import React, { useState, useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View, ActivityIndicator, type ImageSourcePropType } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/context/FavoritesContext";
import { resolveImageSource } from "@/utils/resolveImageSource";

type ProductCardProps = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: ImageSourcePropType;
  onPress?: () => void;
  onAdd?: () => void;
  containerClassName?: string;
};

export default function ProductCard({
  id,
  name,
  subtitle,
  price,
  imageSource,
  onPress,
  onAdd,
  containerClassName,
}: ProductCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addItem } = useCart();
  const favorite = isFavorite(id);
  const resolvedImageSource = resolveImageSource(imageSource);

  const className =
    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm " +
    (containerClassName ?? "mr-4 w-48");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [imageSource]);

  const cardBody = (
    <>
      <View className="relative items-center justify-center overflow-hidden bg-slate-50 p-3" style={{ height: 150 }}>
        {!error ? (
          <>
            <Image
              source={resolvedImageSource}
              contentFit="contain"
              style={{ width: 120, height: 120 }}
              onLoad={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError(true);
              }}
              accessibilityIgnoresInvertColors
            />
            {loading && (
              <View className="absolute inset-0 items-center justify-center">
                <ActivityIndicator size="small" color="#0f172a" />
              </View>
            )}
          </>
        ) : (
          <View className="absolute inset-0 items-center justify-center bg-slate-100">
            <Ionicons name="image-outline" size={36} color="#94a3b8" />
          </View>
        )}

        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            toggleFavorite(id);
          }}
          className="absolute right-3 top-3 h-10 w-10 overflow-hidden rounded-full border border-white/70"
          accessibilityRole="button"
          accessibilityLabel={favorite ? `Unfavorite ${name}` : `Favorite ${name}`}
          accessibilityState={{ selected: favorite }}
          hitSlop={8}
        >
          <View
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            className={favorite ? "bg-red-600/15" : "bg-white/30"}
          />
          <View className="flex-1 items-center justify-center">
            <Ionicons
              name={favorite ? "heart" : "heart-outline"}
              size={20}
              color={favorite ? "#dc2626" : "#0f172a"}
            />
          </View>
        </Pressable>
      </View>

      <View className="px-4 pb-4">
        <Text className="mt-1 text-base font-bold text-slate-900" numberOfLines={1}>
          {name}
        </Text>
        <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
          {subtitle}
        </Text>

        <View className="mt-0 flex-row items-center justify-between">
          <Text className="text-lg font-extrabold text-slate-900">{price}</Text>
          <Pressable
            className="h-9 w-9 items-center justify-center rounded-full bg-emerald-600"
            onPress={(e) => {
              e.stopPropagation?.();
              addItem({
                id,
                name,
                subtitle,
                price,
                imageSource,
              });
              onAdd?.();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Add ${name}`}
          >
            <Ionicons name="add" size={20} color="white" />
          </Pressable>
        </View>
      </View>
    </>
  );

  return Platform.OS === "web" ? (
    <Pressable
      className={className}
      onPress={onPress}
      tabIndex={onPress ? 0 : undefined}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `View ${name}` : undefined}
    >
      {cardBody}
    </Pressable>
  ) : (
    <Pressable
      className={className}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `View ${name}` : undefined}
    >
      {cardBody}
    </Pressable>
  );
}
