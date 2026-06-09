import React, { useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

function FieldLabel({ children }: { children: string }) {
	return (
		<Text className="block text-[12px] font-semibold uppercase tracking-wide text-slate-600 mb-1">
			{children}
		</Text>
	);
}

function SecurityRow({
	icon,
	title,
	description,
	value,
	onValueChange,
}: {
	icon: keyof typeof Ionicons.glyphMap;
	title: string;
	description: string;
	value: boolean;
	onValueChange: (nextValue: boolean) => void;
}) {
	return (
		<View className="flex-row items-center justify-between">
			<View className="flex-row flex-1 items-center gap-4 pr-4">
				<View className="h-10 w-10 items-center justify-center rounded-full bg-[#15803d]/10">
					<Ionicons name={icon} size={20} color="#15803d" />
				</View>
				<View className="flex-1">
					<Text className="text-[16px] font-semibold text-slate-900">{title}</Text>
					<Text className="mt-1 text-[12px] font-bold text-slate-500">{description}</Text>
				</View>
			</View>

			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ false: "#bfcaba", true: "#15803d" }}
				thumbColor="#ffffff"
			/>
		</View>
	);
}

export default function EditProfile() {
	const router = useRouter();
	const [fullName, setFullName] = useState("Alexander Bennett");
	const [phone, setPhone] = useState("+1 (555) 012-3456");
	const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
	const [biometricEnabled, setBiometricEnabled] = useState(false);

	return (
		<SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
			<View className="flex-row items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
				<Pressable
					onPress={() => router.replace("/profile")}
					className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
						<Ionicons name="arrow-back" size={22} color="#0f172a" />
				</Pressable>

				<Text className="absolute left-0 right-0 text-center text-[20px] font-extrabold tracking-tight text-slate-900">Edit Profile</Text>

			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
			>
				<View className="items-center">
					<View className="relative">
						<View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
							<Text className="text-5xl font-extrabold text-[#15803d]">A</Text>
						</View>

						<Pressable
							className="absolute bottom-1 right-1 h-11 w-11 items-center justify-center rounded-full border-2 border-slate-50 bg-[#15803d] shadow-lg shadow-[#15803d]/30 active:bg-[#15803d]"
							accessibilityRole="button"
							accessibilityLabel="Change profile photo"
						>
							<Ionicons name="pencil" size={18} color="white" />
						</Pressable>
					</View>

					<Pressable
						className="mt-4"
						accessibilityRole="button"
						accessibilityLabel="Change profile photo"
					>
						<Text className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#15803d]">
							Change Profile Photo
						</Text>
					</Pressable>
				</View>

				<View className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
					<View className="space-y-2">
						<FieldLabel>Full Name</FieldLabel>
						<TextInput
							value={fullName}
							onChangeText={setFullName}
							className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm"
							selectionColor="#15803d"
						/>
					</View>

					<View className="space-y-2 mt-3">
						<FieldLabel>Email Address</FieldLabel>
						<View className="relative mb-3">
							<TextInput
								value="alex.bennett@smartfood.city"
								editable={false}
								className="h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 pr-12 text-[15px] text-slate-500"
							/>
							<Ionicons
								name="lock-closed-outline"
								size={18}
								color="#64748b"
								style={{ position: "absolute", right: 16, top: 14 }}
							/>
						</View>
					</View>

					<View className="space-y-2 mb-3">
						<FieldLabel>Phone Number</FieldLabel>
						<TextInput
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm"
							selectionColor="#15803d"
						/>
					</View>

					<View className="space-y-2">
						<FieldLabel>Password</FieldLabel>
						<View className="flex-row h-12 items-center justify-between rounded-xl border border-gray-200 bg-white px-4 shadow-sm">
							<Text className="text-[16px] tracking-widest text-slate-900">••••••••</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Change password"
								className="rounded-md bg-[#15803d] px-3 py-1 active:opacity-90"
							>
								<Text className="text-[12px] font-semibold uppercase tracking-wide text-white">
									Change
								</Text>
							</Pressable>
						</View>
					</View>
				</View>

				

				<View className="mt-8">
					<Pressable
						className="w-full rounded-2xl bg-[#15803d] py-4 px-6 shadow-md active:opacity-95"
						accessibilityRole="button"
						accessibilityLabel="Save changes"
					>
						<Text className="text-center text-[18px] font-bold tracking-wide text-white">Save Changes</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
