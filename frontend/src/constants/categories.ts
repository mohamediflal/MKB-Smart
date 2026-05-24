import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import type { ImageSourcePropType } from "react-native";

export type Category = {
  slug: string;
  label: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  backgroundClassName: string;
  imageSource?: ImageSourcePropType;
};

export const CATEGORIES: Category[] = [
  {
    slug: "fruits",
    label: "Fruits",
    iconName: "nutrition-outline",
    backgroundClassName: "bg-rose-200",
    imageSource: require("../assets/images/fruits.jpg"),
  },
  {
    slug: "vegetables",
    label: "Vegetables",
    iconName: "leaf-outline",
    backgroundClassName: "bg-green-200",
    imageSource: require("../assets/images/vegetable.jpg"),
  },
  {
    slug: "dairy",
    label: "Dairy",
    iconName: "water-outline",
    backgroundClassName: "bg-sky-200",
    imageSource: require("../assets/images/dairy.jpg"),
  },
  {
    slug: "meat",
    label: "Meat",
    iconName: "restaurant-outline",
    backgroundClassName: "bg-red-200",
    imageSource: require("../assets/images/meat.jpg"),
  },
  {
    slug: "seafood",
    label: "Seafood",
    iconName: "fish-outline",
    backgroundClassName: "bg-cyan-200",
    imageSource: require("../assets/images/seafood.jpg"),
  },
  {
    slug: "bakery",
    label: "Bakery",
    iconName: "pizza-outline",
    backgroundClassName: "bg-amber-200",
    imageSource: require("../assets/images/bakery.jpg"),
  },
  {
    slug: "grains",
    label: "Grains",
    iconName: "albums-outline",
    backgroundClassName: "bg-yellow-200",
    imageSource: require("../assets/images/grains.jpg"),
  },
  {
    slug: "instant-food",
    label: "Instant Food",
    iconName: "fast-food-outline",
    backgroundClassName: "bg-orange-200",
    imageSource: require("../assets/images/instant_food.webp"),
  },
  {
    slug: "drinks",
    label: "Drinks",
    iconName: "wine-outline",
    backgroundClassName: "bg-indigo-200",
    imageSource: require("../assets/images/drinks.webp"),
  },
  {
    slug: "snacks",
    label: "Snacks",
    iconName: "ice-cream-outline",
    backgroundClassName: "bg-pink-200",
    imageSource: require("../assets/images/snacks.webp"),
  },
];

