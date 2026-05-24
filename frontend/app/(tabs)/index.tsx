import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "@/components/Header";
import Banner from "@/components/Banner";
import CategoryItem from "@/components/CategoryItem";
import ProductCard from "@/components/ProductCard";
import { usePathname, useRouter } from "expo-router";
import { CATEGORIES } from "@/constants/categories";
import { BEST_SELLING } from "@/constants/bestSelling";
import { RECOMMENDED } from "@/constants/recommended";

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const bannerWidth = width;

  const recommendedColumnGap = 12;
  const recommendedColumns = 2;
  // ScrollView has `px-4` => 16px padding each side
  const recommendedItemWidth =
    (width - 32 - recommendedColumnGap * (recommendedColumns - 1)) /
    recommendedColumns;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <Header onNotificationsPress={() => router.push({ pathname: "/notificationPop", params: { returnTo: pathname } })} />

      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 90 }}
      >
        <View className="mb-4">
          <View className="flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-1.8">
            <Ionicons name="search-outline" size={20} color="#64748b" />
            <TextInput
              placeholder="Search products, categories..."
              placeholderTextColor="#94a3b8"
              className="ml-3 flex-1 text-base text-slate-900"
            />
          </View>
        </View>

        {/*  Banner Slider */}

        <View className="-mx-4">
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
            {CATEGORIES.map((category) => (
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="w-full"
            scrollEventThrottle={16}
          >
            {BEST_SELLING.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                subtitle={product.subtitle}
                price={product.price}
                imageSource={product.imageSource}
                containerClassName="mr-2 w-48"
                onPress={() =>
                  router.push({
                    pathname: "/product/[id]",
                    params: { id: product.id },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Recommended for you */}
        <View className="mb-10">
          <View className="mb-4">
            <Text className="text-xl font-bold text-slate-900">Recommended for you</Text>
          </View>

          <View
            className="flex-row flex-wrap"
            style={{ columnGap: recommendedColumnGap, rowGap: 16 }}
          >
            {RECOMMENDED.map((product) => (
              <View key={product.id} style={{ width: recommendedItemWidth }}>
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
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}