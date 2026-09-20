import { Stack } from "expo-router";
import "../global.css";
import { AddressProvider } from "@/context/AddressContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { StripeProvider } from "@stripe/stripe-react-native";

export const DEFAULT_STRIPE_PUBLISHABLE_KEY =
  "pk_test_51U2UPdEl2eLQqTneBsu7nurUhoy7TpuA2HuUz2XZvTfy2JJqAJZL7BAPAfhD9G9ETfffxlWo1iTVvwnFkgobY1go0038rEAZn2";

export default function RootLayout() {
  const publishableKey =
    process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || DEFAULT_STRIPE_PUBLISHABLE_KEY;

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.com.mkbsmart"
      urlScheme="mkbsmart"
    >
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <AddressProvider>
              <CategoryProvider>
                <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="help" options={{ headerShown: false }} />
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

