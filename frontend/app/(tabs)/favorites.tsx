import React, { useMemo } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { RECOMMENDED } from "@/constants/recommended";
import { PRODUCTS } from "@/constants/products";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const { width } = useWindowDimensions();

  const allProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; subtitle: string; price: string; imageSource: any }>();
    for (const p of BEST_SELLING) map.set(p.id, p as any);
    for (const p of RECOMMENDED) map.set(p.id, p as any);
    for (const p of PRODUCTS) map.set(p.id, p as any);
    return map;
  }, []);

  const items = useMemo(
    () => favoriteIds.map((id) => allProducts.get(id)).filter(Boolean) as any[],
    [favoriteIds, allProducts]
  );

  const horizontalPadding = 16;
  const columnGap = 12;
  const columns = 2;
  const itemWidth =
    (width - horizontalPadding * 2 - columnGap * (columns - 1)) / columns;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="bg-white px-5 pt-6 pb-4">
        <View className="flex-row items-center">
          <View className="mr-3 ml-2 h-8 w-1 rounded-full bg-green-700" />
          <Text className="text-[28px] font-black tracking-tight text-slate-900">
            Favourite
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <View className="mx-4 mt-6 items-center justify-center rounded-3xl border border-slate-200 bg-white px-6 py-12 shadow-sm">
            <Text className="text-base font-semibold text-slate-700">
              No favourites yet.
            </Text>
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