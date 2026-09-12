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

    // Step 3: Match each validated AI ingredient against the actual store products.
    const mappedIngredients = validatedIngredients
      .map((ing: any) => {
        // Authoritative path: fuzzy match the ingredient name against the store catalog.
        // The fuzzy matcher is unit-aware, so e.g. "Chicken" (kg) prefers "Fresh Chicken (1 kg)"
        // over "Bairaha Chicken (1 pack)". The AI's id hint is only used as a last resort
        // because the model sometimes copies store product names into the ingredient list.
        let matched = findBestProductMatch(ing.name, dbProducts as StoreProductLike[], ing.unit) || null;
        if (!matched && ing.id) {
          matched = dbProducts.find(p => p.id === ing.id) || null;
        }

        // Reconcile the AI's numeric quantity, unit and displayQuantity so that the
        // cart quantity is expressed in the store product's sale unit (kg / L) when the
        // product is sold by weight or volume.
        const resolved = resolveQuantityAndDisplay(ing, matched?.unit);

        if (matched) {
          return {
            id: matched.id,
            name: matched.name,
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
    // to the same store product or same name, sum their quantities and update display quantity.
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
        // Re-format displayQuantity for the combined amount
        const prodBase = baseUnit(existing.unit);
        if (prodBase === "kg" || prodBase === "g" || prodBase === "l" || prodBase === "ml") {
          existing.displayQuantity = formatDisplayQuantity({ quantity: mergedQty, unit: existing.unit });
        } else {
          existing.displayQuantity = `${mergedQty} ${existing.unit || "pcs"}`;
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
      instructions: aiResult?.instructions || [
        `Prepare all available ingredients for ${recipeName.trim()}.`,
        `Cook thoroughly according to recipe proportions for ${numServings} ${qtyType}.`,
        `Serve fresh and enjoy!`
      ]
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
  const u = (ing.unit && ing.unit.trim()) || "item";
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

// Resolves a single AI ingredient's numeric quantity, display quantity and unit.
// The numeric quantity is expressed in the store product's sale unit so the cart
// quantity matches the display. Policy:
//  - Product sold by weight/volume + requirement in kg/g/L/ml -> exact kg/L amount.
//  - Product sold by weight/volume + requirement in pcs/tsp/cups -> minimum one store unit.
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
      // e.g. "2.5 tsp" of a spice that the store sells per kg -> minimum one store unit.
      quantity = 1;
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

  return {
    quantity: clampQuantity(quantity),
    displayQuantity,
    unit: ingUnit || "item",
  };
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

export function filterIrrelevantIngredients(recipeName: string, ingredients: any[]): any[] {
  const normRecipe = (recipeName || "").toLowerCase().trim();

  return ingredients.filter((ing) => {
    if (!ing || !ing.name) return false;
    const ingNameLower = String(ing.name).toLowerCase().trim();

    for (const rule of STAPLE_CARB_RULES) {
      const isStapleCarb = rule.keywords.some((kw) => ingNameLower === kw || ingNameLower.includes(kw));
      if (isStapleCarb) {
        // Check if recipe name explicitly requires/contains this staple carb
        const isRecipeAllowed = rule.allowedRecipeTerms.some((term) => normRecipe.includes(term));
        if (!isRecipeAllowed) {
          console.log(`[Validation Filter] Removed irrelevant side-dish ingredient "${ing.name}" from recipe "${recipeName}"`);
          return false;
        }
      }
    }
    return true;
  });
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
    } catch {}
  }

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "RecipeHistory" ADD COLUMN IF NOT EXISTS "ingredients" TEXT;
    `);
  } catch {}

  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "RecipeHistory_userId_idx" ON "RecipeHistory"("userId");
    `);
  } catch {}

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
      } catch {}
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


