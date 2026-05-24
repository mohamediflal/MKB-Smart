import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header({ onNotificationsPress }: { onNotificationsPress?: () => void }) {
  return (
    <View className="flex-row items-center justify-between bg-white px-4 py-3">
      <Pressable
        className="flex-row items-center"
        accessibilityRole="button"
        accessibilityLabel="Change delivery location"
      >
        <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="location-outline" size={22} color="black" />
        </View>

        <View>
          <Text className="text-xs font-semibold tracking-wide text-slate-500">
            DELIVER TO
          </Text>
          <View className="flex-row items-center">
            <Text className="text-sm font-semibold text-slate-900">
              Badulla, 2nd mile
            </Text>
            <Ionicons name="chevron-down" size={18} color="black" />
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onNotificationsPress}
        className="h-11 w-11 items-center justify-center rounded-full bg-slate-100"
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={22} color="black" />
      </Pressable>
    </View>
  );
}