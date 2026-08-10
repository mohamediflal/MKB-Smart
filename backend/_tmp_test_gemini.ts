import 'dotenv/config';
import { prisma } from './configs/prisma.js';
import { generateGroceryRecipeGemini } from './services/geminiAi.js';

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
  console.log('Gemini key present:', Boolean(process.env.GEMINI_API_KEY));

  const result = await generateGroceryRecipeGemini('Chicken Curry', 'People', 10, storeProducts);
  console.log('GEMINI RESULT:');
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
