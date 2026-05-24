import type { ImageSourcePropType } from "react-native";

export function resolveImageSource(source: ImageSourcePropType) {
  // Handle ESM-style imports where the asset is the `default` export
  if (typeof source === "object" && source !== null && "default" in source) {
    const def = (source as { default: any }).default;
    if (typeof def === "string") {
      return { uri: def } as unknown as ImageSourcePropType;
    }

    return def as ImageSourcePropType;
  }

  // If the source itself is a string (e.g., a URL), wrap it in the `{ uri }` shape
  if (typeof source === "string") {
    return { uri: source } as unknown as ImageSourcePropType;
  }

  return source;
}