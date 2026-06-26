import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth, API_BASE_URL } from "../src/context/AuthContext";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  orderId?: string;
  isRead: boolean;
  createdAt: string;
}

function NotificationItem({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  isRead,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  isRead: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className={`flex-row gap-4 rounded-xl p-2.5 active:bg-[#f1f5eb] border-l-4 ${
        isRead ? 'border-l-transparent' : 'border-l-green-600 bg-green-50/20'
      }`}
      onPress={onPress}
      accessibilityRole="button"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1 justify-center">
        <Text className={`text-[15px] ${isRead ? 'font-medium text-slate-600' : 'font-bold text-slate-900'}`}>{title}</Text>
        <Text className="mt-1 text-[13px] text-slate-500 leading-snug">{description}</Text>
      </View>
      {!isRead && (
        <View className="h-2 w-2 rounded-full bg-green-600 self-center" />
      )}
    </Pressable>
  );
}

export default function NotificationPop() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const closeNotifications = () => {
    router.back();
  };

  const fetchNotifications = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/user`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching user notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/user/read-all`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all read:", error);
    }
  };

  const handleMarkRead = async (id: string) => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/user/${id}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      }
    } catch (error) {
      console.error("Error marking notification read:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

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
                {notifications.some(n => !n.isRead) && (
                  <Pressable onPress={handleMarkAllRead} accessibilityRole="button" accessibilityLabel="Mark all read">
                    <Text className="text-[12px] font-bold text-[#0d631b]">Mark all read</Text>
                  </Pressable>
                )}
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
                {loading ? (
                  <View className="py-20 justify-center items-center">
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text className="mt-3 text-slate-500 text-sm font-medium">Loading notifications...</Text>
                  </View>
                ) : notifications.length === 0 ? (
                  <View className="py-20 justify-center items-center px-6 text-center">
                    <View className="h-14 w-14 items-center justify-center rounded-full bg-slate-50 border border-slate-100 mb-4">
                      <Ionicons name="notifications-off-outline" size={28} color="#94a3b8" />
                    </View>
                    <Text className="text-[16px] font-semibold text-slate-900">No Notifications</Text>
                    <Text className="mt-1 text-[13px] text-slate-500 text-center">
                      We will notify you when your orders or status updates require attention.
                    </Text>
                  </View>
                ) : (
                  <ScrollView className="max-h-[420px]" contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
                    {notifications.map((notification) => {
                      const isOrderNotification = notification.type === 'NEW_ORDER' || notification.title.toLowerCase().includes('order');
                      return (
                        <NotificationItem
                          key={notification.id}
                          icon={isOrderNotification ? "cart-outline" : "notifications-outline"}
                          iconBg={notification.isRead ? "#f1f5f0" : "#bdefbe"}
                          iconColor={notification.isRead ? "#64748b" : "#2e7d32"}
                          title={notification.title}
                          description={notification.message}
                          isRead={notification.isRead}
                          onPress={async () => {
                            await handleMarkRead(notification.id);
                            closeNotifications();
                            if (notification.orderId) {
                              router.push({
                                pathname: "/myOrders",
                                params: { orderId: notification.orderId }
                              });
                            } else {
                              router.push("/myOrders");
                            }
                          }}
                        />
                      );
                    })}
                  </ScrollView>
                )}

                <View className="border-t border-[#bfcaba] p-4">
                  <Pressable
                    onPress={closeNotifications}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                    className="rounded-xl bg-[#2e7d32] py-4"
                  >
                    <Text className="text-center text-[16px] font-bold text-white">Close</Text>
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