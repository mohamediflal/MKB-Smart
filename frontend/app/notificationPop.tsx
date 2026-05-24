import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";

function NotificationItem({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}) {
  return (
    <Pressable className="flex-row gap-4 rounded-xl p-2 active:bg-[#f1f5eb]" accessibilityRole="button">
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-[16px] font-semibold text-slate-900">{title}</Text>
        <Text className="mt-1 text-[14px] text-slate-500">{description}</Text>
      </View>
    </Pressable>
  );
}

export default function NotificationPop() {
  const navigation = useNavigation<any>();
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = typeof params.returnTo === "string" && params.returnTo.length > 0 ? params.returnTo : "/";
  const closeNotifications = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }

    router.replace(returnTo as never);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeNotifications} statusBarTranslucent>
      <SafeAreaView className="flex-1 bg-transparent" edges={[]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          className="bg-black/50"
          onPress={closeNotifications}
          accessibilityRole="button"
          accessibilityLabel="Close notifications"
        />

        <View className="flex-1 items-center justify-center px-4" style={{ zIndex: 1 }}>
          <View className="w-full max-w-md overflow-hidden rounded-2xl bg-[#f7fbf0] shadow-2xl" style={{ elevation: 10 }}>
            <View className="flex-row items-center justify-between border-b border-[#bfcaba] bg-[#f7fbf0] px-4 py-3">
              <Pressable
                onPress={closeNotifications}
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
              >
                <Ionicons name="arrow-back" size={22} color="#0d631b" />
              </Pressable>

              <View className="flex-row items-center gap-3">
                <Text className="text-[20px] font-bold text-slate-900">Notifications</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Mark all read">
                  <Text className="text-[12px] font-bold text-[#0d631b]">Mark all read</Text>
                </Pressable>
              </View>

              <Pressable
                onPress={closeNotifications}
                className="h-10 w-10 items-center justify-center rounded-full bg-white"
                accessibilityRole="button"
                accessibilityLabel="Close notifications"
              >
                <Ionicons name="close" size={22} color="#40493d" />
              </Pressable>
            </View>

            <View className="px-4 py-4">
              <View className="overflow-hidden rounded-2xl bg-white shadow-sm" style={{ shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 18, elevation: 5 }}>
                <ScrollView className="max-h-[420px] flex-1" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
                  <NotificationItem
                    icon="car-outline"
                    iconBg="#bdefbe"
                    iconColor="#3c6842"
                    title="Order Out for Delivery"
                    description="Your grocery order #SFC-8821 is on its way."
                  />
                  <NotificationItem
                    icon="sparkles-outline"
                    iconBg="#2e7d32"
                    iconColor="#ffffff"
                    title="AI Smart Tip"
                    description="Try our 5-minute Banana Bread recipe!"
                  />
                  <NotificationItem
                    icon="pricetag-outline"
                    iconBg="#ffd9e2"
                    iconColor="#923357"
                    title="Weekly Offer"
                    description="20% Off Produce with code GREEN20."
                  />
                </ScrollView>

                <View className="border-t border-[#bfcaba] p-4">
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="View all notifications"
                    className="rounded-xl bg-[#2e7d32] py-4"
                  >
                    <Text className="text-center text-[16px] font-bold text-white">View All Notifications</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}