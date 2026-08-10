import OpenAI from "openai";

const nvidiaClient = new OpenAI({
  baseURL: "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
});

export interface StoreProductContext {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
}

export interface IngredientRequirement {
  id?: string | null;
  name: string;
  quantity: number;
  displayQuantity?: string;
  unit: string;
  category: string;
  price?: number;
  isAvailable?: boolean;
}

export interface GeneratedRecipeResponse {
  recipeName: string;
  servings: number;
  ingredients: IngredientRequirement[];
  instructions: string[];
}

export async function generateGroceryRecipe(
  recipeName: string,
  quantityType: string = "People",
  quantityValue: number | string = 1,
  storeProducts: StoreProductContext[] = []
): Promise<GeneratedRecipeResponse> {
  const numVal = typeof quantityValue === "number" ? quantityValue : parseFloat(quantityValue as string) || 1;

  let targetDescription = `${numVal} ${quantityType === "People" ? "people / servings" : quantityType}`;
  if (quantityType === "Kg") targetDescription = `${numVal} kg batch`;
  if (quantityType === "L") targetDescription = `${numVal} liters batch`;

  const storeCatalogSummary = storeProducts.length > 0
    ? `Store catalog loaded with ${storeProducts.length} active products (used for server-side matching only).`
    : "No pre-loaded products available.";

  const rules = `You are the MKB Smart AI Grocery Assistant.

TASK: Calculate and generate the complete, realistic, culinary-accurate grocery shopping list of ingredients required to prepare "${recipeName}" for ${targetDescription}.

CRITICAL RULES:
1. STRICT RECIPE RELEVANCE (MOST IMPORTANT):
   - Generate ONLY the ingredients directly required to prepare/cook "${recipeName}" from scratch.
   - Do NOT include optional side dishes, serving suggestions, accompaniments, or unrelated staple carbs (such as Rice, Basmati Rice, Bread, Roti, Naan, Noodles, Pasta) UNLESS "${recipeName}" itself is a dish that inherently includes that grain/carbs in its preparation (e.g. Biriyani, Fried Rice, Noodles, Pasta, Risotto, Macaroni).
   - EXAMPLE: For "Beef Curry", include Beef, Onion, Tomato, Garlic, Ginger, Green Chili, Curry Leaves, Coconut Milk, Cooking Oil, Spices, Salt. Do NOT include Basmati Rice or any rice!
   - EXAMPLE: For "Beef Biriyani", Basmati Rice IS required because rice is an essential cooked component of biriyani.
   - BEFORE outputting each ingredient, verify that it is actually an ingredient cooked inside "${recipeName}". If it is a side dish or serving suggestion eaten WITH the dish, REMOVE IT!

2. SERVING SIZE SCALING:
   - You MUST calculate ingredient quantities strictly based on the requested target: ${targetDescription}.
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
   - Always return "id": null and "isAvailable": false. Server matches products independently.

Return STRICT JSON only (no markdown, no extra text) matching this schema:
{
  "recipeName": "${recipeName}",
  "servings": ${numVal},
  "ingredients": [
    {
      "id": null,
      "name": "string",
      "quantity": 0,
      "displayQuantity": "string",
      "unit": "string",
      "category": "string",
      "price": 0,
      "isAvailable": false
    }
  ],
  "instructions": [ "Prepare all ingredients.", "Cook thoroughly." ]
}`;

  try {
    console.log(`Calling NVIDIA AI for recipe: "${recipeName}" (${targetDescription})...`);

    const aiPromise = nvidiaClient.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages: [
        {
          role: "system",
          content: `${rules}`
        },
        {
          role: "user",
          content: `Generate the complete grocery shopping list for "${recipeName}" for ${targetDescription}. Return STRICT JSON matching the schema. (${storeCatalogSummary})`
        }
      ],
      temperature: 0.2,
      top_p: 0.8,
      max_tokens: 1600,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("NVIDIA AI API call timed out after 45s")), 45000)
    );

    const response: any = await Promise.race([aiPromise, timeoutPromise]);
    const content = response.choices[0]?.message?.content || "";
    console.log("NVIDIA AI Response received length:", content.length);

    let cleanedJson = content
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let parsed: GeneratedRecipeResponse | null = null;

    const parseJson = (raw: string): GeneratedRecipeResponse | null => {
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
      const candidate = raw.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as GeneratedRecipeResponse;
      } catch {
        return null;
      }
    };

    parsed = parseJson(cleanedJson);
    if (!parsed) {
      console.warn("Initial JSON parse failed, attempting repair...");
      // The model sometimes appends stray prose or an extra closing brace.
      parsed = parseJson(cleanedJson.replace(/\}\s*[^}]*$/g, "}"));
    }
    if (!parsed) {
      // Last resort: try to salvage a truncated ingredients array.
      try {
        const repaired = cleanedJson.substring(cleanedJson.indexOf("{"), cleanedJson.lastIndexOf("}") + 1);
        if (!repaired.trimEnd().endsWith("]}")) {
          const candidate = repaired + "]}";
          parsed = JSON.parse(candidate) as GeneratedRecipeResponse;
        }
      } catch (repairErr) {
        console.error("Auto-repair failed:", repairErr);
      }
    }

    if (parsed && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
      return parsed;
    }
  } catch (error: any) {
    console.warn("NVIDIA AI Call Warning:", error.message || error);
  }

  return {
    recipeName,
    servings: numVal,
    ingredients: [],
    instructions: [`Prepare ingredients for ${recipeName}.`, `Cook thoroughly according to serving size (${targetDescription}).`]
  };
}

export async function chatWithGroceryAI(userPrompt: string, history: Array<{ role: string; content: string }> = []) {
  try {
    console.log(`Calling NVIDIA AI Chat for prompt: "${userPrompt.substring(0, 80)}"...`);
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: `You are MKB Smart AI, a friendly and patient cooking assistant. Your goal is to guide people who may have little or no cooking experience through recipes step by step, as if you are standing right beside them in the kitchen.

RESPONSE STYLE RULES — follow these strictly:

1. Use SIMPLE, everyday language. Avoid technical cooking terms. If you must use one, explain it immediately in plain words.
   - BAD: "Sauté the onions until caramelized."
   - GOOD: "Heat the oil in a pan over medium heat. Add the chopped onions and stir occasionally. Cook for about 5–7 minutes until they become soft and light golden brown."

2. For every cooking step, clearly explain:
   - WHAT to do
   - WHICH ingredient to use and HOW MUCH
   - HOW to prepare it (chop, wash, crush, etc.)
   - WHAT cooking method to use (boil, fry, stir, etc.)
   - WHAT heat level to use (high / medium / low)
   - APPROXIMATELY HOW LONG to cook
   - WHAT TO LOOK FOR before moving to the next step (colour, smell, texture, sound)

3. Always explain technical terms when you use them:
   - Instead of "simmer": say "reduce the heat to low and let it cook gently — you should see small bubbles, not vigorous boiling"
   - Instead of "temper the spices": say "heat a little oil, add the seeds or leaves, and let them cook for 20–30 seconds until they start to crackle"
   - Instead of "reduce": say "cook without a lid until some liquid evaporates and the mixture becomes thicker"

4. STRUCTURE every recipe response with these clear sections:
   🍳 Recipe: [Name for N People]
   ⏱ Estimated Total Time: [X–Y minutes]
   🥘 Ingredients Needed: [list with quantities scaled to the number of people]
   👨‍🍳 Step-by-Step Instructions: [numbered steps, each clearly titled]
   ✅ Tips: [1–3 practical beginner tips if helpful]

5. SCALE quantities correctly. If the recipe is for 10 people, provide quantities suitable for 10 people. If it is for 5 people, halve them. Never give the same generic quantities regardless of the serving size.

6. For every important cooking stage, tell the user HOW TO KNOW IT IS READY:
   - BAD: "Cook the chicken for 20 minutes."
   - GOOD: "Cover and cook for about 20 minutes on medium-low heat. The chicken is ready when it is no longer pink inside and feels tender when you press it. If the pieces are large, they may need a few more minutes."

7. For meat, poultry, or seafood, include basic food safety guidance (e.g. chicken must be fully cooked — no pink inside, juices run clear).

8. Never give vague instructions like "cook until done", "add spices as required", or "season to taste" without explaining what that means and roughly how much to use.

9. For follow-up questions, always respond in the context of the recipe already discussed and maintain the same simple, beginner-friendly tone.

Your primary goal: explain what the user needs to do, step by step, so that a person cooking the recipe for the very first time can understand and follow along with confidence.`
      },
      ...history.map(msg => ({
        role: msg.role === "user" ? "user" as const : "assistant" as const,
        content: msg.content
      })),
      {
        role: "user",
        content: userPrompt
      }
    ];

    // Wrap in a 45-second timeout (same pattern as generateGroceryRecipe)
    const aiPromise = nvidiaClient.chat.completions.create({
      model: "meta/llama-3.1-8b-instruct",
      messages,
      temperature: 0.4,
      top_p: 0.8,
      max_tokens: 800,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("NVIDIA AI Chat timed out after 45s")), 45000)
    );

    const response: any = await Promise.race([aiPromise, timeoutPromise]);
    const reply = response.choices[0]?.message?.content;
    console.log("NVIDIA AI Chat Reply received, length:", reply?.length || 0);

    return reply || "Sorry, I couldn't process your request.";
  } catch (error: any) {
    console.error("NVIDIA AI Chat Error:", error.message || error);
    if (error.message?.includes("timed out")) {
      return "The AI is taking too long to respond right now. Please try again in a moment.";
    }
    return "Sorry, I am experiencing difficulties right now. Please try again.";
  }
}
