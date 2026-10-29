import { db } from './db';
export async function available(userId) {
  const c = await db.commission.aggregate({ where: { userId }, _sum: { amount: true } });
  const w = await db.withdrawal.aggregate({ where: { userId }, _sum: { amount: true } });
  return (c._sum.amount || 0) - (w._sum.amount || 0);
}