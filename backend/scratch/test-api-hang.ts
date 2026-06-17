import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { prisma } from '../configs/prisma.js';

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'any_strong_secret';

async function test() {
  console.log("Finding a user...");
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found.");
    return;
  }
  console.log(`Using user: ${user.name} (${user.id})`);

  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  console.log(`Generated token: ${token.substring(0, 20)}...`);

  console.log("Sending POST request to /api/address/add...");
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`http://localhost:${PORT}/api/address/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        fullName: 'John Doe',
        label: 'Home',
        phone: '1234567890',
        street: '123 Street Name',
        city: 'New York',
        postalCode: '10001',
        isPrimary: true
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    console.log(`Response status: ${response.status}`);
    const data = await response.json();
    console.log("Response data:", data);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error("Request HUNG and timed out after 5 seconds!");
    } else {
      console.error("Request failed:", error.message);
    }
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
