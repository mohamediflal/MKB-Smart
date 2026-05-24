import React, { useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

function FieldLabel({ children }: { children: string }) {
	return (
		<Text className="block px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">
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
				<View className="h-10 w-10 items-center justify-center rounded-full bg-[#bdefbe]/30">
					<Ionicons name={icon} size={20} color="#3c6842" />
				</View>
				<View className="flex-1">
					<Text className="text-[16px] font-semibold text-slate-900">{title}</Text>
					<Text className="mt-1 text-[12px] font-bold text-slate-500">{description}</Text>
				</View>
			</View>

			<Switch
				value={value}
				onValueChange={onValueChange}
				trackColor={{ false: "#bfcaba", true: "#0d631b" }}
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
		<SafeAreaView className="flex-1 bg-[#f7fbf0]" edges={["top"]}>
			<View className="flex-row items-center justify-between border-b border-[#bfcaba] bg-[#f7fbf0] px-4 py-3">
				<Pressable
					onPress={() => router.back()}
					className="h-10 w-10 items-center justify-center rounded-full bg-white"
					accessibilityRole="button"
					accessibilityLabel="Go back"
				>
					<Ionicons name="arrow-back" size={22} color="#0d631b" />
				</Pressable>

				<Text className="text-[20px] font-bold text-slate-900">Edit Profile</Text>

				<Pressable
					accessibilityRole="button"
					accessibilityLabel="More options"
					className="h-10 w-10 items-center justify-center rounded-full bg-white"
				>
					<Ionicons name="ellipsis-vertical" size={20} color="#0d631b" />
				</Pressable>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
			>
				<View className="items-center">
					<View className="relative">
						<View className="h-32 w-32 overflow-hidden rounded-full border-2 border-[#e0e4da] bg-white items-center justify-center shadow-sm">
							<Text className="text-5xl font-extrabold text-[#0d631b]">A</Text>
						</View>

						<Pressable
							className="absolute bottom-1 right-1 h-11 w-11 items-center justify-center rounded-full border-2 border-[#f7fbf0] bg-[#2e7d32] shadow-md"
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
						<Text className="text-[12px] font-bold uppercase tracking-wider text-[#0d631b]">
							Change Profile Photo
						</Text>
					</Pressable>
				</View>

				<View className="mt-8 space-y-4">
					<View className="space-y-xs">
						<FieldLabel>Full Name</FieldLabel>
						<TextInput
							value={fullName}
							onChangeText={setFullName}
							className="h-12 rounded-xl border border-[#bfcaba] bg-white px-4 text-[16px] text-slate-900"
							selectionColor="#0d631b"
						/>
					</View>

					<View className="space-y-xs">
						<FieldLabel>Email Address</FieldLabel>
						<View className="relative">
							<TextInput
								value="alex.bennett@smartfood.city"
								editable={false}
								className="h-12 rounded-xl border border-[#bfcaba] bg-[#f1f5eb] px-4 pr-12 text-[16px] text-[#707a6c]"
							/>
							<Ionicons
								name="lock-closed-outline"
								size={18}
								color="#707a6c"
								style={{ position: "absolute", right: 16, top: 14 }}
							/>
						</View>
					</View>

					<View className="space-y-xs">
						<FieldLabel>Phone Number</FieldLabel>
						<TextInput
							value={phone}
							onChangeText={setPhone}
							keyboardType="phone-pad"
							className="h-12 rounded-xl border border-[#bfcaba] bg-white px-4 text-[16px] text-slate-900"
							selectionColor="#0d631b"
						/>
					</View>

					<View className="space-y-xs">
						<FieldLabel>Password</FieldLabel>
						<View className="flex-row items-center justify-between h-12 rounded-xl border border-[#bfcaba] bg-white px-4">
							<Text className="text-[16px] tracking-[4px] text-slate-900">••••••••</Text>
							<Pressable
								accessibilityRole="button"
								accessibilityLabel="Change password"
								className="rounded-lg px-3 py-1"
							>
								<Text className="text-[12px] font-bold uppercase tracking-wider text-[#0d631b]">
									Change
								</Text>
							</Pressable>
						</View>
					</View>
				</View>

				<View className="mt-8 border-t border-[#bfcaba] pt-6">
					<Text className="mb-4 text-[20px] font-bold text-slate-900">Account Security</Text>

					<View className="space-y-4 rounded-2xl bg-[#f1f5eb] p-4">
						<SecurityRow
							icon="shield-checkmark-outline"
							title="Two-Factor Authentication"
							description="Secure your login process"
							value={twoFactorEnabled}
							onValueChange={setTwoFactorEnabled}
						/>

						<SecurityRow
							icon="finger-print"
							title="Biometric Login"
							description="Face ID or Fingerprint"
							value={biometricEnabled}
							onValueChange={setBiometricEnabled}
						/>
					</View>
				</View>

				<View className="mt-8">
					<Pressable
						className="rounded-2xl bg-[#2e7d32] py-4 active:opacity-90"
						accessibilityRole="button"
						accessibilityLabel="Save changes"
					>
						<Text className="text-center text-[20px] font-bold text-white">Save Changes</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
