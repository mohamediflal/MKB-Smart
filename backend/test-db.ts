import { prisma } from './configs/prisma.js';

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      products: true,
    },
  });
  console.log("Categories and their products count:");
  for (const cat of categories) {
    console.log(`- Category: ${cat.name} (slug: ${cat.slug}, id: ${cat.id}) has ${cat.products.length} products`);
    for (const prod of cat.products) {
      console.log(`  * Product: ${prod.name} (id: ${prod.id}, price: ${prod.price})`);
    }
  }
}

main().catch(err => {
  console.error("Error running test-db script:", err);
});
