import 'dotenv/config';
import { prisma } from './configs/prisma.js';
import { generateGroceryRecipe } from './services/nvidiaAi.js';

async function main() {
  const dbProducts = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true },
    orderBy: { name: 'asc' }
  });
  const storeProducts = dbProducts.map(p => ({
    id: p.id, name: p.name, category: p.category?.name || 'Grocery', unit: p.unit || 'piece', price: p.price
  }));
  console.log('Store products loaded:', storeProducts.length);
  console.log('NVIDIA key present:', Boolean(process.env.NVIDIA_API_KEY));

  const result = await generateGroceryRecipe('Chicken Curry', 'People', 10, storeProducts);
  console.log('NVIDIA RESULT:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
