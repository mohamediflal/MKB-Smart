import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import CategoryItem from "@/components/CategoryItem";
import ProductCard from "@/components/ProductCard";
import { usePathname, useRouter } from "expo-router";
import { useCategories } from "@/context/CategoryContext";
import { BEST_SELLING } from "@/constants/bestSelling";
import { RECOMMENDED } from "@/constants/recommended";
import { API_BASE_URL } from "@/context/AuthContext";


export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { categories, refreshCategories } = useCategories();
  const bannerWidth = width;

  const [productList, setProductList] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) setLoadingProducts(true);
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
        setProductList([...BEST_SELLING, ...RECOMMENDED]);
      }
    } catch (err) {
      console.error("Error fetching products in Home:", err);
      setProductList([...BEST_SELLING, ...RECOMMENDED]);
    } finally {
      if (showLoadingIndicator) setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProducts(false),
      refreshCategories()
    ]);
    setRefreshing(false);
  };

  const recommendedColumnGap = 12;
  const recommendedColumns = 2;
  // ScrollView has `px-4` => 16px padding each side
  const recommendedItemWidth =
    (width - 32 - recommendedColumnGap * (recommendedColumns - 1)) /
    recommendedColumns;

  const scaleValue = React.useRef(new Animated.Value(1)).current;
  const sparkleScale = React.useRef(new Animated.Value(1)).current;
  const arrowTranslateX = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleScale, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 0.9,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(sparkleScale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(arrowTranslateX, {
        toValue: 4,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 4,
      }),
      Animated.timing(arrowTranslateX, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Header onNotificationsPress={() => router.push({ pathname: "/notificationPop", params: { returnTo: pathname } })} />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#065f46"]}
            tintColor="#065f46"
          />
        }
      >


        {/*  Banner Slider */}

        <View className="-mx-4 mt-3">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="w-full"
            scrollEventThrottle={16}
          >
            <Banner width={bannerWidth} />
          </ScrollView>
        </View>

        <View className="h-5" />

        {/* Shop Now Button */}

        <View className="mb-4 mt-1">
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <Pressable
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={() => router.push("/shopProduct")}
              className="flex-row items-center justify-between bg-green-800 active:bg-green-900 rounded-2xl py-3 px-5 shadow-sm shadow-green-700/20"
            >
              <View className="flex-row items-center">
                <Animated.View
                  className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-white/10"
                  style={{ transform: [{ scale: sparkleScale }] }}
                >
                  <Ionicons name="sparkles" size={16} color="#FFE082" />
                </Animated.View>
                <Text className="text-white text-base font-bold tracking-wide uppercase">
                  Shop Now
                </Text>
              </View>
              <Animated.View
                className="h-8 w-8 items-center justify-center rounded-full bg-white/20"
                style={{ transform: [{ translateX: arrowTranslateX }] }}
              >
                <Ionicons name="arrow-forward" size={16} color="white" />
              </Animated.View>
            </Pressable>
          </Animated.View>
        </View>



        {/* Categories */}
        <View className="mb-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-900">Categories</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all categories"
              onPress={() => router.push("/categories")}
            >
              <Text className="text-sm font-semibold text-green-700">See all</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="w-full"
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {categories.map((category) => (
              <CategoryItem
                key={category.label}
                label={category.label}
                iconName={category.iconName}
                backgroundClassName={category.backgroundClassName}
                imageSource={category.imageSource}
                containerClassName="mr-3"
                onPress={() =>
                  router.push({
                    pathname: "/category/[slug]",
                    params: { slug: category.slug },
                  })
                }
              />
            ))}
          </ScrollView>

        </View>

        {/* Best Selling */}
        <View className="mb-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-slate-900">Best Selling</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all best selling"
              onPress={() => router.push("/bestSelling")}
            >
              <Text className="text-sm font-semibold text-green-700">See all</Text>
            </Pressable>
          </View>

          {loadingProducts ? (
            <ActivityIndicator size="small" color="#059669" className="py-4" />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="w-full"
              scrollEventThrottle={16}
            >
              {productList.slice(10, 15).map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  subtitle={product.subtitle}
                  price={product.price}
                  imageSource={product.imageSource}
                  containerClassName="mr-2 w-48"
                  stock={product.stock}
                  onPress={() =>
                    router.push({
                      pathname: "/product/[id]",
                      params: { id: product.id },
                    })
                  }
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recommended for you */}
        <View className="mb-10">
          <View className="mb-4">
            <Text className="text-xl font-bold text-slate-900">Recommended for you</Text>
          </View>

          {loadingProducts ? (
            <ActivityIndicator size="small" color="#059669" className="py-4" />
          ) : (
            <View
              className="flex-row flex-wrap"
              style={{ columnGap: recommendedColumnGap, rowGap: 16 }}
            >
              {productList.slice(6, 14).map((product) => (
                <View key={product.id} style={{ width: recommendedItemWidth }}>
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
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}