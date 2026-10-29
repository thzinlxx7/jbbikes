const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = new PrismaClient();
(async () => {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const pass = process.env.ADMIN_PASSWORD;
  if (!email || !pass) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD');
  const passwordHash = await bcrypt.hash(pass, 10);
  await db.user.upsert({
    where: { email },
    update: { role: 'ADMIN', passwordHash },
    create: { email, name: 'Administrador', passwordHash, role: 'ADMIN', refCode: crypto.randomBytes(4).toString('hex') },
  });
  for (const n of ['Pipas', 'Rabiolas', 'Peças de bike', 'Bikes', 'Outros'])
    await db.category.upsert({ where: { name: n }, update: {}, create: { name: n } });
  console.log('Admin e categorias criados.');
})().finally(() => db.$disconnect());