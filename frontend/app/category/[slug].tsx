import React, { useMemo } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProductCard from "@/components/ProductCard";
import { CATEGORIES } from "@/constants/categories";
import { PRODUCTS } from "@/constants/products";

export default function CategoryProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const categoryLabel = useMemo(() => {
    const match = CATEGORIES.find((c) => c.slug === slug);
    return match?.label ?? "Products";
  }, [slug]);

  const items = useMemo(
    () => PRODUCTS.filter((p) => p.categorySlug === slug),
    [slug]
  );

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
    </SafeAreaView>
  );
}
