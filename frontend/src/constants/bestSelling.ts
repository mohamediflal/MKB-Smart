import type { ImageSourcePropType } from "react-native";

export type BestSellingProduct = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: ImageSourcePropType;
};

// Placeholder images from existing assets until you add product-specific images.
export const BEST_SELLING: BestSellingProduct[] = [
  {
    id: "bell-pepper",
    name: "Bairaha Chicken",
    subtitle: "1 pack, Price",
    price: "Rs. 499",
    imageSource: require("../assets/sample_prod/bairaha.jpg"),
  },
  {
    id: "ginger",
    name: "Big Onion",
    subtitle: "1 kg, Price",
    price: "Rs. 450",
    imageSource: require("../assets/sample_prod/onion.jpg"),
  },
  {
    id: "fruits",
    name: "Ponni Rice",
    subtitle: "1 kg, Price",
    price: "Rs. 300",
    imageSource: require("../assets/sample_prod/ponni-rice.jpg"),
  },
];

