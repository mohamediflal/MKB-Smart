import React, { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Share, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { RECOMMENDED } from "@/constants/recommended";
import { PRODUCTS, type Product as CatalogProduct } from "@/constants/products";
import { CATEGORIES } from "@/constants/categories";
import { resolveImageSource } from "@/utils/resolveImageSource";

type DisplayProduct = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: any;
  categorySlug?: string;
};

function inferCategorySlug(
  product: { id: string; name: string },
  byName: Map<string, string>,
  categorySlugs: Set<string>
) {
  const byNameMatch = byName.get(product.name);
  if (byNameMatch) return byNameMatch;
  if (categorySlugs.has(product.id)) return product.id;
  return undefined;
}

export default function ProductDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";

  const { width } = useWindowDimensions();

  const categorySlugs = useMemo(() => new Set(CATEGORIES.map((c) => c.slug)), []);
  const categoryByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of PRODUCTS) map.set(p.name, p.categorySlug);
    return map;
  }, []);

  const productMap = useMemo(() => {
    const map = new Map<string, DisplayProduct>();

    for (const p of PRODUCTS) {
      map.set(p.id, p);
    }

    for (const p of BEST_SELLING as any[]) {
      map.set(p.id, {
        ...(map.get(p.id) ?? {}),
        ...p,
        categorySlug:
          (map.get(p.id) as any)?.categorySlug ??
          inferCategorySlug(p, categoryByName, categorySlugs),
      });
    }

    for (const p of RECOMMENDED as any[]) {
      map.set(p.id, {
        ...(map.get(p.id) ?? {}),
        ...p,
        categorySlug:
          (map.get(p.id) as any)?.categorySlug ??
          inferCategorySlug(p, categoryByName, categorySlugs),
      });
    }

    return map;
  }, [categoryByName, categorySlugs]);

  const product = id ? productMap.get(id) : undefined;

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, cartCount } = useCart();
  const favorite = product ? isFavorite(product.id) : false;

  const [qty, setQty] = useState(1);

  const similarProducts = useMemo(() => {
    if (!product) return [] as CatalogProduct[];
    const categorySlug = product.categorySlug;
    if (!categorySlug) return [] as CatalogProduct[];

    return PRODUCTS.filter(
      (p) =>
        p.categorySlug === categorySlug &&
        p.id !== product.id &&
        p.name !== product.name
    ).slice(0, 8);
  }, [product]);

  const similarColumnGap = 12;
  const similarColumns = 2;
  // section uses horizontal padding 16
  const similarItemWidth =
    (width - 32 - similarColumnGap * (similarColumns - 1)) / similarColumns;

  const onShare = async () => {
    if (!product) return;
    try {
      await Share.share({ message: `${product.name} - ${product.price}` });
    } catch {
      // ignore
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    for (let index = 0; index < qty; index += 1) {
      addItem({
        id: product.id,
        name: product.name,
        subtitle: product.subtitle,
        price: product.price,
        imageSource: product.imageSource,
      });
    }
  };

  if (!product) {
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
          <Text className="ml-3 text-lg font-bold text-slate-900">Product</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-sm text-slate-500">Product not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Image card */}
        <View className="mx-4 mt-2 overflow-hidden rounded-3xl bg-slate-50">
          <View className="h-80 w-full items-center justify-center">
            <Image
              source={resolveImageSource(product.imageSource)}
              resizeMode="contain"
              style={{ width: "100%", height: "100%" }}
              accessibilityLabel={product.name}
              accessibilityIgnoresInvertColors
            />
          </View>

          <View className="absolute left-3 top-3 right-3 flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="black" />
            </Pressable>

            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={onShare}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
                accessibilityRole="button"
                accessibilityLabel="Share product"
              >
                <Ionicons name="share-outline" size={20} color="black" />
              </Pressable>

              <Pressable
                onPress={() => router.push("/cart")}
                className="relative h-10 w-10 items-center justify-center rounded-full bg-white/90"
                accessibilityRole="button"
                accessibilityLabel={`Open cart with ${cartCount} items`}
              >
                <Ionicons name="cart-outline" size={20} color="black" />

                {cartCount > 0 && (
                  <View className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-red-600 px-1.5 py-0.5">
                    <Text className="text-center text-[10px] font-bold leading-none text-white">
                      {cartCount > 99 ? "99+" : cartCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </View>

        {/* Pager hint */}
        <View className="mt-3 items-center justify-center">
          <View className="flex-row items-center">
            <View className="h-1.5 w-4 rounded-full bg-green-700" />
            <View className="ml-2 h-1.5 w-1.5 rounded-full bg-slate-300" />
          </View>
        </View>

        {/* Title + favorite */}
        <View className="mt-5 flex-row items-start justify-between px-4">
          <View className="flex-1 pr-3">
            <Text className="text-2xl font-extrabold text-slate-900" numberOfLines={2}>
              {product.name}
            </Text>
            <Text className="mt-1 text-xs text-slate-500" numberOfLines={1}>
              {product.subtitle}
            </Text>
          </View>

          <Pressable
            onPress={() => toggleFavorite(product.id)}
            className="mt-1 h-11 w-11 items-center justify-center rounded-full bg-slate-100"
            accessibilityRole="button"
            accessibilityLabel={favorite ? "Remove from favourites" : "Add to favourites"}
            accessibilityState={{ selected: favorite }}
          >
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={22}
              color={favorite ? "#dc2626" : "#0f172a"}
            />
          </Pressable>
        </View>

        {/* Qty + price */}
        <View className="mt-5 flex-row items-center justify-between px-4">
          <View className="flex-row items-center">
            <Pressable
              onPress={() => setQty((q) => Math.max(1, q - 1))}
              className="h-10 w-10 items-center justify-center rounded-full bg-slate-100"
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Ionicons name="remove" size={18} color="#64748b" />
            </Pressable>

            <View className="mx-3 h-10 w-12 items-center justify-center rounded-full border border-slate-200 bg-white">
              <Text className="text-sm font-bold text-slate-900">{qty}</Text>
            </View>

            <Pressable
              onPress={() => setQty((q) => q + 1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-green-700"
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Ionicons name="add" size={18} color="white" />
            </Pressable>
          </View>

          <Text className="text-2xl font-extrabold text-slate-900">{product.price}</Text>
        </View>

        <View className="mx-4 mt-6 h-px bg-slate-200" />

        {/* Product detail */}
        <View className="px-4 pt-5">
          <Text className="text-sm font-bold text-slate-900">Product Detail</Text>
          <Text className="mt-2 text-xs leading-5 text-slate-500">
            Apples are nutritious and naturally delicious. Enjoy as a healthy snack or add to meals for extra freshness.
          </Text>
        </View>

        <View className="mx-4 mt-6 h-px bg-slate-200" />

        {/* Nutritions */}
        <Pressable
          className="flex-row items-center justify-between px-4 py-4"
          accessibilityRole="button"
          accessibilityLabel="Open nutritions"
        >
          <Text className="text-sm font-bold text-slate-900">Nutritions</Text>
          <View className="flex-row items-center">
            <View className="mr-3 rounded-md bg-slate-100 px-2 py-1">
              <Text className="text-[10px] font-semibold text-slate-500">100gr</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </Pressable>

        <View className="mx-4 h-px bg-slate-200" />

        {/* Review */}
        <Pressable
          className="flex-row items-center justify-between px-4 py-4"
          accessibilityRole="button"
          accessibilityLabel="Open reviews"
        >
          <Text className="text-sm font-bold text-slate-900">Review</Text>
          <View className="flex-row items-center">
            <View className="mr-2 flex-row items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={14} color="#f97316" />
              ))}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </Pressable>

        <View className="mx-4 h-px bg-slate-200" />

        {/* Similar Products */}
        <View className="px-4 pt-2">
          <Text className="text-base font-bold text-slate-900">Similar Products</Text>
        </View>

        <View
          className="mt-1 flex-row flex-wrap px-4"
          style={{ columnGap: similarColumnGap, rowGap: 12 }}
        >
          {similarProducts.map((p) => (
            <View key={p.id} style={{ width: similarItemWidth }}>
              <Pressable
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                accessibilityRole="button"
                accessibilityLabel={`Open ${p.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: { id: p.id },
                  })
                }
              >
                <View className="relative h-28 w-full bg-slate-50">
                  <Image
                    source={resolveImageSource(p.imageSource)}
                    resizeMode="cover"
                    style={{ width: "100%", height: "100%" }}
                    accessibilityIgnoresInvertColors
                  />

                  <Pressable
                    className="absolute bottom-2 right-2 h-10 w-10 items-center justify-center rounded-full bg-green-700"
                    accessibilityRole="button"
                    accessibilityLabel={`Add ${p.name}`}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      addItem({
                        id: p.id,
                        name: p.name,
                        subtitle: p.subtitle,
                        price: p.price,
                        imageSource: p.imageSource,
                      });
                    }}
                  >
                    <Ionicons name="add" size={22} color="white" />
                  </Pressable>
                </View>

                <View className="px-3 pb-3 pt-2">
                  <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text className="mt-1 text-sm font-bold text-green-700" numberOfLines={1}>
                    {p.price}
                  </Text>
                </View>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View className="border-t border-slate-200 bg-white px-4 pb-2 pt-1">
        <View style={{ flexDirection: "row", columnGap: 12 }}>
          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-2xl bg-green-700 py-4"
            accessibilityRole="button"
            accessibilityLabel="Add to cart"
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={20} color="white" />
            <Text className="ml-2 text-sm font-bold text-white">Add to Cart</Text>
          </Pressable>

          <Pressable
            className="flex-1 flex-row items-center justify-center rounded-2xl border border-green-700 bg-white py-4"
            accessibilityRole="button"
            accessibilityLabel="Buy now"
          >
            <Text className="text-sm font-bold text-green-700">Buy Now</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
