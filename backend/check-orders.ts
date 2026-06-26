import { prisma } from './configs/prisma.js';

async function main() {
  const count = await prisma.order.count();
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });
  console.log("Total orders count:", count);
  console.log("Recent orders:", orders);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
