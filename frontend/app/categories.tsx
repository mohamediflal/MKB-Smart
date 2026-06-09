import React from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import CategoryItem from "@/components/CategoryItem";
import { CATEGORIES } from "@/constants/categories";

export default function CategoriesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const horizontalPadding = 16;
  const columnGap = 12;
  const columns = 3;

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
        <Text className="ml-3 text-lg font-bold text-slate-900">Categories</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row flex-wrap" style={{ columnGap, rowGap: 16 }}>
          {CATEGORIES.map((category) => (
            <View key={category.label} style={{ width: itemWidth }}>
              <CategoryItem
                label={category.label}
                iconName={category.iconName}
                backgroundClassName={category.backgroundClassName}
                imageSource={category.imageSource}
                containerClassName=""
                onPress={() =>
                  router.push({
                    pathname: "/category/[slug]",
                    params: { slug: category.slug },
                  })
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
