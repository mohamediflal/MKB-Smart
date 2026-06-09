import React from "react";
import { StyleSheet, type ImageSourcePropType, Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { resolveImageSource } from "@/utils/resolveImageSource";

type CategoryItemProps = {
  label: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
  backgroundClassName: string;
  imageSource?: ImageSourcePropType;
  onPress?: () => void;
  containerClassName?: string;
  tileClassName?: string;
};

export default function CategoryItem({
  label,
  iconName,
  backgroundClassName,
  imageSource,
  onPress,
  containerClassName,
  tileClassName,
}: CategoryItemProps) {
  const resolvedImageSource = imageSource ? resolveImageSource(imageSource) : undefined;

  return (
    <Pressable
      className={[
        "items-center",
        "shrink-0",
        containerClassName ?? "mr-3",
      ].join(" ")}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        className={[
          "relative overflow-hidden items-center justify-center",
          "border border-black/5 bg-slate-100",
          backgroundClassName,
          tileClassName ?? "",
        ].join(" ")}
        style={{ width: 76, height: 76, borderRadius: 22 }}
      >
        {resolvedImageSource ? (
          <Image
            source={resolvedImageSource}
            contentFit="cover"
            style={[StyleSheet.absoluteFill, { zIndex: 0 }]}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Ionicons name={iconName} size={32} color="#0f172a" />
          </View>
        )}
      </View>
      <Text className="mt-2.5 text-[12px] font-semibold text-slate-950" numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}