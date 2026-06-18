import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE_URL } from "./AuthContext";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ImageSourcePropType } from "react-native";

export type Category = {
  id: string;
  slug: string;
  label: string;
  iconName: ComponentProps<typeof Ionicons>["name"];
  backgroundClassName: string;
  imageSource?: ImageSourcePropType;
};

type CategoryContextValue = {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
};

const CategoryContext = createContext<CategoryContextValue | null>(null);

// Preset list of icon names and background colors for matching predefined categories,
// or fallback mapping for new ones.
const PRESET_MAPPINGS: Record<string, { iconName: ComponentProps<typeof Ionicons>["name"]; backgroundClassName: string }> = {
  fruits: { iconName: "nutrition-outline", backgroundClassName: "bg-rose-200" },
  vegetables: { iconName: "leaf-outline", backgroundClassName: "bg-green-200" },
  dairy: { iconName: "water-outline", backgroundClassName: "bg-sky-200" },
  meat: { iconName: "restaurant-outline", backgroundClassName: "bg-red-200" },
  seafood: { iconName: "fish-outline", backgroundClassName: "bg-cyan-200" },
  bakery: { iconName: "pizza-outline", backgroundClassName: "bg-amber-200" },
  grains: { iconName: "albums-outline", backgroundClassName: "bg-yellow-200" },
  "instant-food": { iconName: "fast-food-outline", backgroundClassName: "bg-orange-200" },
  drinks: { iconName: "wine-outline", backgroundClassName: "bg-indigo-200" },
  snacks: { iconName: "ice-cream-outline", backgroundClassName: "bg-pink-200" },
};

const DEFAULT_MAPPING = {
  iconName: "basket-outline" as const,
  backgroundClassName: "bg-emerald-100",
};

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/categories/list`);
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      
      // Map API categories to frontend Category model
      const mapped = data.map((item: any) => {
        const slug = item.slug;
        const mapping = PRESET_MAPPINGS[slug] || DEFAULT_MAPPING;
        
        let imageSource: ImageSourcePropType | undefined = undefined;
        if (item.emoji && item.emoji !== '📦' && item.emoji.startsWith('http')) {
          imageSource = { uri: item.emoji };
        }
        
        return {
          id: item.id,
          slug: item.slug,
          label: item.name,
          iconName: mapping.iconName,
          backgroundClassName: mapping.backgroundClassName,
          imageSource,
        };
      });
      
      setCategories(mapped);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, loading, error, refreshCategories: fetchCategories }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return ctx;
}
