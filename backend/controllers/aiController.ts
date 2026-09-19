import { Request, Response } from 'express';
import { prisma } from '../configs/prisma.js';
import { generateGroceryRecipe, chatWithGroceryAI } from '../services/nvidiaAi.js';
import { generateGroceryRecipeGemini, chatWithGroceryGemini } from '../services/geminiAi.js';
import { findBestProductMatch, StoreProductLike, baseUnit } from '../services/productMatcher.js';

// Controller to handle AI Recipe Generation
export const generateRecipeController = async (req: Request, res: Response) => {
  try {
    const { recipeName, quantityType, quantityValue, servings } = req.body;

    if (!recipeName || !recipeName.trim()) {
      return res.status(400).json({ success: false, message: "Recipe name is required" });
    }

    const qtyVal = quantityValue || servings || 1;
    const qtyType = quantityType || "People";
    const numServings = typeof qtyVal === "number" ? qtyVal : parseFloat(qtyVal as string) || 1;

    if (isNaN(numServings) || numServings <= 0) {
      return res.status(400).json({ success: false, message: "Quantity amount must be a positive number" });
    }

    // Fetch active products from the store database
    const dbProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true },
      orderBy: { name: 'asc' }
    });

    if (dbProducts.length === 0) {
      return res.status(500).json({ success: false, message: "No products are currently available in the store database" });
    }

    const storeProductsForAi = dbProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category?.name || "Grocery",
      unit: p.unit || "piece",
      price: p.price,
      stock: p.stock || 0
    }));

    // Step 1: Ask the AI for the required ingredients and quantities.
    let aiResult: any = null;
    try {
      if (process.env.GEMINI_API_KEY) {
        console.log("Calling Google Gemini API for recipe generation...");
        aiResult = await generateGroceryRecipeGemini(
          recipeName.trim(),
          qtyType,
          numServings,
          storeProductsForAi
        );
      }
    } catch (err) {
      console.warn("Gemini API call failed, attempting NVIDIA AI...", err);
    }

    if (!aiResult || !Array.isArray(aiResult.ingredients) || aiResult.ingredients.length === 0) {
      try {
        console.log("Calling NVIDIA AI API for recipe generation...");
        aiResult = await generateGroceryRecipe(
          recipeName.trim(),
          qtyType,
          numServings,
          storeProductsForAi
        );
      } catch (err) {
        console.warn("NVIDIA AI API failed or timed out.", err);
      }
    }

    // If the AI did not return valid structured ingredients, fail with a clear message
    // instead of silently returning hardcoded/dummy data.
    if (!aiResult || !Array.isArray(aiResult.ingredients) || aiResult.ingredients.length === 0) {
      return res.status(502).json({
        success: false,
        message: "The AI service could not generate a grocery list right now. Please try again in a moment."
      });
    }

    // Step 2: Normalize & validate ingredient relevance to the requested recipe.
    const normalizedRaw = aiResult.ingredients
      .map((ing: any) => normalizeIngredient(ing))
      .filter((ing: any) => ing && ing.name);

    const validatedIngredients = filterIrrelevantIngredients(recipeName, normalizedRaw);

    // Step 2.5: Validate and sanitize ingredient quantities to realistic culinary proportions
    const sanitizedIngredients = validateAndSanitizeIngredientQuantities(recipeName, numServings, validatedIngredients);

    // Step 3: Match each validated AI ingredient against the actual store products.
    const mappedIngredients = sanitizedIngredients
      .map((ing: any) => {
        // Authoritative path: fuzzy match the ingredient name against the store catalog.
        // The fuzzy matcher is unit-aware, so e.g. "Chicken" (kg) prefers "Fresh Chicken (1 kg)"
        // over "Bairaha Chicken (1 pack)". The AI's id hint is only used as a last resort
        // because the model sometimes copies store product names into the ingredient list.
        let matched = findBestProductMatch(ing.name, dbProducts as StoreProductLike[], ing.unit) || null;
        if (!matched && ing.id) {
          matched = dbProducts.find(p => p.id === ing.id) || null;
        }

        // Safety Guard: Verify matched store product is not incompatible with recipe
        if (matched && isProductIncompatibleWithRecipe(recipeName, matched.name, matched.category?.name)) {
          console.log(`[Product Matcher Guard] Rejected incompatible matched product "${matched.name}" for recipe "${recipeName}"`);
          matched = null;
        }

        // Reconcile the AI's numeric quantity, unit and displayQuantity so that the
        // cart quantity is expressed in the store product's sale unit (kg / L) when the
        // product is sold by weight or volume.
        const resolved = resolveQuantityAndDisplay(ing, matched?.unit);

        if (matched) {
          return {
            id: matched.id,
            name: matched.name,
            recipeIngredient: ing.name,
            category: matched.category?.name || ing.category || "Grocery",
            price: matched.price,
            image: matched.image,
            unit: matched.unit || ing.unit || "piece",
            stock: matched.stock || 0,
            quantity: resolved.quantity,
            displayQuantity: resolved.displayQuantity,
            isDbMatched: true
          };
        }

        // Ingredient required by the recipe but not available in the store database
        return {
          id: null,
          name: ing.name,
          recipeIngredient: ing.name,
          category: ing.category || "Grocery",
          price: 0,
          image: null,
          unit: resolved.unit || "item",
          stock: 0,
          quantity: resolved.quantity,
          displayQuantity: resolved.displayQuantity,
          isDbMatched: false
        };
      });

    // Intelligently combine duplicate ingredients: if multiple ingredients resolve
    // to the same store product or same name, sum their quantities and preserve recipe display quantity.
    const combinedMap = new Map<string, any>();
    for (const item of mappedIngredients) {
      const key = item.isDbMatched && item.id
        ? `prod_${item.id}`
        : `name_${String(item.name || "").trim().toLowerCase()}`;
      if (!key || key === "name_") continue;

      if (combinedMap.has(key)) {
        const existing = combinedMap.get(key);
        const mergedQty = clampQuantity(existing.quantity + item.quantity);
        existing.quantity = mergedQty;

        // Combine recipe display amounts if both have parsed amounts with the same unit
        if (existing.displayQuantity && item.displayQuantity) {
          const parsed1 = parseAmountFromDisplay(existing.displayQuantity);
          const parsed2 = parseAmountFromDisplay(item.displayQuantity);
          if (parsed1 && parsed2 && parsed1.unit === parsed2.unit) {
            existing.displayQuantity = `${Math.round((parsed1.value + parsed2.value) * 100) / 100} ${parsed1.unit}`;
          }
        }
      } else {
        combinedMap.set(key, { ...item });
      }
    }
    const uniqueIngredients = Array.from(combinedMap.values());

    if (uniqueIngredients.length === 0) {
      return res.status(502).json({
        success: false,
        message: "The AI service returned an empty grocery list. Please try again."
      });
    }

    return res.status(200).json({
      success: true,
      recipeName: recipeName.trim(),
      quantityType: qtyType,
      quantityValue: numServings,
      servings: numServings,
      ingredients: uniqueIngredients,
      instructions: (() => {
        if (Array.isArray(aiResult?.instructions) && aiResult.instructions.length > 0) {
          const isDessert = isDessertOrBakeryRecipe((recipeName || "").toLowerCase().trim());
          const cleaned = aiResult.instructions
            .map((step: any) => String(step || "").trim())
            .filter((step: string) => {
              if (!step) return false;
              const stepLower = step.toLowerCase();
              if (!isDessert && (stepLower.includes("cocoa") || stepLower.includes("chocolate") || stepLower.includes("vanilla extract"))) {
                return false;
              }
              return true;
            });
          if (cleaned.length > 0) return cleaned;
        }
        return [
          `Prepare all available ingredients for ${recipeName.trim()}.`,
          `Cook thoroughly according to recipe proportions for ${numServings} ${qtyType}.`,
          `Serve fresh and enjoy!`
        ];
      })()
    });
  } catch (error: any) {
    console.error("AI Recipe Generation Controller Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to generate recipe" });
  }
};

// Controller to handle AI Chat
export const chatController = async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const queryLower = message.toLowerCase().trim();

    // Fetch store products for product matching in chat
    const dbProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: { category: true },
      take: 30
    });

    let reply: string | null = null;
    if (process.env.GEMINI_API_KEY) {
      try {
        reply = await chatWithGroceryGemini(message.trim(), history || []);
      } catch (geminiErr) {
        console.warn("Gemini Chat failed, falling back to NVIDIA:", geminiErr);
      }
    }

    if (!reply) {
      reply = await chatWithGroceryAI(message.trim(), history || []);
    }

    // Filter matched store products for interactive product cards
    const matchedProducts = dbProducts.filter(p =>
      queryLower.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().split(' ').some(w => w.length > 3 && queryLower.includes(w))
    ).slice(0, 4).map(p => ({
      id: p.id,
      name: p.name,
      price: `Rs. ${p.price}`,
      quantity: 1,
      subtitle: p.unit || "piece",
      image: p.image
    }));

    return res.status(200).json({
      success: true,
      reply,
      products: matchedProducts
    });
  } catch (error: any) {
    console.error("AI Chat Controller Error:", error);
    return res.status(500).json({ success: false, message: error.message || "AI Chat failed" });
  }
};

function normalizeIngredient(ing: any): any {
  if (!ing || typeof ing !== "object") return null;
  const rawQty = typeof ing.quantity === "number" ? ing.quantity : parseFloat(String(ing.quantity));
  const quantity = isNaN(rawQty) ? 1 : rawQty;
  const unit = typeof ing.unit === "string" ? ing.unit.trim() : "piece";

  let displayQuantity = typeof ing.displayQuantity === "string" ? ing.displayQuantity.trim() : "";
  const unitForDisplay = unit || "item";
  if (displayQuantity && !/[a-zA-Z]/.test(displayQuantity)) {
    // Bare number (e.g. "2") with no unit -> attach the ingredient unit
    displayQuantity = `${formatDecimal(quantity)} ${unitForDisplay}`;
  }

  return {
    id: typeof ing.id === "string" ? ing.id : null,
    name: typeof ing.name === "string" ? ing.name.trim() : "",
    quantity,
    displayQuantity,
    unit,
    category: typeof ing.category === "string" ? ing.category : "Grocery",
  };
}

function formatDecimal(value: number): string {
  return Math.round(value * 100) / 100 + "";
}

function clampQuantity(qty: number): number {
  const safe = isNaN(qty) ? 1 : Math.max(0.05, Math.round(qty * 100) / 100);
  return safe;
}

function formatDisplayQuantity(ing: any): string {
  const q = clampQuantity(ing.quantity);
  const u = baseUnit(ing.unit) || (ing.unit && ing.unit.trim()) || "item";
  const lowerU = u.toLowerCase();
  if (lowerU === "g" && q >= 1000) return `${Math.round(q / 1000 * 100) / 100} kg`;
  if (lowerU === "kg" && q < 1) return `${Math.round(q * 1000)} g`;
  if (lowerU === "ml" && q >= 1000) return `${Math.round(q / 1000 * 100) / 100} L`;
  if ((lowerU === "l" || lowerU === "litre" || lowerU === "liter") && q < 1) return `${Math.round(q * 1000)} ml`;
  return `${q} ${u}`;
}

// Parses a leading numeric amount + unit out of a display string like "2.5 kg",
// "500 g", "2 bunches" or "As needed". Returns null when no amount is present.
function parseAmountFromDisplay(display: string): { value: number; unit: string } | null {
  const match = /(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/.exec((display || "").trim());
  if (!match) return null;
  return {
    value: parseFloat(match[1].replace(",", ".")),
    unit: match[2].toLowerCase(),
  };
}

// True for weight/volume sale units (kg, g, L, ml).
function isMeasuredUnit(unit: string): boolean {
  return unit === "kg" || unit === "g" || unit === "ml" || unit === "l" || unit === "litre" || unit === "liter";
}

/**
 * Normalizes purchasable quantity according to store purchasing policy:
 * - Weight-based products: minimum 100 g (0.1 kg).
 * - Liquid-based products: minimum 100 ml (0.1 L).
 * - Piece/count-based products: minimum 1.
 */
export function normalizePurchasableQuantity(
  rawQty: number,
  productUnit?: string | null
): number {
  const prodBase = baseUnit(productUnit);
  const qty = isNaN(rawQty) || rawQty <= 0 ? 0.1 : rawQty;

  if (prodBase === "kg") {
    // Stored in kg: minimum 0.1 kg (100 g)
    return Math.max(0.1, Math.round(qty * 100) / 100);
  }
  if (prodBase === "g") {
    // Stored in g: minimum 100 g
    return Math.max(100, Math.round(qty));
  }
  if (prodBase === "l" || prodBase === "liter" || prodBase === "litre") {
    // Stored in L: minimum 0.1 L (100 ml)
    return Math.max(0.1, Math.round(qty * 100) / 100);
  }
  if (prodBase === "ml") {
    // Stored in ml: minimum 100 ml
    return Math.max(100, Math.round(qty));
  }

  // Countable/piece products: minimum 1
  return Math.max(1, Math.round(qty));
}

// Resolves a single AI ingredient's numeric quantity, display quantity and unit.
// The numeric quantity is expressed in the store product's sale unit so the cart
// quantity matches the display. Policy:
//  - Product sold by weight/volume + requirement in kg/g/L/ml -> exact kg/L amount (normalized to store minimums).
//  - Product sold by weight/volume + requirement in pcs/tsp/cups -> scaled kg/L amount (normalized to store minimums).
//  - Product sold by count (pcs/pack/bunch) -> the required count.
function resolveQuantityAndDisplay(
  ing: any,
  productUnit?: string | null
): { quantity: number; displayQuantity: string; unit: string } {
  const rawQty = typeof ing.quantity === "number" && isFinite(ing.quantity) ? ing.quantity : parseFloat(String(ing.quantity ?? ""));
  const safeRaw = isNaN(rawQty) ? 1 : Math.max(0, rawQty);
  const ingUnit = (typeof ing.unit === "string" ? ing.unit : "").toLowerCase();

  let displayQuantity = typeof ing.displayQuantity === "string" ? ing.displayQuantity.trim() : "";
  if (!displayQuantity || !/[a-zA-Z]/.test(displayQuantity)) {
    displayQuantity = formatDisplayQuantity({ quantity: safeRaw, unit: ingUnit || "item" });
  }

  const prodBase = baseUnit(productUnit);
  const prodMeasured = isMeasuredUnit(prodBase);
  const parsed = parseAmountFromDisplay(displayQuantity);

  let quantity = safeRaw;
  if (parsed) {
    if (isMeasuredUnit(parsed.unit)) {
      // Normalize the mass/volume amount into the product's sale unit.
      quantity = parsed.unit === "g" ? parsed.value / 1000 : parsed.unit === "ml" ? parsed.value / 1000 : parsed.value;
      if (prodBase === "g") quantity = quantity * 1000;
      else if (prodBase === "ml") quantity = quantity * 1000;
    } else if (prodMeasured) {
      if (parsed.unit === "tsp") {
        quantity = (parsed.value * 5) / 1000;
      } else if (parsed.unit === "tbsp") {
        quantity = (parsed.value * 15) / 1000;
      } else if (parsed.unit === "cloves" || parsed.unit === "clove") {
        quantity = (parsed.value * 5) / 1000;
      } else {
        const approxMatch = /approx\.?\s*(\d+(?:[.,]\d+)?)\s*g/i.exec(displayQuantity);
        if (approxMatch) {
          const approxG = parseFloat(approxMatch[1].replace(",", "."));
          quantity = approxG / 1000;
        } else {
          // If piece/count item sold by weight in store:
          const ingNameLower = String(ing.name || "").toLowerCase();
          if (ingNameLower.includes("chili") || ingNameLower.includes("chilli")) {
            quantity = (parsed.value * 5) / 1000; // ~40g for 8 pcs -> normalizes to 0.1 kg (100 g)
          } else if (ingNameLower.includes("garlic")) {
            quantity = (parsed.value * 5) / 1000;
          } else {
            quantity = (parsed.value * 100) / 1000;
          }
        }
      }
      if (prodBase === "g") quantity = quantity * 1000;
      else if (prodBase === "ml") quantity = quantity * 1000;
    } else {
      quantity = parsed.value;
    }
  } else if (ingUnit === "g") {
    quantity = safeRaw / 1000;
    if (prodBase === "g") quantity = quantity * 1000;
  } else if (ingUnit === "ml") {
    quantity = safeRaw / 1000;
    if (prodBase === "ml") quantity = quantity * 1000;
  }

  // Normalize according to store minimum purchasing rules (100g weight / 100ml liquid / 1 piece)
  const normalizedQuantity = normalizePurchasableQuantity(quantity, productUnit);

  const ingNameLower = String(ing.name || "").toLowerCase().trim();
  const isCarbOrNoodle =
    ingNameLower.includes("noodle") ||
    ingNameLower.includes("pasta") ||
    ingNameLower.includes("spaghetti") ||
    ingNameLower.includes("macaroni") ||
    ingNameLower.includes("roll");

  const isEgg =
    !isCarbOrNoodle &&
    !ingNameLower.includes("eggplant") &&
    (ingNameLower === "egg" ||
      ingNameLower === "eggs" ||
      ingNameLower === "red egg" ||
      ingNameLower === "red eggs" ||
      ingNameLower === "white egg" ||
      ingNameLower === "white eggs" ||
      ingNameLower === "chicken egg" ||
      ingNameLower === "chicken eggs" ||
      ingNameLower === "brown egg" ||
      ingNameLower === "brown eggs" ||
      ingNameLower === "fresh egg" ||
      ingNameLower === "fresh eggs" ||
      ingNameLower === "raw egg" ||
      ingNameLower === "raw eggs" ||
      ingNameLower === "boiled egg" ||
      ingNameLower === "boiled eggs");

  if (isEgg) {
    const finalEggQty = Math.max(1, Math.round(normalizedQuantity));
    return {
      quantity: finalEggQty,
      displayQuantity: `${finalEggQty} pcs`,
      unit: "pcs",
    };
  }

  return {
    quantity: clampQuantity(normalizedQuantity),
    displayQuantity,
    unit: ingUnit || "item",
  };
}

/**
 * Validates and sanitizes AI-generated ingredient quantities to guarantee realistic,
 * culinary-accurate scaling and prevent absurd values (e.g. 2 kg of chilli powder for 10 people).
 */
export function validateAndSanitizeIngredientQuantities(
  recipeName: string,
  numServings: number,
  ingredients: any[]
): any[] {
  const servings = Math.max(1, isNaN(numServings) ? 1 : numServings);
  const normRecipe = (recipeName || "").toLowerCase().trim();

  return ingredients.map((ing) => {
    if (!ing || !ing.name) return ing;
    let name = String(ing.name).trim();
    let nameLower = name.toLowerCase();
    let qty = typeof ing.quantity === "number" && isFinite(ing.quantity) ? ing.quantity : parseFloat(String(ing.quantity)) || 1;
    let unit = (typeof ing.unit === "string" ? ing.unit.trim() : "g").toLowerCase();
    let display = (typeof ing.displayQuantity === "string" ? ing.displayQuantity.trim() : "");

    // 0. Eggs (CRITICAL: MUST ALWAYS be in 'pcs', never 'kg', 'g', or other weight units)
    const isNoodleOrCarb =
      nameLower.includes("noodle") ||
      nameLower.includes("pasta") ||
      nameLower.includes("spaghetti") ||
      nameLower.includes("macaroni") ||
      nameLower.includes("roll");

    const isEgg =
      !isNoodleOrCarb &&
      !nameLower.includes("eggplant") &&
      (nameLower === "egg" ||
        nameLower === "eggs" ||
        nameLower === "red egg" ||
        nameLower === "red eggs" ||
        nameLower === "white egg" ||
        nameLower === "white eggs" ||
        nameLower === "chicken egg" ||
        nameLower === "chicken eggs" ||
        nameLower === "brown egg" ||
        nameLower === "brown eggs" ||
        nameLower === "fresh egg" ||
        nameLower === "fresh eggs" ||
        nameLower === "farm egg" ||
        nameLower === "farm eggs" ||
        nameLower === "raw egg" ||
        nameLower === "raw eggs" ||
        nameLower === "boiled egg" ||
        nameLower === "boiled eggs");

    if (isEgg) {
      if (nameLower === "eggs") {
        name = "Egg";
      }
      let eggCount: number;
      if (unit === "kg" || unit === "kgs" || unit === "kilo" || unit === "g" || unit === "grams") {
        // Correct impossible weight unit for eggs to realistic count based on servings (e.g. 10 people = 10 pcs)
        eggCount = Math.max(1, Math.round(servings * 1.0));
        console.log(`[Quantity Sanitizer] Corrected impossible egg weight (${qty} ${unit}) for "${name}" (${servings} servings) to ${eggCount} pcs`);
      } else if (unit === "pcs" || unit === "pc" || unit === "piece" || unit === "pieces" || unit === "item") {
        if (servings >= 4 && qty < servings * 0.5) {
          eggCount = Math.max(1, Math.round(servings * 1.0));
          console.log(`[Quantity Sanitizer] Corrected unrealistic egg count (${qty} pcs) for "${name}" (${servings} servings) to ${eggCount} pcs`);
        } else {
          eggCount = Math.max(1, Math.round(qty));
        }
      } else {
        eggCount = Math.max(1, Math.round(servings * 1.0));
      }

      qty = eggCount;
      unit = "pcs";
      display = `${eggCount} pcs`;

      return {
        ...ing,
        name,
        quantity: qty,
        unit,
        displayQuantity: display,
      };
    }

    // 1. Spices & Seasonings (Red Chili Powder, Turmeric, Masalas, Salt, etc.)
    const isChiliPowder =
      nameLower.includes("chili powder") ||
      nameLower.includes("chilli powder") ||
      nameLower.includes("chile powder") ||
      nameLower.includes("crushed chili") ||
      nameLower.includes("chilli flakes") ||
      nameLower.includes("chili flakes") ||
      ((nameLower.includes("red chili") || nameLower.includes("red chilli")) && !nameLower.includes("fresh") && !nameLower.includes("sauce"));

    const isGeneralSpice =
      isChiliPowder ||
      nameLower.includes("turmeric") ||
      nameLower.includes("curry powder") ||
      nameLower.includes("garam masala") ||
      nameLower.includes("biryani masala") ||
      nameLower.includes("coriander powder") ||
      nameLower.includes("cumin powder") ||
      nameLower.includes("cumin seed") ||
      nameLower.includes("black pepper") ||
      nameLower.includes("white pepper") ||
      nameLower.includes("paprika") ||
      nameLower.includes("fenugreek") ||
      nameLower.includes("cardamom") ||
      nameLower.includes("cinnamon") ||
      nameLower.includes("clove") ||
      nameLower.includes("nutmeg") ||
      nameLower.includes("saffron") ||
      nameLower.includes("salt");

    if (isChiliPowder) {
      // For 10 people biryani/curry: 40-70g (standard catering target: ~55g total, or ~5.5g per serving)
      const targetGrams = Math.round(servings * 5.5);

      if (unit === "kg" || unit === "kgs" || unit === "kilo" || unit === "l" || unit === "liter" || unit === "litre") {
        console.log(`[Quantity Sanitizer] Corrected impossible spice unit (${qty} ${unit}) for "${name}" (${servings} servings) to ${targetGrams} g`);
        qty = targetGrams;
        unit = "g";
        display = `${targetGrams} g`;
      } else if (unit === "g") {
        if (qty > servings * 14 || qty > 160) {
          console.log(`[Quantity Sanitizer] Corrected unrealistic spice quantity (${qty} g) for "${name}" (${servings} servings) to ${targetGrams} g`);
          qty = targetGrams;
          display = `${targetGrams} g`;
        }
      } else if (unit === "tbsp" || unit === "tsp") {
        const maxTbsp = Math.max(3, servings * 0.8);
        if (unit === "tbsp" && qty > maxTbsp) {
          qty = Math.round(servings * 0.4 * 10) / 10;
          display = `${qty} tbsp`;
        }
      }
    } else if (isGeneralSpice) {
      // Ground spices & salt: unit MUST NEVER be kg
      if (unit === "kg" || unit === "kgs" || unit === "kilo" || unit === "l" || unit === "liter" || unit === "litre") {
        const targetGrams = nameLower.includes("salt") ? Math.round(servings * 3.5) : Math.round(servings * 2);
        console.log(`[Quantity Sanitizer] Corrected impossible unit for spice/salt "${name}" to ${targetGrams} g`);
        qty = targetGrams;
        unit = "g";
        display = `${targetGrams} g`;
      } else if (unit === "g") {
        const maxGrams = nameLower.includes("salt") ? servings * 10 : servings * 8;
        if (qty > maxGrams && qty > 80) {
          const targetGrams = nameLower.includes("salt") ? Math.round(servings * 3.5) : Math.round(servings * 2);
          qty = targetGrams;
          display = `${targetGrams} g`;
        }
      }
    }

    // 2. Fresh Green Chilies / Fresh Red Chilies (Produce)
    const isFreshChili = (nameLower.includes("green chili") || nameLower.includes("green chilli") || nameLower.includes("fresh chili")) && !isChiliPowder;
    if (isFreshChili) {
      if (unit === "kg" || unit === "kgs" || (unit === "g" && qty > servings * 25 && qty > 80)) {
        const pcs = Math.max(2, Math.round(servings * 0.7)); // 10 people = 7 pcs
        const grams = pcs * 6; // approx 40-50g
        console.log(`[Quantity Sanitizer] Corrected fresh chili quantity for "${name}" to ${pcs} pcs (approx. ${grams} g)`);
        qty = pcs;
        unit = "pcs";
        display = `${pcs} pcs (approx. ${grams} g)`;
      }
    }

    // 3. Garlic & Ginger
    if (nameLower.includes("garlic") && !nameLower.includes("powder") && !nameLower.includes("bread")) {
      if (unit === "kg" || (unit === "g" && qty > servings * 20 && qty > 80)) {
        const cloves = Math.max(3, Math.round(servings * 1.0)); // 10 people = 10 cloves (~50g)
        qty = cloves;
        unit = "cloves";
        display = `${cloves} cloves (approx. ${cloves * 5} g)`;
      }
    }
    if (nameLower.includes("ginger") && !nameLower.includes("powder") && !nameLower.includes("beer")) {
      if (unit === "kg" || (unit === "g" && qty > servings * 15 && qty > 80)) {
        const grams = Math.max(10, Math.round(servings * 4)); // 10 people = 40g
        qty = grams;
        unit = "g";
        display = `${grams} g`;
      }
    }

    // 4. Rice / Grains (when cooked in recipe e.g. Biryani)
    if (nameLower.includes("rice") && (normRecipe.includes("biryani") || normRecipe.includes("briyani") || normRecipe.includes("fried rice") || normRecipe.includes("pulao"))) {
      if (unit === "kg" && qty > servings * 0.25) {
        const targetKg = Math.round(servings * 0.11 * 10) / 10; // ~1.1 kg for 10 people
        qty = targetKg;
        display = `${targetKg} kg`;
      }
    }

    // 5. Meat / Chicken / Protein
    if ((nameLower.includes("chicken") || nameLower.includes("beef") || nameLower.includes("mutton") || nameLower.includes("fish")) && !nameLower.includes("sauce") && !nameLower.includes("cube")) {
      if (unit === "kg" && qty > servings * 0.35) {
        const targetKg = Math.round(servings * 0.17 * 10) / 10; // ~1.7 kg for 10 people
        qty = targetKg;
        display = `${targetKg} kg`;
      }
    }

    return {
      ...ing,
      name,
      quantity: qty,
      unit,
      displayQuantity: display || `${qty} ${unit}`,
    };
  });
}

const STAPLE_CARB_RULES: Array<{
  keywords: string[];
  allowedRecipeTerms: string[];
}> = [
    {
      // Rice & Rice products
      keywords: ["basmati rice", "white rice", "red rice", "samba rice", "jasmin rice", "jasmine rice", "cooked rice", "raw rice", "rice"],
      allowedRecipeTerms: ["rice", "biriyani", "briyani", "biryani", "pulao", "pillawo", "pilaf", "risotto", "khichdi", "congee", "nasi", "paella", "jambalaya"]
    },
    {
      // Noodles & Pasta products
      keywords: ["noodle", "noodles", "pasta", "spaghetti", "macaroni", "lasagna", "penne", "fettuccine", "ramen", "vermicelli", "chow mein"],
      allowedRecipeTerms: ["noodle", "noodles", "pasta", "spaghetti", "macaroni", "lasagna", "penne", "fettuccine", "ramen", "vermicelli", "chow mein", "lo mein", "pad thai", "laksa"]
    },
    {
      // Breads & Flatbreads
      keywords: ["roti", "naan", "bread", "paratha", "chapati", "pitta", "pita", "tortilla", "baguette"],
      allowedRecipeTerms: ["bread", "roti", "naan", "paratha", "chapati", "sandwich", "burger", "wrap", "taco", "toast", "shawarma", "sub", "bruschetta", "pitta", "pita", "tortilla"]
    }
  ];

export function isDessertOrBakeryRecipe(normRecipe: string): boolean {
  return (
    normRecipe.includes("cake") ||
    normRecipe.includes("cookie") ||
    normRecipe.includes("brownie") ||
    normRecipe.includes("pancake") ||
    normRecipe.includes("waffle") ||
    normRecipe.includes("pastry") ||
    normRecipe.includes("muffin") ||
    normRecipe.includes("cupcake") ||
    normRecipe.includes("pudding") ||
    normRecipe.includes("custard") ||
    normRecipe.includes("dessert") ||
    normRecipe.includes("donut") ||
    normRecipe.includes("doughnut") ||
    normRecipe.includes("tart") ||
    normRecipe.includes("pie") ||
    normRecipe.includes("sweet") ||
    normRecipe.includes("halwa") ||
    normRecipe.includes("payasam") ||
    normRecipe.includes("kheer") ||
    normRecipe.includes("gulab jamun") ||
    normRecipe.includes("ice cream") ||
    normRecipe.includes("chocolate")
  );
}

export function isBiryaniRecipe(normRecipe: string): boolean {
  return (
    normRecipe.includes("biryani") ||
    normRecipe.includes("biriyani") ||
    normRecipe.includes("briyani")
  );
}

// Ingredients exclusively used in sweet baking, desserts, or confectionery.
// Strictly forbidden in savory main dishes (Biryani, Curries, Noodles, Fried Rice, Soups, etc.).
const DESSERT_AND_BAKING_TERMS = [
  "cocoa powder", "cocoa", "cacao", "chocolate", "chocolate chip", "chocolate chips", "chocolate syrup",
  "vanilla extract", "vanilla essence", "vanilla pod", "vanilla", "strawberry essence",
  "custard powder", "jelly powder", "gelatin", "marshmallow", "marshmallows",
  "icing sugar", "powdered sugar", "frosting", "sprinkles",
  "cake mix", "brownie mix", "cookie dough"
];

// Condiments and sauces unrelated to authentic Biryani preparation
const BIRYANI_UNRELATED_CONDIMENTS = [
  "soy sauce", "oyster sauce", "fish sauce", "barbecue sauce", "bbq sauce",
  "mayonnaise", "ketchup", "tomato ketchup", "mustard sauce", "mustard paste",
  "pasta sauce", "pizza sauce", "marinara sauce", "tartar sauce"
];

// Starches unrelated to Biryani (which inherently uses rice)
const BIRYANI_UNRELATED_GRAINS = [
  "noodle", "noodles", "pasta", "spaghetti", "macaroni", "lasagna", "ramen",
  "chow mein", "vermicelli", "oats", "rolled oats"
];

export function filterIrrelevantIngredients(recipeName: string, ingredients: any[]): any[] {
  const normRecipe = (recipeName || "").toLowerCase().trim();
  const isBiryani = isBiryaniRecipe(normRecipe);
  const isDessert = isDessertOrBakeryRecipe(normRecipe);

  // Variant flags for Biryani protein consistency
  const isVegBiryani = isBiryani && (normRecipe.includes("veg") || normRecipe.includes("paneer") || normRecipe.includes("mushroom"));
  const isChickenBiryani = isBiryani && normRecipe.includes("chicken");
  const isMuttonBiryani = isBiryani && (normRecipe.includes("mutton") || normRecipe.includes("lamb") || normRecipe.includes("goat"));
  const isBeefBiryani = isBiryani && normRecipe.includes("beef");
  const isFishBiryani = isBiryani && normRecipe.includes("fish");
  const isPrawnBiryani = isBiryani && (normRecipe.includes("prawn") || normRecipe.includes("shrimp"));

  return ingredients.filter((ing) => {
    if (!ing || !ing.name) return false;
    const ingNameLower = String(ing.name).toLowerCase().trim();

    // 1. Check side-dish staple carbs (e.g. side bread / side rice for curry)
    for (const rule of STAPLE_CARB_RULES) {
      const isStapleCarb = rule.keywords.some((kw) => ingNameLower === kw || ingNameLower.includes(kw));
      if (isStapleCarb) {
        const isRecipeAllowed = rule.allowedRecipeTerms.some((term) => normRecipe.includes(term));
        if (!isRecipeAllowed) {
          console.log(`[Validation Filter] Removed irrelevant side-dish staple "${ing.name}" from recipe "${recipeName}"`);
          return false;
        }
      }
    }

    // 2. Prevent confectionery, sweet baking, and dessert items in savory recipes
    if (!isDessert) {
      const isDessertIngredient = DESSERT_AND_BAKING_TERMS.some((term) =>
        ingNameLower === term || ingNameLower.includes(term)
      );
      if (isDessertIngredient) {
        console.log(`[Validation Filter] Removed incompatible dessert/baking ingredient "${ing.name}" from savory recipe "${recipeName}"`);
        return false;
      }

      // Leaveners like baking powder/soda are not used in Biryani, curries, or rice
      if (isBiryani || normRecipe.includes("curry") || normRecipe.includes("rice")) {
        if (ingNameLower.includes("baking powder") || ingNameLower.includes("baking soda") || ingNameLower === "yeast") {
          console.log(`[Validation Filter] Removed baking leavener "${ing.name}" from recipe "${recipeName}"`);
          return false;
        }
      }
    }

    // 3. Strict Biryani culinary relevance rules
    if (isBiryani) {
      // 3a. Incompatible grains and noodles
      if (BIRYANI_UNRELATED_GRAINS.some((g) => ingNameLower === g || ingNameLower.includes(g))) {
        console.log(`[Validation Filter] Removed incompatible carb "${ing.name}" from Biryani recipe "${recipeName}"`);
        return false;
      }

      // 3b. Incompatible condiments
      if (BIRYANI_UNRELATED_CONDIMENTS.some((c) => ingNameLower === c || ingNameLower.includes(c))) {
        console.log(`[Validation Filter] Removed unrelated condiment "${ing.name}" from Biryani recipe "${recipeName}"`);
        return false;
      }

      // 3c. Protein specificity for Biryani
      if (isVegBiryani) {
        const meatTerms = ["chicken", "beef", "mutton", "lamb", "goat", "pork", "fish", "prawn", "shrimp", "seafood", "crab", "squid", "bacon", "ham", "sausage"];
        if (meatTerms.some((m) => ingNameLower.includes(m))) {
          console.log(`[Validation Filter] Removed non-veg ingredient "${ing.name}" from Vegetarian Biryani "${recipeName}"`);
          return false;
        }
      } else if (isChickenBiryani) {
        const competingProteins = ["mutton", "lamb", "goat", "beef", "pork", "fish", "prawn", "shrimp", "crab", "squid"];
        if (competingProteins.some((m) => ingNameLower.includes(m))) {
          console.log(`[Validation Filter] Removed competing protein "${ing.name}" from Chicken Biryani "${recipeName}"`);
          return false;
        }
      } else if (isMuttonBiryani) {
        const competingProteins = ["chicken", "beef", "pork", "fish", "prawn", "shrimp", "crab", "squid"];
        if (competingProteins.some((m) => ingNameLower.includes(m))) {
          console.log(`[Validation Filter] Removed competing protein "${ing.name}" from Mutton Biryani "${recipeName}"`);
          return false;
        }
      } else if (isBeefBiryani) {
        const competingProteins = ["chicken", "mutton", "lamb", "goat", "pork", "fish", "prawn", "shrimp", "crab", "squid"];
        if (competingProteins.some((m) => ingNameLower.includes(m))) {
          console.log(`[Validation Filter] Removed competing protein "${ing.name}" from Beef Biryani "${recipeName}"`);
          return false;
        }
      } else if (isFishBiryani) {
        const competingProteins = ["chicken", "beef", "mutton", "lamb", "goat", "pork", "prawn", "shrimp", "crab", "squid"];
        if (competingProteins.some((m) => ingNameLower.includes(m))) {
          console.log(`[Validation Filter] Removed competing meat/seafood "${ing.name}" from Fish Biryani "${recipeName}"`);
          return false;
        }
      } else if (isPrawnBiryani) {
        const competingProteins = ["chicken", "beef", "mutton", "lamb", "goat", "pork", "fish"];
        if (competingProteins.some((m) => ingNameLower.includes(m))) {
          console.log(`[Validation Filter] Removed competing protein "${ing.name}" from Prawn Biryani "${recipeName}"`);
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Validates whether a matched store product is culinary-compatible with the recipe.
 * Prevents store catalog mismatches (e.g. Cocoa Powder matching a Biryani spice)
 * from ever being attached to the grocery list.
 */
export function isProductIncompatibleWithRecipe(
  recipeName: string,
  productName: string,
  categoryName?: string | null
): boolean {
  const normRecipe = (recipeName || "").toLowerCase().trim();
  const prodLower = (productName || "").toLowerCase().trim();
  const catLower = (categoryName || "").toLowerCase().trim();

  const isDessert = isDessertOrBakeryRecipe(normRecipe);
  const isBiryani = isBiryaniRecipe(normRecipe);

  if (!isDessert) {
    // Savory recipes must never match sweet dessert / baking products
    if (
      prodLower.includes("cocoa") ||
      prodLower.includes("chocolate") ||
      prodLower.includes("custard powder") ||
      prodLower.includes("jelly") ||
      prodLower.includes("marshmallow") ||
      prodLower.includes("vanilla extract") ||
      prodLower.includes("vanilla essence")
    ) {
      return true;
    }

    if (isBiryani && catLower.includes("baking") && (prodLower.includes("powder") || prodLower.includes("extract"))) {
      return true;
    }
  }

  if (isBiryani) {
    if (
      prodLower.includes("pasta") ||
      prodLower.includes("noodle") ||
      prodLower.includes("macaroni") ||
      prodLower.includes("spaghetti") ||
      prodLower.includes("mayonnaise") ||
      prodLower.includes("soy sauce")
    ) {
      return true;
    }

    // Protein check on matched store product for Biryani
    const isVegBiryani = normRecipe.includes("veg") || normRecipe.includes("paneer");
    const isChickenBiryani = normRecipe.includes("chicken");
    const isMuttonBiryani = normRecipe.includes("mutton") || normRecipe.includes("lamb");
    const isBeefBiryani = normRecipe.includes("beef");
    const isFishBiryani = normRecipe.includes("fish");
    const isPrawnBiryani = normRecipe.includes("prawn") || normRecipe.includes("shrimp");

    const allMeatTerms = ["chicken", "beef", "mutton", "lamb", "pork", "fish", "prawn", "shrimp"];
    if (isVegBiryani && allMeatTerms.some((t) => prodLower.includes(t))) return true;
    if (isChickenBiryani && ["mutton", "beef", "pork", "fish", "prawn", "shrimp"].some((t) => prodLower.includes(t))) return true;
    if (isMuttonBiryani && ["chicken", "beef", "pork", "fish", "prawn", "shrimp"].some((t) => prodLower.includes(t))) return true;
    if (isBeefBiryani && ["chicken", "mutton", "pork", "fish", "prawn", "shrimp"].some((t) => prodLower.includes(t))) return true;
    if (isFishBiryani && ["chicken", "beef", "mutton", "pork", "prawn", "shrimp"].some((t) => prodLower.includes(t))) return true;
    if (isPrawnBiryani && ["chicken", "beef", "mutton", "pork"].some((t) => prodLower.includes(t))) return true;
  }

  return false;
}

let isRecipeHistoryTableChecked = false;
async function ensureRecipeHistoryTable() {
  if (isRecipeHistoryTableChecked) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RecipeHistory" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "recipeName" TEXT NOT NULL,
        "quantityType" TEXT NOT NULL,
        "quantityValue" TEXT NOT NULL,
        "ingredients" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "RecipeHistory_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "RecipeHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
  } catch (tableErr) {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RecipeHistory" (
          "id" TEXT NOT NULL,
          "userId" TEXT NOT NULL,
          "recipeName" TEXT NOT NULL,
          "quantityType" TEXT NOT NULL,
          "quantityValue" TEXT NOT NULL,
          "ingredients" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RecipeHistory_pkey" PRIMARY KEY ("id")
        );
      `);
    } catch { }
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RecipeHistory" ADD COLUMN IF NOT EXISTS "ingredients" TEXT;
    `);
  } catch { }

  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RecipeHistory_userId_idx" ON "RecipeHistory"("userId");
    `);
  } catch { }

  isRecipeHistoryTableChecked = true;
}

// Controller to fetch user's recipe history (User isolated)
export const getRecipeHistoryController = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID missing." });
    }

    await ensureRecipeHistoryTable();

    let history: any[] = [];
    try {
      history = await prisma.$queryRawUnsafe<any[]>(
        `SELECT "id", "userId", "recipeName", "quantityType", "quantityValue", "ingredients", "createdAt", "updatedAt"
         FROM "RecipeHistory"
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC`,
        req.userId
      );
    } catch {
      try {
        history = await prisma.$queryRawUnsafe<any[]>(
          `SELECT "id", "userId", "recipeName", "quantityType", "quantityValue", "createdAt", "updatedAt"
           FROM "RecipeHistory"
           WHERE "userId" = $1
           ORDER BY "createdAt" DESC`,
          req.userId
        );
      } catch {
        try {
          history = await (prisma as any).recipeHistory.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
          });
        } catch {
          history = [];
        }
      }
    }

    return res.json({
      success: true,
      history: (history || []).map((h: any) => {
        let parsedIngredients: any[] = [];
        if (h.ingredients) {
          try {
            parsedIngredients = typeof h.ingredients === 'string' ? JSON.parse(h.ingredients) : h.ingredients;
          } catch {
            parsedIngredients = [];
          }
        }
        return {
          id: h.id,
          recipeName: h.recipeName,
          quantityType: h.quantityType,
          quantityValue: h.quantityValue,
          ingredients: parsedIngredients,
          timestamp: new Date(h.createdAt || h.createdat || Date.now()).getTime(),
        };
      }),
    });
  } catch (error: any) {
    console.error("Error fetching recipe history:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch recipe history" });
  }
};

// Controller to save a new recipe history record (User isolated)
export const createRecipeHistoryController = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID missing." });
    }

    const { recipeName, quantityType, quantityValue, ingredients } = req.body;
    if (!recipeName || !recipeName.trim() || !quantityValue || !String(quantityValue).trim()) {
      return res.status(400).json({ success: false, message: "Recipe name and quantity value are required." });
    }

    await ensureRecipeHistoryTable();

    const recipeNameStr = recipeName.trim();
    const quantityTypeStr = (quantityType || "People").trim();
    const quantityValueStr = String(quantityValue).trim();
    const ingredientsJson = ingredients ? (typeof ingredients === 'string' ? ingredients : JSON.stringify(ingredients)) : null;

    // Delete existing duplicate for this user if any
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "RecipeHistory"
         WHERE "userId" = $1
           AND LOWER("recipeName") = LOWER($2)
           AND "quantityType" = $3
           AND "quantityValue" = $4`,
        req.userId,
        recipeNameStr,
        quantityTypeStr,
        quantityValueStr
      );
    } catch {
      try {
        await (prisma as any).recipeHistory.deleteMany({
          where: {
            userId: req.userId,
            recipeName: { equals: recipeNameStr, mode: 'insensitive' },
            quantityType: quantityTypeStr,
            quantityValue: quantityValueStr,
          },
        });
      } catch {
        // Ignore if deletion fails
      }
    }

    const historyId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    let inserted = false;

    // 1. Try raw insert with ingredients and CURRENT_TIMESTAMP (avoids Date object conversion in Neon driver)
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "RecipeHistory" ("id", "userId", "recipeName", "quantityType", "quantityValue", "ingredients", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        historyId,
        req.userId,
        recipeNameStr,
        quantityTypeStr,
        quantityValueStr,
        ingredientsJson
      );
      inserted = true;
    } catch (insertErr1: any) {
      console.warn("Direct insert with ingredients column failed, trying without ingredients column:", insertErr1?.message);
    }

    // 2. If table didn't have ingredients column yet, try raw insert without ingredients
    if (!inserted) {
      try {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "RecipeHistory" ("id", "userId", "recipeName", "quantityType", "quantityValue", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          historyId,
          req.userId,
          recipeNameStr,
          quantityTypeStr,
          quantityValueStr
        );
        inserted = true;
      } catch (insertErr2: any) {
        console.warn("Direct insert without ingredients failed, trying Prisma Client:", insertErr2?.message);
      }
    }

    // 3. Fallback to Prisma Client create with proper connection relation
    if (!inserted) {
      try {
        await (prisma as any).recipeHistory.create({
          data: {
            id: historyId,
            recipeName: recipeNameStr,
            quantityType: quantityTypeStr,
            quantityValue: quantityValueStr,
            user: { connect: { id: req.userId } },
          },
        });
        inserted = true;
      } catch (prismaErr: any) {
        // Also try with userId directly in case unchecked input is accepted
        try {
          await (prisma as any).recipeHistory.create({
            data: {
              id: historyId,
              userId: req.userId,
              recipeName: recipeNameStr,
              quantityType: quantityTypeStr,
              quantityValue: quantityValueStr,
            },
          });
          inserted = true;
        } catch (prismaErr2: any) {
          console.error("Prisma recipeHistory.create fallback also failed:", prismaErr2?.message);
        }
      }
    }

    let returnIngredients: any[] = [];
    if (ingredientsJson) {
      try {
        returnIngredients = JSON.parse(ingredientsJson);
      } catch {
        returnIngredients = Array.isArray(ingredients) ? ingredients : [];
      }
    }

    return res.status(201).json({
      success: true,
      item: {
        id: historyId,
        recipeName: recipeNameStr,
        quantityType: quantityTypeStr,
        quantityValue: quantityValueStr,
        ingredients: returnIngredients,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error("Error creating recipe history:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to save recipe history" });
  }
};

// Controller to delete a recipe history record (User isolated)
export const deleteRecipeHistoryController = async (req: Request & { userId?: string }, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. User ID missing." });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "History ID is required." });
    }

    await ensureRecipeHistoryTable();

    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "RecipeHistory" WHERE "id" = $1 AND "userId" = $2`,
        id,
        req.userId
      );
    } catch {
      try {
        await (prisma as any).recipeHistory.deleteMany({
          where: {
            id: id,
            userId: req.userId,
          },
        });
      } catch { }
    }

    return res.json({
      success: true,
      message: "Recipe history item deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting recipe history:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete recipe history" });
  }
};


