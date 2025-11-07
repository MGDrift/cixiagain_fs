const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const email = 'admin11@gmail.com';
  const username = 'Administrador11';
  const password = 'admin123';

  // Hash password in case we need to create
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.upsert({
    where: { email },
    update: {
      role: 'admin',
      username,
    },
    create: {
      username,
      email,
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('Usuario admin creado/actualizado:', user);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
