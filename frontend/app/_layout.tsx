import { Stack } from "expo-router";
import "../global.css";
import { AddressProvider } from "@/context/AddressContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { StripeProvider } from "@stripe/stripe-react-native";

export default function RootLayout() {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  return (
    <StripeProvider publishableKey={publishableKey}>
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
    </StripeProvider>
  );
}

