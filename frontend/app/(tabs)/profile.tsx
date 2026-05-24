import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";

function MenuRow({
  icon,
  label,
  value,
  showDivider,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  showDivider?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between px-4 py-4 ${showDivider ? "border-t border-[#bfcaba]" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="flex-row items-center gap-4">
        <Ionicons name={icon} size={22} color="#0d631b" />
        <Text className="text-base text-slate-900">{label}</Text>
      </View>

      {value ? (
        <View className="flex-row items-center gap-2">
          <Text className="text-sm text-slate-500">{value}</Text>
          <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      )}
    </Pressable>
  );
}

function StatsItem({
  value,
  label,
  divider,
}: {
  value: string;
  label: string;
  divider?: boolean;
}) {
  return (
    <View
      className={`flex-1 items-center justify-center py-2 ${divider ? "border-x border-[#bfcaba]" : ""}`}
    >
      <Text className="text-[24px] font-extrabold text-[#0d631b]">{value}</Text>
      <Text className="mt-1 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">
        {label}
      </Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <SafeAreaView className="flex-1 bg-[#f7fbf0]" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-[#bfcaba] bg-[#f7fbf0] px-4 py-3">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-white border border-[#bfcaba]">
            <Ionicons name="menu" size={22} color="#0d631b" />
          </View>
          <Text className="text-[24px] font-extrabold text-[#0d631b]">
            MKB-Smart
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push({
              pathname: "/notificationPop",
              params: { returnTo: pathname },
            })
          }
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="h-10 w-10 items-center justify-center rounded-full bg-white border border-[#bfcaba]"
        >
          <Ionicons name="notifications-outline" size={22} color="#40493d" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 20,
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
      >
        <View className="items-center">
          <View className="relative">
            <View className="h-24 w-24 overflow-hidden rounded-full border-2 border-[#a3f69c] bg-white shadow-sm items-center justify-center">
              <Text className="text-3xl font-extrabold text-[#0d631b]">A</Text>
            </View>

            {/*<Pressable
							className="absolute -bottom-1 -right-1 h-9 w-9 items-center justify-center rounded-full bg-[#0d631b] shadow-md"
							accessibilityRole="button"
							accessibilityLabel="Edit profile photo"
						>
							<Ionicons name="pencil" size={16} color="white" />
						</Pressable>*/}
          </View>

          <View className="mt-4 items-center">
            <Text className="text-[24px] font-extrabold text-slate-900">
              Alexander Bennett
            </Text>
            <Text className="mt-1 text-[14px] text-slate-500">
              alex.bennett@smartfood.city
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/editProfile")}
            className="mt-4 rounded-xl border border-[#0d631b] px-5 py-2.5"
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text className="text-[12px] font-bold uppercase tracking-wider text-[#0d631b]">
              Edit Profile
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 flex-row overflow-hidden rounded-xl border border-[#bfcaba] bg-white">
          <StatsItem value="124" label="Total Orders" />
          <StatsItem value="42" label="Saved Items" divider />
          <StatsItem value="18" label="Reviews" />
        </View>

        <View className="mt-6 space-y-3">
          <Text className="px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            Account Settings
          </Text>

          <View className="overflow-hidden rounded-xl border border-[#bfcaba] bg-white">
            <MenuRow icon="bag-handle-outline" label="My Orders" />
            <MenuRow
              icon="location-outline"
              label="My Addresses"
              showDivider
              onPress={() => router.push("/myAddress")}
            />
            <MenuRow icon="card-outline" label="Payment Methods" showDivider />
          </View>

          <Text className="px-1 pt-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            Preferences
          </Text>

          <View className="overflow-hidden rounded-xl border border-[#bfcaba] bg-white">
            <MenuRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() =>
                router.push({
                  pathname: "/notificationPop",
                  params: { returnTo: pathname },
                })
              }
            />
            <MenuRow
              icon="language-outline"
              label="Language"
              value="English"
              showDivider
            />
            <MenuRow
              icon="help-circle-outline"
              label="Help Center"
              showDivider
            />
          </View>

          <View className="pt-2">
            <Pressable
              className="flex-row items-center justify-center gap-2 rounded-xl border border-[#bfcaba] bg-white px-4 py-4"
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text className="text-base font-bold text-red-600">Logout</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
