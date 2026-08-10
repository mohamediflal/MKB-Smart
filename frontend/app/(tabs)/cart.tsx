import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname, useRouter } from "expo-router";
import { useCart } from "@/context/CartContext";
import { resolveImageSource } from "@/utils/resolveImageSource";
import { AIVoiceShoppingAssistant } from "@/components/AIVoiceShoppingAssistant";

const DELIVERY_FEE = 150;

type CartItem = ReturnType<typeof useCart>["cartItems"][number];

type MeasurementUnit = "kg" | "l";

function parsePrice(value: string) {
  const clean = value.replace(/Rs\./i, "").replace(/LKR/i, "").trim();
  const numeric = Number(value.replace(/[^0-9]/g, "")) || 0;
  return clean.includes(".") ? numeric / 100 : numeric;
}

const formatLkr = (value: number) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(value);

function roundQuantity(value: number) {
  return Math.round(value * 100) / 100;
}

function formatDecimal(value: number) {
  return roundQuantity(value).toString().replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

function getMeasurementUnit(subtitle: string): MeasurementUnit | null {
  const normalized = subtitle.replace(/\s+/g, "").toLowerCase();

  if (normalized.startsWith("1kg")) {
    return "kg";
  }

  if (normalized.startsWith("1l")) {
    return "l";
  }

  return null;
}

function formatMeasuredQuantity(quantity: number, unit: MeasurementUnit) {
  const rounded = roundQuantity(quantity);

  if (unit === "kg") {
    return rounded >= 1 ? `${formatDecimal(rounded)} kg` : `${Math.round(rounded * 1000)} g`;
  }

  return rounded >= 1 ? `${formatDecimal(rounded)} L` : `${Math.round(rounded * 1000)} ml`;
}

function formatSubtitleWithQuantity(subtitle: string, quantity: number) {
  const measuredUnit = getMeasurementUnit(subtitle);

  if (measuredUnit) {
    const match = subtitle.match(/^\s*1\s*([A-Za-z]+)(.*)$/i);

    if (match) {
      const [, , rest] = match;
      return `${formatMeasuredQuantity(quantity, measuredUnit)}${rest}`;
    }
  }

  const match = subtitle.match(/^(\d+(?:\.\d+)?)(\s*)([A-Za-z]+)?(.*)$/);

  if (!match) {
    return subtitle;
  }

  const [, , spacing, rawUnit, rest] = match;

  if (!rawUnit) {
    return `${formatDecimal(quantity)}${spacing}${rest}`;
  }

  // Keep measurement units unchanged (e.g., L, ml, kg) and only pluralize countable words.
  const nonPluralUnits = new Set(["g", "kg", "mg", "lb", "oz", "ml", "l"]);
  const isCountableWord = spacing.length > 0 && !nonPluralUnits.has(rawUnit.toLowerCase());
  const singularUnit = rawUnit.endsWith("s") ? rawUnit.slice(0, -1) : rawUnit;
  const unit = isCountableWord && quantity !== 1 ? `${singularUnit}s` : singularUnit;

  return `${formatDecimal(quantity)}${spacing}${unit}${rest}`;
}

function formatQuantityLabel(subtitle: string, quantity: number) {
  const measuredUnit = getMeasurementUnit(subtitle);

  if (measuredUnit) {
    return formatMeasuredQuantity(quantity, measuredUnit);
  }

  return formatDecimal(quantity);
}

function CartCard({
  item,
  onRemove,
  onIncrement,
  onDecrement,
  onAdjustQuantity,
  onOpenEditor,

}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onAdjustQuantity: (id: string, delta: number) => void;
  onOpenEditor: (id: string) => void;
}) {
  const router = useRouter();
  const unitPrice = parsePrice(item.price);
  const lineTotal = unitPrice * item.quantity;
  const subtitle = formatSubtitleWithQuantity(item.subtitle, item.quantity);
  const quantityLabel = formatQuantityLabel(item.subtitle, item.quantity);
  const measuredUnit = getMeasurementUnit(item.subtitle);
  const measuredStep = measuredUnit ? 0.05 : 1;


  return (
    <View className="flex-row overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <Pressable
        onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })}
        accessibilityRole="button"
        accessibilityLabel={`View ${item.name}`}
        className="h-25 w-22 overflow-hidden rounded-2xl bg-slate-100 active:scale-[0.98]"
      >
        <Image
          source={resolveImageSource(item.imageSource)}
          style={{ width: 80, height: 80 }}
          contentFit="cover"
          accessibilityLabel={item.name}
        />
      </Pressable>

      <View className="ml-4 flex-1">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900" numberOfLines={2}>
              {item.name}
            </Text>
            <Text className="mt-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {subtitle}
            </Text>
          </View>

          <Pressable
            onPress={() => onRemove(item.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.name}`}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-50 active:bg-slate-100"
          >
            <Ionicons name="trash-outline" size={18} color="#475569" />
          </Pressable>
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-extrabold text-[#15803d]">
              {formatLkr(lineTotal)}
            </Text>

          </View>

          <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-50 px-1 py-1 shadow-sm">
            <Pressable
              onPress={() =>
                measuredUnit ? onAdjustQuantity(item.id, -measuredStep) : onDecrement(item.id)
              }
              accessibilityRole="button"
              accessibilityLabel={
                measuredUnit
                  ? `Decrease ${item.name} by ${measuredUnit === "kg" ? "50 g" : "50 ml"}`
                  : `Decrease ${item.name}`
              }
              className="h-8 w-8 items-center justify-center rounded-full bg-white active:bg-emerald-50"
            >
              <Ionicons name="remove" size={18} color="#15803d" />
            </Pressable>

            <Pressable
              onPress={() => onOpenEditor(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${item.name} quantity`}
              className="min-w-[54px] px-2 items-center justify-center"
            >
              <Text className="text-center text-sm font-bold text-slate-900">{quantityLabel}</Text>
            </Pressable>

            <Pressable
              onPress={() =>
                measuredUnit ? onAdjustQuantity(item.id, measuredStep) : onIncrement(item.id)
              }
              accessibilityRole="button"
              accessibilityLabel={
                measuredUnit
                  ? `Increase ${item.name} by ${measuredUnit === "kg" ? "50 g" : "50 ml"}`
                  : `Increase ${item.name}`
              }
              className="h-8 w-8 items-center justify-center rounded-full bg-white active:bg-emerald-50"
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
  const { cartItems, removeItem, incrementItem, decrementItem, adjustItemQuantity, setItemQuantity, clearCart, cartCount } = useCart();
  const [showEmptyCartPopup, setShowEmptyCartPopup] = React.useState(false);
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null);
  const [kgInput, setKgInput] = React.useState<string>("0");
  const [gInput, setGInput] = React.useState<string>("0");
  const [lInput, setLInput] = React.useState<string>("0");
  const [mlInput, setMlInput] = React.useState<string>("0");
  const [countInput, setCountInput] = React.useState<string>("1");

  const subtotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + parsePrice(item.price) * item.quantity,
        0
      ),
    [cartItems]
  );

  const total = subtotal + DELIVERY_FEE;

  const editingItem = editingItemId ? cartItems.find((i) => i.id === editingItemId) ?? null : null;
  const editingKind = editingItem ? getMeasurementUnit(editingItem.subtitle) : null;

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      setShowEmptyCartPopup(true);
      return;
    }

    router.push({
      pathname: "/checkout",
      params: { returnTo: pathname },
    });
  };

  const openEditorFor = (id: string) => {
    const item = cartItems.find((i) => i.id === id);
    if (!item) return;

    const kind = getMeasurementUnit(item.subtitle);
    setEditingItemId(id);

    // initialize inputs from existing quantity
    const qty = roundQuantity(item.quantity);
    if (kind === "kg") {
      const kg = Math.floor(qty);
      const g = Math.round((qty - kg) * 1000);
      setKgInput(String(kg));
      setGInput(String(g));
    } else if (kind === "l") {
      const l = Math.floor(qty);
      const ml = Math.round((qty - l) * 1000);
      setLInput(String(l));
      setMlInput(String(ml));
    } else {
      setCountInput(String(Math.round(qty)));
    }
  };

  const closeEditor = () => {
    setEditingItemId(null);
  };

  const confirmEditor = () => {
    if (!editingItem) return;
    const kind = getMeasurementUnit(editingItem.subtitle);

    if (kind === "kg") {
      let kg = Number(kgInput) || 0;
      let g = Number(gInput) || 0;
      if (kg < 0) kg = 0;
      if (g < 0) g = 0;
      if (kg > 20) kg = 20;
      if (kg >= 20) g = 0;
      if (g > 900) g = 900;
      let qty = roundQuantity(kg + g / 1000);
      if (qty > 20) qty = 20;
      setItemQuantity(editingItem.id, qty);
    } else if (kind === "l") {
      let l = Number(lInput) || 0;
      let ml = Number(mlInput) || 0;
      if (l < 0) l = 0;
      if (ml < 0) ml = 0;
      if (l > 20) l = 20;
      if (l >= 20) ml = 0;
      if (ml > 900) ml = 900;
      let qty = roundQuantity(l + ml / 1000);
      if (qty > 20) qty = 20;
      setItemQuantity(editingItem.id, qty);
    } else {
      let q = Math.round(Number(countInput) || 0);
      if (q < 0) q = 0;
      if (q > 20) q = 20;
      setItemQuantity(editingItem.id, q);
    }

    closeEditor();
  };

  return (
    <View className="flex-1 bg-slate-50">
      <View className="border-b border-slate-200/80 bg-white px-4 pb-5 pt-14 shadow-sm">
        <View className="flex-row items-center justify-between rounded-3xl border border-emerald-100 bg-white px-4 py-3 shadow-sm">
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <Ionicons name="cart-outline" size={22} color="#15803d" />
            </View>

            <View>
              <Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-emerald-700">
                Shopping Cart
              </Text>

              <View className="mt-1 flex-row items-center gap-2">
                <Text className="text-2xl font-extrabold tracking-tight text-slate-900">
                  My Cart
                </Text>
                <View className="rounded-full bg-slate-900 px-2.5 py-1">
                  <Text className="text-[11px] font-bold text-white">
                    {cartCount} items
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.push({ pathname: "/notificationPop", params: { returnTo: pathname } })}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          >
            <Ionicons name="notifications-outline" size={22} color="#0f172a" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-40 pt-5"
        showsVerticalScrollIndicator={false}
      >


        <View className="mt-2 gap-4">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <CartCard
                key={item.id}
                item={item}
                onRemove={removeItem}
                onIncrement={incrementItem}
                onDecrement={decrementItem}
                onAdjustQuantity={adjustItemQuantity}
                onOpenEditor={openEditorFor}
              />
            ))
          ) : (
            <View className="items-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 shadow-sm">
              <Ionicons name="cart-outline" size={36} color="#94a3b8" />
              <Text className="mt-3 text-lg font-bold tracking-tight text-slate-900">
                Your cart is empty
              </Text>
              <Text className="mt-1 text-center text-sm leading-6 text-slate-500">
                Add items from the catalog to see them here.
              </Text>
            </View>
          )}
        </View>



        <View className="mt-5 mb-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <Text className="text-xl font-extrabold tracking-tight text-slate-900">Order Summary</Text>

          <View className="mt-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Subtotal</Text>
              <Text className="text-sm font-medium text-slate-800">{formatLkr(subtotal)}</Text>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-500">Delivery Fee</Text>
              <Text className="text-sm font-medium text-slate-800">{formatLkr(DELIVERY_FEE)}</Text>
            </View>

            <View className="my-2 h-px bg-slate-200" />

            <View className="flex-row items-end justify-between">
              <Text className="text-lg font-bold text-slate-900">Total</Text>
              <Text className="text-2xl font-extrabold tracking-tight text-[#15803d]">
                {formatLkr(total)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed / Sticky AI Voice Shopping Assistant (remains fixed above Proceed to Checkout bar, does NOT scroll) */}
      <View className="absolute bottom-[170px] mb-2 right-4 z-20 items-end pointer-events-box-none">
        <AIVoiceShoppingAssistant />
      </View>

      <View className="absolute bottom-24 left-0 right-0 border-t border-slate-200/80 bg-white px-4 pb-8 pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Proceed to checkout"
          className="h-14 flex-row items-center justify-center rounded-2xl bg-[#15803d] active:bg-[#166534]"
          onPress={handleProceedToCheckout}
        >
          <Text className="mr-2 text-base font-bold tracking-wide text-white">Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </Pressable>
      </View>

      <Modal visible={!!editingItem} transparent animationType="fade" onRequestClose={closeEditor}>
        <View className="flex-1 items-center justify-center bg-black/45 px-5">
          <View className="w-full max-w-[420px] overflow-hidden rounded-[20px] bg-white p-5 shadow-2xl">
            <Text className="text-lg font-extrabold text-slate-900">Enter quantity</Text>
            <Text className="mt-2 text-sm text-slate-600">{editingItem?.name}</Text>

            {editingKind === "kg" ? (
              <View className="mt-4 flex-row items-center gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">kg (max 20)</Text>
                  <TextInput
                    value={kgInput}
                    onChangeText={setKgInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border px-3 py-2"
                  />
                </View>

                <View className="w-32">
                  <Text className="text-xs text-slate-500">g (max 900)</Text>
                  <TextInput
                    value={gInput}
                    onChangeText={setGInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border px-3 py-2"
                  />
                </View>
              </View>
            ) : editingKind === "l" ? (
              <View className="mt-4 flex-row items-center gap-2">
                <View className="flex-1">
                  <Text className="text-xs text-slate-500">L (max 20)</Text>
                  <TextInput
                    value={lInput}
                    onChangeText={setLInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border px-3 py-2"
                  />
                </View>

                <View className="w-32">
                  <Text className="text-xs text-slate-500">ml (max 900)</Text>
                  <TextInput
                    value={mlInput}
                    onChangeText={setMlInput}
                    keyboardType="numeric"
                    className="mt-1 h-12 w-full rounded-2xl border px-3 py-2"
                  />
                </View>
              </View>
            ) : (
              <View className="mt-4">
                <Text className="text-xs text-slate-500">Quantity (max 20)</Text>
                <TextInput
                  value={countInput}
                  onChangeText={setCountInput}
                  keyboardType="numeric"
                  className="mt-1 h-12 w-full rounded-2xl border px-3 py-2"
                />
              </View>
            )}

            <View className="mt-5 flex-row gap-3">
              <Pressable onPress={closeEditor} className="flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5">
                <Text className="text-sm font-bold text-slate-700">Cancel</Text>
              </Pressable>

              <Pressable onPress={confirmEditor} className="flex-1 items-center justify-center rounded-2xl bg-[#15803d] py-3.5">
                <Text className="text-sm font-bold text-white">OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEmptyCartPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmptyCartPopup(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-5">
          <View className="w-full max-w-[380px] overflow-hidden rounded-[28px] border border-white bg-white p-5 shadow-2xl">
            <View className="mb-4 flex-row items-start gap-4">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-100">
                <Ionicons name="cart-outline" size={24} color="#b45309" />
              </View>

              <View className="flex-1">
                <Text className="text-[20px] font-extrabold tracking-tight text-slate-900">
                  Your cart is empty
                </Text>
                <Text className="mt-2 text-sm leading-6 text-slate-600">
                  Add products to your cart before continuing to checkout.
                </Text>
              </View>
            </View>

            <View className="mb-5 rounded-2xl bg-slate-50 px-4 py-3">
              <Text className="text-sm font-semibold text-slate-800">
                Tip: browse the catalog and tap the green + button to add items.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowEmptyCartPopup(false)}
                className="flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white py-3.5"
                accessibilityRole="button"
                accessibilityLabel="Close empty cart popup"
              >
                <Text className="text-sm font-bold text-slate-700">Continue Shopping</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowEmptyCartPopup(false);
                  router.push("/");
                }}
                className="flex-1 items-center justify-center rounded-2xl bg-[#15803d] py-3.5 shadow-green-700/20"
                accessibilityRole="button"
                accessibilityLabel="Go to products"
              >
                <Text className="text-sm font-bold text-white">Go to Products</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}