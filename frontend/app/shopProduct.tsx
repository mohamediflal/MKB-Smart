import React, { useState, useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, ActivityIndicator, LayoutAnimation, Animated, Modal, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
let ExpoSpeechRecognitionModule: any = null;
try {
    const SpeechLib = require("expo-speech-recognition");
    ExpoSpeechRecognitionModule = SpeechLib.ExpoSpeechRecognitionModule;
} catch (error) {
    console.warn("ExpoSpeechRecognition native module not found:", error);
}

import ProductCard from "@/components/ProductCard";
import { BEST_SELLING } from "@/constants/bestSelling";
import { useCategories } from "@/context/CategoryContext";
import { API_BASE_URL } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function BestSellingScreen() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const { categories } = useCategories();
    const { cartCount } = useCart();

    const [productList, setProductList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Ref and states for Voice Search / Speech to Text
    const searchInputRef = useRef<TextInput>(null);
    const [voiceModalVisible, setVoiceModalVisible] = useState(false);
    const [recognizedText, setRecognizedText] = useState("");
    const [recognitionError, setRecognitionError] = useState<string | null>(null);
    const [confirmationStep, setConfirmationStep] = useState(false);
    const [isMockMode, setIsMockMode] = useState(false);

    const isVoiceSupported = !!ExpoSpeechRecognitionModule;

    // Speech recognition event handlers
    useEffect(() => {
        if (!ExpoSpeechRecognitionModule) return;

        const startListener = ExpoSpeechRecognitionModule.addListener("start", () => {
            setIsListening(true);
        });

        const resultListener = ExpoSpeechRecognitionModule.addListener("result", (event: any) => {
            const transcript = event.results?.[0]?.transcript || "";
            setRecognizedText(transcript);
        });

        const errorListener = ExpoSpeechRecognitionModule.addListener("error", (event: any) => {
            if (event.error !== "aborted") {
                console.error("Speech recognition error:", event);
                setRecognitionError(event.message || `Recognition error: ${event.error}`);
            }
            setIsListening(false);
        });

        const endListener = ExpoSpeechRecognitionModule.addListener("end", () => {
            setIsListening(false);
            setConfirmationStep(true);
        });

        return () => {
            startListener.remove();
            resultListener.remove();
            errorListener.remove();
            endListener.remove();
        };
    }, []);

    const startVoiceSearch = async () => {
        if (!isVoiceSupported) {
            // Expo Go Mock Fallback Mode
            setIsMockMode(true);
            setRecognizedText("");
            setRecognitionError(null);
            setConfirmationStep(false);
            setVoiceModalVisible(true);
            setIsListening(true);
            return;
        }

        try {
            setIsMockMode(false);
            const status = await ExpoSpeechRecognitionModule.getPermissionsAsync();
            let granted = status.granted;
            if (!granted) {
                const request = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
                granted = request.granted;
            }

            if (!granted) {
                Alert.alert(
                    "Permission Denied",
                    "Microphone and speech recognition permissions are required to use voice search."
                );
                return;
            }

            // Prepare voice search state
            setRecognizedText("");
            setRecognitionError(null);
            setConfirmationStep(false);
            setVoiceModalVisible(true);
            setIsListening(true);

            // Start recognition service
            ExpoSpeechRecognitionModule.start({
                lang: "en-US",
                interimResults: true,
                maxAlternatives: 1,
                continuous: false,
            });
        } catch (error: any) {
            console.error("Failed to start voice search:", error);
            setRecognitionError(error.message || "Failed to start speech recognition.");
            setIsListening(false);
        }
    };

    const stopVoiceSearch = () => {
        if (isMockMode) {
            setIsListening(false);
            setConfirmationStep(true);
            return;
        }
        if (isVoiceSupported) {
            ExpoSpeechRecognitionModule.stop();
        }
        setIsListening(false);
    };

    const cancelVoiceSearch = () => {
        if (isMockMode) {
            setIsListening(false);
            setVoiceModalVisible(false);
            setConfirmationStep(false);
            setRecognizedText("");
            setIsMockMode(false);
            return;
        }
        if (isVoiceSupported) {
            ExpoSpeechRecognitionModule.abort();
        }
        setIsListening(false);
        setVoiceModalVisible(false);
        setConfirmationStep(false);
        setRecognizedText("");
    };

    const handleConfirm = () => {
        if (recognizedText.trim()) {
            setSearchQuery(recognizedText);
        }
        setVoiceModalVisible(false);
        setConfirmationStep(false);
    };

    const handleEdit = () => {
        if (recognizedText.trim()) {
            setSearchQuery(recognizedText);
        }
        setVoiceModalVisible(false);
        setConfirmationStep(false);
        setTimeout(() => {
            searchInputRef.current?.focus();
        }, 150);
    };


    const horizontalPadding = 16;
    const columnGap = 12;
    const columns = 2;

    const itemWidth =
        (width - horizontalPadding * 2 - columnGap * (columns - 1)) / columns;

    const categoriesList = ["All", ...categories.map(c => c.label)];

    // Pulse animation while listening
    useEffect(() => {
        if (isListening) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
        }
    }, [isListening]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await fetch(`${API_BASE_URL}/api/products/list`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter to only ACTIVE products
                    const activeOnly = data.filter((p: any) => p.status === 'ACTIVE');
                    const mapped = activeOnly.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        subtitle: `${p.unit || "piece"}, Price`,
                        price: `Rs. ${p.price}`,
                        imageSource: p.image ? { uri: p.image } : BEST_SELLING[0].imageSource,
                        category: p.category?.name || "Uncategorized",
                        stock: p.stock,
                    }));
                    setProductList(mapped);
                } else {
                    setProductList(BEST_SELLING);
                }
            } catch (err) {
                console.error("Error fetching products:", err);
                setProductList(BEST_SELLING);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = productList.filter((p) => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory =
            selectedCategory === "All" ||
            p.category.toLowerCase() === selectedCategory.toLowerCase();

        return matchesSearch && matchesCategory;
    });

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
                <View className="flex-row items-center">
                    <Pressable
                        onPress={() => router.back()}
                        className="h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 border border-slate-100"
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <Ionicons name="chevron-back" size={20} color="#10B981" />
                    </Pressable>
                    <View className="ml-3.5">
                        <Text className="text-xl font-bold text-slate-900 leading-6">Smart Shopping</Text>
                        <Text className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Best Groceries</Text>
                    </View>
                </View>

                {/* Cart icon (moved outside the inner flex-row View) */}
                <Pressable
                    onPress={() => router.push("/cart")}
                    className="relative h-12 w-12 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md"
                    accessibilityRole="button"
                    accessibilityLabel={`Open cart with ${cartCount} items`}
                >
                    <Ionicons name="cart-outline" size={20} color="#0f172a" />

                    {cartCount > 0 && (
                        <View className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1.5 py-0.5">
                            <Text className="text-center text-[10px] font-bold leading-none text-white">
                                {cartCount > 99 ? "99+" : cartCount}
                            </Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {/* Search and Filter Row */}
            <View className="flex-row items-center px-4 mt-4 mb-3 gap-3">
                <View className="flex-1 flex-row items-center rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 shadow-sm">
                    <Ionicons name="search-outline" size={20} color="#10B981" />
                    <TextInput
                        ref={searchInputRef}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholder="Search products..."
                        placeholderTextColor="#94a3b8"
                        className="ml-2.5 flex-1 text-base font-semibold text-slate-800"
                    />
                    {searchQuery.length > 0 && (
                        <Pressable onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={18} color="#94a3b8" />
                        </Pressable>
                    )}

                    {/* Microphone / Voice Search button */}
                    <Pressable
                        onPress={isListening ? stopVoiceSearch : startVoiceSearch}
                        accessibilityRole="button"
                        accessibilityLabel={isListening ? "Stop voice search" : "Start voice search"}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Animated.View
                            style={[
                                {
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: isListening ? "#10B981" : "#ecfdf5",
                                    transform: [{ scale: pulseAnim }],
                                },
                            ]}
                        >
                            <Ionicons
                                name={isListening ? "mic" : "mic-outline"}
                                size={17}
                                color={isListening ? "#ffffff" : "#059669"}
                            />
                        </Animated.View>
                    </Pressable>
                </View>

                {/* Filter Icon Button */}
                <Pressable
                    onPress={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="h-12 w-12 items-center justify-center rounded-2xl border"
                    style={{
                        backgroundColor: showCategoryFilter ? "#059669" : "#f8fafc",
                        borderColor: showCategoryFilter ? "#059669" : "#f1f5f9",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: showCategoryFilter ? 0.15 : 0,
                        shadowRadius: 2,
                        elevation: showCategoryFilter ? 2 : 0,
                    }}
                >
                    <Ionicons
                        name="funnel"
                        size={18}
                        color={showCategoryFilter ? "white" : "#059669"}
                    />
                </Pressable>
            </View>

            {/* Category Filter Horizontal Scroll */}
            {showCategoryFilter && (
                <View className="mb-3">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                        className="py-1"
                    >
                        {categoriesList.map((catName) => {
                            const isSelected = selectedCategory === catName;
                            return (
                                <Pressable
                                    key={catName}
                                    onPress={() => setSelectedCategory(catName)}
                                    className="mr-2.5 rounded-xl px-4 py-2 border"
                                    style={{
                                        backgroundColor: isSelected ? "#059669" : "#f8fafc",
                                        borderColor: isSelected ? "#059669" : "#f1f5f9",
                                        shadowColor: "#000",
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: isSelected ? 0.15 : 0,
                                        shadowRadius: 2,
                                        elevation: isSelected ? 2 : 0,
                                    }}
                                >
                                    <Text
                                        className="text-xs font-semibold"
                                        style={{
                                            color: isSelected ? "white" : "#475569"
                                        }}
                                    >
                                        {catName}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Main Content Body */}
            {loading ? (
                <View className="flex-1 items-center justify-center bg-white">
                    <ActivityIndicator size="large" color="#059669" />
                    <Text className="mt-3 text-sm font-semibold text-slate-500">Loading fresh products...</Text>
                </View>
            ) : filteredProducts.length === 0 ? (
                <View className="flex-1 items-center justify-center p-8 bg-white">
                    <Ionicons name="basket-outline" size={64} color="#cbd5e1" />
                    <Text className="mt-4 text-base font-semibold text-slate-500 text-center">
                        No products match your search or filter.
                    </Text>
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 16 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="flex-row flex-wrap" style={{ columnGap, rowGap: 16 }}>
                        {filteredProducts.map((product) => (
                            <View key={product.id} style={{ width: itemWidth }}>
                                <ProductCard
                                    id={product.id}
                                    name={product.name}
                                    subtitle={product.subtitle}
                                    price={product.price}
                                    imageSource={product.imageSource}
                                    containerClassName="w-full"
                                    stock={product.stock}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/product/[id]",
                                            params: { id: product.id },
                                        })
                                    }
                                />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Voice Search Modal */}
            <Modal
                transparent
                visible={voiceModalVisible}
                animationType="fade"
                onRequestClose={cancelVoiceSearch}
            >
                <View style={{ flex: 1, backgroundColor: "rgba(15, 23, 42, 0.6)", justifyContent: "flex-end" }}>
                    <Pressable style={{ flex: 1 }} onPress={cancelVoiceSearch} />
                    <View 
                        className="bg-white rounded-t-[32px] px-6 pt-6 pb-8 shadow-2xl border-t border-slate-100"
                        style={{
                            shadowColor: "#0f172a",
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.1,
                            shadowRadius: 10,
                            elevation: 10,
                        }}
                    >
                        {/* Drag Handle Indicator */}
                        <View className="items-center mb-6">
                            <View className="w-12 h-1.5 rounded-full bg-slate-200" />
                        </View>

                        {recognitionError ? (
                            // Error State
                            <View className="items-center py-4">
                                <View className="h-16 w-16 items-center justify-center rounded-full bg-rose-50 mb-4">
                                    <Ionicons name="alert-circle" size={32} color="#f43f5e" />
                                </View>
                                <Text className="text-lg font-bold text-slate-800 mb-2">Speech Recognition Error</Text>
                                <Text className="text-sm text-slate-500 text-center px-4 mb-6 leading-relaxed">
                                    {recognitionError}
                                </Text>
                                <View className="flex-row w-full gap-3">
                                    <Pressable
                                        onPress={startVoiceSearch}
                                        className="flex-1 bg-emerald-600 py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-emerald-700"
                                    >
                                        <Text className="text-white font-bold text-base">Try Again</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={cancelVoiceSearch}
                                        className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
                                    >
                                        <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : !confirmationStep ? (
                            // Listening / Speaking State
                            <View className="items-center py-4">
                                <Text className="text-lg font-extrabold text-slate-800 mb-6">Listening...</Text>
                                
                                {/* Pulsing Central Icon */}
                                <View className="h-28 w-28 items-center justify-center rounded-full bg-emerald-50 mb-6 relative">
                                    <Animated.View 
                                        className="absolute inset-0 rounded-full bg-emerald-100"
                                        style={{
                                            transform: [{ scale: pulseAnim }],
                                            opacity: 0.6
                                        }}
                                    />
                                    <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-600 shadow-lg relative z-10">
                                        <Ionicons name="mic" size={36} color="white" />
                                    </View>
                                </View>

                                {/* Transcribed Text */}
                                <View className="min-h-[60px] justify-center px-4 mb-4 w-full">
                                    {recognizedText ? (
                                        <Text className="text-xl font-bold text-slate-800 text-center leading-relaxed italic">
                                            "{recognizedText}"
                                        </Text>
                                    ) : (
                                        <Text className="text-base font-semibold text-slate-400 text-center">
                                            {isMockMode ? "Select a suggestion below to simulate speech:" : 'Say something like "Fresh Apple"'}
                                        </Text>
                                    )}
                                </View>

                                {/* Mock Mode suggestion chips & input fallback for Expo Go */}
                                {isMockMode && (
                                    <View className="w-full px-2 mb-6">
                                        <View className="flex-row flex-wrap justify-center gap-2 mb-4">
                                            {["Fresh Milk", "Alponse mango", "Carrots", "Chicken"].map((term) => (
                                                <Pressable
                                                    key={term}
                                                    onPress={() => {
                                                        setRecognizedText(term);
                                                        setIsListening(false);
                                                        setConfirmationStep(true);
                                                    }}
                                                    className="bg-emerald-50 border border-emerald-100 rounded-full px-3.5 py-1.5 active:bg-emerald-100"
                                                >
                                                    <Text className="text-xs font-bold text-emerald-700">{term}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                        
                                        {/* Or let them type a custom query */}
                                        <View className="flex-row items-center border border-slate-200 rounded-xl bg-slate-50 px-3 py-1 mx-2">
                                            <TextInput
                                                value={recognizedText}
                                                onChangeText={setRecognizedText}
                                                placeholder="Or type custom test query here..."
                                                placeholderTextColor="#cbd5e1"
                                                className="flex-1 text-sm font-semibold text-slate-700 p-1"
                                            />
                                        </View>
                                    </View>
                                )}

                                {/* Done / Cancel controls */}
                                <View className="flex-row w-full gap-3">
                                    <Pressable
                                        onPress={stopVoiceSearch}
                                        className="flex-1 bg-emerald-600 py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-emerald-700"
                                    >
                                        <Text className="text-white font-bold text-base">Done Speaking</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={cancelVoiceSearch}
                                        className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
                                    >
                                        <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : !recognizedText.trim() ? (
                            // No speech detected state
                            <View className="items-center py-4">
                                <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-100 mb-4">
                                    <Ionicons name="mic-off" size={28} color="#64748b" />
                                </View>
                                <Text className="text-lg font-bold text-slate-800 mb-2">No Speech Detected</Text>
                                <Text className="text-sm text-slate-400 text-center mb-6">
                                    We couldn't hear what you said. Please try again.
                                </Text>
                                <View className="flex-row w-full gap-3">
                                    <Pressable
                                        onPress={startVoiceSearch}
                                        className="flex-1 bg-emerald-600 py-3.5 rounded-2xl items-center justify-center shadow-md active:bg-emerald-700"
                                    >
                                        <Text className="text-white font-bold text-base">Try Again</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={cancelVoiceSearch}
                                        className="flex-1 bg-slate-100 py-3.5 rounded-2xl items-center justify-center active:bg-slate-200"
                                    >
                                        <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>
                        ) : (
                            // Confirmation State (Confirm / Edit / Cancel)
                            <View className="items-center py-4">
                                <Text className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1.5">Voice Search Result</Text>
                                <Text className="text-xl font-extrabold text-slate-900 mb-6 text-center">Is this what you want to search?</Text>

                                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-8 w-full justify-center">
                                    <Text className="text-xs font-bold text-slate-400 uppercase mb-2">Search for:</Text>
                                    <Text className="text-2xl font-extrabold text-slate-800 leading-snug">
                                        "{recognizedText}"
                                    </Text>
                                </View>

                                {/* Confirmation Buttons Row */}
                                <View className="flex-row w-full gap-2.5">
                                    <Pressable
                                        onPress={handleConfirm}
                                        className="flex-[1.2] bg-emerald-600 py-4 rounded-2xl items-center justify-center shadow-md active:bg-emerald-700"
                                    >
                                        <Text className="text-white font-bold text-base">Confirm</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={handleEdit}
                                        className="flex-1 bg-slate-100 py-4 rounded-2xl items-center justify-center active:bg-slate-200"
                                    >
                                        <Text className="text-slate-700 font-bold text-base">Edit</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={cancelVoiceSearch}
                                        className="flex-1 border border-slate-200 bg-white py-4 rounded-2xl items-center justify-center active:bg-slate-50"
                                    >
                                        <Text className="text-slate-500 font-bold text-base">Cancel</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
