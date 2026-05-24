import type { ImageSourcePropType } from "react-native";

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: ImageSourcePropType;
  categorySlug: string;
};

export const PRODUCTS: Product[] = [
  // Fruits
  {
    id: "fruit-apple",
    name: "Red Apples",
    subtitle: "1kg, Price",
    price: "Rs. 1,150",
    imageSource: require("../assets/images/fruits.jpg"),
    categorySlug: "fruits",
  },
  {
    id: "fruit-banana",
    name: "Banana",
    subtitle: "1 dozen, Price",
    price: "Rs. 420",
    imageSource: require("../assets/images/fruits.jpg"),
    categorySlug: "fruits",
  },
  {
    id: "fruit-orange",
    name: "Orange",
    subtitle: "1kg, Price",
    price: "Rs. 980",
    imageSource: require("../assets/images/fruits.jpg"),
    categorySlug: "fruits",
  },
  {
    id: "fruit-strawberry",
    name: "Fresh Strawberries",
    subtitle: "500g, Price",
    price: "Rs. 990",
    imageSource: require("../assets/images/fruits.jpg"),
    categorySlug: "fruits",
  },

  // Vegetables
  {
    id: "veg-carrot",
    name: "Carrot",
    subtitle: "1kg, Price",
    price: "Rs. 650",
    imageSource: require("../assets/images/vegetable.jpg"),
    categorySlug: "vegetables",
  },
  {
    id: "veg-tomato",
    name: "Tomato",
    subtitle: "1kg, Price",
    price: "Rs. 520",
    imageSource: require("../assets/images/vegetable.jpg"),
    categorySlug: "vegetables",
  },
  {
    id: "veg-onion",
    name: "Big Onion",
    subtitle: "1kg, Price",
    price: "Rs. 1,200",
    imageSource: require("../assets/sample_prod/onion.jpg"),
    categorySlug: "vegetables",
  },

  // Dairy
  {
    id: "dairy-milk",
    name: "Fresh Milk",
    subtitle: "1L, Price",
    price: "Rs. 680",
    imageSource: require("../assets/images/dairy.jpg"),
    categorySlug: "dairy",
  },
  {
    id: "dairy-yogurt",
    name: "Yogurt",
    subtitle: "500ml, Price",
    price: "Rs. 360",
    imageSource: require("../assets/images/dairy.jpg"),
    categorySlug: "dairy",
  },

  // Grains
  {
    id: "grains-ponni",
    name: "Ponni Rice",
    subtitle: "5kg, Price",
    price: "Rs. 2,950",
    imageSource: require("../assets/sample_prod/ponni-rice.jpg"),
    categorySlug: "grains",
  },
  {
    id: "grains-lentils",
    name: "Red Lentils",
    subtitle: "1kg, Price",
    price: "Rs. 1,450",
    imageSource: require("../assets/images/grains.jpg"),
    categorySlug: "grains",
  },

  // Meat
  {
    id: "meat-chicken",
    name: "Bairaha Chicken",
    subtitle: "1kg, Price",
    price: "Rs. 1,990",
    imageSource: require("../assets/sample_prod/bairaha.jpg"),
    categorySlug: "meat",
  },
  {
    id: "meat-fresh",
    name: "Fresh Meat",
    subtitle: "1kg, Price",
    price: "Rs. 2,450",
    imageSource: require("../assets/images/meat.jpg"),
    categorySlug: "meat",
  },

  // Seafood
  {
    id: "seafood-fish",
    name: "Fresh Seafood",
    subtitle: "1kg, Price",
    price: "Rs. 1,950",
    imageSource: require("../assets/images/seafood.jpg"),
    categorySlug: "seafood",
  },

  // Bakery
  {
    id: "bakery-bread",
    name: "Bakery Items",
    subtitle: "1 pack, Price",
    price: "Rs. 540",
    imageSource: require("../assets/images/bakery.jpg"),
    categorySlug: "bakery",
  },

  // Instant Food
  {
    id: "instant-noodles",
    name: "Instant Food",
    subtitle: "1 pack, Price",
    price: "Rs. 520",
    imageSource: require("../assets/images/instant_food.webp"),
    categorySlug: "instant-food",
  },

  // Drinks
  {
    id: "drinks-soft",
    name: "Soft Drinks",
    subtitle: "1L, Price",
    price: "Rs. 380",
    imageSource: require("../assets/images/drinks.webp"),
    categorySlug: "drinks",
  },

  // Snacks
  {
    id: "snacks-pack",
    name: "Tasty Snacks",
    subtitle: "1 pack, Price",
    price: "Rs. 420",
    imageSource: require("../assets/images/snacks.webp"),
    categorySlug: "snacks",
  },
];

