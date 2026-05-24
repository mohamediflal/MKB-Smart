import { Stack } from "expo-router";
import "../global.css";
import { AddressProvider } from "@/context/AddressContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";

export default function RootLayout() {
  return (
    <FavoritesProvider>
      <CartProvider>
        <AddressProvider>
          <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="notificationPop"
              options={{ presentation: "transparentModal", animation: "fade" }}
            />
          </Stack>
        </AddressProvider>
      </CartProvider>
    </FavoritesProvider>
  );
}
