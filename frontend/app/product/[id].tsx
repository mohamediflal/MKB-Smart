import React, { useMemo, useState, useEffect } from "react";
import { Image, Pressable, ScrollView, Share, Text, useWindowDimensions, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

import ProductCard from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { RECOMMENDED } from "@/constants/recommended";
import { PRODUCTS, type Product as CatalogProduct } from "@/constants/products";
import { useCategories } from "@/context/CategoryContext";
import { resolveImageSource } from "@/utils/resolveImageSource";
import { API_BASE_URL } from "@/context/AuthContext";

type DisplayProduct = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: any;
  categorySlug?: string;
  stock?: number;
  status?: string;
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
  const { categories } = useCategories();

  const categorySlugs = useMemo(() => new Set(categories.map((c) => c.slug)), [categories]);
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

  const staticProduct = id ? productMap.get(id) : undefined;
  const [dbProduct, setDbProduct] = useState<DisplayProduct | null>(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbProductsList, setDbProductsList] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    if (staticProduct) {
      setDbProduct(null);
      return;
    }

    const fetchProduct = async () => {
      try {
        setDbLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/products/single/${id}`);
        if (res.ok) {
          const p = await res.json();
          setDbProduct({
            id: p.id,
            name: p.name,
            subtitle: `${p.unit || "piece"}, Price`,
            price: `Rs. ${p.price}`,
            imageSource: p.image ? { uri: p.image } : require("../../src/assets/images/vegetable.jpg"),
            categorySlug: p.category?.slug || "",
            stock: p.stock ?? 0,
            status: p.status || "ACTIVE",
          });
        } else {
          setDbProduct(null);
        }
      } catch (err) {
        console.error("Error fetching product from DB:", err);
        setDbProduct(null);
      } finally {
        setDbLoading(false);
      }
    };

    fetchProduct();
  }, [id, staticProduct]);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
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
            stock: p.stock ?? 0,
            status: p.status || "ACTIVE",
          }));
          setDbProductsList(mapped);
        }
      } catch (err) {
        console.error("Error fetching all products for similar list:", err);
      }
    };
    fetchAllProducts();
  }, []);

  const product = useMemo(() => {
    if (staticProduct) {
      return {
        ...staticProduct,
        stock: 99,
        status: "ACTIVE",
      };
    }
    return dbProduct;
  }, [staticProduct, dbProduct]);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem, cartCount } = useCart();
  const favorite = product ? isFavorite(product.id) : false;

  const [qty, setQty] = useState(1);

  const isOutOfStock = product?.stock !== undefined && product.stock <= 0;
  const isLowStock = product?.stock !== undefined && product.stock > 0 && product.stock < 15;

  const similarProducts = useMemo(() => {
    if (!product) return [] as any[];
    const categorySlug = product.categorySlug;
    if (!categorySlug) return [] as any[];

    const matchedDb = dbProductsList.filter(
      (p) =>
        p.categorySlug === categorySlug &&
        p.id !== product.id &&
        p.name !== product.name
    );

    if (matchedDb.length > 0) {
      return matchedDb.slice(0, 8);
    }

    return PRODUCTS.filter(
      (p) =>
        p.categorySlug === categorySlug &&
        p.id !== product.id &&
        p.name !== product.name
    ).map((p) => ({
      ...p,
      stock: 99,
      status: "ACTIVE",
    })).slice(0, 8);
  }, [product, dbProductsList]);

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

  if (dbLoading) {
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
          <ActivityIndicator size="large" color="#10B981" />
          <Text className="mt-3 text-sm font-semibold text-slate-500">Loading product details...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  if (product && product.status !== "ACTIVE") {
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
          <Ionicons name="alert-circle-outline" size={64} color="#dc2626" />
          <Text className="mt-4 text-lg font-bold text-slate-800">Product Unavailable</Text>
          <Text className="mt-2 text-sm text-center text-slate-500">
            This product is currently not active or unavailable.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 rounded-2xl bg-green-700 px-6 py-3 shadow-md"
          >
            <Text className="font-bold text-white">Go Back</Text>
          </Pressable>
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
              style={{ width: "120%", height: "120%" }}
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

              
            </View>
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
            {isOutOfStock && (
              <View className="mt-2.5 self-start rounded-lg bg-red-100 border border-red-200 px-2.5 py-1">
                <Text className="text-[10px] font-extrabold text-red-700 uppercase tracking-wider">Out of Stock</Text>
              </View>
            )}
            {isLowStock && (
              <View className="mt-2.5 self-start rounded-lg bg-amber-100 border border-amber-200 px-2.5 py-1">
                <Text className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">Only {product.stock} left</Text>
              </View>
            )}
            {product.stock !== undefined && product.stock >= 15 && (
              <View className="mt-2.5 self-start rounded-lg bg-green-100 border border-green-200 px-2.5 py-1">
                <Text className="text-[10px] font-extrabold text-green-700 uppercase tracking-wider">In Stock</Text>
              </View>
            )}
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
        <View className="mx-4 mt-3 rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
          <Text className="text-base font-extrabold tracking-tight text-slate-900">Product Detail</Text>
          <Text className="mt-2.5 text-sm leading-6 text-slate-600">
            Apples are nutritious and naturally delicious. Enjoy as a healthy snack or add to meals for extra freshness.
          </Text>
        </View>

        <View className="mx-6 mt-5 h-px bg-slate-200/80" />

        {/* Nutritions */}
        <Pressable
          className="mx-4 mt-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          accessibilityRole="button"
          accessibilityLabel="Open nutritions"
        >
          <Text className="text-sm font-bold tracking-wide text-slate-900">Nutritions</Text>
          <View className="flex-row items-center">
            <View className="mr-3 rounded-full bg-emerald-50 px-3 py-1">
              <Text className="text-[10px] font-semibold text-emerald-700">Check with Ai</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </Pressable>

        <View className="mx-6 my-4 h-px bg-slate-200/80" />

        {/* Review */}
        <Pressable
          className="mx-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
          accessibilityRole="button"
          accessibilityLabel="Open reviews"
        >
          <Text className="text-sm font-bold tracking-wide text-slate-900">Review</Text>
          <View className="flex-row items-center">
            <View className="mr-2 flex-row items-center rounded-full bg-amber-50 px-2 py-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons key={i} name="star" size={13} color="#f59e0b" />
              ))}
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        </Pressable>

        <View className="mx-6 my-4 h-px bg-slate-200/80" />

        {/* Similar Products */}
        <View className="px-4 pt-2">
          <Text className="text-lg font-extrabold tracking-tight text-slate-900">Similar Products</Text>
        </View>

        <View
          className="mt-3 flex-row flex-wrap px-4"
          style={{ columnGap: similarColumnGap, rowGap: 12 }}
        >
          {similarProducts.map((p) => (
            <View key={p.id} style={{ width: similarItemWidth }}>
              <ProductCard
                id={p.id}
                name={p.name}
                subtitle={p.subtitle}
                price={p.price}
                imageSource={p.imageSource}
                containerClassName="w-full mr-0"
                stock={p.stock}
                onPress={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: { id: p.id },
                  })
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View className="border-t border-slate-200 bg-white px-4 pb-5 pt-3">
        <View style={{ flexDirection: "row", columnGap: 12, alignItems: "center" }}>
          <Pressable
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 shadow-sm ${
              isOutOfStock ? "bg-slate-200" : "bg-[#15803d]"
            }`}
            accessibilityRole="button"
            accessibilityLabel={isOutOfStock ? "Product is out of stock" : "Add to cart"}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={20} color={isOutOfStock ? "#94a3b8" : "white"} />
            <Text className={`ml-2 text-sm font-bold tracking-wide ${isOutOfStock ? "text-slate-400" : "text-white"}`}>
              {isOutOfStock ? "Out of Stock" : "Add to Cart"}
            </Text>
          </Pressable>

          <Pressable
            className={`flex-1 flex-row items-center justify-center rounded-2xl py-4 shadow-sm border ${
              isOutOfStock ? "border-slate-200 bg-slate-50" : "border-[#15803d] bg-white"
            }`}
            accessibilityRole="button"
            accessibilityLabel={isOutOfStock ? "Product is out of stock" : "Buy now"}
            disabled={isOutOfStock}
            onPress={() => {
              if (isOutOfStock) return;
              handleAddToCart();
              router.push("/cart");
            }}
          >
            <Text className={`text-sm font-bold ${isOutOfStock ? "text-slate-400" : "text-[#15803d]"}`}>
              Buy Now
            </Text>
          </Pressable>

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
      </View>
    </SafeAreaView>
  );
}
