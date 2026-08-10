import React, { useState, useEffect, useRef } from "react";
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, ActivityIndicator, LayoutAnimation, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

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
                        onPress={() => setIsListening(prev => !prev)}
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
        </SafeAreaView>
    );
}
