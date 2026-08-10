import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Modal,
  Animated,
  PanResponder,
  TouchableOpacity,
  Keyboard,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCart } from "@/context/CartContext";
import { API_BASE_URL, useAuth } from "@/context/AuthContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { resolveImageSource } from "@/utils/resolveImageSource";

const STORAGE_KEY_HISTORY = "@mkb_recipe_history";

type MeasurementUnit = "kg" | "l";

type HistoryItem = {
  id: string;
  recipeName: string;
  quantityType: string;
  quantityValue: string;
  timestamp: number;
};

function formatHistoryTitle(recipeName: string, quantityType: string, quantityValue: string) {
  const name = recipeName.trim();
  const val = quantityValue.trim();
  if (quantityType === "People") {
    const num = Number(val);
    const label = num === 1 ? "person" : "people";
    return `${name} for ${val} ${label}`;
  }
  if (quantityType === "Kg") return `${val} kg ${name}`;
  if (quantityType === "L") return `${val} L ${name}`;
  return `${name} (${val} ${quantityType})`;
}

function SwipeableHistoryCard({
  item,
  onPress,
  onDelete,
}: {
  item: HistoryItem;
  onPress: () => void;
  onDelete: () => void;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isOpen, setIsOpen] = useState(false);
  const title = formatHistoryTitle(item.recipeName, item.quantityType, item.quantityValue);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) pan.setValue({ x: Math.min(gestureState.dx, 100), y: 0 });
        else if (isOpen && gestureState.dx < 0) pan.setValue({ x: Math.max(80 + gestureState.dx, 0), y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > 40) {
          Animated.spring(pan, { toValue: { x: 80, y: 0 }, useNativeDriver: false }).start();
          setIsOpen(true);
        } else {
          Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
          setIsOpen(false);
        }
      },
    })
  ).current;

  const handleClose = () => {
    Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    setIsOpen(false);
  };

  return (
    <View className="relative mb-3 overflow-hidden rounded-2xl">
      <View className="absolute inset-y-0 left-0 w-[80px] bg-rose-600 justify-center items-center rounded-2xl">
        <Pressable onPress={() => { handleClose(); onDelete(); }} className="h-full w-full items-center justify-center bg-rose-600 active:bg-rose-700 rounded-l-2xl">
          <Ionicons name="trash-outline" size={22} color="white" />
          <Text className="text-[11px] font-bold text-white mt-1">Delete</Text>
        </Pressable>
      </View>
      <Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX: pan.x }] }} className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
        <Pressable onPress={() => { if (isOpen) handleClose(); else onPress(); }} className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 gap-3.5 pr-2">
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-[#0d631b]/10 border border-[#0d631b]/20">
              <Ionicons name="sparkles" size={20} color="#0d631b" />
            </View>
            <View className="flex-1">
              <Text className="text-[16px] font-bold text-slate-900" numberOfLines={1}>{title}</Text>
              <Text className="text-[12px] font-semibold text-[#0d631b] mt-0.5">Generate Recipe with AI</Text>
            </View>
          </View>
          <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-50 border border-slate-100">
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function parsePrice(value: string) {
  const clean = value.replace(/Rs\./i, "").replace(/LKR/i, "").trim();
  const numeric = Number(value.replace(/[^0-9]/g, "")) || 0;
  return clean.includes(".") ? numeric / 100 : numeric;
}

const formatLkr = (value: number) => new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value);
function roundQuantity(value: number) { return Math.round(value * 100) / 100; }
function formatDecimal(value: number) { return roundQuantity(value).toString().replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1"); }
function getMeasurementUnit(subtitle: string): MeasurementUnit | null {
  const normalized = subtitle.replace(/\s+/g, "").toLowerCase();
  if (normalized.startsWith("1kg")) return "kg";
  if (normalized.startsWith("1l")) return "l";
  return null;
}
function formatMeasuredQuantity(quantity: number, unit: MeasurementUnit) {
  const rounded = roundQuantity(quantity);
  if (unit === "kg") return rounded >= 1 ? `${formatDecimal(rounded)} kg` : `${Math.round(rounded * 1000)} g`;
  return rounded >= 1 ? `${formatDecimal(rounded)} L` : `${Math.round(rounded * 1000)} ml`;
}
function formatSubtitleWithQuantity(subtitle: string, quantity: number) {
  const measuredUnit = getMeasurementUnit(subtitle);
  if (measuredUnit) {
    const match = subtitle.match(/^\s*1\s*([A-Za-z]+)(.*)$/i);
    if (match) return `${formatMeasuredQuantity(quantity, measuredUnit)}${match[2]}`;
  }
  const match = subtitle.match(/^(\d+(?:\.\d+)?)(\s*)([A-Za-z]+)?(.*)$/);
  if (!match) return subtitle;
  const [, , spacing, rawUnit, rest] = match;
  if (!rawUnit) return `${formatDecimal(quantity)}${spacing}${rest}`;
  const nonPluralUnits = new Set(["g", "kg", "mg", "lb", "oz", "ml", "l"]);
  const isCountableWord = spacing.length > 0 && !nonPluralUnits.has(rawUnit.toLowerCase());
  const singularUnit = rawUnit.endsWith("s") ? rawUnit.slice(0, -1) : rawUnit;
  const unit = isCountableWord && quantity !== 1 ? `${singularUnit}s` : singularUnit;
  return `${formatDecimal(quantity)}${spacing}${unit}${rest}`;
}
function formatQuantityLabel(subtitle: string, quantity: number) {
  const measuredUnit = getMeasurementUnit(subtitle);
  if (measuredUnit) return formatMeasuredQuantity(quantity, measuredUnit);
  return formatDecimal(quantity);
}

type GeneratedItem = {
  id: string | null;
  tempKey: string;
  name: string;
  category: string;
  price: string;
  imageSource: any;
  quantity: number;
  displayQuantity?: string;
  subtitle: string;
  isAvailable: boolean;
};

// Curated list of common recipe names to supplement the product database
const COMMON_RECIPES = [
  "Noodles", "Chicken Noodles", "Vegetable Noodles", "Spicy Noodles", "Egg Noodles",
  "Chicken Curry", "Chicken Biryani", "Chicken Fried Rice", "Chilli Chicken", "Chicken Soup",
  "Mutton Biryani", "Beef Biryani", "Vegetable Biryani", "Prawn Biryani", "Fish Biryani",
  "Fried Rice", "Vegetable Fried Rice", "Egg Fried Rice", "Prawn Fried Rice",
  "Pasta", "Pasta Carbonara", "Pasta Arrabiata", "Creamy Pasta", "Spaghetti Bolognese",
  "Pizza", "Margherita Pizza", "Chicken Pizza", "BBQ Pizza",
  "Dhal Curry", "Lentil Soup", "Tomato Soup", "Mushroom Soup", "Corn Soup",
  "Kottu Roti", "Egg Kottu", "Chicken Kottu", "Beef Kottu",
  "Hoppers", "Egg Hoppers", "String Hoppers",
  "Fish Curry", "Prawn Curry", "Crab Curry", "Mutton Curry", "Beef Curry", "Pork Curry",
  "Vegetable Curry", "Potato Curry", "Jackfruit Curry", "Coconut Sambol",
  "Pancakes", "Waffles", "French Toast", "Omelette", "Scrambled Eggs",
  "Sandwich", "Club Sandwich", "Grilled Chicken Sandwich",
  "Burger", "Chicken Burger", "Beef Burger", "Veggie Burger",
  "Salad", "Caesar Salad", "Pasta Salad", "Fruit Salad", "Greek Salad",
  "Smoothie", "Milkshake", "Lassi", "Juice",
  "Pudding", "Caramel Pudding", "Bread Pudding",
  "Cake", "Chocolate Cake", "Vanilla Cake", "Carrot Cake",
  "Cookies", "Brownies", "Muffins",
  "Idly", "Dosa", "Sambar", "Vada",
  "Upma", "Pongal", "Poha", "Aloo Paratha", "Chapathi", "Roti",
  "Palak Paneer", "Paneer Butter Masala", "Butter Chicken",
  "Tandoori Chicken", "Chicken Tikka", "Kebab",
  "Haleem", "Khichdi", "Rajma Chawal", "Chole Bhature",
  "Pav Bhaji", "Samosa", "Pakora", "Spring Rolls",
  "Fried Chicken", "Grilled Fish", "BBQ Ribs", "Stir Fry",
  "Tacos", "Burritos", "Nachos", "Quesadilla",
  "Sushi", "Ramen", "Udon", "Tempura",
  "Kimchi Fried Rice", "Bibimbap", "Bulgogi",
  "Tom Yum Soup", "Pad Thai", "Green Curry", "Red Curry", "Massaman Curry",
];

export default function AIRecipeGenerator() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, setItemQuantity } = useCart();
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [recipeName, setRecipeName] = useState("");
  const [quantityType, setQuantityType] = useState("People");
  const [quantityValue, setQuantityValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [groceryList, setGroceryList] = useState<GeneratedItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [recipeHistory, setRecipeHistory] = useState<HistoryItem[]>([]);
  const [editingItemKey, setEditingItemKey] = useState<string | null>(null);
  const [kgInput, setKgInput] = useState<string>("0");
  const [gInput, setGInput] = useState<string>("0");
  const [lInput, setLInput] = useState<string>("0");
  const [mlInput, setMlInput] = useState<string>("0");
  const [countInput, setCountInput] = useState<string>("1");

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionScrollRef = useRef<ScrollView>(null);

  const editingItem = editingItemKey ? groceryList.find((i) => i.tempKey === editingItemKey) ?? null : null;
  const editingKind = editingItem ? getMeasurementUnit(editingItem.subtitle) : null;

  useEffect(() => {
    const fetchStoreProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/list`);
        if (res.ok) setStoreProducts(await res.json());
      } catch (err) {
        console.error("Error fetching store products:", err);
      }
    };
    fetchStoreProducts();
  }, []);

  // Fetch recipe history for the logged-in user
  useEffect(() => {
    if (user && user.token) {
      fetch(`${API_BASE_URL}/api/ai/history`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.history)) {
            setRecipeHistory(data.history);
          } else {
            setRecipeHistory([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching recipe history:", err);
          setRecipeHistory([]);
        });
    } else {
      setRecipeHistory([]);
    }
  }, [user]);

  // Build the full autocomplete source: common recipes + product names from DB
  const allRecipeNames = useCallback((): string[] => {
    const productNames = storeProducts.map((p: any) => p.name as string);
    const combined = [...COMMON_RECIPES, ...productNames];
    // Deduplicate case-insensitively
    const seen = new Set<string>();
    return combined.filter((name) => {
      const key = name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [storeProducts]);

  // Filter suggestions with debounce
  const handleRecipeNameChange = (text: string) => {
    setRecipeName(text);
    setHighlightedIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      const query = text.toLowerCase();
      const matched = allRecipeNames()
        .filter((name) => name.toLowerCase().includes(query))
        .slice(0, 8); // cap at 8 suggestions
      setSuggestions(matched);
      setShowSuggestions(matched.length > 0 || text.trim().length > 0);
    }, 120);
  };

  const handleSelectSuggestion = (name: string) => {
    setRecipeName(name);
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    Keyboard.dismiss();
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Arrow up/down navigation helpers (called from custom nav buttons on mobile)
  const SUGGESTION_ITEM_HEIGHT = 50;
  const navigateSuggestions = (direction: "up" | "down") => {
    if (!showSuggestions || suggestions.length === 0) return;
    setHighlightedIndex((prev) => {
      const next =
        direction === "down"
          ? Math.min(prev + 1, suggestions.length - 1)
          : Math.max(prev - 1, -1);
      if (next >= 0) {
        suggestionScrollRef.current?.scrollTo({ y: next * SUGGESTION_ITEM_HEIGHT, animated: true });
      }
      return next;
    });
  };

  const confirmHighlightedSuggestion = () => {
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
      handleSelectSuggestion(suggestions[highlightedIndex]);
    }
  };

  const getActiveRecipeTitle = () => {
    if (recipeName.trim() && quantityValue.trim()) {
      return formatHistoryTitle(recipeName, quantityType, quantityValue);
    }
    if (recipeHistory.length > 0) {
      return formatHistoryTitle(recipeHistory[0].recipeName, recipeHistory[0].quantityType, recipeHistory[0].quantityValue);
    }
    return "Biriyani for 10 people";
  };

  const openGroceryHistoryChat = (titleOverride?: string) => {
    const titleToPass = titleOverride || getActiveRecipeTitle();
    setShowResults(false);
    router.push({
      pathname: "/GroceryHistoryChat",
      params: { recipeTitle: titleToPass },
    });
  };

  const saveRecipeToHistory = async (rName: string, qType: string, qVal: string) => {
    if (!rName.trim() || !qVal.trim()) return;
    const rNameClean = rName.trim();
    const qTypeClean = qType.trim();
    const qValClean = qVal.trim();

    const tempItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipeName: rNameClean,
      quantityType: qTypeClean,
      quantityValue: qValClean,
      timestamp: Date.now(),
    };

    // Optimistic local state update
    setRecipeHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.recipeName.toLowerCase() === rNameClean.toLowerCase() && h.quantityType === qTypeClean && h.quantityValue === qValClean)
      );
      return [tempItem, ...filtered];
    });

    if (user && user.token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({
            recipeName: rNameClean,
            quantityType: qTypeClean,
            quantityValue: qValClean,
          }),
        });
        const data = await res.json();
        if (data && data.success && data.item) {
          setRecipeHistory((prev) =>
            prev.map((item) => (item.id === tempItem.id ? data.item : item))
          );
        }
      } catch (err) {
        console.error("Error saving recipe history to DB:", err);
      }
    }
  };

  const handleDeleteHistory = async (id: string) => {
    setRecipeHistory((prev) => prev.filter((item) => item.id !== id));

    if (user && user.token) {
      try {
        await fetch(`${API_BASE_URL}/api/ai/history/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      } catch (err) {
        console.error("Error deleting recipe history from DB:", err);
      }
    }
  };

  const getPlaceholder = () => {
    if (quantityType === "People") return "How many people are you cooking for?";
    if (quantityType === "Kg") return "Enter the required quantity in kilograms";
    if (quantityType === "L") return "Enter the required quantity in liters";
    return "";
  };

  const handleGenerate = async (overrideName?: string, overrideType?: string, overrideValue?: string) => {
    const nameToUse = overrideName ?? recipeName;
    const typeToUse = overrideType ?? quantityType;
    const valToUse = overrideValue ?? quantityValue;
    if (!nameToUse.trim() || !valToUse || isNaN(Number(valToUse)) || Number(valToUse) <= 0) {
      alert("Please enter valid recipe details");
      return;
    }

    setLoading(true);
    setShowResults(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/generate-recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          recipeName: nameToUse,
          quantityType: typeToUse,
          quantityValue: valToUse,
          servings: Number(valToUse)
        })
      });
      clearTimeout(timeoutId);

      let data: any = null;
      try {
        data = await res.json();
      } catch (jsonErr) {
        // ignore invalid json body
      }

      if (res.ok) {
        if (data?.success && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
          const generated: GeneratedItem[] = data.ingredients.map((ing: any, index: number) => {
            const isAvailable = ing.isDbMatched === true && ing.id != null;
            const matchedStoreProduct = isAvailable ? storeProducts.find((p) => p.id === ing.id) : null;
            const imgUrl = matchedStoreProduct?.image || ing.image;

            return {
              id: isAvailable ? (matchedStoreProduct?.id || ing.id) : null,
              tempKey: `ing-${index}-${Date.now()}`,
              name: matchedStoreProduct?.name || ing.name,
              category: matchedStoreProduct?.category?.name || ing.category || "Grocery",
              price: isAvailable ? `Rs. ${matchedStoreProduct?.price ?? ing.price ?? "0.00"}` : "N/A",
              imageSource: imgUrl ? resolveImageSource(imgUrl) : (isAvailable ? BEST_SELLING[index % BEST_SELLING.length].imageSource : null),
              quantity: Math.max(0.05, roundQuantity(ing.quantity || 1)),
              displayQuantity: ing.displayQuantity || `${ing.quantity || 1} ${ing.unit || ''}`.trim(),
              subtitle: `${matchedStoreProduct?.unit || ing.unit || "piece"}`,
              isAvailable
            };
          });

          setGroceryList(generated);
          saveRecipeToHistory(nameToUse, typeToUse, valToUse);
          setShowResults(true);
          setRecipeName("");
          setQuantityType("People");
          setQuantityValue("");
        } else {
          alert(data?.message || "Could not generate grocery list. Please try again.");
        }
      } else {
        alert(data?.message || "Server error generating grocery list. Please try again.");
      }
    } catch (err: any) {
      console.warn("AI Recipe backend error:", err);
      if (err.name === 'AbortError') {
        alert("Request timed out. The AI is taking too long — please check your connection and try again.");
      } else {
        alert("Network error connecting to the AI service. Please try again.");
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const adjustQty = (tempKey: string, delta: number) =>
    setGroceryList((current) =>
      current
        .map((item) => (item.tempKey === tempKey ? { ...item, quantity: Math.min(Math.max(roundQuantity(item.quantity + delta), 0), 20) } : item))
        .filter((i) => i.quantity > 0)
    );

  const openEditorFor = (tempKey: string) => {
    const item = groceryList.find((i) => i.tempKey === tempKey);
    if (!item) return;
    const kind = getMeasurementUnit(item.subtitle);
    setEditingItemKey(tempKey);
    const qty = roundQuantity(item.quantity);
    if (kind === "kg") {
      setKgInput(String(Math.floor(qty)));
      setGInput(String(Math.round((qty - Math.floor(qty)) * 1000)));
    } else if (kind === "l") {
      setLInput(String(Math.floor(qty)));
      setMlInput(String(Math.round((qty - Math.floor(qty)) * 1000)));
    } else {
      setCountInput(String(Math.round(qty)));
    }
  };

  const closeEditor = () => setEditingItemKey(null);

  const confirmEditor = () => {
    if (!editingItem) return;
    const kind = getMeasurementUnit(editingItem.subtitle);
    let targetQty = 0;
    if (kind === "kg") targetQty = roundQuantity((Number(kgInput) || 0) + (Number(gInput) || 0) / 1000);
    else if (kind === "l") targetQty = roundQuantity((Number(lInput) || 0) + (Number(mlInput) || 0) / 1000);
    else targetQty = Math.round(Number(countInput) || 0);

    setGroceryList((current) =>
      current
        .map((item) => (item.tempKey === editingItem.tempKey ? { ...item, quantity: Math.min(Math.max(targetQty, 0), 20) } : item))
        .filter((i) => i.quantity > 0)
    );
    closeEditor();
  };

  const handleAddToCart = () => {
    const availableProducts = groceryList.filter((item) => item.isAvailable && item.id != null);

    if (availableProducts.length === 0) {
      alert("No available store products to add to cart.");
      return;
    }

    availableProducts.forEach((item) => {
      if (item.id) {
        if (getMeasurementUnit(item.subtitle)) {
          addItem({ id: item.id, name: item.name, subtitle: item.subtitle, price: item.price, imageSource: item.imageSource });
          setItemQuantity(item.id, item.quantity);
        } else {
          for (let i = 0; i < item.quantity; i++) {
            addItem({ id: item.id, name: item.name, subtitle: item.subtitle, price: item.price, imageSource: item.imageSource });
          }
        }
      }
    });

    saveRecipeToHistory(recipeName, quantityType, quantityValue);
    setShowResults(false);
    setToastMessage(`${availableProducts.length} available product${availableProducts.length > 1 ? 's' : ''} added to cart!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#fcfdfa]" edges={["top"]}>
      {/* Header Bar */}
      <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-slate-200/80 bg-white shadow-xs">
        <View className="flex-1 pr-3">
          <Text className="text-[22px] font-extrabold text-[#0d631b] tracking-tight">AI Grocery Generator</Text>
          <Text className="text-[13px] font-medium text-slate-500 mt-0.5">Tell us what you want to cook</Text>
        </View>

        <Pressable
          onPress={() => router.push({ pathname: "/notificationPop", params: { returnTo: "/ai" } })}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#f4f7f4] active:bg-slate-100 border border-slate-200"
        >
          <Ionicons name="notifications-outline" size={20} color="#0d631b" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>

        {/* Form Card */}
        <View className="rounded-[24px] border border-slate-200/90 bg-white p-4 shadow-xs mb-6">
          <Text className="text-[12px] font-extrabold uppercase tracking-wider text-[#0d631b] mb-2">Recipe generator form</Text>

          <View className="mb-3 text-left">
            <Text className="text-[14px] font-bold text-slate-800 mb-1">What do you want to cook?</Text>

            {/* Recipe Name Input + Autocomplete Dropdown */}
            <View style={{ zIndex: 100 }}>
              {/* Input row */}
              <View
                className="flex-row items-center rounded-2xl border bg-[#f8faf7] px-4"
                style={{
                  borderColor: showSuggestions ? "#0d631b" : "#e2e8f0",
                }}
              >
                <Ionicons name="restaurant-outline" size={18} color="#0d631b" style={{ marginRight: 10 }} />
                <TextInput
                  value={recipeName}
                  onChangeText={handleRecipeNameChange}
                  onFocus={() => {
                    if (recipeName.trim()) setShowSuggestions(suggestions.length > 0);
                  }}
                  onBlur={() => {
                    // Delay must be long enough for onPressIn on suggestion items to fire first
                    setTimeout(() => handleDismissSuggestions(), 300);
                  }}
                  placeholder="e.g. Chicken Curry, Pasta"
                  placeholderTextColor="#94a3b8"
                  className="flex-1 py-3.5 text-slate-900 text-[15px] font-medium"
                  returnKeyType="search"
                  onSubmitEditing={confirmHighlightedSuggestion}
                />
                {recipeName.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setRecipeName("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <View
                  style={{
                    position: "absolute",
                    top: 52,
                    left: 0,
                    right: 0,
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: "#e2e8f0",
                    shadowColor: "#0d631b",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.10,
                    shadowRadius: 12,
                    elevation: 8,
                    zIndex: 9999,
                    overflow: "hidden",
                    maxHeight: 280,
                  }}
                >
                  {/* Dropdown header */}
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: "#f1f5f9",
                      backgroundColor: "#f8faf7",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons name="search-outline" size={13} color="#0d631b" />
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#0d631b", textTransform: "uppercase", letterSpacing: 0.6 }}>
                        Recipe Suggestions
                      </Text>
                    </View>
                    {/* Navigation arrows */}
                    <View style={{ flexDirection: "row", gap: 4 }}>
                      <TouchableOpacity
                        onPress={() => navigateSuggestions("up")}
                        style={{
                          width: 24, height: 24,
                          borderRadius: 6,
                          backgroundColor: "#f1f5f9",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="chevron-up" size={14} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => navigateSuggestions("down")}
                        style={{
                          width: 24, height: 24,
                          borderRadius: 6,
                          backgroundColor: "#f1f5f9",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="chevron-down" size={14} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleDismissSuggestions}
                        style={{
                          width: 24, height: 24,
                          borderRadius: 6,
                          backgroundColor: "#fee2e2",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons name="close" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Suggestions list — use ScrollView, NOT FlatList, to avoid nested VirtualizedList */}
                  {suggestions.length === 0 ? (
                    <View style={{ paddingVertical: 16, paddingHorizontal: 14, alignItems: "center", flexDirection: "row", gap: 8 }}>
                      <Ionicons name="search-outline" size={16} color="#94a3b8" />
                      <Text style={{ fontSize: 13, color: "#94a3b8", fontWeight: "500" }}>No recipes found</Text>
                    </View>
                  ) : (
                    <ScrollView
                      ref={suggestionScrollRef}
                      keyboardShouldPersistTaps="always"
                      showsVerticalScrollIndicator={false}
                      style={{ maxHeight: 220 }}
                    >
                      {suggestions.map((item, index) => {
                        const isHighlighted = index === highlightedIndex;
                        const lower = item.toLowerCase();
                        const query = recipeName.toLowerCase();
                        const matchStart = lower.indexOf(query);
                        const matchEnd = matchStart + query.length;
                        return (
                          <TouchableOpacity
                            key={`${item}-${index}`}
                            activeOpacity={0.7}
                            onPressIn={() => handleSelectSuggestion(item)}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: 14,
                              paddingVertical: 11,
                              backgroundColor: isHighlighted ? "#f0fdf4" : "#ffffff",
                              borderLeftWidth: isHighlighted ? 3 : 0,
                              borderLeftColor: "#0d631b",
                              borderBottomWidth: index < suggestions.length - 1 ? 1 : 0,
                              borderBottomColor: "#f8fafc",
                              gap: 10,
                            }}
                          >
                            <View
                              style={{
                                width: 28, height: 28,
                                borderRadius: 8,
                                backgroundColor: isHighlighted ? "#dcfce7" : "#f1f5f9",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Ionicons
                                name="restaurant-outline"
                                size={14}
                                color={isHighlighted ? "#0d631b" : "#64748b"}
                              />
                            </View>
                            <Text style={{ flex: 1, fontSize: 14, fontWeight: "500", color: "#1e293b" }}>
                              {matchStart >= 0 ? (
                                <>
                                  <Text style={{ color: "#64748b" }}>{item.slice(0, matchStart)}</Text>
                                  <Text style={{ color: "#0d631b", fontWeight: "800" }}>{item.slice(matchStart, matchEnd)}</Text>
                                  <Text style={{ color: "#64748b" }}>{item.slice(matchEnd)}</Text>
                                </>
                              ) : (
                                item
                              )}
                            </Text>
                            {isHighlighted && (
                              <Ionicons name="return-down-back-outline" size={14} color="#0d631b" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          </View>

          <View className="mb-4 text-left">
            <Text className="text-[14px] font-bold text-slate-800 mb-2">Select Quantity Type</Text>
            <View className="flex-row items-center gap-2.5">
              {["People", "Kg", "L"].map((opt) => {
                const isSelected = quantityType === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => setQuantityType(opt)}
                    className="flex-1 items-center justify-center rounded-2xl py-3 border"
                    style={{
                      backgroundColor: isSelected ? "#0d631b" : "#f8faf7",
                      borderColor: isSelected ? "#0d631b" : "#e2e8f0",
                    }}
                  >
                    <Text
                      className="text-[15px] font-bold"
                      style={{ color: isSelected ? "#ffffff" : "#374151" }}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mb-6 text-left">
            <Text className="text-[14px] font-bold text-slate-800 mb-2">Quantity Amount</Text>
            <View className="flex-row items-center rounded-2xl border border-slate-200 bg-[#f8faf7] px-4">
              <Ionicons name="calculator-outline" size={18} color="#0d631b" className="mr-3" />
              <TextInput
                value={quantityValue}
                onChangeText={setQuantityValue}
                placeholder={getPlaceholder()}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                className="flex-1 py-3.5 text-slate-900 text-[15px] font-medium"
              />
            </View>
          </View>

          <Pressable
            onPress={() => handleGenerate()}
            disabled={loading}
            className="flex-row items-center justify-center rounded-2xl bg-[#0d631b] active:bg-[#0a4d15] py-3.5 px-6 shadow-sm"
          >
            <Ionicons name="sparkles" size={18} color="white" className="mr-2" />
            <Text className="text-white text-base font-bold tracking-wide uppercase">
              {loading ? "Generating..." : "Generate Grocery"}
            </Text>
          </Pressable>
        </View>

        {loading && (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#0d631b" />
            <Text className="text-[15px] font-medium text-slate-600 mt-4">AI is curating your ingredients list...</Text>
          </View>
        )}



        {/* Recent Recipes Section */}
        <View className="mt-2 mb-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-[16px] font-extrabold text-slate-900">Recent Recipes</Text>
            {recipeHistory.length > 0 && (
              <Text className="text-xs font-semibold text-slate-400">Swipe right to delete</Text>
            )}
          </View>
          {recipeHistory.length > 0 ? (
            <View style={{ gap: 8 }}>
              {recipeHistory.map((hItem) => {
                const cardTitle = formatHistoryTitle(hItem.recipeName, hItem.quantityType, hItem.quantityValue);
                return (
                  <SwipeableHistoryCard
                    key={hItem.id}
                    item={hItem}
                    onPress={() => {
                      setRecipeName(hItem.recipeName);
                      setQuantityType(hItem.quantityType);
                      setQuantityValue(hItem.quantityValue);
                      openGroceryHistoryChat(cardTitle);
                    }}
                    onDelete={() => handleDeleteHistory(hItem.id)}
                  />
                );
              })}
            </View>
          ) : (
            <View className="bg-white border border-slate-200/90 rounded-2xl p-5 items-center justify-center">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 mb-2">
                <Ionicons name="receipt-outline" size={20} color="#94a3b8" />
              </View>
              <Text className="text-[14px] font-bold text-slate-700">No recent recipes yet</Text>
              <Text className="text-[12px] font-medium text-slate-400 mt-1 text-center">
                Generate a recipe above to save your grocery history here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Grocery List Results Modal */}
      <Modal visible={showResults} transparent animationType="slide" onRequestClose={() => setShowResults(false)}>
        <View className="flex-1 justify-end bg-black/55">
          <View className="bg-white rounded-t-[32px] px-5 pb-6 pt-5 max-h-[88%] shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#0d631b] border border-emerald-500/30 shadow-xs">
                  <Ionicons name="sparkles" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-[20px] font-extrabold text-slate-900">Grocery List Results</Text>
                  <Text className="text-[12px] font-bold text-[#0d631b]">
                    {groceryList.filter(i => i.isAvailable).length} Available in Store DB • {groceryList.filter(i => !i.isAvailable).length} Unavailable
                  </Text>
                </View>
              </View>
              <Pressable onPress={() => setShowResults(false)} className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200">
                <Ionicons name="close" size={22} color="#475569" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
              {/* AVAILABLE IN STORE SECTION */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-3 px-1">
                  <View className="flex-row items-center gap-2">
                    <View className="h-3 w-3 rounded-full bg-[#0d631b]" />
                    <Text className="text-[14px] font-black text-[#0d631b] uppercase tracking-wider">Available in Store</Text>
                  </View>
                  <View className="px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                    <Text className="text-[11px] font-bold text-emerald-800">
                      {groceryList.filter(i => i.isAvailable).length} Items
                    </Text>
                  </View>
                </View>

                {groceryList.filter(i => i.isAvailable).length === 0 ? (
                  <View className="p-4 rounded-2xl bg-slate-50 border border-slate-200 items-center mb-3">
                    <Text className="text-xs font-semibold text-slate-500">No ingredients directly matching store inventory.</Text>
                  </View>
                ) : (
                  groceryList.filter(i => i.isAvailable).map((item) => {
                    const lineTotal = parsePrice(item.price) * item.quantity;
                    const measuredUnit = getMeasurementUnit(item.subtitle);

                    return (
                      <View key={item.tempKey} className="flex-row rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs mb-3">
                        <View className="h-20 w-20 rounded-2xl bg-slate-50 items-center justify-center border border-slate-100">
                          <Image source={resolveImageSource(item.imageSource)} style={{ width: 72, height: 72, borderRadius: 12 }} />
                        </View>
                        <View className="ml-4 flex-1">
                          <View className="flex-row items-center justify-between">
                            <Text className="text-base font-bold text-slate-900 flex-1 pr-2">{item.name}</Text>
                            <View className="flex-row items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <Ionicons name="checkmark-circle" size={13} color="#0d631b" />
                              <Text className="text-xs font-extrabold text-[#0d631b]">
                                {item.displayQuantity || formatSubtitleWithQuantity(item.subtitle, item.quantity)}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs font-bold uppercase text-slate-400 mt-0.5">
                            {formatSubtitleWithQuantity(item.subtitle, item.quantity)}
                          </Text>
                          <View className="flex-row items-center justify-between mt-2.5">
                            <Text className="text-lg font-extrabold text-[#15803d]">{formatLkr(lineTotal)}</Text>
                            <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-1 py-1">
                              <Pressable onPress={() => adjustQty(item.tempKey, measuredUnit ? -0.05 : -1)} className="h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs">
                                <Ionicons name="remove" size={18} color="#15803d" />
                              </Pressable>
                              <Pressable onPress={() => openEditorFor(item.tempKey)} className="px-2 min-w-[50px] items-center">
                                <Text className="text-sm font-bold text-slate-900">{formatQuantityLabel(item.subtitle, item.quantity)}</Text>
                              </Pressable>
                              <Pressable onPress={() => adjustQty(item.tempKey, measuredUnit ? 0.05 : 1)} className="h-8 w-8 items-center justify-center rounded-full bg-white shadow-xs">
                                <Ionicons name="add" size={18} color="#15803d" />
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>

              {/* NOT AVAILABLE IN STORE SECTION */}
              {groceryList.filter(i => !i.isAvailable).length > 0 && (
                <View className="mt-2">
                  <View className="flex-row items-center justify-between mb-3 px-1">
                    <View className="flex-row items-center gap-2">
                      <View className="h-3 w-3 rounded-full bg-rose-500" />
                      <Text className="text-[14px] font-black text-rose-800 uppercase tracking-wider">Not Available in Store</Text>
                    </View>
                    <View className="px-2.5 py-0.5 rounded-full bg-rose-100 border border-rose-200">
                      <Text className="text-[11px] font-bold text-rose-800">
                        {groceryList.filter(i => !i.isAvailable).length} Items
                      </Text>
                    </View>
                  </View>

                  {groceryList.filter(i => !i.isAvailable).map((item) => (
                    <View key={item.tempKey} className="flex-row items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 mb-2.5 shadow-xs">
                      <View className="flex-row items-center gap-3 flex-1 pr-2">
                        <View className="h-10 w-10 rounded-xl bg-rose-100 items-center justify-center border border-rose-200">
                          <Ionicons name="alert-circle-outline" size={22} color="#e11d48" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-[15px] font-bold text-slate-900">{item.name}</Text>
                          <Text className="text-xs font-semibold text-rose-800 mt-0.5">
                            Required: {item.displayQuantity || `${item.quantity} ${item.subtitle}`}
                          </Text>
                        </View>
                      </View>
                      <View className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-300 flex-row items-center gap-1">
                        <Text className="text-[11px] font-black text-rose-700">⚠ NOT IN STORE</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <Pressable
              onPress={handleAddToCart}
              className="flex-row items-center justify-center rounded-2xl bg-[#0d631b] active:bg-[#0a4d15] py-4 shadow-md"
            >
              <Ionicons name="cart-outline" size={20} color="white" className="mr-2" />
              <Text className="text-white text-base font-bold uppercase tracking-wide">
                Add Available Products to Cart
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Quantity Editor Modal */}
      <Modal visible={!!editingItemKey} transparent animationType="fade" onRequestClose={closeEditor}>
        <View className="flex-1 items-center justify-center bg-black/45 px-5">
          <View className="w-full max-w-[420px] rounded-[24px] bg-white p-5 shadow-2xl">
            <Text className="text-lg font-extrabold text-slate-900">Enter quantity</Text>
            {editingKind === "kg" ? (
              <View className="flex-row gap-2.5 mt-4">
                <TextInput value={kgInput} onChangeText={setKgInput} keyboardType="numeric" className="flex-1 h-12 border border-slate-200 rounded-xl px-3.5 text-slate-900 font-medium bg-[#f8faf7]" />
                <TextInput value={gInput} onChangeText={setGInput} keyboardType="numeric" className="w-24 h-12 border border-slate-200 rounded-xl px-3.5 text-slate-900 font-medium bg-[#f8faf7]" />
              </View>
            ) : editingKind === "l" ? (
              <View className="flex-row gap-2.5 mt-4">
                <TextInput value={lInput} onChangeText={setLInput} keyboardType="numeric" className="flex-1 h-12 border border-slate-200 rounded-xl px-3.5 text-slate-900 font-medium bg-[#f8faf7]" />
                <TextInput value={mlInput} onChangeText={setMlInput} keyboardType="numeric" className="w-24 h-12 border border-slate-200 rounded-xl px-3.5 text-slate-900 font-medium bg-[#f8faf7]" />
              </View>
            ) : (
              <TextInput value={countInput} onChangeText={setCountInput} keyboardType="numeric" className="h-12 border border-slate-200 rounded-xl px-3.5 text-slate-900 font-medium bg-[#f8faf7] mt-4" />
            )}
            <View className="flex-row gap-3 mt-5">
              <Pressable onPress={closeEditor} className="flex-1 py-3.5 border border-slate-200 rounded-xl items-center bg-[#f8faf7] active:bg-slate-100">
                <Text className="font-bold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmEditor} className="flex-1 py-3.5 bg-[#0d631b] active:bg-[#0a4d15] rounded-xl items-center shadow-xs">
                <Text className="font-bold text-white">OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Toast Alert */}
      {toastMessage !== "" && (
        <View className="absolute top-12 left-4 right-4 z-50 flex-row items-center rounded-2xl bg-[#dcfce7] border border-[#bbf7d0] px-4 py-3.5 shadow-lg">
          <Ionicons name="checkmark-circle" size={22} color="#16a34a" className="mr-3" />
          <Text className="font-semibold text-[15px] text-[#166534]">{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
