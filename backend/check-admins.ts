import { prisma } from './configs/prisma.js';

async function main() {
  const admins = await prisma.admin.findMany();
  console.log("Admins currently in database:", admins);
}

main().catch(err => {
  console.error("Error running script:", err);
});
