import React, { useState, useCallback } from "react";
import {
	ActivityIndicator,
	Modal,
	Pressable,
	RefreshControl,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";

import { useAuth, API_BASE_URL } from "@/context/AuthContext";

type OrderItem = {
	id: string;
	name: string;
	price: string;
	quantity: number;
	image?: string;
};

type StatusHistoryEvent = {
	status: string;
	timestamp: string;
	message?: string;
};

type OrderRecord = {
	id: string;
	userId: string;
	items: OrderItem[];
	shippingAddress: {
		fullName: string;
		phone: string;
		street: string;
		city: string;
		postalCode?: string;
	};
	paymentMethod: "card" | "cod";
	subtotal: number;
	deliveryFee: number;
	total: number;
	status: string;
	statusHistory: StatusHistoryEvent[];
	isPaid: boolean;
	createdAt: string;
	updatedAt: string;
};

function formatLkr(value: number) {
	return new Intl.NumberFormat("en-LK", {
		style: "currency",
		currency: "LKR",
		maximumFractionDigits: 2,
		minimumFractionDigits: 2,
	}).format(value);
}

function formatDate(dateStr: string) {
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function StatusBadge({ status }: { status: string }) {
	let bgColor = "bg-slate-100";
	let textColor = "text-slate-700";

	switch (status.toLowerCase()) {
		case "placed":
			bgColor = "bg-blue-50 border border-blue-200";
			textColor = "text-blue-700";
			break;
		case "processing":
			bgColor = "bg-amber-50 border border-amber-200";
			textColor = "text-amber-700";
			break;
		case "shipped":
		case "out for delivery":
			bgColor = "bg-indigo-50 border border-indigo-200";
			textColor = "text-indigo-700";
			break;
		case "delivered":
			bgColor = "bg-emerald-50 border border-emerald-200";
			textColor = "text-emerald-700";
			break;
		case "cancelled":
			bgColor = "bg-rose-50 border border-rose-200";
			textColor = "text-rose-700";
			break;
	}

	return (
		<View className={`rounded-full px-3 py-1 ${bgColor}`}>
			<Text className={`text-[11px] font-extrabold uppercase tracking-[0.5px] ${textColor}`}>
				{status}
			</Text>
		</View>
	);
}

export default function MyOrdersScreen() {
	const router = useRouter();
	const { user } = useAuth();
	const [orders, setOrders] = useState<OrderRecord[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

	const fetchOrders = useCallback(async (showIndicator = true) => {
		if (!user || !user.token) {
			setOrders([]);
			setIsLoading(false);
			return;
		}

		if (showIndicator) {
			setIsLoading(true);
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/address/ping`); // Pre-warm or check connection
			const orderResponse = await fetch(`${API_BASE_URL}/api/orders/user-orders`, {
				headers: {
					Authorization: `Bearer ${user.token}`,
				},
			});

			const data = await orderResponse.json();
			if (orderResponse.ok && data.success && Array.isArray(data.orders)) {
				setOrders(data.orders);
			}
		} catch (error) {
			console.error("Error fetching orders:", error);
		} finally {
			setIsLoading(false);
			setIsRefreshing(false);
		}
	}, [user]);

	useFocusEffect(
		useCallback(() => {
			fetchOrders(true);
		}, [fetchOrders])
	);

	const handleRefresh = () => {
		setIsRefreshing(true);
		fetchOrders(false);
	};

	const handleBackPress = () => {
		if (router.canGoBack()) {
			router.back();
		} else {
			router.replace("/");
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
			{/* Header */}
			<View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 shadow-sm">
				<View className="flex-row items-center gap-3">
					<Pressable
						onPress={handleBackPress}
						className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
						accessibilityRole="button"
						accessibilityLabel="Go back"
					>
						<Ionicons name="arrow-back" size={22} color="#0f172a" />
					</Pressable>
					<Text className="text-[20px] font-bold text-slate-900">My Orders</Text>
				</View>
			</View>

			{/* Main Content */}
			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#15803d" />
					<Text className="mt-3 text-sm text-slate-500 font-medium">Loading orders...</Text>
				</View>
			) : orders.length === 0 ? (
				<ScrollView
					className="flex-1"
					contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 24 }}
					refreshControl={
						<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#15803d"]} />
					}
				>
					<View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-slate-100">
						<Ionicons name="receipt-outline" size={40} color="#475569" />
					</View>
					<Text className="text-lg font-bold text-slate-900 text-center">No orders found</Text>
					<Text className="mt-2 max-w-[240px] text-center text-sm text-slate-500 leading-5">
						You haven't placed any orders yet. Fill your cart and checkout to place your first order.
					</Text>
					<Pressable
						onPress={() => router.replace("/")}
						className="mt-6 rounded-xl bg-[#15803d] px-6 py-3 shadow-md active:bg-[#166534]"
					>
						<Text className="text-sm font-bold text-white uppercase tracking-[0.5px]">Start Shopping</Text>
					</Pressable>
				</ScrollView>
			) : (
				<ScrollView
					className="flex-1"
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
					refreshControl={
						<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} colors={["#15803d"]} />
					}
				>
					<View style={{ gap: 14 }}>
						{orders.map((order) => {
							const totalItems = order.items.reduce((sum, it) => sum + it.quantity, 0);

							return (
								<Pressable
									key={order.id}
									onPress={() => setSelectedOrder(order)}
									className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm active:scale-[0.99] active:bg-slate-50"
									style={{ shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 }}
								>
									<View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
										<View>
											<Text className="text-xs text-slate-400 font-medium">ORDER ID</Text>
											<Text className="text-[13px] font-bold text-slate-800" numberOfLines={1} style={{ maxWidth: 140 }}>
												{order.id}
											</Text>
										</View>
										<StatusBadge status={order.status} />
									</View>

									<View className="py-3.5">
										<Text className="text-xs text-slate-400 font-medium">DATE PLACED</Text>
										<Text className="text-[14px] font-bold text-slate-700 mt-0.5">
											{formatDate(order.createdAt)}
										</Text>

										<Text className="text-xs text-slate-400 font-medium mt-3">ITEMS</Text>
										<Text className="text-[14px] text-slate-600 mt-0.5" numberOfLines={1}>
											{totalItems} item{totalItems > 1 ? "s" : ""} (
											{order.items.map((it) => `${it.name} x${it.quantity}`).join(", ")})
										</Text>
									</View>

									<View className="flex-row items-center justify-between border-t border-slate-100 pt-3">
										<View>
											<Text className="text-xs text-slate-400 font-medium">TOTAL AMOUNT</Text>
											<Text className="text-lg font-extrabold text-[#15803d]">
												{formatLkr(order.total)}
											</Text>
										</View>

										<View className="flex-row items-center gap-1">
											<Text className="text-xs font-bold text-[#15803d]">View Details</Text>
											<Ionicons name="chevron-forward" size={14} color="#15803d" />
										</View>
									</View>
								</Pressable>
							);
						})}
					</View>
				</ScrollView>
			)}

			{/* Order Details Modal */}
			<Modal
				visible={Boolean(selectedOrder)}
				transparent
				animationType="slide"
				onRequestClose={() => setSelectedOrder(null)}
			>
				<View className="flex-1 justify-end bg-black/55">
					<View className="bg-white rounded-t-[32px] px-5 pb-8 pt-5 max-h-[85%] border-t border-slate-100 shadow-2xl">
						{/* Drag Handle */}
						<View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5" />

						{/* Title */}
						<View className="flex-row items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
							<View>
								<Text className="text-[18px] font-bold text-slate-900">Order Details</Text>
								<Text className="text-[11px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">
									ID: {selectedOrder?.id}
								</Text>
							</View>
							<Pressable
								onPress={() => setSelectedOrder(null)}
								className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
							>
								<Ionicons name="close" size={20} color="#475569" />
							</Pressable>
						</View>

						<ScrollView showsVerticalScrollIndicator={false} className="mb-4">
							{/* Tracking Timeline */}
							<Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400 mb-3.5">
								Order Tracking
							</Text>

							{selectedOrder?.statusHistory && (
								<View className="mb-6 px-1">
									{selectedOrder.statusHistory.map((history, idx) => {
										const isLast = idx === selectedOrder.statusHistory.length - 1;
										return (
											<View key={idx} className="flex-row">
												{/* Left Line & Node */}
												<View className="items-center mr-3.5">
													<View className={`h-6 w-6 items-center justify-center rounded-full ${isLast ? "bg-emerald-100 border border-emerald-300" : "bg-slate-100"}`}>
														<View className={`h-2.5 w-2.5 rounded-full ${isLast ? "bg-emerald-600 animate-ping" : "bg-slate-400"}`} />
													</View>
													{!isLast && (
														<View className="w-0.5 bg-slate-200" style={{ height: 26 }} />
													)}
												</View>

												{/* Status Text Info */}
												<View className="flex-1 pb-4">
													<Text className={`text-[14px] font-bold ${isLast ? "text-emerald-700" : "text-slate-700"}`}>
														{history.status}
													</Text>
													<Text className="text-xs text-slate-500 mt-0.5">
														{history.message || `Status updated to ${history.status}`}
													</Text>
													<Text className="text-[10px] text-slate-400 mt-1">
														{formatDate(history.timestamp)}
													</Text>
												</View>
											</View>
										);
									})}
								</View>
							)}

							<View className="h-px bg-slate-100 my-4" />

							{/* Items Summary */}
							<Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400 mb-3.5">
								Items Purchased
							</Text>
							<View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5" style={{ gap: 10 }}>
								{selectedOrder?.items.map((item) => (
									<View key={item.id} className="flex-row items-center justify-between">
										<View className="flex-1 pr-3">
											<Text className="text-[14px] font-bold text-slate-800" numberOfLines={1}>
												{item.name}
											</Text>
											<Text className="text-xs text-slate-500 mt-0.5">
												{item.price} each
											</Text>
										</View>
										<Text className="text-[14px] font-semibold text-slate-500 mr-4">
											x{item.quantity}
										</Text>
										<Text className="text-[14px] font-extrabold text-slate-800">
											{formatLkr(parsePrice(item.price) * item.quantity)}
										</Text>
									</View>
								))}
							</View>

							{/* Delivery Info */}
							<Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400 mb-3.5">
								Delivery Address
							</Text>
							<View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-5">
								<Text className="text-[14px] font-extrabold text-slate-800">
									{selectedOrder?.shippingAddress.fullName}
								</Text>
								<Text className="text-[13px] text-slate-600 mt-1.5 leading-5">
									{selectedOrder?.shippingAddress.street}, {selectedOrder?.shippingAddress.city}
									{selectedOrder?.shippingAddress.postalCode ? `, ${selectedOrder.shippingAddress.postalCode}` : ""}
								</Text>
								<View className="flex-row items-center gap-1.5 mt-3">
									<Ionicons name="call-outline" size={12} color="#64748b" />
									<Text className="text-xs font-semibold text-slate-500">
										{selectedOrder?.shippingAddress.phone}
									</Text>
								</View>
							</View>

							{/* Order Bill Breakdown */}
							<Text className="text-[11px] font-bold uppercase tracking-[1.5px] text-slate-400 mb-3.5">
								Order Receipt
							</Text>
							<View className="bg-slate-50 rounded-2xl p-4 border border-slate-100 mb-2" style={{ gap: 6 }}>
								<View className="flex-row justify-between">
									<Text className="text-xs text-slate-500">Subtotal</Text>
									<Text className="text-xs font-bold text-slate-800">
										{formatLkr(selectedOrder?.subtotal || 0)}
									</Text>
								</View>
								<View className="flex-row justify-between">
									<Text className="text-xs text-slate-500">Delivery Fee</Text>
									<Text className="text-xs font-bold text-slate-800">
										{formatLkr(selectedOrder?.deliveryFee || 0)}
									</Text>
								</View>
								<View className="flex-row justify-between">
									<Text className="text-xs text-slate-500">Payment Mode</Text>
									<Text className="text-xs font-bold text-slate-800 uppercase">
										{selectedOrder?.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Online Card"}
									</Text>
								</View>
								<View className="flex-row justify-between">
									<Text className="text-xs text-slate-500">Paid Status</Text>
									<Text className={`text-xs font-extrabold uppercase ${selectedOrder?.isPaid ? "text-emerald-700" : "text-amber-600"}`}>
										{selectedOrder?.isPaid ? "Paid" : "Pending"}
									</Text>
								</View>
								<View className="h-px bg-slate-200 my-1.5" />
								<View className="flex-row justify-between items-end">
									<Text className="text-[14px] font-extrabold text-slate-900">Total Amount</Text>
									<Text className="text-[18px] font-extrabold text-[#15803d]">
										{formatLkr(selectedOrder?.total || 0)}
									</Text>
								</View>
							</View>
						</ScrollView>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

// Utility function to parse standard LKR prices
function parsePrice(value: string) {
	return Number(value.replace(/[^0-9]/g, "")) || 0;
}
