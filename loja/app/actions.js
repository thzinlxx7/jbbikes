'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { put } from '@vercel/blob';
import { db } from '@/lib/db';
import { createSession, destroySession, requireUser, requireAdmin } from '@/lib/auth';
import { available } from '@/lib/balance';
import { sendMail } from '@/lib/mail';

const SITE = process.env.SITE_URL || 'https://jbbikes.online';
const go = (path, k, msg) => redirect(`${path}${path.includes('?') ? '&' : '?'}${k}=${encodeURIComponent(msg)}`);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const cents = (v) => Math.round(parseFloat(String(v).replace(',', '.')) * 100) || 0;

/* ---------- Conta ---------- */
export async function register(fd) {
  const email = String(fd.get('email')).trim().toLowerCase();
  const name = String(fd.get('name')).trim();
  const password = String(fd.get('password'));
  const ref = String(fd.get('ref') || '');
  const back = ref ? `/cadastro?ref=${ref}` : '/cadastro';
  if (!email.includes('@') || !name || password.length < 6) go(back, 'erro', 'Preencha tudo (senha com 6+ caracteres).');
  if (await db.user.findUnique({ where: { email } })) go(back, 'erro', 'Este e-mail já está cadastrado.');
  const referrer = ref ? await db.user.findUnique({ where: { refCode: ref } }) : null;
  const user = await db.user.create({
    data: { email, name, passwordHash: await bcrypt.hash(password, 10), refCode: crypto.randomBytes(4).toString('hex'), referredById: referrer?.id },
  });
  await createSession(user.id);
  redirect('/conta');
}

export async function login(fd) {
  const email = String(fd.get('email')).trim().toLowerCase();
  const next = String(fd.get('next') || '/conta');
  const u = await db.user.findUnique({ where: { email } });
  if (!u || !(await bcrypt.compare(String(fd.get('password')), u.passwordHash))) go('/login', 'erro', 'E-mail ou senha incorretos.');
  await createSession(u.id);
  redirect(next.startsWith('/') && !next.startsWith('//') ? next : '/conta');
}

export async function logout() { destroySession(); redirect('/'); }

export async function forgot(fd) {
  const email = String(fd.get('email')).trim().toLowerCase();
  const u = await db.user.findUnique({ where: { email } });
  if (u) {
    const token = crypto.randomBytes(32).toString('hex');
    await db.user.update({ where: { id: u.id }, data: { resetHash: sha(token), resetExpires: new Date(Date.now() + 3600e3) } });
    await sendMail(email, 'Recuperação de senha - JB Bikes',
      `<p>Clique para criar uma nova senha (válido por 1 hora):</p><p><a href="${SITE}/redefinir-senha?token=${token}">Redefinir senha</a></p>`);
  }
  go('/esqueci-senha', 'ok', 'Se o e-mail existir, enviamos o link de recuperação.');
}

export async function resetPassword(fd) {
  const token = String(fd.get('token'));
  const password = String(fd.get('password'));
  if (password.length < 6) go(`/redefinir-senha?token=${token}`, 'erro', 'Senha com 6+ caracteres.');
  const u = await db.user.findFirst({ where: { resetHash: sha(token), resetExpires: { gt: new Date() } } });
  if (!u) go('/esqueci-senha', 'erro', 'Link inválido ou expirado.');
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(password, 10), resetHash: null, resetExpires: null } });
  go('/login', 'ok', 'Senha alterada! Faça login.');
}

/* ---------- Compra ---------- */
export async function buy(fd) {
  const u = await requireUser();
  const pid = String(fd.get('productId'));
  const p = await db.product.findUnique({ where: { id: pid } });
  const qty = Math.max(1, parseInt(fd.get('quantity')) || 1);
  const address = String(fd.get('address')).trim();
  if (!p || !p.active) redirect('/');
  if (address.length < 10) go(`/comprar/${pid}`, 'erro', 'Informe o endereço completo com CEP.');
  const order = await db.order.create({ data: { userId: u.id, productName: p.name, quantity: qty, total: p.price * qty, address } });
  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ title: p.name, quantity: qty, unit_price: p.price / 100, currency_id: 'BRL' }],
      payer: { email: u.email },
      external_reference: order.id,
      notification_url: `${SITE}/api/webhook`,
      back_urls: { success: `${SITE}/conta`, failure: `${SITE}/conta`, pending: `${SITE}/conta` },
      auto_return: 'approved',
    }),
  });
  const d = await r.json();
  if (!d.init_point) go(`/comprar/${pid}`, 'erro', 'Erro ao iniciar pagamento. Tente novamente.');
  redirect(d.init_point);
}

/* ---------- Saque ---------- */
export async function requestWithdraw(fd) {
  const u = await requireUser();
  const pixKey = String(fd.get('pixKey')).trim();
  const avail = await available(u.id);
  if (avail < 5000) go('/conta', 'erro', 'Saque disponível a partir de R$ 50,00.');
  if (!pixKey) go('/conta', 'erro', 'Informe sua chave Pix.');
  await db.withdrawal.create({ data: { userId: u.id, amount: avail, pixKey } });
  go('/conta', 'ok', 'Saque solicitado! Você receberá via Pix.');
}

/* ---------- Admin ---------- */
export async function saveProduct(fd) {
  await requireAdmin();
  const id = String(fd.get('id') || '');
  const data = {
    name: String(fd.get('name')),
    description: String(fd.get('description') || ''),
    price: cents(fd.get('price')),
    categoryId: String(fd.get('categoryId') || '') || null,
    active: fd.get('active') === 'on',
  };
  const file = fd.get('image');
  if (file && file.size > 0) {
    const blob = await put(`produtos/${Date.now()}-${file.name}`, file, { access: 'public' });
    data.image = blob.url;
  }
  if (id) await db.product.update({ where: { id }, data });
  else await db.product.create({ data });
  revalidatePath('/'); revalidatePath('/admin');
}
export async function deleteProduct(fd) {
  await requireAdmin();
  await db.product.delete({ where: { id: String(fd.get('id')) } });
  revalidatePath('/'); revalidatePath('/admin');
}
export async function saveCategory(fd) {
  await requireAdmin();
  const name = String(fd.get('name')).trim();
  if (name) await db.category.upsert({ where: { name }, update: {}, create: { name } });
  revalidatePath('/admin');
}
export async function deleteCategory(fd) {
  await requireAdmin();
  await db.category.delete({ where: { id: String(fd.get('id')) } });
  revalidatePath('/admin');
}
export async function addAdmin(fd) {
  await requireAdmin();
  const email = String(fd.get('email')).trim().toLowerCase();
  const u = await db.user.findUnique({ where: { email } });
  if (!u) go('/admin', 'erro', 'Nenhuma conta com esse e-mail.');
  await db.user.update({ where: { id: u.id }, data: { role: 'ADMIN' } });
  go('/admin', 'ok', `${email} agora é administrador.`);
}
export async function setStatus(fd) {
  await requireAdmin();
  await db.order.update({ where: { id: String(fd.get('id')) }, data: { status: String(fd.get('status')) } });
  revalidatePath('/admin');
}
export async function payWithdraw(fd) {
  await requireAdmin();
  await db.withdrawal.update({ where: { id: String(fd.get('id')) }, data: { status: 'PAGO' } });
  revalidatePath('/admin');
}