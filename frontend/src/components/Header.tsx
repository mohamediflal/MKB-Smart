import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAddresses } from "@/context/AddressContext";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";
import { useIsFocused } from "@react-navigation/native";

export default function Header({ onNotificationsPress }: { onNotificationsPress?: () => void }) {
  const { addresses } = useAddresses();
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [unreadCount, setUnreadCount] = useState(0);

  const primaryAddress = addresses.find((address) => address.isPrimary);
  const locationText = primaryAddress
    ? primaryAddress.street
    : "Add a delivery address";

  const fetchUnreadCount = async () => {
    if (!user?.token) {
      setUnreadCount(0);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/user`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const unread = (data.notifications || []).filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
    }
  };

  useEffect(() => {
    if (isFocused && user?.token) {
      fetchUnreadCount();
    } else if (!user?.token) {
      setUnreadCount(0);
    }
  }, [isFocused, user]);

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
            <Text className="text-sm font-semibold text-slate-900" numberOfLines={1}>
              {locationText}
            </Text>
            {/* <Ionicons name="chevron-down" size={18} color="black" /> */}
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onNotificationsPress}
        className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 relative"
        accessibilityRole="button"
        accessibilityLabel="Notifications"
      >
        <Ionicons name="notifications-outline" size={22} color="black" />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 border border-white">
            <Text className="text-[10px] font-bold text-white text-center">
              {unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}