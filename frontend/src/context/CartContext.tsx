import React, { createContext, useContext, useMemo, useState } from "react";
import type { ImageSourcePropType } from "react-native";

export type CartItem = {
  id: string;
  name: string;
  subtitle: string;
  price: string;
  imageSource: ImageSourcePropType;
  quantity: number;
};

type AddToCartItem = Omit<CartItem, "quantity">;

type CartContextValue = {
  cartItems: CartItem[];
  cartCount: number;
  addItem: (item: AddToCartItem) => void;
  removeItem: (id: string) => void;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      addItem: (item) => {
        setCartItems((current) => {
          const existing = current.find((cartItem) => cartItem.id === item.id);

          if (existing) {
            return current.map((cartItem) =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + 1 }
                : cartItem
            );
          }

          return [...current, { ...item, quantity: 1 }];
        });
      },
      removeItem: (id) => {
        setCartItems((current) => current.filter((item) => item.id !== id));
      },
      incrementItem: (id) => {
        setCartItems((current) =>
          current.map((item) =>
            item.id === id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      },
      decrementItem: (id) => {
        setCartItems((current) =>
          current
            .map((item) =>
              item.id === id
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0)
        );
      },
      clearCart: () => setCartItems([]),
    }),
    [cartItems]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}