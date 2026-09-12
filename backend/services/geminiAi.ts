import { GoogleGenAI, Type } from "@google/genai";

let _ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey });
  }
  return _ai;
}

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro-preview"
];

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
      ? `${quantityValue} kg total batch of finished ${recipeName}`
      : quantityType === "L"
        ? `${quantityValue} litres finished volume of ${recipeName}`
        : `${quantityValue} ${quantityValue === 1 ? "person" : "people"}`;

  const prompt = `You are the master culinary AI for MKB Smart Grocery. Calculate and generate the complete, authentic, highly accurate grocery shopping list of ingredients required to prepare "${recipeName}" for ${quantityDescription}. ${storeCatalogSummary}

CRITICAL RULES FOR ACCURACY & CULINARY PROPORTIONS:

1. UNDERSTAND THE EXACT RECIPE:
   - Every recipe has standard, authentic core ingredients.
   - For Noodles (e.g. Chicken Noodles, Veg Noodles, Egg Noodles): Include noodles, main protein/eggs, crisp vegetables (cabbage, carrot, bell pepper/capsicum, spring onions), aromatics (ginger, garlic), seasoning (soy sauce, chili/oyster sauce, sesame oil, black pepper, salt).
   - For Biryani (e.g. Chicken, Mutton, Beef, Prawn, Fish, Veg): Include Basmati Rice, main protein, onions (for frying/birista), tomatoes, plain yogurt/curd, ginger, garlic, green chilies, mint leaves, coriander leaves, ghee/oil, whole spices (cinnamon, cloves, cardamom, bay leaf, star anise), biryani masala, turmeric, chili powder, salt. Do NOT include side bread or separate rice!
   - For Fried Rice: Include long grain/basmati rice, eggs/protein, finely diced vegetables (carrots, leeks/spring onions), garlic, soy sauce, sesame oil, pepper, salt.
   - For Soups (e.g. Tomato Soup, Lentil Soup, Corn Soup, Chicken Soup): Include main base (fresh tomatoes, lentils, corn, chicken), broth/stock, onions, garlic, butter/olive oil, fresh cream (if creamy soup), herbs (basil/coriander), salt, black pepper.
   - For Curries (e.g. Dhal Curry, Fish Curry, Chicken Curry, Beef Curry): Include main protein/veggies, onions, tomatoes, green chilies, ginger, garlic, curry leaves, coconut milk (or yogurt), chili powder, curry powder, turmeric, fenugreek/mustard seeds, salt, oil.
   - For Pastas: Include pasta, sauce base (cream/tomatoes/olive oil), garlic, cheese (parmesan), protein, herbs, black pepper, salt.
   - For Bakery/Desserts (e.g. Cakes, Cookies, Brownies, Pancakes, Waffles): Include all-purpose flour, sugar, butter/oil, eggs, baking powder/soda, milk, vanilla extract, cocoa powder (if chocolate), salt.
   - For Sri Lankan/Indian Specialties (Kottu, Hoppers, Sambol, Dosa, Idly, Sambar): Include their authentic authentic base components (e.g., Godamba roti, eggs, meat, leeks, onions for Kottu; grated coconut, red onion, chili powder, lime for Coconut Sambol).

2. STRICT RECIPE RELEVANCE:
   - Generate ONLY ingredients cooked directly inside "${recipeName}".
   - NEVER add separate side dishes, accompaniments, or unrelated staple carbs (such as bread, roti, plain rice) unless that grain is an inherent cooked ingredient of "${recipeName}" (like Biryani, Fried Rice, Risotto, Noodles, Pasta).

3. SERVING SIZE & TARGET SCALING:
   - Calculate ingredient quantities strictly based on the target: ${quantityDescription}.
   - For People:
     * 1 person: standard single-portion quantities.
     * 5 people: ~5x of single portion.
     * 10 people: standard 10-person catering quantities (e.g. 1 kg noodles, 1 kg chicken, 4 eggs, 500g cabbage, 300g carrots, 50g garlic, 100ml soy sauce for Chicken Noodles for 10 people).
     * 20 people: approx double of 10 people.
   - For Kg batch (finished weight): Calculate raw ingredients needed to yield ${quantityValue} kg of cooked finished dish.
   - For L batch (finished volume): Calculate liquids, aromatics, and solids needed to produce ${quantityValue} litres of finished liquid/soup/curry.
   - Never use a flat multiplier that produces absurd or uncookable quantities.

4. REALISTIC GROCERY PURCHASING UNITS:
   - Use standard units: "kg", "g", "L", "ml", "pcs", "cloves", "tbsp", "tsp", "bunches".
   - Practical grocery units:
     * Countable produce (onions, tomatoes, lemons, eggs, green chilies): use "pcs" or "g" (e.g. quantity: 3, unit: "pcs", displayQuantity: "3 pcs (approx. 300 g)" or quantity: 300, unit: "g").
     * Garlic: use "cloves" or "g" (e.g. quantity: 6, unit: "cloves", displayQuantity: "6 cloves").
     * Meats / Seafood: use "kg" or "g" (e.g. quantity: 1, unit: "kg", displayQuantity: "1 kg").
     * Flour / Sugar / Rice / Noodles: use "kg" or "g".
     * Oils / Sauces / Milk / Broth: use "ml" or "L".
     * Spices / Salt: use "tsp", "tbsp", or "g".

5. PLAIN NATURAL INGREDIENT NAMES FOR MATCHING:
   - Return clear, standard ingredient names (e.g. "Chicken", "Basmati Rice", "Noodles", "Onion", "Tomato", "Garlic", "Ginger", "Green Chili", "Soy Sauce", "Eggs", "Cooking Oil", "Coconut Milk", "Salt", "Turmeric Powder").
   - Always return "id": null and "isAvailable": false.`;

  const config = {
    systemInstruction: "You are the MKB Smart AI Grocery Assistant. Always generate thorough, authentic, complete recipe grocery lists with exact realistic scaled quantities based on serving size.",
    responseMimeType: "application/json",
    temperature: 0.1, // Low temperature for high consistency and determinism
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
  };

  const ai = getGeminiClient();
  if (!ai) {
    console.warn("GEMINI_API_KEY is not configured.");
    return null;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`Calling Gemini API (${modelName}) for recipe: "${recipeName}" (${quantityDescription})...`);
      const apiCall = ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini recipe API call with model "${modelName}" timed out after 15s`)), 15000)
      );

      const response: any = await Promise.race([apiCall, timeoutPromise]);

      if (response && response.text) {
        return JSON.parse(response.text);
      }
    } catch (error: any) {
      console.warn(`Gemini API with model "${modelName}" failed:`, error?.message || error);
    }
  }

  return null;
}

export async function chatWithGroceryGemini(
  userPrompt: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string | null> {
  const systemInstruction = `You are MKB Smart AI, a friendly and patient cooking assistant. Your goal is to guide people who may have little or no cooking experience through recipes step by step, as if you are standing right beside them in the kitchen.

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

4. STRUCTURE every recipe response EXACTLY like this:
   🍽️ [Recipe Name]

   ⏱️ Preparation Time: [X minutes]
   🔥 Cooking Time: [Y minutes]
   👥 Servings: [N people/servings]

   ### 🛒 Ingredients
   * [Quantity and ingredient]
   * [Quantity and ingredient]

   ### 👨‍🍳 Cooking Steps
   **Step 1 — [Title of Step]**
   [Short, clear paragraph with what to do, heat level, duration, and sensory check]

   **Step 2 — [Title of Step]**
   [Instructions...]

   ### 💡 Cooking Tips
   * [Tip 1]
   * [Tip 2]

   ### 🍴 Serving
   [Serving suggestion: e.g. Serve hot with your favorite accompaniment.]

5. If exact ingredients and quantities are provided in the user prompt, you MUST use them EXACTLY without changing, omitting, or recalculating any ingredients or quantities. Otherwise, scale quantities correctly based on the target in the user request.
6. If a section like Cooking Tips is not needed for a simple recipe, omit it rather than leaving it empty.
7. Keep each step's paragraph short and focused so users can easily read it on mobile screens.
8. For meat, poultry, or seafood, include basic food safety guidance (e.g. chicken must be fully cooked — no pink inside, juices run clear).
9. For follow-up questions, respond in the context of the recipe discussed using a friendly tone, clear paragraphs, and bullet points.`;

  const contents: any[] = [
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    })),
    {
      role: "user",
      parts: [{ text: userPrompt }]
    }
  ];

  const ai = getGeminiClient();
  if (!ai) {
    console.warn("GEMINI_API_KEY is not configured.");
    return null;
  }

  for (const modelName of CANDIDATE_MODELS) {
    try {
      console.log(`Calling Gemini API (${modelName}) for cooking chat...`);
      const apiCall = ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3
        }
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Gemini chat API call with model "${modelName}" timed out after 15s`)), 15000)
      );

      const response: any = await Promise.race([apiCall, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch (error: any) {
      console.warn(`Gemini Chat with model "${modelName}" failed:`, error?.message || error);
    }
  }

  return null;
}
