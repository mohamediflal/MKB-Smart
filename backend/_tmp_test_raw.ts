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

  for (const tc of [
    { recipeName: 'Soup', quantityType: 'L', quantityValue: 5 },
    { recipeName: 'Chocolate Cake', quantityType: 'People', quantityValue: 6 },
  ]) {
    console.log(`\n===== RAW AI for "${tc.recipeName}" ${tc.quantityType} ${tc.quantityValue} =====`);
    const result = await generateGroceryRecipe(tc.recipeName, tc.quantityType, tc.quantityValue, storeProducts);
    for (const ing of result.ingredients) {
      console.log(`- name="${ing.name}" | qty=${ing.quantity} | unit="${ing.unit}" | display="${ing.displayQuantity}" | idHint=${ing.id || 'null'}`);
    }
  }
}

main().catch((err) => {
  console.error('ERROR:', err);
  process.exit(1);
});
