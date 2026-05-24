import React from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAddresses } from "@/context/AddressContext";

function AddressCard({
	onEdit,
	onDelete,
	onSetPrimary,
  title,
  addressLine1,
  addressLine2,
  phone,
  icon,
  primaryBorder,
  primaryBadge,
  showPrimaryButton,
}: {
	onEdit: () => void;
	onDelete: () => void;
	onSetPrimary?: () => void;
  title: string;
  addressLine1: string;
  addressLine2: string;
  phone: string;
  icon: keyof typeof Ionicons.glyphMap;
  primaryBorder?: boolean;
  primaryBadge?: boolean;
  showPrimaryButton?: boolean;
}) {
  return (
    <View
			className={`rounded-2xl bg-white px-4 py-4 shadow-sm ${primaryBorder ? "border border-[#0d631b]" : "border border-[#c8d0c1]"}`}
			style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}
    >
			<View className="mb-4 flex-row items-start justify-between">
				<View className="flex-1 flex-row items-start gap-3 pr-3">
					<View className="h-11 w-11 items-center justify-center rounded-full bg-[#bdefbe]">
            <Ionicons name={icon} size={20} color="#0d631b" />
          </View>
					<View className="flex-1 pt-0.5">
						<Text className="text-[12px] font-bold uppercase tracking-[1.2px] text-slate-500">
              {title}
            </Text>
            {primaryBadge ? (
							<View className="mt-1 self-start rounded-full bg-[#0d631b] px-2.5 py-0.5">
                <Text className="text-[10px] font-bold text-white">PRIMARY</Text>
              </View>
            ) : null}
          </View>
        </View>

				<View className="flex-row gap-3 pt-0.5">
          <Pressable
						onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title} address`}
						className="h-8 w-8 items-center justify-center rounded-full bg-white"
          >
						<Ionicons name="create-outline" size={19} color="#40493d" />
          </Pressable>
          <Pressable
						onPress={onDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${title} address`}
						className="h-8 w-8 items-center justify-center rounded-full bg-white"
          >
						<Ionicons name="trash-outline" size={19} color="#ba1a1a" />
          </Pressable>
        </View>
      </View>

			<View>
				<Text className="text-[17px] font-normal leading-6 text-slate-900">{addressLine1}</Text>
				<Text className="mt-1 text-[14px] leading-5 text-slate-500">{addressLine2}</Text>
				<View className="mt-3 flex-row items-center gap-2 text-slate-500">
          <Ionicons name="call-outline" size={14} color="#40493d" />
          <Text className="text-[14px] text-slate-500">{phone}</Text>
        </View>
      </View>

      {showPrimaryButton ? (
        <Pressable
					onPress={onSetPrimary}
					className="mt-4 rounded-xl border border-[#0d631b] py-3"
          accessibilityRole="button"
          accessibilityLabel={`Set ${title} as primary`}
        >
					<Text className="text-center text-[13px] font-bold text-[#0d631b]">Set as Primary</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function MyAddressScreen() {
	const router = useRouter();
	const { addresses, removeAddress, updateAddress } = useAddresses();
	const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
	const formattedAddresses = addresses.map((address) => ({
		id: address.id,
		title: address.label,
		addressLine1: address.street,
		addressLine2: `${address.city}${address.postalCode ? `, ${address.postalCode}` : ""}`,
		phone: address.phone,
		icon:
			address.label === "Home"
				? ("home" as const)
				: address.label === "Office"
					? ("briefcase" as const)
					: address.label === "Parent's House"
						? ("people" as const)
						: ("location" as const),
			primaryBorder: address.isPrimary,
			primaryBadge: address.isPrimary,
			showPrimaryButton: !address.isPrimary,
				fullName: address.fullName,
	}));

		const handleDelete = (addressId: string, title: string) => {
			setDeleteTarget({ id: addressId, title });
		};

		const confirmDelete = () => {
			if (!deleteTarget) {
				return;
			}

			removeAddress(deleteTarget.id);
			setDeleteTarget(null);
		};

		const handleSetPrimary = (addressId: string) => {
			const selected = addresses.find((entry) => entry.id === addressId);
			if (!selected) {
				return;
			}

			updateAddress(addressId, { ...selected, isPrimary: true });
		};

	return (
		<SafeAreaView className="flex-1 bg-[#f7fbf0]" edges={["top"]}>
			<View className="flex-row items-center justify-between border-b border-[#bfcaba] bg-[#f7fbf0] px-4 py-3">
				<View className="flex-row items-center gap-3">
					<Pressable
						onPress={() => router.back()}
						className="h-10 w-10 items-center justify-center rounded-full bg-white"
						accessibilityRole="button"
						accessibilityLabel="Go back"
					>
						<Ionicons name="arrow-back" size={22} color="#0d631b" />
					</Pressable>
					<Text className="text-[20px] font-bold text-slate-900">My Addresses</Text>
				</View>

				<Pressable
					onPress={() => router.push("/addNewAddress")}
					accessibilityRole="button"
					accessibilityLabel="Add new address"
					className="h-10 w-10 items-center justify-center rounded-full bg-white"
				>
					<Ionicons name="add" size={22} color="#0d631b" />
				</Pressable>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 120 }}
			>
				<View style={{ gap: 16 }}>
					{formattedAddresses.map((address) => (
						<AddressCard
							key={address.id}
							title={address.title}
							addressLine1={address.addressLine1}
							addressLine2={address.addressLine2}
							phone={address.phone}
							icon={address.icon}
							primaryBorder={address.primaryBorder}
							primaryBadge={address.primaryBadge}
							showPrimaryButton={address.showPrimaryButton}
							onEdit={() =>
								router.push({
									pathname: "/addNewAddress",
									params: { addressId: address.id },
								})
							}
							onDelete={() => handleDelete(address.id, address.title)}
							onSetPrimary={address.showPrimaryButton ? () => handleSetPrimary(address.id) : undefined}
						/>
					))}
				</View>

				<View className="mt-8 items-center justify-center py-6 opacity-50">
					<View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-[#e5eadf]">
						<Ionicons name="location-outline" size={40} color="#40493d" />
					</View>
					<Text className="max-w-[220px] text-center text-[14px] text-slate-500">
						Keep your delivery addresses updated for faster checkout.
					</Text>
				</View>
			</ScrollView>

			<View className="absolute bottom-0 left-0 right-0 border-t border-[#bfcaba] bg-[#f7fbf0] px-4 pb-6 pt-4">
				<Pressable
					onPress={() => router.push("/addNewAddress")}
					className="flex-row items-center justify-center gap-2 rounded-xl bg-[#2e7d32] py-4"
					accessibilityRole="button"
					accessibilityLabel="Add new address"
				>
					<Ionicons name="add-circle-outline" size={20} color="white" />
					<Text className="text-[16px] font-bold text-white">Add New Address</Text>
				</Pressable>
			</View>

			<Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
				<View className="flex-1 items-center justify-center bg-black/45 px-6">
					<View
						className="w-full max-w-[360px] overflow-hidden rounded-[24px] border border-[#bfcaba] bg-[#f7fbf0] p-5 shadow-2xl"
						style={{ elevation: 12 }}
					>
						<View className="mb-4 flex-row items-center gap-3">
							<View className="h-12 w-12 items-center justify-center rounded-full bg-[#ffd9e2]">
								<Ionicons name="trash-outline" size={22} color="#ba1a1a" />
							</View>
							<View className="flex-1">
								<Text className="text-[20px] font-bold text-slate-900">Delete address</Text>
								<Text className="mt-1 text-[14px] leading-5 text-slate-600">
									Remove {deleteTarget?.title} from your saved addresses?
								</Text>
							</View>
						</View>

						<View className="flex-row justify-end gap-3 pt-2">
							<Pressable
								onPress={() => setDeleteTarget(null)}
								className="min-w-[92px] rounded-xl border border-[#bfcaba] bg-white px-4 py-3"
								accessibilityRole="button"
								accessibilityLabel="Cancel delete"
							>
								<Text className="text-center text-[14px] font-bold tracking-[1px] text-[#40493d]">CANCEL</Text>
							</Pressable>
							<Pressable
								onPress={confirmDelete}
								className="min-w-[92px] rounded-xl bg-[#2e7d32] px-4 py-3"
								accessibilityRole="button"
								accessibilityLabel="Confirm delete"
							>
								<Text className="text-center text-[14px] font-bold tracking-[1px] text-white">DELETE</Text>
							</Pressable>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
