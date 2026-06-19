import { prisma } from '../configs/prisma.js';

async function main() {
  console.log("Fetching first user...");
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in database!");
    return;
  }
  console.log(`Found user: ${user.name} (${user.id})`);

  console.log("Creating test address...");
  try {
    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: "Test User",
        label: "Home",
        phone: "1234567890",
        address: "123 Main St",
        city: "Test City",
        district: "Test District",
        zip: "12345",
        isDefault: false,
        lat: 0.0,
        lng: 0.0,
      }
    });
    console.log("Success! Address created:", address);

    // Clean up
    await prisma.address.delete({
      where: { id: address.id }
    });
    console.log("Cleaned up test address.");
  } catch (error) {
    console.error("Failed to create address:", error);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
