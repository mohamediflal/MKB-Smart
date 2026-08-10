import 'dotenv/config';
import { generateGroceryRecipe } from './services/nvidiaAi.js';

async function test() {
  console.log("Testing NVIDIA AI Recipe Generation...");
  try {
    const result = await generateGroceryRecipe("Chicken Curry", 4);
    console.log("Result received from NVIDIA AI:\n");
    console.log(result);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

test();
