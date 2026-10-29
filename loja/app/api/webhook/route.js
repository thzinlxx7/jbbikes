import { db } from '@/lib/db';

export async function POST(req) {
  const url = new URL(req.url);
  let id = url.searchParams.get('data.id') || url.searchParams.get('id');
  let type = url.searchParams.get('type') || url.searchParams.get('topic');
  try { const b = await req.json(); id = id || b?.data?.id; type = type || b?.type; } catch {}
  if (!id || (type && type !== 'payment')) return new Response('ok');

  // Confirma o pagamento direto na API do Mercado Pago (não confia no corpo recebido)
  const r = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });
  const p = await r.json();

  if (p.status === 'approved' && p.external_reference) {
    const res = await db.order.updateMany({
      where: { id: p.external_reference, paid: false },
      data: { paid: true, status: 'PREPARANDO', mpPaymentId: String(id) },
    });
    if (res.count) {
      const o = await db.order.findUnique({ where: { id: p.external_reference }, include: { user: true } });
      if (o?.user.referredById) {
        await db.commission
          .create({ data: { userId: o.user.referredById, orderId: o.id, amount: Math.floor(o.total * 0.1) } })
          .catch(() => {});
      }
    }
  }
  return new Response('ok');
}