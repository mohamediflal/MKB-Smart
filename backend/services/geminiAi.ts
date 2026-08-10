import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateGroceryRecipeGemini(
  recipeName: string,
  quantityType: string = "People",
  quantityValue: number = 1,
  storeProducts: any[] = []
) {
  const storeCatalogSummary = storeProducts.length > 0
    ? `Store catalog loaded with ${storeProducts.length} active products (used for server-side matching only).`
    : "No pre-loaded products available.";

  const quantityDescription =
    quantityType === "Kg"
      ? `${quantityValue} kg batch of finished ${recipeName}`
      : quantityType === "L"
        ? `${quantityValue} litres batch of finished ${recipeName}`
        : `${quantityValue} ${quantityValue === 1 ? "person" : "people"}`;

  const prompt = `Calculate and generate the complete, realistic, culinary-accurate grocery shopping list of ingredients required to prepare "${recipeName}" for ${quantityDescription}. ${storeCatalogSummary}

CRITICAL RULES:
1. STRICT RECIPE RELEVANCE (MOST IMPORTANT):
   - Generate ONLY the ingredients directly required to prepare/cook "${recipeName}" from scratch.
   - Do NOT include optional side dishes, serving suggestions, accompaniments, or unrelated staple carbs (such as Rice, Basmati Rice, Bread, Roti, Naan, Noodles, Pasta) UNLESS "${recipeName}" itself is a dish that inherently includes that grain/carbs in its preparation (e.g. Biriyani, Fried Rice, Noodles, Pasta, Risotto, Macaroni).
   - EXAMPLE: For "Beef Curry", include Beef, Onion, Tomato, Garlic, Ginger, Green Chili, Curry Leaves, Coconut Milk, Cooking Oil, Spices, Salt. Do NOT include Basmati Rice or any rice!
   - EXAMPLE: For "Beef Biriyani", Basmati Rice IS required because rice is an essential cooked component of biriyani.
   - BEFORE outputting each ingredient, verify that it is actually an ingredient cooked inside "${recipeName}". If it is a side dish or serving suggestion eaten WITH the dish, REMOVE IT!

2. SERVING SIZE SCALING:
   - You MUST calculate ingredient quantities strictly based on the requested target: ${quantityDescription}.
   - Quantities MUST scale proportionally (e.g. 5 people = approx. half of 10 people; 20 people = approx. double of 10 people; 5 L = 5 litres batch; 10 kg = 10 kg batch).
   - Never return identical quantities for different serving amounts.

3. CULINARY REALISM & PROPORTIONS:
   - Main Proteins (beef, chicken, fish, mutton): ~150g-200g raw per person (e.g. 10 people = 1.5kg-2kg, 5 people = 750g-1kg, 20 people = 3kg-4kg).
   - Main Grains/Carbs (ONLY if the recipe explicitly includes them, e.g. biriyani, fried rice, noodles, pasta): ~100g-150g dry per person (e.g. 10 people = 1kg-1.5kg).
   - Vegetables (onion, tomato, carrot, cabbage, capsicum): ~50g-100g each per person (e.g. 10 people = 500g-1kg onion, 500g-800g tomato).
   - Aromatics (ginger, garlic): ~5g-10g each per person (e.g. 10 people = 50g-100g ginger, 50g-100g garlic).
   - Liquids/Fats (oil, ghee, yogurt, coconut milk): ~15-20ml oil per person, ~50g-100g yogurt/coconut milk per person (e.g. 10 people = 150-200ml oil, 500g yogurt, 1L coconut milk).
   - Spices & Salt: proportional amounts (e.g. 10 people = 2-5 tsp spices, 3-10 tsp salt).
   - Countable items (lemon, green chili, cinnamon sticks, cardamom pods, cloves, bay leaves): exact counts (e.g. 10 people = 10 green chilies, 5 lemons, 20 cardamom pods).

4. UNITS & FORMATTING:
   - Use metric units: "kg", "g", "L", "ml". Use "pcs" for countable items, "bunches" for herbs, "tsp"/"tbsp" for small spices.
   - "quantity" MUST be a clean numeric float corresponding to "unit" (e.g. quantity: 1.5, unit: "kg"; quantity: 800, unit: "g"; quantity: 200, unit: "ml"; quantity: 10, unit: "pcs").
   - "displayQuantity" MUST be a human-readable string matching "quantity" and "unit" (e.g. "1.5 kg", "800 g", "200 ml", "1 L", "10 pcs", "5 tsp").

5. PLAIN INGREDIENT NAMES FOR MATCHING:
   - Use standard natural ingredient names (e.g. "Beef", "Chicken", "Onion", "Tomato", "Green Chili", "Ginger", "Garlic", "Yogurt", "Cooking Oil", "Ghee", "Mint Leaves", "Coriander Leaves", "Lemon", "Cinnamon", "Cardamom", "Cloves", "Bay Leaf", "Turmeric Powder", "Chili Powder", "Salt", "Coconut Milk", "Curry Leaves", "Fish", "Noodles", "Basmati Rice").
   - Always return "id": null and "isAvailable": false. Server matches products independently.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the MKB Smart AI Grocery Assistant. Always generate thorough, complete recipe grocery lists with exact realistic scaled quantities based on serving size.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipeName: { type: Type.STRING },
            servings: { type: Type.NUMBER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, nullable: true },
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  displayQuantity: { type: Type.STRING },
                  unit: { type: Type.STRING },
                  category: { type: Type.STRING },
                  isAvailable: { type: Type.BOOLEAN }
                },
                required: ["name", "quantity", "displayQuantity", "unit", "isAvailable"]
              }
            }
          },
          required: ["recipeName", "servings", "ingredients"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
}


