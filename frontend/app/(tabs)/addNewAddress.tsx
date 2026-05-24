import React, { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AddressLabel, useAddresses } from "@/context/AddressContext";

type AddressChip = AddressLabel;

const chips: AddressChip[] = ["Home", "Office", "Parent's House", "Gym"];

export default function AddNewAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ addressId?: string }>();
  const { addresses, addAddress, updateAddress } = useAddresses();
  const editingAddress = params.addressId ? addresses.find((address) => address.id === params.addressId) : undefined;
  const isEditing = Boolean(editingAddress);

  const [selectedLabel, setSelectedLabel] = useState<AddressChip>("Home");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);

  useEffect(() => {
    if (!editingAddress) {
      return;
    }

    setSelectedLabel(editingAddress.label);
    setFullName(editingAddress.fullName);
    setPhone(editingAddress.phone);
    setStreet(editingAddress.street);
    setCity(editingAddress.city);
    setPostalCode(editingAddress.postalCode);
    setIsPrimary(editingAddress.isPrimary);
  }, [editingAddress]);

  const canSave = useMemo(
    () => fullName.trim().length > 0 && phone.trim().length > 0 && street.trim().length > 0 && city.trim().length > 0,
    [fullName, phone, street, city],
  );

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const payload = {
      label: selectedLabel,
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      postalCode: postalCode.trim(),
      isPrimary,
    };

    if (isEditing && editingAddress) {
      updateAddress(editingAddress.id, payload);
    } else {
      addAddress(payload);
    }

    requestAnimationFrame(() => {
      router.replace("/myAddress");
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]" edges={["top"]}>
      <View className="flex-row items-center border-b border-[#bfcaba] bg-[#f7fbf0] px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#0d631b" />
        </Pressable>
        <Text className="flex-1 text-[20px] font-bold text-[#0d631b]">
          {isEditing ? "Edit Address" : "Add New Address"}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons name="notifications-outline" size={22} color="#0d631b" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 22, paddingBottom: 180 }}
        >
          <View className="mb-6 overflow-hidden rounded-[22px] border border-[#bfcaba] bg-white shadow-sm" style={{ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 14, elevation: 3 }}>
            <View className="relative h-40 overflow-hidden bg-[#e5eadf]">
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-24 w-24 items-center justify-center rounded-full bg-[#bdefbe]">
                  <Ionicons name="location" size={34} color="#0d631b" />
                </View>
              </View>

              <View className="absolute bottom-3 right-3 flex-row items-center gap-2 rounded-xl border border-[#bfcaba] bg-white px-3 py-2 shadow-sm">
                <Ionicons name="navigate" size={16} color="#0d631b" />
                <Text className="text-[12px] font-bold text-[#0d631b]">Detect current location</Text>
              </View>
            </View>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="mb-3 ml-1 text-[12px] font-extrabold uppercase tracking-[1.4px] text-[#40493d]">
                Address Label
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
              {chips.map((chip) => {
                const active = chip === selectedLabel;
                return (
                  <Pressable
                    key={chip}
                    onPress={() => setSelectedLabel(chip)}
                    className={`rounded-full border px-4 py-2.5 ${active ? "border-[#0d631b] bg-[#0d631b]" : "border-[#bfcaba] bg-white"}`}
                    accessibilityRole="button"
                    accessibilityLabel={chip}
                  >
                    <Text className={`text-[12px] font-bold ${active ? "text-white" : "text-[#40493d]"}`}>
                      {chip}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            </View>
             <View className="space-y-100   pt-5">
            <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
           </View>
            <InputField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="+1 (555) 000-0000"
              keyboardType="phone-pad"
              icon="call"
            />
            <InputField
              label="Street Address"
              value={street}
              onChangeText={setStreet}
              placeholder="Street name, building, apartment number"
              multiline
              numberOfLines={3}
            />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <InputField label="City/District" value={city} onChangeText={setCity} placeholder="e.g. Brooklyn" />
              </View>
              <View className="flex-1">
                <InputField label="Postal Code" value={postalCode} onChangeText={setPostalCode} placeholder="11201" />
              </View>
            </View>

            <View className="flex-row items-center justify-between rounded-[22px] border border-[#bfcaba] bg-[#f1f5eb] px-4 py-4">
              <View className="flex-row flex-1 items-center gap-3 pr-4">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#bdefbe]">
                  <Ionicons name="star" size={20} color="#24502c" />
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold text-[#181d17]">Set as Primary</Text>
                  <Text className="mt-1 text-[12px] leading-4 text-[#40493d]">Use this as default for future orders</Text>
                </View>
              </View>

              <Pressable
                onPress={() => setIsPrimary((value) => !value)}
                className={`h-8 w-14 rounded-full border p-0.5 ${isPrimary ? "border-[#0d631b] bg-[#0d631b]" : "border-[#bfcaba] bg-[#d7dbd2]"}`}
                accessibilityRole="switch"
                accessibilityState={{ checked: isPrimary }}
                accessibilityLabel="Set as primary"
              >
                <View className={`h-7 w-7 rounded-full bg-white ${isPrimary ? "ml-auto" : "ml-0"}`} />
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="absolute left-4 right-4 rounded-2xl border border-[#bfcaba] bg-[#f7fbf0] px-4 pb-4 pt-4 shadow-lg" style={{ bottom: 112, elevation: 6, zIndex: 20 }}>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-xl py-4 ${canSave ? "bg-[#2e7d32]" : "bg-[#8fb494]"}`}
          accessibilityRole="button"
          accessibilityLabel="Save address"
        >
          <Text className="text-center text-[16px] font-bold text-white">
            {isEditing ? "Update Address" : "Save Address"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  numberOfLines,
  keyboardType,
  icon,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: React.ComponentProps<typeof TextInput>["keyboardType"];
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 ml-1 text-[12px] font-extrabold uppercase tracking-[1.4px] text-[#40493d]">{label}</Text>
      <View className="relative">
        {icon ? (
          <View className="absolute left-4 top-0 z-10 h-full justify-center">
            <Ionicons name={icon} size={20} color="#40493d" />
          </View>
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          textAlignVertical={multiline ? "top" : "center"}
          className={`rounded-xl border border-[#bfcaba] bg-white px-4 py-3 text-[14px] text-[#181d17] shadow-sm ${icon ? "pl-11" : ""} ${multiline ? "min-h-[88px]" : ""}`}
          placeholderTextColor="#707a6c"
          style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}
        />
      </View>
    </View>
  );
}
