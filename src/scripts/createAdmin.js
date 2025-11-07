const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client'); // Importa Prisma
const db = new PrismaClient();

async function main() {
  const password = 'admin123'; // contraseña que quieras
  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await db.user.create({
    data: {
      username: 'Administrador11',
      email: 'admin11@gmail.com',
      password: hashedPassword,
      role: 'admin'
    }
  });

  console.log('Admin creado:', newAdmin);
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
