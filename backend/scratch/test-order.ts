import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { prisma } from '../configs/prisma.js';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'any_strong_secret';

async function test() {
  console.log("Finding user Ismath...");
  const user = await prisma.user.findFirst({
    where: { name: "Ismath" }
  });
  if (!user) {
    console.error("User Ismath not found.");
    return;
  }
  console.log(`Found user Ismath with ID: ${user.id}`);

  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  console.log(`Generated JWT token: ${token.substring(0, 20)}...`);

  // Mock payload
  const payload = {
    items: [
      { id: "product-1", name: "Organic Apple", price: "LKR 150.00", quantity: 3, image: "" }
    ],
    shippingAddress: {
      fullName: "Ismath User",
      phone: "0771234567",
      street: "456 Park Avenue",
      city: "Colombo",
      postalCode: "00100"
    },
    subtotal: 450,
    deliveryFee: 150,
    total: 600
  };

  console.log("\n1. Testing POST /api/orders/place (COD)...");
  try {
    const response = await fetch(`http://localhost:${PORT}/api/orders/place`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("POST /place status:", response.status);
    console.log("POST /place data:", data);

    if (data.success && data.order?.id) {
      console.log("\n2. Testing GET /api/orders/user-orders...");
      const getResponse = await fetch(`http://localhost:${PORT}/api/orders/user-orders`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const getData = await getResponse.json();
      console.log("GET /user-orders status:", getResponse.status);
      console.log("GET /user-orders count:", getData.orders?.length);
      console.log("Sample order:", getData.orders?.[0]);

      // Clean up the created test order to keep DB clean
      await prisma.order.delete({
        where: { id: data.order.id }
      });
      console.log("\nCleaned up test order.");
    }
  } catch (error: any) {
    console.error("Order test failed:", error.message);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
