import React, { useState, useEffect } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProductCard from "@/components/ProductCard";
import { BEST_SELLING } from "@/constants/bestSelling";
import { API_BASE_URL } from "@/context/AuthContext";

export default function BestSellingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string }>();
  const pageTitle = params.title || "Hot Deals";
  const { width } = useWindowDimensions();

  const [productList, setProductList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const horizontalPadding = 16;
  const columnGap = 12;
  const columns = 2;

  const itemWidth =
    (width - horizontalPadding * 2 - columnGap * (columns - 1)) / columns;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const mapItem = (p: any) => ({
          id: p.id,
          name: p.name,
          subtitle: `${p.unit || "piece"}, Price`,
          price: `Rs. ${p.price}`,
          imageSource: p.image ? { uri: p.image } : BEST_SELLING[0].imageSource,
          category: p.category?.name || "Uncategorized",
          stock: p.stock,
        });

        // Fetch all available products (most-ordered first)
        const res = await fetch(`${API_BASE_URL}/api/products/most-ordered`);
        if (res.ok) {
          const data = await res.json();
          const activeOnly = Array.isArray(data) ? data.filter((p: any) => p.status === 'ACTIVE') : [];
          if (activeOnly.length > 0) {
            setProductList(activeOnly.map(mapItem));
          } else {
            // Fallback to all products
            const listRes = await fetch(`${API_BASE_URL}/api/products/list`);
            if (listRes.ok) {
              const listData = await listRes.json();
              const listActive = listData.filter((p: any) => p.status === 'ACTIVE');
              setProductList(listActive.length > 0 ? listActive.map(mapItem) : BEST_SELLING);
            } else {
              setProductList(BEST_SELLING);
            }
          }
        } else {
          // Fallback to /api/products/list
          const listRes = await fetch(`${API_BASE_URL}/api/products/list`);
          if (listRes.ok) {
            const listData = await listRes.json();
            const listActive = listData.filter((p: any) => p.status === 'ACTIVE');
            setProductList(listActive.length > 0 ? listActive.map(mapItem) : BEST_SELLING);
          } else {
            setProductList(BEST_SELLING);
          }
        }
      } catch (err) {
        console.error("Error fetching best selling products:", err);
        setProductList(BEST_SELLING);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center px-4 py-3 border-b border-slate-100">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="black" />
        </Pressable>
        <Text className="ml-3 text-lg font-bold text-slate-900">{pageTitle}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">Loading products...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap" style={{ columnGap, rowGap: 16, marginTop: 16 }}>
            {productList.map((product) => (
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
