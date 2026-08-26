import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCart } from "@/context/CartContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { API_BASE_URL } from "@/context/AuthContext";
import { resolveImageSource } from "@/utils/resolveImageSource";

let ExpoSpeechRecognitionModule: any = null;
try {
  const SpeechLib = require("expo-speech-recognition");
  ExpoSpeechRecognitionModule = SpeechLib.ExpoSpeechRecognitionModule;
} catch (error) {
  console.warn("ExpoSpeechRecognition native module not found:", error);
}

// Default store products fallback catalog
const DEFAULT_CATALOG: any[] = [
  ...BEST_SELLING,
  {
    id: "fresh-milk",
    name: "Fresh Milk",
    subtitle: "1L, Price",
    price: "Rs. 350",
    imageSource: BEST_SELLING[0]?.imageSource,
    category: "Dairy",
  },
  {
    id: "red-apples",
    name: "Red Apples",
    subtitle: "1 kg, Price",
    price: "Rs. 650",
    imageSource: BEST_SELLING[0]?.imageSource,
    category: "Fruits",
  },
  {
    id: "maggi-noodles",
    name: "Maggi Noodles",
    subtitle: "1 pack, Price",
    price: "Rs. 180",
    imageSource: BEST_SELLING[0]?.imageSource,
    category: "Groceries",
  },
  {
    id: "white-sugar",
    name: "White Sugar",
    subtitle: "1 kg, Price",
    price: "Rs. 280",
    imageSource: BEST_SELLING[0]?.imageSource,
    category: "Groceries",
  },
];

type VoiceState = "idle" | "listening" | "processing" | "completed" | "error";

export type ParsedVoiceCommand = {
  rawText: string;
  productQuery: string;
  quantity: number;
  unit: string;
  action: "add" | "unknown";
};

// Natural language voice shopping parser
export function parseVoiceShoppingCommand(text: string): ParsedVoiceCommand {
  let clean = text
    .toLowerCase()
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  const wordNumbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    half: 0.5,
    a: 1,
    an: 1,
  };

  const unitAliases: Record<string, string> = {
    litres: "Litre",
    litre: "Litre",
    liters: "Litre",
    liter: "Litre",
    l: "Litre",
    millilitres: "ml",
    millilitre: "ml",
    milliliters: "ml",
    milliliter: "ml",
    ml: "ml",
    kilograms: "kg",
    kilogram: "kg",
    kilos: "kg",
    kilo: "kg",
    kgs: "kg",
    kg: "kg",
    grams: "g",
    gram: "g",
    g: "g",
    packets: "pack",
    packet: "pack",
    packs: "pack",
    pack: "pack",
    bottles: "bottle",
    bottle: "bottle",
    boxes: "box",
    box: "box",
    bags: "bag",
    bag: "bag",
    pieces: "piece",
    piece: "piece",
    pcs: "piece",
    cans: "piece",
    can: "piece",
    items: "piece",
    item: "piece",
  };

  const unitPattern = "(?:litres|litre|liters|liter|l|millilitres|millilitre|milliliters|milliliter|ml|kilograms|kilogram|kilos|kilo|kgs|kg|grams|gram|g|packets|packet|packs|pack|bottles|bottle|boxes|box|bags|bag|pieces|piece|pcs|cans|can|items|item)";
  const numPattern = "(?:half|one|two|three|four|five|six|seven|eight|nine|ten|a|an|\\d+(?:\\.\\d+)?)";

  let quantity = 1;
  let unit = "";

  const qtyRegex = new RegExp(`\\b(${numPattern})\\s*(${unitPattern})?\\b`, "i");
  const qtyMatch = clean.match(qtyRegex);

  if (qtyMatch) {
    const qtyStr = qtyMatch[1].toLowerCase();
    if (wordNumbers[qtyStr] !== undefined) {
      quantity = wordNumbers[qtyStr];
    } else {
      const num = parseFloat(qtyStr);
      if (!isNaN(num) && num > 0) quantity = num;
    }

    if (qtyMatch[2]) {
      const uStr = qtyMatch[2].toLowerCase();
      unit = unitAliases[uStr] || uStr;
    }
  }

  let query = clean
    .replace(/\b(add|put|buy|get|want|need|include|can you|could you|please|thanks|thank you|i want|i need|i would like|bring me)\b/gi, " ")
    .replace(/\b(to my cart|in my cart|to cart|in cart|my cart|the cart|cart|for me|to the cart)\b/gi, " ")
    .replace(new RegExp(`\\b${numPattern}\\s*${unitPattern}?\\b`, "gi"), " ")
    .replace(/\b(of|a|an|the|some|for|to|in)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!query) {
    query = clean
      .replace(/\b(add|put|buy|get|to|my|cart|in|please|of)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return {
    rawText: text,
    productQuery: query || clean,
    quantity,
    unit,
    action: "add",
  };
}

// Levenshtein similarity distance helper (0 to 1)
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - distance / maxLen;
}

function stem(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) {
    if (w.endsWith("ies")) return w.slice(0, -3) + "y";
    if (w.endsWith("es")) return w.slice(0, -2);
    return w.slice(0, -1);
  }
  return w;
}

export type ProductMatchResult = {
  bestMatch: any | null;
  candidates: any[];
};

// Advanced Fuzzy Product Matcher
export function findMatchingProducts(
  productQuery: string,
  parsedUnit: string,
  storeProducts: any[]
): ProductMatchResult {
  if (!productQuery || storeProducts.length === 0) {
    return { bestMatch: null, candidates: [] };
  }

  const q = productQuery.toLowerCase().trim();
  const qTokens = q.split(/\s+/).filter((w: string) => w.length > 0);
  const qStems = qTokens.map(stem);

  const scoredProducts: { product: any; score: number }[] = [];

  for (const prod of storeProducts) {
    const pName: string = String(prod?.name || "").toLowerCase().trim();
    const pSub: string = String(prod?.subtitle || "").toLowerCase().trim();
    const pCat: string = String(prod?.category || "").toLowerCase().trim();
    const pTokens = pName.split(/\s+/).filter((w: string) => w.length > 0);
    const pStems = pTokens.map(stem);

    let score = 0;

    // 1. Exact full match or stemmed full match
    if (pName === q) {
      score += 100;
    } else if (pStems.join(" ") === qStems.join(" ")) {
      score += 90;
    } else if (pName.startsWith(q) || q.startsWith(pName)) {
      score += 85;
    } else if (pName.includes(q)) {
      score += 75;
    } else if (q.includes(pName)) {
      score += 65;
    }

    // 2. Token overlap & stem scoring
    let matchedTokenCount = 0;
    for (let i = 0; i < qTokens.length; i++) {
      const qToken = qTokens[i];
      const qStem = qStems[i];

      if (pTokens.includes(qToken)) {
        score += 30;
        matchedTokenCount++;
      } else if (pStems.includes(qStem)) {
        score += 25;
        matchedTokenCount++;
      } else {
        for (const pTok of pTokens) {
          if (stringSimilarity(qToken, pTok) >= 0.75) {
            score += 20;
            matchedTokenCount++;
            break;
          }
        }
      }
    }

    if (qTokens.length > 0 && matchedTokenCount === qTokens.length) {
      score += 20;
    }

    // 3. String similarity score
    const similarity = stringSimilarity(pName, q);
    if (similarity >= 0.8) score += 40;
    else if (similarity >= 0.6) score += 20;

    // Subtitle & category matches
    for (const qToken of qTokens) {
      if (pSub.includes(qToken)) score += 10;
      if (pCat.includes(qToken)) score += 10;
    }

    // 4. Unit match alignment bonus
    if (parsedUnit) {
      const pUnitLower = (prod.subtitle + " " + (prod.unit || "")).toLowerCase();
      const normParsedUnit = parsedUnit.toLowerCase();
      if (
        (normParsedUnit === "litre" && (pUnitLower.includes("1l") || pUnitLower.includes("liter") || pUnitLower.includes("litre") || pUnitLower.includes("1000ml"))) ||
        (normParsedUnit === "kg" && (pUnitLower.includes("1 kg") || pUnitLower.includes("kg"))) ||
        (normParsedUnit === "pack" && pUnitLower.includes("pack"))
      ) {
        score += 15;
      }
    }

    // Penalty for completely unmatched query terms to prevent false positive matches
    const strongUnmatched = qTokens.filter(
      (tok) => tok.length > 2 && !pName.includes(tok) && !pStems.includes(stem(tok))
    );
    if (strongUnmatched.length === qTokens.length) {
      score = 0;
    } else {
      score -= strongUnmatched.length * 15;
    }

    if (score >= 45) {
      scoredProducts.push({ product: prod, score });
    }
  }

  scoredProducts.sort((a, b) => b.score - a.score);

  if (scoredProducts.length === 0) {
    return { bestMatch: null, candidates: [] };
  }

  const candidates = scoredProducts.map((sp) => sp.product);

  const uniqueCandidates = candidates.filter(
    (item, index, self) => index === self.findIndex((t) => t.id === item.id || t.name === item.name)
  );

  return {
    bestMatch: uniqueCandidates[0] || null,
    candidates: uniqueCandidates.slice(0, 5),
  };
}

interface AIVoiceShoppingAssistantProps {
  onRecognizedText?: (text: string) => void;
}

export function AIVoiceShoppingAssistant({ onRecognizedText }: AIVoiceShoppingAssistantProps) {
  const { cartItems, addItem, setItemQuantity } = useCart();

  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);

  const [storeProducts, setStoreProducts] = useState<any[]>(DEFAULT_CATALOG);
  const [parsedCmd, setParsedCmd] = useState<ParsedVoiceCommand | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<any | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [showCandidatePicker, setShowCandidatePicker] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");

  const isVoiceSupported = !!ExpoSpeechRecognitionModule;

  // Track latest state in refs to prevent re-attaching listeners on every speech token
  const recognizedTextRef = useRef<string>("");
  const storeProductsRef = useRef<any[]>(storeProducts);

  useEffect(() => {
    storeProductsRef.current = storeProducts;
  }, [storeProducts]);

  useEffect(() => {
    recognizedTextRef.current = recognizedText;
  }, [recognizedText]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const micBounceAnim = useRef(new Animated.Value(1)).current;

  // Fetch store products from backend DB on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/products/list`);
        if (res.ok) {
          const data = await res.json();
          const activeOnly = data.filter((p: any) => p.status === "ACTIVE");
          const mapped = activeOnly.map((p: any) => ({
            id: p.id,
            name: p.name,
            subtitle: `${p.unit || "piece"}, Price`,
            price: `Rs. ${p.price}`,
            imageSource: p.image ? { uri: p.image } : BEST_SELLING[0]?.imageSource,
            category: p.category?.name || "Uncategorized",
          }));
          if (mapped.length > 0) {
            setStoreProducts(mapped);
            storeProductsRef.current = mapped;
            return;
          }
        }
      } catch (e) {
        console.warn("Failed to fetch products for voice assistant, using default catalog:", e);
      }
      setStoreProducts(DEFAULT_CATALOG);
      storeProductsRef.current = DEFAULT_CATALOG;
    };

    fetchProducts();
  }, []);

  // Concentric wave ripple animation & mic bounce
  useEffect(() => {
    let waveLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let micLoop: Animated.CompositeAnimation | null = null;

    if (voiceState === "listening") {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      micLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micBounceAnim, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(micBounceAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      micLoop.start();

      wave1Anim.setValue(0);
      wave2Anim.setValue(0);

      waveLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(wave1Anim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(wave2Anim, {
            toValue: 1,
            duration: 1600,
            delay: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();
    } else {
      pulseAnim.setValue(1);
      micBounceAnim.setValue(1);
      wave1Anim.setValue(0);
      wave2Anim.setValue(0);
    }

    return () => {
      pulseLoop?.stop();
      micLoop?.stop();
      waveLoop?.stop();
    };
  }, [voiceState]);

  const processCommandAndMatchProduct = (textOverride?: string) => {
    const speech = (textOverride ?? recognizedTextRef.current).trim();
    if (!speech) {
      setVoiceState("error");
      setErrorMessage("No speech detected. Please try speaking your order again.");
      setConfirmationStep(false);
      return;
    }

    setVoiceState("processing");
    const parsed = parseVoiceShoppingCommand(speech);
    setParsedCmd(parsed);

    const { bestMatch, candidates } = findMatchingProducts(
      parsed.productQuery,
      parsed.unit,
      storeProductsRef.current
    );
    setMatchedProduct(bestMatch);
    setMatchingCandidates(candidates);
    setShowCandidatePicker(false);
    setVoiceState("completed");
    setConfirmationStep(true);

    if (onRecognizedText) {
      onRecognizedText(speech);
    }
  };

  // Speech Recognition Event Listeners
  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) return;

    const startListener = ExpoSpeechRecognitionModule.addListener("start", () => {
      setVoiceState("listening");
      setErrorMessage("");
    });

    const resultListener = ExpoSpeechRecognitionModule.addListener("result", (event: any) => {
      const transcript = event.results?.[0]?.transcript || "";
      if (transcript) {
        setRecognizedText(transcript);
        recognizedTextRef.current = transcript;
      }
    });

    const errorListener = ExpoSpeechRecognitionModule.addListener("error", (event: any) => {
      if (event.error !== "aborted") {
        console.error("Speech recognition error:", event);
        setErrorMessage(event.message || `Recognition error: ${event.error}`);
        setVoiceState("error");
      } else {
        // Recognition aborted/stopped. If text was captured before stopping, process it!
        if (recognizedTextRef.current.trim().length > 0) {
          processCommandAndMatchProduct(recognizedTextRef.current);
        } else {
          setVoiceState("idle");
        }
      }
    });

    const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
      setVoiceState("processing");
      setTimeout(() => {
        if (recognizedTextRef.current.trim().length > 0) {
          processCommandAndMatchProduct(recognizedTextRef.current);
        }
      }, 300);
    });

    return () => {
      startListener.remove();
      resultListener.remove();
      errorListener.remove();
      endListener.remove();
    };
  }, []);

  const startListening = async () => {
    setErrorMessage("");
    setRecognizedText("");
    recognizedTextRef.current = "";
    setMatchedProduct(null);
    setMatchingCandidates([]);
    setShowCandidatePicker(false);
    setConfirmationStep(false);
    setToastMessage("");

    if (!isVoiceSupported) {
      // Expo Go Mock Fallback Mode
      setIsMockMode(true);
      setModalVisible(true);
      setVoiceState("listening");
      return;
    }

    try {
      setIsMockMode(false);
      const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
      let granted = status?.granted;
      if (!granted && typeof ExpoSpeechRecognitionModule.requestPermissionsAsync === "function") {
        const req = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        granted = req?.granted;
      }

      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "Microphone and speech recognition permissions are required to use AI Voice Shopping."
        );
        setErrorMessage("Microphone permission denied");
        setVoiceState("error");
        return;
      }

      setModalVisible(true);
      setVoiceState("listening");
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
      });
    } catch (err: any) {
      console.error("Failed to start voice shopping:", err);
      setErrorMessage(err.message || "Failed to start speech recognition.");
      setVoiceState("error");
    }
  };

  const stopListening = () => {
    if (isMockMode) {
      setVoiceState("processing");
      setTimeout(() => {
        processCommandAndMatchProduct();
      }, 300);
      return;
    }

    if (isVoiceSupported) {
      try {
        ExpoSpeechRecognitionModule.stop();
      } catch (e) {}
    }

    if (recognizedTextRef.current.trim().length > 0) {
      processCommandAndMatchProduct(recognizedTextRef.current);
    }
  };

  const handleCancelVoiceShopping = () => {
    recognizedTextRef.current = "";
    if (isVoiceSupported && voiceState === "listening") {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch (e) {}
    }
    setModalVisible(false);
    setVoiceState("idle");
    setConfirmationStep(false);
    setMatchedProduct(null);
    setMatchingCandidates([]);
    setShowCandidatePicker(false);
    setRecognizedText("");
    setIsMockMode(false);
  };

  const handleConfirmAddToCart = () => {
    if (!matchedProduct || !parsedCmd) return;

    const qtyToAdd = parsedCmd.quantity || 1;
    const existing = cartItems.find((i) => i.id === matchedProduct.id);

    addItem({
      id: matchedProduct.id,
      name: matchedProduct.name,
      subtitle: matchedProduct.subtitle,
      price: matchedProduct.price,
      imageSource: matchedProduct.imageSource,
    });

    if (existing) {
      setItemQuantity(matchedProduct.id, Math.min(existing.quantity + qtyToAdd, 20));
    } else if (qtyToAdd > 1) {
      setItemQuantity(matchedProduct.id, Math.min(qtyToAdd, 20));
    }

    setToastMessage(`Added ${qtyToAdd}x ${matchedProduct.name} to your cart!`);
    setTimeout(() => setToastMessage(""), 4000);

    setModalVisible(false);
    setVoiceState("idle");
    setConfirmationStep(false);
    setMatchedProduct(null);
    setMatchingCandidates([]);
    setShowCandidatePicker(false);
  };

  const handleSelectCandidate = (prod: any) => {
    setMatchedProduct(prod);
    setShowCandidatePicker(false);
  };

  // Interpolate wave animations for expanding rings
  const wave1Scale = wave1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const wave1Opacity = wave1Anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  const wave2Scale = wave2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const wave2Opacity = wave2Anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  return (
    <View className="items-end">
      {/* Toast Alert Banner */}
      {toastMessage !== "" && (
        <View className="mb-2 bg-emerald-700 border border-emerald-500 rounded-2xl px-4 py-3 shadow-xl flex-row items-center gap-2 max-w-[320px]">
          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
          <Text className="text-xs font-extrabold text-white flex-1">{toastMessage}</Text>
        </View>
      )}

      {/* Main AI Voice Agent Capsule Button */}
      <Pressable
        onPress={startListening}
        accessibilityRole="button"
        accessibilityLabel="AI Voice Shopping Assistant - Add products using your voice"
        className="flex-row items-center gap-2.5 active:opacity-90"
      >
        {/* Floating Badge */}
        {voiceState === "idle" && (
          <View className="bg-white/95 border border-slate-200/90 rounded-2xl py-2 px-3.5 shadow-md flex-col items-end">
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={11} color="#0d631b" />
              <Text className="text-xs font-extrabold text-slate-900 tracking-tight">
                AI Voice Shopping
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-[#0d631b]">Add by Voice</Text>
          </View>
        )}

        {/* Circular Floating AI Agent Button with Concentric Wave Animations */}
        <View className="relative items-center justify-center">
          {voiceState === "listening" && (
            <Animated.View
              style={{
                position: "absolute",
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#0d631b",
                transform: [{ scale: wave1Scale }],
                opacity: wave1Opacity,
              }}
            />
          )}

          {voiceState === "listening" && (
            <Animated.View
              style={{
                position: "absolute",
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#15803d",
                transform: [{ scale: wave2Scale }],
                opacity: wave2Opacity,
              }}
            />
          )}

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View
              className={`h-14 w-14 items-center justify-center rounded-full bg-[#0d631b] border-2 shadow-xl ${
                voiceState === "listening" ? "border-emerald-300" : "border-white"
              }`}
              style={{
                elevation: 8,
                shadowColor: voiceState === "listening" ? "#10b981" : "#0d631b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              <Animated.View style={{ transform: [{ scale: micBounceAnim }] }}>
                {voiceState === "listening" ? (
                  <Ionicons name="mic" size={26} color="#ffffff" />
                ) : voiceState === "processing" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="mic-outline" size={24} color="#ffffff" />
                )}
              </Animated.View>

              <View className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 border border-white items-center justify-center shadow-xs">
                <Ionicons name="sparkles" size={10} color="#000000" />
              </View>
            </View>
          </Animated.View>
        </View>
      </Pressable>

      {/* Voice Shopping Assistant Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={handleCancelVoiceShopping}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" }}>
          <Pressable style={{ flex: 1 }} onPress={handleCancelVoiceShopping} />

          <View
            className="bg-white rounded-t-[32px] px-6 pt-6 pb-8 shadow-2xl border-t border-slate-100 max-h-[85%]"
            style={{
              shadowColor: "#0f172a",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 rounded-full bg-slate-200" />
            </View>

            {voiceState === "error" ? (
              // Error State
              <View className="items-center py-4">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-rose-50 mb-4">
                  <Ionicons name="alert-circle" size={32} color="#f43f5e" />
                </View>
                <Text className="text-lg font-bold text-slate-800 mb-2">Voice Input Error</Text>
                <Text className="text-sm text-slate-500 text-center px-4 mb-6 leading-relaxed">
                  {errorMessage || "Could not recognize your voice command."}
                </Text>
                <View className="flex-row w-full gap-3">
                  <Pressable
                    onPress={startListening}
                    className="flex-1 bg-[#0d631b] py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-[#0b5216]"
                  >
                    <Text className="text-white font-bold text-base">Try Again</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCancelVoiceShopping}
                    className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
                  >
                    <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : !confirmationStep ? (
              // Listening / Speaking State
              <View className="items-center py-4">
                <Text className="text-lg font-extrabold text-slate-800 mb-6">
                  {voiceState === "processing" ? "Processing Voice Command..." : "Listening to your order..."}
                </Text>

                {/* Pulsing Central Icon */}
                <View className="h-28 w-28 items-center justify-center rounded-full bg-emerald-50 mb-6 relative">
                  <Animated.View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 56,
                      backgroundColor: "#dcfce7",
                      transform: [{ scale: pulseAnim }],
                      opacity: 0.6,
                    }}
                  />
                  <View className="h-20 w-20 items-center justify-center rounded-full bg-[#0d631b] shadow-lg relative z-10">
                    {voiceState === "processing" ? (
                      <ActivityIndicator size="large" color="white" />
                    ) : (
                      <Ionicons name="mic" size={36} color="white" />
                    )}
                  </View>
                </View>

                {/* Transcribed Speech Text */}
                <View className="min-h-[60px] justify-center px-4 mb-4 w-full">
                  {recognizedText ? (
                    <Text className="text-xl font-bold text-slate-800 text-center leading-relaxed italic">
                      "{recognizedText}"
                    </Text>
                  ) : (
                    <Text className="text-base font-semibold text-slate-400 text-center">
                      {isMockMode
                        ? "Select a voice command below to test:"
                        : 'Say e.g. "Add 1 litre of milk to my cart"'}
                    </Text>
                  )}
                </View>

                {/* Mock Mode suggestion chips & test input for Expo Go */}
                {isMockMode && (
                  <View className="w-full px-2 mb-6">
                    <View className="flex-row flex-wrap justify-center gap-2 mb-4">
                      {[
                        "Add 1 litre of milk to my cart",
                        "Add 2 kg Big Onion",
                        "Add 1 pack Bairaha Chicken",
                        "Add 1 kg Basmati Rice",
                      ].map((cmd) => (
                        <Pressable
                          key={cmd}
                          onPress={() => {
                            setRecognizedText(cmd);
                            processCommandAndMatchProduct(cmd);
                          }}
                          className="bg-emerald-50 border border-emerald-100 rounded-full px-3.5 py-1.5 active:bg-emerald-100"
                        >
                          <Text className="text-xs font-bold text-[#0d631b]">{cmd}</Text>
                        </Pressable>
                      ))}
                    </View>

                    <View className="flex-row items-center border border-slate-200 rounded-xl bg-slate-50 px-3 py-1 mx-2">
                      <TextInput
                        value={recognizedText}
                        onChangeText={setRecognizedText}
                        placeholder="Or type custom test voice command..."
                        placeholderTextColor="#cbd5e1"
                        className="flex-1 text-sm font-semibold text-slate-700 p-1"
                        onSubmitEditing={() => processCommandAndMatchProduct()}
                      />
                    </View>
                  </View>
                )}

                {/* Done / Cancel controls */}
                <View className="flex-row w-full gap-3">
                  <Pressable
                    onPress={stopListening}
                    className="flex-1 bg-[#0d631b] py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-[#0b5216]"
                  >
                    <Text className="text-white font-bold text-base">Done Speaking</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCancelVoiceShopping}
                    className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
                  >
                    <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : showCandidatePicker ? (
              // Candidate Match Selection View
              <View className="py-2">
                <Text className="text-xs font-bold text-[#0d631b] uppercase tracking-widest text-center mb-1">
                  Multiple Store Matches
                </Text>
                <Text className="text-xl font-extrabold text-slate-900 mb-4 text-center">
                  Select Matching Product
                </Text>
                <Text className="text-xs text-slate-500 text-center mb-4 px-4">
                  Please pick the exact product you want to add for "{parsedCmd?.productQuery}":
                </Text>

                <ScrollView style={{ maxHeight: 280 }} className="mb-4">
                  {(matchingCandidates.length > 0 ? matchingCandidates : storeProducts.slice(0, 5)).map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectCandidate(item)}
                      className={`flex-row items-center p-3 mb-2 rounded-2xl border ${
                        matchedProduct?.id === item.id
                          ? "bg-emerald-50 border-[#0d631b]"
                          : "bg-slate-50 border-slate-200"
                      } active:opacity-80`}
                    >
                      <View className="h-14 w-14 rounded-xl bg-white border border-slate-100 items-center justify-center overflow-hidden mr-3">
                        <Image
                          source={resolveImageSource(item.imageSource)}
                          style={{ width: 48, height: 48 }}
                          contentFit="cover"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-bold text-slate-900">{item.name}</Text>
                        <Text className="text-xs text-slate-500">{item.subtitle}</Text>
                        <Text className="text-xs font-extrabold text-[#15803d] mt-0.5">{item.price}</Text>
                      </View>
                      <View className={`h-8 w-8 rounded-full items-center justify-center ${
                        matchedProduct?.id === item.id ? "bg-[#0d631b]" : "bg-slate-200"
                      }`}>
                        <Ionicons
                          name={matchedProduct?.id === item.id ? "checkmark" : "chevron-forward"}
                          size={18}
                          color="#ffffff"
                        />
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>

                <Pressable
                  onPress={() => setShowCandidatePicker(false)}
                  className="bg-slate-100 py-3 rounded-2xl items-center justify-center"
                >
                  <Text className="text-slate-700 font-bold text-sm">Back to Confirmation</Text>
                </Pressable>
              </View>
            ) : matchedProduct ? (
              // Confirmation View (Product Found)
              <View className="items-center py-2">
                <Text className="text-xs font-bold text-[#0d631b] uppercase tracking-widest mb-1">
                  AI Voice Match Found
                </Text>
                <Text className="text-xl font-extrabold text-slate-900 mb-3 text-center">
                  Did you mean this product?
                </Text>

                {/* Parsed voice output badge */}
                {parsedCmd && (
                  <View className="flex-row items-center bg-emerald-50 border border-emerald-200/80 rounded-full px-3.5 py-1.5 mb-4">
                    <Ionicons name="mic-outline" size={14} color="#0d631b" className="mr-1.5" />
                    <Text className="text-xs font-bold text-[#0d631b]">
                      Product: <Text className="font-extrabold">{parsedCmd.productQuery}</Text> | Qty: <Text className="font-extrabold">{parsedCmd.quantity}</Text> {parsedCmd.unit ? `(${parsedCmd.unit})` : ""}
                    </Text>
                  </View>
                )}

                {/* Product Card Preview */}
                <View className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 mb-5 w-full flex-row items-center gap-4 shadow-xs relative">
                  <View className="h-20 w-20 rounded-xl bg-white border border-slate-100 items-center justify-center overflow-hidden">
                    <Image
                      source={resolveImageSource(matchedProduct.imageSource)}
                      style={{ width: 72, height: 72 }}
                      contentFit="cover"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{matchedProduct.name}</Text>
                    <Text className="text-xs font-semibold text-slate-500 uppercase mt-0.5">
                      {matchedProduct.subtitle}
                    </Text>
                    <Text className="text-base font-extrabold text-[#15803d] mt-1">
                      {matchedProduct.price}
                    </Text>
                  </View>
                  <View className="bg-[#0d631b] rounded-full px-3 py-1 items-center justify-center">
                    <Text className="text-xs font-black text-white">x{parsedCmd?.quantity || 1}</Text>
                  </View>
                </View>

                {/* Action Buttons: Confirm & Add to Cart, Change Product, Cancel */}
                <View className="flex-col w-full gap-2.5">
                  <Pressable
                    onPress={handleConfirmAddToCart}
                    className="w-full bg-[#0d631b] py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-[#0b5216] flex-row gap-2"
                  >
                    <Ionicons name="cart" size={20} color="#ffffff" />
                    <Text className="text-white font-bold text-base">Confirm & Add to Cart</Text>
                  </Pressable>

                  <View className="flex-row w-full gap-2.5">
                    <Pressable
                      onPress={() => setShowCandidatePicker(true)}
                      className="flex-1 border border-slate-300 bg-white py-3 rounded-2xl items-center justify-center active:bg-slate-50 flex-row gap-1.5"
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#334155" />
                      <Text className="text-slate-700 font-bold text-sm">Change Product</Text>
                    </Pressable>

                    <Pressable
                      onPress={handleCancelVoiceShopping}
                      className="flex-1 bg-slate-100 py-3 rounded-2xl items-center justify-center active:bg-slate-200"
                    >
                      <Text className="text-slate-600 font-bold text-sm">Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : (
              // Product Not Found View
              <View className="items-center py-4">
                <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50 mb-4">
                  <Ionicons name="basket-outline" size={32} color="#d97706" />
                </View>
                <Text className="text-lg font-bold text-slate-900 mb-2">Product Not Found</Text>
                <Text className="text-sm text-slate-600 text-center px-4 mb-6 leading-relaxed">
                  We couldn't find a matching product for <Text className="font-bold text-slate-800">"{parsedCmd?.productQuery || recognizedText}"</Text> in our store catalog.
                </Text>

                <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 w-full">
                  <Text className="text-xs font-bold text-slate-500 uppercase mb-1">Available Store Products Include:</Text>
                  <Text className="text-xs font-medium text-slate-700 leading-relaxed">
                    • "Add 1 litre of milk to my cart"{"\n"}
                    • "Add 2 kg Big Onion"{"\n"}
                    • "Add 1 pack Bairaha Chicken"{"\n"}
                    • "Add 1 kg Basmati Rice"
                  </Text>
                </View>

                <View className="flex-row w-full gap-3">
                  <Pressable
                    onPress={startListening}
                    className="flex-1 bg-[#0d631b] py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-[#0b5216]"
                  >
                    <Text className="text-white font-bold text-base">Try Again</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCancelVoiceShopping}
                    className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
                  >
                    <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
