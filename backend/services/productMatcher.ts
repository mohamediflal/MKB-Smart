// Intelligent matching between AI-generated ingredient names and store database products.
// Deterministic token-based fuzzy matching with a small synonym map for common grocery terms.

const MIN_SCORE = 0.5;

const STOP_TOKENS = new Set([
  "the", "and", "with", "for", "from", "fresh", "organic", "pure", "premium",
  "natural", "high", "low", "big", "large", "small", "medium", "young", "ripe",
  "red", "white", "brown", "green", "yellow", "black", "golden", "local",
  "imported", "instant", "peeled", "frozen", "raw", "wild", "sea",
  "highland", "nuwara", "eliya", "bairaha", "jaffna", "sri", "lanka",
]);

const IRREGULAR_PLURALS: Record<string, string> = {
  leaves: "leaf",
  halves: "half",
  knives: "knife",
  potatoes: "potato",
  tomatoes: "tomato",
  chillies: "chilli",
  chilies: "chilli",
  onions: "onion",
  bananas: "banana",
  carrots: "carrot",
  eggs: "egg",
  mangoes: "mango",
  mangos: "mango",
  berries: "berry",
  biscuits: "biscuit",
  noodles: "noodle",
  grapes: "grape",
  cucumbers: "cucumber",
  beetroots: "beetroot",
  lemons: "lemon",
  limes: "lime",
  apples: "apple",
  oranges: "orange",
  peaches: "peach",
  pineapples: "pineapple",
  pumpkins: "pumpkin",
  beans: "bean",
  peas: "pea",
  prawns: "prawn",
  shrimps: "shrimp",
  fish: "fish",
};

// Tokens that indicate a product is a processed/prepared item (not a raw ingredient).
// When such a token appears only on the product side, the match is penalized so that
// e.g. "Potato" does not match "Lays Potato Chips" or "Chocolate" match "Chocolate Biscuits".
const PRODUCT_TYPE_TOKENS = new Set([
  "chip", "chips", "biscuit", "biscuits", "cookie", "cookies", "cracker", "crackers",
  "noodle", "noodles", "pasta", "candy", "sweet", "sweets", "icecream", "cake",
  "snack", "snacks", "wine", "beer", "cola", "soda", "juice", "syrup",
]);

const TOKEN_SYNONYMS: Record<string, string> = {
  chilli: "chili",
  chilly: "chili",
  chiles: "chili",
  chilis: "chili",
  chili: "chili",
  yoghurt: "yogurt",
  curd: "yogurt",
  aubergine: "eggplant",
  brinjal: "eggplant",
  capsicum: "bellpepper",
  capsicums: "bellpepper",
  bellpepper: "bellpepper",
  scallion: "springonion",
  scallions: "springonion",
  springonion: "springonion",
  springonions: "springonion",
  cilantro: "coriander",
  corriander: "coriander",
  prawn: "shrimp",
  shrimps: "shrimp",
  pudina: "mint",
  dhal: "dal",
  dahl: "dal",
  lentil: "dal",
  lentils: "dal",
  ketchup: "tomatosauce",
};

function normalizeToken(raw: string): string | null {
  const lower = raw.toLowerCase();
  if (!/^[a-z]/.test(lower)) return null;
  return lower;
}

function singularize(token: string): string {
  if (IRREGULAR_PLURALS[token]) return IRREGULAR_PLURALS[token];
  if (token.length <= 3) return token;
  if (token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.endsWith("oes")) return `${token.slice(0, -2)}`;
  if (token.endsWith("ves")) return `${token.slice(0, -3)}f`;
  if (token.endsWith("ss") || token.endsWith("us")) return token;
  if (token.endsWith("s")) return token.slice(0, -1);
  return token;
}

function canonicalToken(raw: string): string | null {
  const norm = normalizeToken(raw);
  if (!norm) return null;
  const singular = singularize(norm);
  const mapped = TOKEN_SYNONYMS[singular] || singular;
  return mapped;
}

// Extracts the base sale unit from a product unit string (e.g. "1 kg" -> "kg", "1 pack" -> "pack").
export function baseUnit(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/^\s*\d+(?:\.\d+)?\s*/, "").trim().toLowerCase();
}

// Returns true when a product sold in `productUnit` is a suitable vehicle for an
// ingredient whose AI unit hint is `unitHint`. Uses exact base-unit comparisons so
// that a "g" hint does not accidentally match "kg" products.
export function unitFits(unitHint: string | null | undefined, productUnit: string | null | undefined): boolean {
  const hint = (unitHint || "").toLowerCase();
  if (!hint) return false;
  const bu = baseUnit(productUnit);
  if (!bu) return false;

  if (hint === "g" || hint === "kg") return bu === "g" || bu === "kg";
  if (hint === "ml" || hint === "l" || hint === "litre" || hint === "liter") {
    return bu === "ml" || bu === "l" || bu === "litre" || bu === "liter";
  }
  return bu === hint || bu.includes(hint);
}

// Returns significant tokens (stopwords removed). Used for shared-token matching.
export function tokenizeIngredient(name: string): string[] {
  const tokens = rawTokens(name);
  return tokens.filter((t) => !STOP_TOKENS.has(t));
}

// Returns all canonical tokens (stopwords kept). Used for the specificity denominator
// so that long product names (e.g. "Highland Fresh Milk") cannot inflate the match score.
export function rawTokens(name: string): string[] {
  const cleaned = name
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .toLowerCase()
    .replace(/-/g, " ");
  const tokens: string[] = [];
  for (const part of cleaned.split(/\s+/)) {
    const canon = canonicalToken(part);
    if (!canon) continue;
    tokens.push(canon);
  }
  return tokens;
}

export type StoreProductLike = {
  id: string;
  name: string;
  unit?: string | null;
  price?: number;
  stock?: number | null;
  category?: any;
  image?: string | null;
};

// Score 0..1. Combines how much of the ingredient is covered by the product (coverage)
// and how specifically the shared tokens describe the product (specificity).
function matchScore(ingTokens: string[], prodTokens: string[]): number {
  const prodSignificant = prodTokens.filter((t) => !STOP_TOKENS.has(t));
  if (ingTokens.length === 0 || prodSignificant.length === 0) return 0;
  const ingSet = new Set(ingTokens);
  const prodSet = new Set(prodSignificant);
  let shared = 0;
  for (const t of ingTokens) if (prodSet.has(t)) shared += 1;
  if (shared === 0) return 0;

  const coverage = shared / ingTokens.length;
  const specificity = shared / prodTokens.length;
  let score = 0.6 * coverage + 0.4 * specificity;

  // Penalize when the product is a processed item whose product-type word is not shared
  // with the ingredient (e.g. "Potato" vs "Lays Potato Chips").
  const hasExtraProductType = prodSignificant.some(
    (t) => !ingSet.has(t) && PRODUCT_TYPE_TOKENS.has(t)
  );
  if (hasExtraProductType) score -= 0.35;

  return score;
}

// Returns the best matching store product for an ingredient, or null if none is suitable.
// `preferredUnit` is the ingredient's unit (e.g. "kg", "g", "ml", "pcs") used to break ties.
export function findBestProductMatch(
  ingredientName: string,
  products: StoreProductLike[],
  preferredUnit?: string | null
): StoreProductLike | null {
  if (!ingredientName || !ingredientName.trim() || products.length === 0) return null;

  const ingTokens = tokenizeIngredient(ingredientName);
  if (ingTokens.length === 0) return null;

  const normalizedIng = ingredientName.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, " ");
  const unitHint = (preferredUnit || "").toLowerCase();

  let best: { product: StoreProductLike; score: number } | null = null;

  for (const product of products) {
    const prodTokens = rawTokens(product.name);
    if (prodTokens.length === 0) continue;

    const normalizedProd = product.name.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, " ");

    let score: number;
    if (normalizedIng.length >= 3 && normalizedIng === normalizedProd) {
      score = 1;
    } else {
      score = matchScore(ingTokens, prodTokens);
    }

    if (score < MIN_SCORE) continue;

    // Prefer products sold in units closer to the ingredient scale when scores are tied
    const fits = unitFits(unitHint, product.unit);
    if (best && Math.abs(score - best.score) < 0.001) {
      if (fits && !unitFits(unitHint, best.product.unit)) {
        best = { product, score };
      }
      continue;
    }

    if (!best || score > best.score) {
      best = { product, score };
    }
  }

  return best ? best.product : null;
}
