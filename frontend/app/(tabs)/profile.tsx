import React, { useEffect, useRef } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";

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
      className={`flex-row items-center justify-between px-4 py-4 ${showDivider ? "border-t border-slate-200" : ""}`}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="flex-row items-center gap-4">
        <Ionicons name={icon} size={22} color="#15803d" />
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
      className={`flex-1 items-center justify-center py-2 ${divider ? "border-x border-slate-200" : ""}`}
    >
      <Text className="text-[24px] font-extrabold text-[#15803d]">{value}</Text>
      <Text className="mt-1 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">
        {label}
      </Text>
    </View>
  );
}

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isAuthReady, logout } = useAuth();
  const hasAttemptedAuth = useRef(false);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated && !hasAttemptedAuth.current) {
      hasAttemptedAuth.current = true;
      const timer = setTimeout(() => {
        if (!isAuthenticated) {
          router.push({ pathname: "/authPopUp", params: { returnTo: pathname } });
        }
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [isAuthReady, isAuthenticated, pathname, router]);

  if (!isAuthReady || !isAuthenticated) {
    return null;
  }

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API_BASE_URL}/api/auth/delete-user`, {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${user?.token}`
                }
              });

              const data = await res.json();
              if (res.ok) {
                Alert.alert("Success", "Your account has been deleted successfully.");
                logout();
                router.replace("/");
              } else {
                Alert.alert("Error", data.message || "Failed to delete account.");
              }
            } catch (err) {
              console.error(err);
              Alert.alert("Error", "An error occurred while deleting your account.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
        <View className="flex-row items-center gap-3">
          
          <Text className="text-[24px] ml-2 font-extrabold tracking-tight text-[#15803d]">
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
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 border border-slate-200 active:bg-slate-200"
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
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg shadow-slate-200/60">
              {user?.profileImage ? (
                <Image
                  source={{ uri: user.profileImage }}
                  className="h-24 w-24 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-3xl font-extrabold text-[#15803d]">
                  {user?.name?.[0] ?? "U"}
                </Text>
              )}
            </View>
          </View>

          <View className="mt-4 items-center">
            <Text className="text-[24px] font-extrabold text-slate-900">
              {user?.name ?? "My Profile"}
            </Text>
            <Text className="mt-1 text-[14px] text-slate-500">
              {user?.email ?? "No email available"}
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/editProfile")}
            className="mt-4 rounded-xl border border-[#15803d] px-5 py-2.5 bg-white active:opacity-95 shadow-sm"
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
          >
            <Text className="text-[12px] font-semibold uppercase tracking-wider text-[#15803d]">
              Edit Profile
            </Text>
          </Pressable>
        </View>

        <View className="mt-6 space-y-3">
          <Text className="px-1 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            Account Settings
          </Text>

          <View className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <MenuRow icon="bag-handle-outline" label="My Orders" />
            <MenuRow
              icon="location-outline"
              label="My Addresses"
              showDivider
              onPress={() => router.push("/myAddress")}
            />
            
          </View>

          <Text className="px-1 pt-2 text-[12px] font-bold uppercase tracking-wider text-slate-500">
            Preferences
          </Text>

          <View className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
              onPress={() => {
                logout();
                router.replace("/");
              }}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm active:bg-slate-50"
              accessibilityRole="button"
              accessibilityLabel="Logout"
            >
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text className="text-base font-bold text-red-600">Logout</Text>
            </Pressable>

            
          </View>

          <View className="pt-2 mt-3">
            <Pressable
              onPress={handleDeleteAccount}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm active:bg-slate-50"
              accessibilityRole="button"
              accessibilityLabel="Delete Account"
            >
              <Text className="text-base font-bold text-red-600">Delete Account</Text>
            </Pressable>

            
          </View>

          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
