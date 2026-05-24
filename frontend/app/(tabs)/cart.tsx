import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useCart } from "@/context/CartContext";
import { resolveImageSource } from "@/utils/resolveImageSource";

const PROMO_CODE = "FESTIVE20";
const DISCOUNT_RATE = 0.2;
const DELIVERY_FEE = 150;
const TAX_RATE = 0.025;

type CartItem = ReturnType<typeof useCart>["cartItems"][number];

const formatLkr = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);

function CartCard({
  item,
  onRemove,
  onIncrement,
  onDecrement,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
}) {
  const subtotal = Number(item.price.replace(/[^0-9.]/g, "")) || 0;
  const savings = subtotal * 0.1;

  return (
    <View className="flex-row overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <View className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
        <Image
          source={resolveImageSource(item.imageSource)}
          style={{ width: 80, height: 80 }}
          contentFit="cover"
          accessibilityLabel={item.name}
        />
      </View>

      <View className="ml-4 flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
              {item.name}
            </Text>
            <Text className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.subtitle}
            </Text>
          </View>

          <Pressable
            onPress={() => onRemove(item.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name}`}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-50"
          >
            <Ionicons name="trash-outline" size={18} color="#475569" />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-extrabold text-emerald-700">
              {item.price}
            </Text>
            <Text className="mt-1 text-xs font-semibold text-emerald-600">
              Saved {formatLkr(savings)}
            </Text>
          </View>

          <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-1 py-1">
            <Pressable
              onPress={() => onDecrement(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Decrease ${item.name}`}
              className="h-8 w-8 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="remove" size={18} color="#15803d" />
            </Pressable>

            <Text className="min-w-[28px] px-2 text-center text-sm font-bold text-slate-900">
              {item.quantity}
            </Text>

            <Pressable
              onPress={() => onIncrement(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Increase ${item.name}`}
              className="h-8 w-8 items-center justify-center rounded-full bg-white"
            >
              <Ionicons name="add" size={18} color="#15803d" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { cartItems, removeItem, incrementItem, decrementItem, clearCart, cartCount } = useCart();
  const [promoCode, setPromoCode] = useState("FESTIVE20");
  const [appliedCode, setAppliedCode] = useState("FESTIVE20");

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (Number(item.price.replace(/[^0-9.]/g, "")) || 0) * item.quantity,
        0
      ),
    [cartItems]
  );

  const bundleSavings = useMemo(
    () => subtotal * 0.1,
    [subtotal]
  );

  const promoDiscount = appliedCode === PROMO_CODE ? subtotal * DISCOUNT_RATE : 0;
  const taxes = subtotal * TAX_RATE;
  const total = subtotal - promoDiscount + DELIVERY_FEE + taxes;

  const handleApplyPromo = () => {
    setAppliedCode(promoCode.trim().toUpperCase());
  };

  return (
    <View className="flex-1 bg-[#f7fbf0]">
      <View className="border-b border-emerald-100 bg-white px-4 pb-4 pt-14 shadow-sm">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-emerald-50">
              <Ionicons name="menu" size={22} color="#15803d" />
            </View>
            <View>
              <Text className="text-xs font-semibold uppercase tracking-[2px] text-emerald-700">
                Shopping Cart
              </Text>
              <Text className="text-2xl font-extrabold text-emerald-900">
                My Cart ({cartCount} items)
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.push({ pathname: "/notificationPop", params: { returnTo: pathname } })}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="h-11 w-11 items-center justify-center rounded-full bg-emerald-50"
          >
            <Ionicons name="notifications-outline" size={22} color="#15803d" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-36 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
          <View className="flex-row items-start gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Ionicons name="sparkles" size={20} color="#15803d" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold uppercase tracking-[1.6px] text-emerald-700">
                AI Assistant Tip
              </Text>
              <Text className="mt-1 text-sm leading-5 text-slate-700">
                You&apos;ve saved {formatLkr(bundleSavings)} on this order by choosing
                items with current bundle offers.
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 gap-4">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <CartCard
                key={item.id}
                item={item}
                onRemove={removeItem}
                onIncrement={incrementItem}
                onDecrement={decrementItem}
              />
            ))
          ) : (
            <View className="items-center rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-10">
              <Ionicons name="cart-outline" size={36} color="#94a3b8" />
              <Text className="mt-3 text-lg font-bold text-slate-900">
                Your cart is empty
              </Text>
              <Text className="mt-1 text-center text-sm text-slate-500">
                Add items from the catalog to see them here.
              </Text>
            </View>
          )}
        </View>

        <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <Text className="mb-2 text-xs font-bold uppercase tracking-[1.6px] text-slate-500">
            Promo Code
          </Text>
          <View className="flex-row items-center gap-3">
            <TextInput
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter code"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
            />
            <Pressable
              onPress={handleApplyPromo}
              accessibilityRole="button"
              accessibilityLabel="Apply promo code"
              className="rounded-xl bg-emerald-600 px-5 py-3"
            >
              <Text className="text-sm font-bold text-white">Apply</Text>
            </Pressable>
          </View>
          <Text className="mt-2 text-xs font-semibold text-slate-500">
            {appliedCode === PROMO_CODE
              ? `Applied ${PROMO_CODE}`
              : `Try ${PROMO_CODE} for 20% off.`}
          </Text>
        </View>

        <View className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <Text className="text-xl font-extrabold text-slate-900">Order Summary</Text>

          <View className="mt-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Subtotal</Text>
              <Text className="text-sm text-slate-700">{formatLkr(subtotal)}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-emerald-700">Discount ({PROMO_CODE})</Text>
              <Text className="text-sm text-emerald-700">- {formatLkr(promoDiscount)}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Delivery Fee</Text>
              <Text className="text-sm text-slate-700">{formatLkr(DELIVERY_FEE)}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Estimated Taxes</Text>
              <Text className="text-sm text-slate-700">{formatLkr(taxes)}</Text>
            </View>

            <View className="my-2 h-px bg-slate-200" />

            <View className="flex-row items-end justify-between">
              <Text className="text-lg font-bold text-slate-900">Total</Text>
              <Text className="text-2xl font-extrabold tracking-tight text-slate-900">
                {formatLkr(total)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-24 left-0 right-0 border-t border-slate-200 bg-white px-4 pb-8 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
          className="h-14 flex-row items-center justify-center rounded-2xl bg-emerald-700"
          onPress={clearCart}
        >
          <Text className="mr-2 text-base font-bold text-white">Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}