import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth, API_BASE_URL } from "./AuthContext";

type FavoritesContextValue = {
  favoriteIds: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
  syncFavorites: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const STORAGE_KEY = "@mkb_grocery_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const { user } = useAuth();

  // Helper to fetch/sync favorites from the server
  const syncFavorites = async () => {
    if (!user || !user.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/favorites/check`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setFavoriteIds(data);
        }
      }
    } catch (error) {
      console.error("Error syncing favorites from database:", error);
    }
  };

  // 1. Initial load from AsyncStorage (for guest or offline fallback)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          setFavoriteIds(parsed);
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Fetch from DB if user logs in
  useEffect(() => {
    if (user && user.token) {
      syncFavorites();
    } else {
      // If user logs out, we clear favorites to avoid mixing user data.
      setFavoriteIds([]);
    }
  }, [user]);

  // 3. Save to AsyncStorage whenever state changes
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
      } catch {
        // ignore
      }
    })();
  }, [favoriteIds]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = async (productId: string) => {
    // Optimistic local state update
    const isCurrentlyFav = favoriteSet.has(productId);
    setFavoriteIds((prev) =>
      isCurrentlyFav
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );

    // If user is logged in, sync with Neon database
    if (user && user.token) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/favorites/toggle`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify({ productId }),
        });
        if (!response.ok) {
          console.error("Failed to toggle favorite on server");
          // Revert optimistic update
          setFavoriteIds((prev) =>
            isCurrentlyFav
              ? [...prev, productId]
              : prev.filter((id) => id !== productId)
          );
        }
      } catch (error) {
        console.error("Error toggling favorite on server:", error);
        // Revert optimistic update
        setFavoriteIds((prev) =>
          isCurrentlyFav
            ? [...prev, productId]
            : prev.filter((id) => id !== productId)
        );
      }
    }
  };

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favoriteIds,
      isFavorite: (productId) => favoriteSet.has(productId),
      toggleFavorite,
      clearFavorites: () => setFavoriteIds([]),
      syncFavorites,
    }),
    [favoriteIds, favoriteSet, user]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
