import React, { useMemo, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStripe } from "@stripe/stripe-react-native";

import { useCart } from "@/context/CartContext";
import { useAddresses } from "@/context/AddressContext";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";


const DELIVERY_FEE = 150;
const DISCOUNT = 0;

function formatLkr(value: number) {
	return new Intl.NumberFormat("en-LK", {
		style: "currency",
		currency: "LKR",
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	}).format(value);
}

function parsePrice(value: string) {
	const clean = value.replace(/Rs\./i, "").replace(/LKR/i, "").trim();
	const numeric = Number(value.replace(/[^0-9]/g, "")) || 0;
	return clean.includes(".") ? numeric / 100 : numeric;
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
	return (
		<View className="mb-3">
			<Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-slate-500">
				{eyebrow}
			</Text>
			<Text className="mt-1 text-[22px] font-extrabold tracking-tight text-slate-900">
				{title}
			</Text>
		</View>
	);
}

function RadioCard({
	active,
	icon,
	title,
	subtitle,
	onPress,
}: {
	active: boolean;
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	subtitle: string;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			className={`flex-row items-center gap-4 rounded-[24px] border px-4 py-4 active:scale-[0.99] ${active ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white"}`}
		>
			<View className={`h-11 w-11 items-center justify-center rounded-2xl ${active ? "bg-white" : "bg-slate-50"}`}>
				<Ionicons name={icon} size={20} color={active ? "#15803d" : "#475569"} />
			</View>

			<View className="flex-1">
				<Text className="text-base font-bold text-slate-900">{title}</Text>
				<Text className="mt-1 text-sm text-slate-500">{subtitle}</Text>
			</View>

			<View className={`h-6 w-6 items-center justify-center rounded-full border-2 ${active ? "border-emerald-600" : "border-slate-300"}`}>
				{active ? <View className="h-3 w-3 rounded-full bg-emerald-600" /> : null}
			</View>
		</Pressable>
	);
}

function SummaryRow({
	label,
	value,
	accent,
}: {
	label: string;
	value: string;
	accent?: boolean;
}) {
	return (
		<View className="flex-row items-center justify-between py-1.5">
			<Text className={`text-sm ${accent ? "text-emerald-700" : "text-slate-500"}`}>{label}</Text>
			<Text className={`text-sm font-semibold ${accent ? "text-emerald-700" : "text-slate-800"}`}>{value}</Text>
		</View>
	);
}

export default function CheckoutScreen() {
	const router = useRouter();
	const params = useLocalSearchParams<{ returnTo?: string }>();
	const { cartItems, clearCart } = useCart();
	const { addresses, updateAddress } = useAddresses();
	const { user } = useAuth();
	const { initPaymentSheet, presentPaymentSheet } = useStripe();

	const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
	const [showAddressDropdown, setShowAddressDropdown] = useState(false);
	const [isPlacing, setIsPlacing] = useState(false);
	const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
	const [createdOrder, setCreatedOrder] = useState<any>(null);

	const subtotal = useMemo(
		() => cartItems.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0),
		[cartItems]
	);

	const primaryAddress = useMemo(
		() => addresses.find((address) => address.isPrimary) ?? addresses[0],
		[addresses]
	);

	const total = subtotal + DELIVERY_FEE - DISCOUNT;

	const handleBackPress = () => {
		if (params.returnTo === "/cart") {
			router.replace("/cart");
			return;
		}

		if (params.returnTo === "/") {
			router.replace("/");
			return;
		}

		if (router.canGoBack()) {
			router.back();
			return;
		}

		router.replace("/");
	};

	const handlePlaceOrder = async () => {
		if (cartItems.length === 0) {
			Alert.alert("Your cart is empty", "Add items before placing an order.");
			return;
		}

		if (!primaryAddress) {
			Alert.alert("Shipping Address Required", "Please select or add a delivery address.");
			return;
		}

		if (!user || !user.token) {
			Alert.alert("Not logged in", "Please log in to place an order.");
			return;
		}

		setIsPlacing(true);

		if (paymentMethod === "cod") {
			try {
				const response = await fetch(`${API_BASE_URL}/api/orders/place`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${user.token}`,
					},
					body: JSON.stringify({
						items: cartItems,
						shippingAddress: primaryAddress,
						subtotal,
						deliveryFee: DELIVERY_FEE,
						total,
					}),
				});

				const data = await response.json();

				if (!response.ok || !data.success) {
					Alert.alert("Order Failed", data.message || "Failed to place your order. Please try again.");
					return;
				}

				setCreatedOrder(data.order);
				setIsSuccessModalVisible(true);
			} catch (error: any) {
				console.error("Place Order Error:", error);
				Alert.alert("Network Error", "Unable to connect to the server. Please check your internet connection.");
			} finally {
				setIsPlacing(false);
			}
		} else {
			try {
				// 1. Create PaymentIntent on the backend
				const intentResponse = await fetch(`${API_BASE_URL}/api/orders/create-payment-intent`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${user.token}`,
					},
					body: JSON.stringify({
						items: cartItems,
						subtotal,
						deliveryFee: DELIVERY_FEE,
						total,
					}),
				});

				const intentData = await intentResponse.json();

				if (!intentResponse.ok || !intentData.success) {
					Alert.alert("Payment Setup Failed", intentData.message || "Failed to initiate payment sheet. Please try again.");
					setIsPlacing(false);
					return;
				}

				const { clientSecret, paymentIntentId } = intentData;

				// 2. Initialize the native Stripe Payment Sheet
				const { error: initError } = await initPaymentSheet({
					paymentIntentClientSecret: clientSecret,
					merchantDisplayName: "MKB Smart Store",
					defaultBillingDetails: {
						name: primaryAddress.fullName,
						phone: primaryAddress.phone || undefined,
						address: {
							city: primaryAddress.city,
							country: "LK",
							line1: primaryAddress.street,
							postalCode: primaryAddress.postalCode,
						}
					}
				});

				if (initError) {
					Alert.alert("Payment Setup Error", initError.message);
					setIsPlacing(false);
					return;
				}

				// 3. Present the Payment Sheet
				const { error: presentError } = await presentPaymentSheet();

				if (presentError) {
					if (presentError.code === "Canceled") {
						console.log("Stripe Payment Sheet Canceled by User");
					} else {
						Alert.alert("Payment Failed", presentError.message);
					}
					setIsPlacing(false);
					return;
				}

				// 4. Place the order with verified payment ID on the backend
				const orderResponse = await fetch(`${API_BASE_URL}/api/orders/place-card`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${user.token}`,
					},
					body: JSON.stringify({
						items: cartItems,
						shippingAddress: primaryAddress,
						subtotal,
						deliveryFee: DELIVERY_FEE,
						total,
						paymentIntentId,
					}),
				});

				const orderData = await orderResponse.json();

				if (!orderResponse.ok || !orderData.success) {
					Alert.alert("Order Completed but Failed to Save", orderData.message || "Your payment succeeded but we failed to register the order. Please contact support.");
					return;
				}

				setCreatedOrder(orderData.order);
				setIsSuccessModalVisible(true);
			} catch (error: any) {
				console.error("Card Payment Place Order Error:", error);
				Alert.alert("Connection Error", "An error occurred while completing payment. Please check your internet connection.");
			} finally {
				setIsPlacing(false);
			}
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-[#f9f9ff]" edges={["top"]}>
			<View className="sticky top-0 z-10 border-b border-[#becabc] bg-white/85 px-4 py-4 backdrop-blur-md">
				<View className="flex-row items-center gap-3">
					<Pressable
						onPress={handleBackPress}
						accessibilityRole="button"
						accessibilityLabel="Go back"
						className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
					>
						<Ionicons name="arrow-back" size={22} color="#0f172a" />
					</Pressable>

					<View className="flex-1">
						<Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-emerald-700">
							Premium Checkout
						</Text>
						<Text className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
							Checkout
						</Text>
					</View>
				</View>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 160 }}
			>
				<SectionTitle eyebrow="Delivery" title="Delivery Address" />
				<View className="rounded-[28px] border border-white bg-white p-5 shadow-sm">
					<View className="flex-row items-start gap-4">
						<View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
							<Ionicons name="location-outline" size={22} color="#15803d" />
						</View>

						<View className="flex-1">
							<View className="flex-row items-start justify-between gap-3">
								<View className="flex-1">
									<Text className="text-base font-bold text-slate-900">
										{primaryAddress?.fullName ?? "Saved Address"}
									</Text>
									<Text className="mt-1 text-sm leading-6 text-slate-600">
										{primaryAddress
											? `${primaryAddress.street}, ${primaryAddress.district ? `${primaryAddress.district}, ` : ""}${primaryAddress.city}${primaryAddress.postalCode ? `, ${primaryAddress.postalCode}` : ""}`
											: "Add a delivery address to continue."}
									</Text>
									<Text className="mt-2 text-sm text-slate-500">
										{primaryAddress?.phone ?? "No phone number saved"}
									</Text>
								</View>

								<Pressable
									onPress={() => setShowAddressDropdown((current) => !current)}
									accessibilityRole="button"
									accessibilityLabel="Change address"
									className="rounded-full bg-slate-100 px-4 py-2 active:bg-slate-200"
								>
									<View className="flex-row items-center gap-1.5">
										<Text className="text-sm font-semibold text-[#15803d]">Change</Text>
										<Ionicons
											name={showAddressDropdown ? "chevron-up" : "chevron-down"}
											size={14}
											color="#15803d"
										/>
									</View>
								</Pressable>
							</View>

							{showAddressDropdown ? (
								<View className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-2">
									{addresses.map((address) => {
										const isSelected = address.id === primaryAddress?.id;

										return (
											<Pressable
												key={address.id}
												onPress={() => {
													updateAddress(address.id, {
														label: address.label,
														fullName: address.fullName,
														phone: address.phone,
														street: address.street,
														district: address.district,
														city: address.city,
														postalCode: address.postalCode,
														isPrimary: true,
													});
													setShowAddressDropdown(false);
												}}
												className={`mb-1 rounded-xl border px-3 py-3 ${isSelected ? "border-[#15803d] bg-emerald-50" : "border-transparent bg-white"}`}
												accessibilityRole="button"
												accessibilityLabel={`Select ${address.label} address`}
											>
												<View className="flex-row items-center justify-between gap-3">
													<View className="flex-1">
														<Text className="text-sm font-bold text-slate-900">
															{address.label}
														</Text>
														<Text className="mt-1 text-xs text-slate-600" numberOfLines={1}>
															{address.street}
														</Text>
													</View>

													{isSelected ? (
														<Ionicons name="checkmark-circle" size={18} color="#15803d" />
													) : (
														<Ionicons name="ellipse-outline" size={18} color="#94a3b8" />
													)}
												</View>
											</Pressable>
										);
									})}

									<Pressable
										onPress={() =>
											router.push({
												pathname: "/myAddress",
												params: { returnTo: "/checkout" },
											})
										}
										className="mt-1 rounded-xl bg-white px-3 py-2.5"
										accessibilityRole="button"
										accessibilityLabel="Manage addresses"
									>
										<Text className="text-center text-xs font-semibold text-[#15803d]">
											Manage addresses
										</Text>
									</Pressable>
								</View>
							) : null}
						</View>
					</View>
				</View>

				<View className="mt-8">
					<SectionTitle eyebrow="Payment" title="Payment Method" />
					<View style={{ gap: 12 }}>
						<RadioCard
							active={paymentMethod === "card"}
							icon="card-outline"
							title="Credit / Debit Card"
							subtitle="Secure online payment"
							onPress={() => setPaymentMethod("card")}
						/>
						<RadioCard
							active={paymentMethod === "cod"}
							icon="cash-outline"
							title="Cash on Delivery"
							subtitle="Pay when your order arrives"
							onPress={() => setPaymentMethod("cod")}
						/>
					</View>
				</View>

				<View className="mt-8 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
					<Text className="text-[11px] font-semibold uppercase tracking-[2.4px] text-slate-500">
						Order Summary
					</Text>

					<View className="mt-4" style={{ gap: 2 }}>
						<SummaryRow label="Subtotal" value={formatLkr(subtotal)} />
						<SummaryRow label="Delivery Fee" value={formatLkr(DELIVERY_FEE)} />
						<SummaryRow label="Discount" value={DISCOUNT > 0 ? `-${formatLkr(DISCOUNT)}` : formatLkr(0)} accent />

						<View className="my-3 h-px bg-slate-200" />

						<View className="flex-row items-end justify-between">
							<Text className="text-lg font-bold text-slate-900">Total Amount</Text>
							<Text className="text-3xl font-extrabold tracking-tight text-[#15803d]">
								{formatLkr(total)}
							</Text>
						</View>
					</View>
				</View>

				<View className="mt-8 mb-4 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-5">
					<View className="flex-row items-start gap-4">
						<View className="h-12 w-12 items-center justify-center rounded-full bg-white">
							<Ionicons name="leaf-outline" size={22} color="#15803d" />
						</View>
						<View className="flex-1">
							<Text className="text-base font-bold text-slate-900">Eco-Friendly Delivery</Text>
							<Text className="mt-1 text-sm leading-6 text-slate-600">
								Delivered with a focus on low-emission and efficient routing for a cleaner city.
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>

			<View className="absolute bottom-24 left-0 right-0 z-50 border-t border-slate-200/80 bg-white/95 px-4 pb-6 pt-4 backdrop-blur-md shadow-[0_-12px_30px_rgba(15,23,42,0.12)]">
				<Pressable
					onPress={handlePlaceOrder}
					disabled={cartItems.length === 0 || isPlacing}
					accessibilityRole="button"
					accessibilityLabel="Place order"
					className="h-14 flex-row items-center justify-center rounded-2xl bg-[#15803d] active:bg-[#166534]"
				>
					{isPlacing ? (
						<ActivityIndicator color="white" />
					) : (
						<>
							<Text className="mr-2 text-base font-bold tracking-[0.8px] text-white">
								Place Order
							</Text>
							<View className="ml-1 h-9 w-9 items-center justify-center rounded-full bg-white/15">
								<Ionicons name="arrow-forward" size={18} color="#ffffff" />
							</View>
						</>
					)}
				</Pressable>
			</View>

			{/* Success Popup Modal */}
			<Modal
				visible={isSuccessModalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => { }}
			>
				<View className="flex-1 items-center justify-center bg-black/60 px-6">
					<View className="w-full max-w-[360px] overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl items-center animate-in fade-in duration-300">
						{/* Success Icon */}
						<View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
							<Ionicons name="checkmark-circle" size={40} color="#15803d" />
						</View>

						<Text className="text-xl font-extrabold text-slate-900 text-center">
							Order Placed!
						</Text>
						<Text className="mt-2 text-sm text-slate-500 text-center leading-5 px-2">
							Your order has been placed successfully and is being prepared.
						</Text>

						{/* Order Details Brief */}
						<View className="w-full bg-slate-50 rounded-2xl p-4 mt-4 mb-5 border border-slate-100">
							<View className="flex-row justify-between mb-2">
								<Text className="text-xs text-slate-500 font-medium">Order ID</Text>
								<Text className="text-xs font-bold text-slate-800" numberOfLines={1} style={{ maxWidth: 160 }}>
									{createdOrder?.id}
								</Text>
							</View>
							<View className="flex-row justify-between mb-2">
								<Text className="text-xs text-slate-500 font-medium">Payment</Text>
								<Text className="text-xs font-bold text-slate-800 uppercase">
									{createdOrder?.paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}
								</Text>
							</View>
							<View className="flex-row justify-between mb-2">
								<Text className="text-xs text-slate-500 font-medium">Total Amount</Text>
								<Text className="text-xs font-extrabold text-[#15803d]">
									{formatLkr(createdOrder?.total || total)}
								</Text>
							</View>
							<View className="h-px bg-slate-200 my-1.5" />
							<Text className="text-[11px] text-slate-500 leading-4">
								<Text className="font-bold text-slate-700">Deliver to: </Text>
								{createdOrder?.shippingAddress ? `${createdOrder.shippingAddress.street}, ${createdOrder.shippingAddress.district ? `${createdOrder.shippingAddress.district}, ` : ""}${createdOrder.shippingAddress.city}` : ""}
							</Text>
						</View>

						{/* Action Buttons */}
						<View className="w-full" style={{ gap: 10 }}>
							<Pressable
								onPress={() => {
									clearCart();
									setIsSuccessModalVisible(false);
									router.replace("/");
								}}
								className="w-full rounded-xl bg-[#15803d] py-3.5 shadow-sm active:bg-[#166534]"
							>
								<Text className="text-center text-sm font-bold text-white uppercase tracking-[1px]">
									Continue Shopping
								</Text>
							</Pressable>

							<Pressable
								onPress={() => {
									clearCart();
									setIsSuccessModalVisible(false);
									router.replace("/myOrders");
								}}
								className="w-full rounded-xl border border-[#15803d] bg-white py-3 active:bg-slate-50"
							>
								<Text className="text-center text-sm font-bold text-[#15803d] uppercase tracking-[1px]">
									View My Orders
								</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
