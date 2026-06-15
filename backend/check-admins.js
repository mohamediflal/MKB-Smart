import { PrismaClient } from './generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.admin.findMany();
  console.log("Admins currently in database:", admins);
}

main()
  .catch(err => {
    console.error("Error running script:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
