import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCart } from "@/context/CartContext";
import { API_BASE_URL } from "@/context/AuthContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { resolveImageSource } from "@/utils/resolveImageSource";

// Helpers matching cart.tsx quantity & unit rules
type MeasurementUnit = "kg" | "l";

function parsePrice(value: string) {
  const clean = value.replace(/Rs\./i, "").replace(/LKR/i, "").trim();
  const numeric = Number(value.replace(/[^0-9]/g, "")) || 0;
  return clean.includes(".") ? numeric / 100 : numeric;
}

const formatLkr = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);

function roundQuantity(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDecimal(value: number) {
  return roundQuantity(value).toString().replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function getMeasurementUnit(subtitle: string): MeasurementUnit | null {
  const normalized = subtitle.replace(/\s+/g, "").toLowerCase();

  if (normalized.startsWith("1kg")) {
    return "kg";
  }

  if (normalized.startsWith("1l")) {
    return "l";
  }

  return null;
}

function formatMeasuredQuantity(quantity: number, unit: MeasurementUnit) {
  const rounded = roundQuantity(quantity);

  if (unit === "kg") {
    return rounded >= 1 ? `${formatDecimal(rounded)} kg` : `${Math.round(rounded * 1000)} g`;
  }

  return rounded >= 1 ? `${formatDecimal(rounded)} L` : `${Math.round(rounded * 1000)} ml`;
}

function formatSubtitleWithQuantity(subtitle: string, quantity: number) {
  const measuredUnit = getMeasurementUnit(subtitle);

  if (measuredUnit) {
    const match = subtitle.match(/^\s*1\s*([A-Za-z]+)(.*)$/i);

    if (match) {
      const [, , rest] = match;
      return `${formatMeasuredQuantity(quantity, measuredUnit)}${rest}`;
    }
  }

  const match = subtitle.match(/^(\d+(?:\.\d+)?)(\s*)([A-Za-z]+)?(.*)$/);

  if (!match) {
    return subtitle;
  }

  const [, , spacing, rawUnit, rest] = match;

  if (!rawUnit) {
    return `${formatDecimal(quantity)}${spacing}${rest}`;
  }

  // Keep measurement units unchanged (e.g., L, ml, kg) and only pluralize countable words.
  const nonPluralUnits = new Set(["g", "kg", "mg", "lb", "oz", "ml", "l"]);
  const isCountableWord = spacing.length > 0 && !nonPluralUnits.has(rawUnit.toLowerCase());
  const singularUnit = rawUnit.endsWith("s") ? rawUnit.slice(0, -1) : rawUnit;
  const unit = isCountableWord && quantity !== 1 ? `${singularUnit}s` : singularUnit;

  return `${formatDecimal(quantity)}${spacing}${unit}${rest}`;
}

function formatQuantityLabel(subtitle: string, quantity: number) {
  const measuredUnit = getMeasurementUnit(subtitle);

  if (measuredUnit) {
    return formatMeasuredQuantity(quantity, measuredUnit);
  }

  return formatDecimal(quantity);
}

// Simple local database of ingredients for keyword mapping
const RECIPE_DATABASE: Record<string, Array<{ name: string; category: string; baseQty: number; unit: string }>> = {
  "chicken curry": [
    { name: "Fresh Chicken", category: "Meat & Poultry", baseQty: 1, unit: "pack" },
    { name: "Curry Powder", category: "Spices & Spreads", baseQty: 1, unit: "packet" },
    { name: "Red Onion", category: "Vegetables", baseQty: 1, unit: "1kg" },
    { name: "Garlic", category: "Vegetables", baseQty: 0.25, unit: "1kg" },
    { name: "Coconut Milk 400ml", category: "Pantry", baseQty: 1, unit: "can" },
  ],
  "pasta": [
    { name: "Spaghetti Pasta 500g", category: "Pantry", baseQty: 1, unit: "packet" },
    { name: "Marinara Pasta Sauce", category: "Pantry", baseQty: 1, unit: "jar" },
    { name: "Parmesan Cheese 100g", category: "Dairy & Eggs", baseQty: 1, unit: "pack" },
    { name: "Garlic", category: "Vegetables", baseQty: 0.1, unit: "1kg" },
  ],
  "fried rice": [
    { name: "Rice 1kg", category: "Pantry", baseQty: 1, unit: "pack" },
    { name: "Eggs", category: "Dairy & Eggs", baseQty: 6, unit: "pack" },
    { name: "Soy Sauce", category: "Pantry", baseQty: 1, unit: "bottle" },
    { name: "Mixed Vegetables", category: "Vegetables", baseQty: 1, unit: "1kg" },
    { name: "Spring Onions", category: "Vegetables", baseQty: 1, unit: "bunch" },
  ],
  "salad": [
    { name: "Lettuce", category: "Vegetables", baseQty: 1, unit: "head" },
    { name: "Tomatoes 250g", category: "Vegetables", baseQty: 1, unit: "pack" },
    { name: "Cucumber", category: "Vegetables", baseQty: 1, unit: "piece" },
    { name: "Olive Oil", category: "Pantry", baseQty: 1, unit: "1L" },
  ]
};

type GeneratedItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  imageSource: any;
  quantity: number;
  subtitle: string;
};

export default function AIRecipeGenerator() {
  const { addItem, setItemQuantity } = useCart();
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [quantityType, setQuantityType] = useState("People");
  const [quantityValue, setQuantityValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [groceryList, setGroceryList] = useState<GeneratedItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Quantity editor modal states (matching cart.tsx)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [kgInput, setKgInput] = useState<string>("0");
  const [gInput, setGInput] = useState<string>("0");
  const [lInput, setLInput] = useState<string>("0");
  const [mlInput, setMlInput] = useState<string>("0");
  const [countInput, setCountInput] = useState<string>("1");

  const editingItem = editingItemId ? groceryList.find((i) => i.id === editingItemId) ?? null : null;
  const editingKind = editingItem ? getMeasurementUnit(editingItem.subtitle) : null;

  useEffect(() => {
    const fetchStoreProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/list`);
        if (res.ok) {
          const data = await res.json();
          setStoreProducts(data);
        }
      } catch (err) {
        console.error("Error fetching store products in AI Generator:", err);
      }
    };
    fetchStoreProducts();
  }, []);

  const getPlaceholder = () => {
    if (quantityType === "People") return "How many people are you cooking for?";
    if (quantityType === "Kg") return "Enter the required quantity in kilograms";
    if (quantityType === "L") return "Enter the required quantity in liters";
    return "";
  };

  const handleGenerate = () => {
    if (!recipeName.trim()) {
      alert("Please enter a recipe name");
      return;
    }
    const val = Number(quantityValue);
    if (!quantityValue || isNaN(val) || val <= 0) {
      alert("Please enter a valid quantity amount");
      return;
    }

    setLoading(true);
    setShowResults(false);

    // Simulate AI model processing
    setTimeout(() => {
      const normalizedRecipe = recipeName.toLowerCase().trim();
      let baseIngredients: Array<{ name: string; category: string; baseQty: number; unit: string }> = [];

      // Keyword matching
      if (normalizedRecipe.includes("chicken") || normalizedRecipe.includes("curry")) {
        baseIngredients = RECIPE_DATABASE["chicken curry"];
      } else if (normalizedRecipe.includes("pasta") || normalizedRecipe.includes("spaghetti") || normalizedRecipe.includes("noodle") || normalizedRecipe.includes("lasagna")) {
        baseIngredients = RECIPE_DATABASE["pasta"];
      } else if (normalizedRecipe.includes("rice") || normalizedRecipe.includes("biryani") || normalizedRecipe.includes("fried")) {
        baseIngredients = RECIPE_DATABASE["fried rice"];
      } else if (normalizedRecipe.includes("salad") || normalizedRecipe.includes("healthy") || normalizedRecipe.includes("green") || normalizedRecipe.includes("diet")) {
        baseIngredients = RECIPE_DATABASE["salad"];
      } else {
        // Fallback generic baking/cooking ingredients
        baseIngredients = [
          { name: "Olive Oil", category: "Pantry", baseQty: 1, unit: "1L" },
          { name: "Red Onion", category: "Vegetables", baseQty: 0.5, unit: "1kg" },
          { name: "Garlic", category: "Vegetables", baseQty: 0.1, unit: "1kg" },
          { name: "Salt", category: "Pantry", baseQty: 1, unit: "packet" },
        ];
      }

      // Calculate multiplier based on quantity selection
      let multiplier = 1;
      if (quantityType === "People") {
        multiplier = Math.ceil(val / 2); // Base recipe is for 2 people
      } else {
        multiplier = val;
      }

      const generated = baseIngredients.map((item, index) => {
        // Find match in actual store products database
        const match = storeProducts.find((p) =>
          p.name.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(p.name.toLowerCase())
        );

        const targetQuantity = roundQuantity(item.baseQty * multiplier);

        if (match) {
          return {
            id: match.id,
            name: match.name,
            category: match.category?.name || item.category,
            price: `Rs. ${match.price}`,
            imageSource: match.image ? { uri: match.image } : BEST_SELLING[0].imageSource,
            quantity: Math.max(0.05, targetQuantity),
            subtitle: `${match.unit || "piece"}, Price`,
          };
        } else {
          return {
            id: `mock-ai-${item.name.toLowerCase().replace(/\s+/g, "-")}-${index}`,
            name: item.name,
            category: item.category,
            price: "Rs. 150.00",
            imageSource: BEST_SELLING[0].imageSource,
            quantity: Math.max(0.05, targetQuantity),
            subtitle: `${item.unit || "piece"}, Price`,
          };
        }
      });

      setGroceryList(generated);
      setLoading(false);
      setShowResults(true);
    }, 1500);
  };

  const adjustQty = (id: string, delta: number) => {
    setGroceryList((current) =>
      current
        .map((item) => {
          if (item.id === id) {
            const nextQty = roundQuantity(item.quantity + delta);
            return { ...item, quantity: Math.min(Math.max(nextQty, 0), 20) };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const openEditorFor = (id: string) => {
    const item = groceryList.find((i) => i.id === id);
    if (!item) return;

    const kind = getMeasurementUnit(item.subtitle);
    setEditingItemId(id);

    // initialize inputs from existing quantity
    const qty = roundQuantity(item.quantity);
    if (kind === "kg") {
      const kg = Math.floor(qty);
      const g = Math.round((qty - kg) * 1000);
      setKgInput(String(kg));
      setGInput(String(g));
    } else if (kind === "l") {
      const l = Math.floor(qty);
      const ml = Math.round((qty - l) * 1000);
      setLInput(String(l));
      setMlInput(String(ml));
    } else {
      setCountInput(String(Math.round(qty)));
    }
  };

  const closeEditor = () => {
    setEditingItemId(null);
  };

  const confirmEditor = () => {
    if (!editingItem) return;
    const kind = getMeasurementUnit(editingItem.subtitle);
    let targetQty = 0;

    if (kind === "kg") {
      let kg = Number(kgInput) || 0;
      let g = Number(gInput) || 0;
      if (kg < 0) kg = 0;
      if (g < 0) g = 0;
      if (kg > 20) kg = 20;
      if (kg >= 20) g = 0;
      if (g > 950) g = 950;
      targetQty = roundQuantity(kg + g / 1000);
    } else if (kind === "l") {
      let l = Number(lInput) || 0;
      let ml = Number(mlInput) || 0;
      if (l < 0) l = 0;
      if (ml < 0) ml = 0;
      if (l > 20) l = 20;
      if (l >= 20) ml = 0;
      if (ml > 950) ml = 950;
      targetQty = roundQuantity(l + ml / 1000);
    } else {
      let q = Math.round(Number(countInput) || 0);
      if (q < 0) q = 0;
      if (q > 20) q = 20;
      targetQty = q;
    }

    if (targetQty > 20) targetQty = 20;

    setGroceryList((current) =>
      current
        .map((item) => {
          if (item.id === editingItem.id) {
            return { ...item, quantity: targetQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );

    closeEditor();
  };

  const handleAddToCart = () => {
    if (groceryList.length === 0) return;

    groceryList.forEach((item) => {
      const isMeasured = getMeasurementUnit(item.subtitle);
      if (isMeasured) {
        // If it's a measured item (kg or l), we pass the fractional quantity directly to context
        // and adjust the item in one go.
        addItem({
          id: item.id,
          name: item.name,
          subtitle: item.subtitle,
          price: item.price,
          imageSource: item.imageSource,
        });
        // Since addItem defaults to 1, we set the actual decimal quantity
        setItemQuantity(item.id, item.quantity);
      } else {
        // For countable items (piece, pack), call addItem in a loop of size quantity
        for (let i = 0; i < item.quantity; i++) {
          addItem({
            id: item.id,
            name: item.name,
            subtitle: item.subtitle,
            price: item.price,
            imageSource: item.imageSource,
          });
        }
      }
    });

    setToastMessage(`${groceryList.length} items added to your cart!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fcfdfa]" edges={["top"]}>
      {/* Header */}
      <View className="px-5 py-4 border-b border-[#e1e5dd] bg-white">
        <Text className="text-[22px] font-bold text-[#0d631b] tracking-tight">AI Grocery Generator</Text>
        <Text className="text-[13px] text-slate-500 mt-1">
          Tell us what you want to cook and we’ll generate your grocery list
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 220 }}
      >
        {/* Input Card Layout */}
        <View className="rounded-[24px] border border-[#e1e5dd] bg-white p-5 shadow-sm mb-6">
          <Text className="text-[14px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Recipe generator form</Text>

          {/* Input 1: Recipe Name */}
          <View className="mb-4 text-left">
            <Text className="text-[14px] font-bold text-slate-800 mb-2">What do you want to cook?</Text>
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-[#f7f9f6] px-4">
              <Ionicons name="restaurant-outline" size={18} color="#0d631b" className="mr-3" />
              <TextInput
                value={recipeName}
                onChangeText={setRecipeName}
                placeholder="e.g. Chicken Curry, Pasta, Fried Rice"
                className="flex-1 py-3 text-slate-800 text-[15px]"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Input 2: Quantity Type */}
          <View className="mb-4 text-left">
            <Text className="text-[14px] font-bold text-slate-800 mb-2">Select Quantity Type</Text>
            <View className="flex-row items-center gap-2">
              {["People", "Kg", "L"].map((opt) => {
                const isSelected = quantityType === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setQuantityType(opt)}
                    className={`flex-1 items-center justify-center rounded-xl py-3 border ${isSelected
                        ? "bg-[#0d631b] border-[#0d631b]"
                        : "bg-[#f7f9f6] border-slate-200"
                      }`}
                  >
                    <Text
                      className={`text-[15px] font-bold ${isSelected ? "text-white" : "text-slate-700"
                        }`}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Input 3: Dynamic Quantity Value */}
          <View className="mb-6 text-left">
            <Text className="text-[14px] font-bold text-slate-800 mb-2">Quantity Amount</Text>
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-[#f7f9f6] px-4">
              <Ionicons name="calculator-outline" size={18} color="#0d631b" className="mr-3" />
              <TextInput
                value={quantityValue}
                onChangeText={setQuantityValue}
                placeholder={getPlaceholder()}
                keyboardType="numeric"
                className="flex-1 py-3 text-slate-800 text-[15px]"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          {/* Generate Button */}
          <Pressable
            onPress={handleGenerate}
            disabled={loading}
            className="flex-row items-center justify-center rounded-full bg-[#0d631b] py-3.5 px-6 shadow-md shadow-[#0d631b]/20 active:opacity-95 disabled:opacity-50"
            style={{ elevation: 3 }}
          >
            <Ionicons name="sparkles" size={18} color="white" className="mr-2" />
            <Text className="text-white text-base font-bold tracking-wide uppercase">
              {loading ? "Generating..." : "Generate Grocery"}
            </Text>
          </Pressable>
        </View>

        {/* Loading Spinner */}
        {loading && (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#0d631b" />
            <Text className="text-[15px] font-medium text-slate-600 mt-4">AI is curating your ingredients list...</Text>
          </View>
        )}

        {/* Grocery Results Section */}
        {showResults && (
          <View className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[18px] font-bold text-slate-900">Grocery List Results</Text>
              <Text className="text-sm font-semibold text-[#0d631b]">{groceryList.length} Items</Text>
            </View>

            {groceryList.length === 0 ? (
              <View className="rounded-[22px] border border-[#e1e5dd] bg-white p-8 items-center justify-center">
                <Ionicons name="leaf-outline" size={44} color="#94a3b8" />
                <Text className="text-[15px] font-semibold text-slate-800 mt-3">All ingredients removed</Text>
                <Text className="text-xs text-slate-500 mt-1 text-center">Try generating again or search products</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {groceryList.map((item) => {
                  const unitPrice = parsePrice(item.price);
                  const lineTotal = unitPrice * item.quantity;
                  const subtitle = formatSubtitleWithQuantity(item.subtitle, item.quantity);
                  const quantityLabel = formatQuantityLabel(item.subtitle, item.quantity);
                  const measuredUnit = getMeasurementUnit(item.subtitle);
                  const measuredStep = measuredUnit ? 0.05 : 1;

                  return (
                    <View
                      key={item.id}
                      className="flex-row overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm"
                    >
                      <Pressable
                        className="h-25 w-22 overflow-hidden rounded-2xl bg-slate-100 active:scale-[0.98]"
                      >
                        <Image
                          source={resolveImageSource(item.imageSource)}
                          style={{ width: 80, height: 80 }}
                          contentFit="cover"
                          accessibilityLabel={item.name}
                        />
                      </Pressable>

                      <View className="ml-4 flex-1">
                        <View className="flex-row items-start justify-between gap-3">
                          <View className="flex-1 text-left">
                            <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
                              {item.name}
                            </Text>
                            <Text className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
                              {subtitle}
                            </Text>
                          </View>

                          <Pressable
                            onPress={() => adjustQty(item.id, -item.quantity)}
                            hitSlop={10}
                            className="h-9 w-9 items-center justify-center rounded-full bg-slate-50 active:bg-slate-100"
                          >
                            <Ionicons name="trash-outline" size={18} color="#475569" />
                          </Pressable>
                        </View>

                        <View className="mt-2 flex-row items-center justify-between">
                          <View>
                            <Text className="text-lg font-extrabold text-[#15803d]">
                              {formatLkr(lineTotal)}
                            </Text>
                          </View>

                          <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm">
                            <Pressable
                              onPress={() =>
                                measuredUnit ? adjustQty(item.id, -measuredStep) : adjustQty(item.id, -1)
                              }
                              className="h-8 w-8 items-center justify-center rounded-full bg-white active:bg-emerald-50"
                            >
                              <Ionicons name="remove" size={18} color="#15803d" />
                            </Pressable>

                            <Pressable
                              onPress={() => openEditorFor(item.id)}
                              className="min-w-[54px] px-2 items-center justify-center"
                            >
                              <Text className="text-center text-sm font-bold text-slate-900">{quantityLabel}</Text>
                            </Pressable>

                            <Pressable
                              onPress={() =>
                                measuredUnit ? adjustQty(item.id, measuredStep) : adjustQty(item.id, 1)
                              }
                              className="h-8 w-8 items-center justify-center rounded-full bg-white active:bg-emerald-50"
                            >
                              <Ionicons name="add" size={18} color="#15803d" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Sticky Bottom Action Footer */}
        {showResults && groceryList.length > 0 && (
          <View
            className="absolute bottom-24 left-0 right-0 border-t border-[#e1e5dd] bg-white px-5 py-4 pb-8 shadow-xl"
            style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 12 }}
          >
            <Pressable
              onPress={handleAddToCart}
              className="flex-row items-center justify-center rounded-full bg-[#0d631b] py-4 shadow-md shadow-[#0d631b]/20 active:opacity-95"
            >
              <Ionicons name="cart-outline" size={20} color="white" className="mr-2" />
              <Text className="text-white text-base font-bold tracking-wide uppercase">
                Add Products to Cart
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>



      {/* Quantity Editor Modal */}
      <Modal visible={!!editingItemId} transparent animationType="fade" onRequestClose={closeEditor}>
        <View className="flex-1 items-center justify-center bg-black/45 px-5">
          <View className="w-full max-w-[420px] overflow-hidden rounded-[20px] bg-white p-5 shadow-2xl">
            <Text className="text-lg font-extrabold text-slate-900">Enter quantity</Text>
            <Text className="mt-2 text-sm text-slate-600 text-left">{editingItem?.name}</Text>

            {editingKind === "kg" ? (
              <View className="mt-4 flex-row items-center gap-2">
                <View className="flex-1 text-left">
                  <Text className="text-xs text-slate-500">kg (max 20)</Text>
                  <TextInput
                    value={kgInput}
                    onChangeText={setKgInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </View>

                <View className="w-32 text-left">
                  <Text className="text-xs text-slate-500">g (max 950)</Text>
                  <TextInput
                    value={gInput}
                    onChangeText={setGInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </View>
              </View>
            ) : editingKind === "l" ? (
              <View className="mt-4 flex-row items-center gap-2">
                <View className="flex-1 text-left">
                  <Text className="text-xs text-slate-500">L (max 20)</Text>
                  <TextInput
                    value={lInput}
                    onChangeText={setLInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </View>

                <View className="w-32 text-left">
                  <Text className="text-xs text-slate-500">ml (max 950)</Text>
                  <TextInput
                    value={mlInput}
                    onChangeText={setMlInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-800"
                  />
                </View>
              </View>
            ) : (
              <View className="mt-4 text-left">
                <Text className="text-xs text-slate-500">Quantity (max 20)</Text>
                <TextInput
                  value={countInput}
                  onChangeText={setCountInput}
                  keyboardType="numeric"
                  className="mt-1 h-12 w-full rounded-2xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </View>
            )}

            <View className="mt-5 flex-row gap-3">
              <Pressable onPress={closeEditor} className="flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5">
                <Text className="text-sm font-bold text-slate-700">Cancel</Text>
              </Pressable>

              <Pressable onPress={confirmEditor} className="flex-1 items-center justify-center rounded-2xl bg-[#15803d] py-3.5">
                <Text className="text-sm font-bold text-white">OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast popup */}
      {toastMessage !== "" && (
        <View
          className="fixed top-12 left-4 right-4 z-50 flex-row items-center rounded-2xl bg-[#dcfce7] border border-[#bbf7d0] px-4 py-3.5 shadow-lg"
          style={{ elevation: 8 }}
        >
          <Ionicons name="checkmark-circle" size={22} color="#16a34a" className="mr-3" />
          <Text className="font-semibold text-[15px] text-[#166534]">{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
