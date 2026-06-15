import React, { useMemo, useState, useEffect } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/constants/products";
import { useCategories } from "@/context/CategoryContext";
import { API_BASE_URL } from "@/context/AuthContext";

export default function CategoryProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const { categories } = useCategories();

  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryLabel = useMemo(() => {
    const match = categories.find((c) => c.slug === slug);
    return match?.label ?? "Products";
  }, [categories, slug]);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
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
            imageSource: p.image ? { uri: p.image } : require("../../src/assets/images/vegetable.jpg"),
            categorySlug: p.category?.slug || "",
            stock: p.stock,
          }));
          setDbProducts(mapped);
        }
      } catch (err) {
        console.error("Error fetching category products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, []);

  const items = useMemo(() => {
    const matchedDbProducts = dbProducts.filter((p) => p.categorySlug === slug);
    if (matchedDbProducts.length > 0) {
      return matchedDbProducts;
    }
    return PRODUCTS.filter((p) => p.categorySlug === slug);
  }, [dbProducts, slug]);


  const { width } = useWindowDimensions();
  const horizontalPadding = 16;
  const columnGap = 12;
  const columns = 2;
  const itemWidth =
    (width - horizontalPadding * 2 - columnGap * (columns - 1)) / columns;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </Pressable>
        <Text className="ml-3 text-lg font-bold text-slate-900">{categoryLabel}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">Loading products...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {items.length === 0 ? (
            <View className="items-center justify-center pt-10">
              <Text className="text-sm text-slate-500">No products found.</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap" style={{ columnGap, rowGap: 16 }}>
              {items.map((product) => (
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
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
