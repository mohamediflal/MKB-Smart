import React from "react";
import { View } from "react-native";
import { Image } from "expo-image";

type BannerProps = {
  width: number;
};

export default function Banner({ width }: BannerProps) {
  const source = require("../assets/images/Gro_banner.png");
  const meta =
    typeof source === "object" && source !== null && "default" in source
      ? (source as any).default
      : source;
  const aspectRatio =
    meta?.width && meta?.height ? meta.width / meta.height : 16 / 9;

  const height = Math.round(width / aspectRatio);

  return (
    <View
      className="overflow-hidden rounded-2xl bg-white"
      style={{ width, height }}
    >
      <Image
        source={source}
        contentFit="contain"
        style={{ width, height }}
        accessibilityLabel="Grocery banner"
      />
    </View>
  );
}

