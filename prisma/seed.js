// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { ROLES, ROLE_PERMISSIONS } = require('../src/config/constants');
const PasswordUtil = require('../src/utils/password');

const prisma = new PrismaClient();

async function main() {
  // Create roles
  for (const roleName of Object.values(ROLES)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        permissions: ROLE_PERMISSIONS[roleName],
      },
    });
  }

  // Create admin user
  const adminRole = await prisma.role.findUnique({
    where: { name: ROLES.ADMIN },
  });

  if (adminRole) {
    await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: {},
      create: {
        email: 'admin@gmail.com',
        password: await PasswordUtil.hash('admin123'),
        username: 'Admin User',
        roleId: adminRole.id,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
