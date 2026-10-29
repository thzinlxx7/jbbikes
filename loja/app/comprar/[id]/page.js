import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { buy } from '../../actions';
import { brl } from '@/lib/fmt';

export default async function Comprar({ params, searchParams: s }) {
  await requireUser().catch(() => {});
  const { getUser } = await import('@/lib/auth');
  if (!(await getUser())) redirect(`/login?next=/comprar/${params.id}`);
  const p = await db.product.findUnique({ where: { id: params.id } });
  if (!p || !p.active) redirect('/');
  return (
    <div className="box" style={{ maxWidth: 520, margin: '30px auto' }}>
      <h2>{p.name}</h2>
      {p.image && <img src={p.image} alt="" style={{ width: '100%', borderRadius: 12 }} />}
      <p>{p.description}</p>
      <p className="price">{brl(p.price)}</p>
      {s.erro && <div className="msg err">{s.erro}</div>}
      <form className="f" action={buy}>
        <input type="hidden" name="productId" value={p.id} />
        <label>Quantidade<input name="quantity" type="number" min="1" defaultValue="1" /></label>
        <label>Endereço de entrega (rua, número, bairro, cidade, UF e CEP)
          <textarea name="address" rows={3} required /></label>
        <button className="btn green">Pagar (Pix, boleto ou cartão)</button>
      </form>
    </div>
  );
}