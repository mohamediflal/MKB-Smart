import type { ImageSourcePropType } from "react-native";

export type RecommendedProduct = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: ImageSourcePropType;
};

export const RECOMMENDED: RecommendedProduct[] = [
  {
    id: "strawberries",
    name: "Fresh Strawberries",
    subtitle: "500g, Price",
    price: "Rs. 990",
    imageSource: require("../assets/images/fruits.jpg"),
  },
  {
    id: "snacks",
    name: "Tasty Snacks",
    subtitle: "1 pack, Price",
    price: "Rs. 420",
    imageSource: require("../assets/images/snacks.webp"),
  },
  {
    id: "dairy",
    name: "Fresh Dairy",
    subtitle: "1L, Price",
    price: "Rs. 680",
    imageSource: require("../assets/images/dairy.jpg"),
  },
  {
    id: "bakery",
    name: "Bakery Items",
    subtitle: "1 pack, Price",
    price: "Rs. 540",
    imageSource: require("../assets/images/bakery.jpg"),
  },
  {
    id: "seafood",
    name: "Fresh Seafood",
    subtitle: "1kg, Price",
    price: "Rs. 1,950",
    imageSource: require("../assets/images/seafood.jpg"),
  },
  {
    id: "meat",
    name: "Fresh Meat",
    subtitle: "1kg, Price",
    price: "Rs. 2,450",
    imageSource: require("../assets/images/meat.jpg"),
  },
  {
    id: "drinks",
    name: "Soft Drinks",
    subtitle: "1L, Price",
    price: "Rs. 380",
    imageSource: require("../assets/images/drinks.webp"),
  },
  {
    id: "instant-food",
    name: "Instant Food",
    subtitle: "1 pack, Price",
    price: "Rs. 520",
    imageSource: require("../assets/images/instant_food.webp"),
  },
];

