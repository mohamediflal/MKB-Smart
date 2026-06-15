import { Stack } from "expo-router";
import "../global.css";
import { AddressProvider } from "@/context/AddressContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CategoryProvider } from "@/context/CategoryContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <AddressProvider>
            <CategoryProvider>
              <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
                <Stack.Screen
                  name="notificationPop"
                  options={{ presentation: "transparentModal", animation: "fade" }}
                />
                <Stack.Screen
                  name="authPopUp"
                  options={{ presentation: "transparentModal", animation: "fade" }}
                />
              </Stack>
            </CategoryProvider>
          </AddressProvider>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
