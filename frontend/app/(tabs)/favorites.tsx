import React, { useState, useEffect } from "react";
import { ScrollView, Text, useWindowDimensions, View, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import ProductCard from "@/components/ProductCard";
import { useFavorites } from "@/context/FavoritesContext";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { BEST_SELLING } from "@/constants/bestSelling";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favoriteIds } = useFavorites();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      try {
        setLoading(true);
        if (user && user.token) {
          // Logged in: fetch user's favorites list from Neon DB
          const res = await fetch(`${API_BASE_URL}/api/favorites/list`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          });
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
            setItems(mapped);
          }
        } else {
          // Guest mode: fetch all products and filter by local favoriteIds
          const res = await fetch(`${API_BASE_URL}/api/products/list`);
          if (res.ok) {
            const data = await res.json();
            // Filter to only ACTIVE products
            const activeOnly = data.filter((p: any) => p.status === 'ACTIVE');
            const mapped = activeOnly
              .map((p: any) => ({
                id: p.id,
                name: p.name,
                subtitle: `${p.unit || "piece"}, Price`,
                price: `Rs. ${p.price}`,
                imageSource: p.image ? { uri: p.image } : BEST_SELLING[0].imageSource,
                category: p.category?.name || "Uncategorized",
                stock: p.stock,
              }))
              .filter((p: any) => favoriteIds.includes(p.id));
            setItems(mapped);
          }
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteProducts();
  }, [user, favoriteIds]);

  const horizontalPadding = 16;
  const columnGap = 12;
  const columns = 2;
  const itemWidth =
    (width - horizontalPadding * 2 - columnGap * (columns - 1)) / columns;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-row items-center justify-between bg-white px-5 pt-6 pb-4 border-b border-slate-100">
        <View className="flex-row items-center">
          <View className="mr-3 ml-2 h-8 w-1 rounded-full bg-green-700" />
          <Text className="text-[28px] font-black tracking-tight text-slate-900">
            Favourite
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/notificationPop", params: { returnTo: "/favorites" } })}
          className="h-10 w-10 items-center justify-center rounded-full bg-[#f4f7f4] active:bg-slate-100 border border-slate-200"
        >
          <Ionicons name="notifications-outline" size={20} color="#0d631b" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#059669" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">Loading favourites...</Text>
        </View>
      ) : (
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
            <View className="flex-row flex-wrap" style={{ columnGap, rowGap: 16, marginTop: 16 }}>
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