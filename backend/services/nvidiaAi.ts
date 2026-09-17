import OpenAI from "openai";

let _nvidiaClient: OpenAI | null = null;
function getNvidiaClient(): OpenAI | null {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  if (!_nvidiaClient) {
    _nvidiaClient = new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
    });
  }
  return _nvidiaClient;
}

const NVIDIA_MODEL = process.env.NVIDIA_MODEL || "meta/llama-3.2-11b-vision-instruct";

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
   - Main Proteins (beef, chicken, fish, mutton, paneer): ~150g-200g raw per person (e.g. 10 people = 1.5kg-2kg, 5 people = 750g-1kg, 20 people = 3kg-4kg).
   - EGGS (CRITICAL RULE):
     * Eggs MUST ALWAYS be measured in pieces ("pcs"). NEVER measure eggs in kilograms ("kg"), grams ("g"), or any weight units!
     * For dishes requiring eggs (e.g. Chicken Noodles, Veg Noodles, Egg Noodles, Fried Rice, Kottu, Omelette):
       ~1 egg per person (e.g. 10 people Chicken Noodles = 10 pcs / 10 eggs, 5 people = 5 pcs, 1 person = 1-2 pcs).
     * unit MUST be "pcs" and displayQuantity MUST be formatted as "[N] pcs" (e.g. quantity: 10, unit: "pcs", displayQuantity: "10 pcs").
   - Main Grains/Carbs (ONLY if the recipe explicitly includes them, e.g. biryani, fried rice, noodles, pasta): ~100g-120g dry per person (e.g. 10 people = 1kg-1.2kg).
   - Vegetables (onion, tomato, carrot, cabbage, capsicum): ~50g-80g each per person (e.g. 10 people = 500g-800g onion, 300g-500g tomato).
   - Aromatics (ginger, garlic): ~4g-6g each per person (e.g. 10 people = 40g-60g garlic / 8-12 cloves, 30g-50g ginger).
   - Liquids/Fats (oil, ghee, yogurt, coconut milk): ~15-20ml oil per person, ~25g-40g yogurt/coconut milk per person (e.g. 10 people = 150-200ml oil, 250g-400g yogurt).
   - SPICES & SALT (CRITICAL RULE):
     * Spices (Chili powder, turmeric, coriander, cumin, garam masala, biryani masala, black pepper, curry powder, paprika) and Salt MUST ALWAYS be measured in grams ("g"), teaspoons ("tsp"), or tablespoons ("tbsp").
     * NEVER use "kg" or "L" for spices or salt! A value like 1 kg or 2 kg of chili powder is STRICTLY PROHIBITED.
     * For Red Chili Powder / Chilli Powder:
       - 1 person: ~4g–7g (~1 tsp)
       - 5 people: ~20g–35g (~1.5–2 tbsp)
       - 10 people: ~40g–70g (~2.5–4.5 tbsp)
       - 20 people: ~80g–140g
     * Turmeric: ~1g–2g per person (10 people = 10g–15g).
     * Garam / Biryani Masala: ~2g–4g per person (10 people = 20g–35g).
     * Salt: ~3g–5g per person (10 people = 30g–45g).
   - Countable items (eggs, lemon, green chili, cinnamon sticks, cardamom pods, cloves, bay leaves): exact counts in "pcs". EGGS MUST ALWAYS BE COUNTED IN "pcs" (e.g. 10 people chicken noodles = 10 pcs). NEVER use "kg" or "g" for eggs or fresh chilies!

4. UNITS & FORMATTING:
   - Use metric units: "kg", "g", "L", "ml". Use "pcs" for countable items like eggs, "bunches" for herbs, "tsp"/"tbsp" for small spices.
   - "quantity" MUST be a clean numeric float corresponding to "unit" (e.g. quantity: 50, unit: "g"; quantity: 1.5, unit: "kg"; quantity: 200, unit: "ml"; quantity: 8, unit: "pcs"; quantity: 10, unit: "pcs").
   - "displayQuantity" MUST be a human-readable string matching "quantity" and "unit" (e.g. "50 g", "1.5 kg", "200 ml", "1 L", "8 pcs", "10 pcs", "2 tbsp").

5. PLAIN INGREDIENT NAMES FOR MATCHING:
   - Use standard natural ingredient names (e.g. "Beef", "Chicken", "Onion", "Tomato", "Green Chili", "Ginger", "Garlic", "Yogurt", "Cooking Oil", "Ghee", "Mint Leaves", "Coriander Leaves", "Lemon", "Cinnamon", "Cardamom", "Cloves", "Bay Leaf", "Turmeric Powder", "Red Chili Powder", "Biryani Masala", "Salt", "Coconut Milk", "Curry Leaves", "Fish", "Noodles", "Egg", "Basmati Rice").
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

    const client = getNvidiaClient();
    if (!client) {
      console.warn("NVIDIA_API_KEY is not configured.");
      return {
        recipeName,
        servings: numVal,
        ingredients: [],
        instructions: [`Prepare ingredients for ${recipeName}.`, `Cook thoroughly according to serving size (${targetDescription}).`]
      };
    }

    const aiPromise = client.chat.completions.create({
      model: NVIDIA_MODEL,
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
      setTimeout(() => reject(new Error("NVIDIA AI API call timed out after 35s")), 35000)
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

5. SCALE quantities realistically. If exact ingredients and quantities are provided in the user prompt, you MUST use them EXACTLY without changing, omitting, or recalculating any ingredients or quantities. Otherwise, scale quantities accurately for the serving size. Spices (e.g. chili powder, turmeric, garam masala) and salt MUST ALWAYS be measured in grams (g), tsp, or tbsp — NEVER in kg. For example, for 10 people biryani, red chili powder is roughly 40–70 g (around 2–4 tbsp), NEVER 1 kg or 2 kg. Eggs MUST ALWAYS be measured in pieces (pcs) — NEVER in kg or g (e.g. 10 eggs for 10 people Chicken Noodles, NEVER 1 kg).

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

    const client = getNvidiaClient();
    if (!client) {
      return "Sorry, the AI service is currently not configured.";
    }

    // Wrap in a 45-second timeout (same pattern as generateGroceryRecipe)
    const aiPromise = client.chat.completions.create({
      model: NVIDIA_MODEL,
      messages,
      temperature: 0.4,
      top_p: 0.8,
      max_tokens: 800,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("NVIDIA AI Chat timed out after 35s")), 35000)
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
