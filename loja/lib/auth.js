import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';
const key = new TextEncoder().encode(process.env.AUTH_SECRET);

export async function createSession(uid) {
  const t = await new SignJWT({ uid }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('30d').sign(key);
  cookies().set('s', t, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 30, secure: process.env.NODE_ENV === 'production' });
}
export function destroySession() { cookies().delete('s'); }
export async function getUser() {
  const t = cookies().get('s')?.value;
  if (!t) return null;
  try { const { payload } = await jwtVerify(t, key); return await db.user.findUnique({ where: { id: payload.uid } }); }
  catch { return null; }
}
export async function requireUser() { const u = await getUser(); if (!u) redirect('/login'); return u; }
export async function requireAdmin() { const u = await getUser(); if (!u || u.role !== 'ADMIN') redirect('/'); return u; }