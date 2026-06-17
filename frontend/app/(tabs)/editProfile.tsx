import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";

const getBase64FromUri = async (uri: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
};

export default function EditProfile() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profileImage ?? null
  );
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>("image/jpeg");
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to change your profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log("[DEBUG Frontend] Image picked. URI:", asset.uri);
      
      let base64 = asset.base64;
      if (!base64) {
        console.log("[DEBUG Frontend] asset.base64 was missing, using fetch fallback...");
        try {
          base64 = await getBase64FromUri(asset.uri);
          console.log("[DEBUG Frontend] Fetch fallback success, base64 length:", base64.length);
        } catch (err) {
          console.error("[DEBUG Frontend] Fetch fallback failed:", err);
        }
      } else {
        console.log("[DEBUG Frontend] asset.base64 exists, length:", base64.length);
      }

      setProfileImage(asset.uri);
      setImageBase64(base64 ?? null);
      setImageMimeType(asset.mimeType ?? "image/jpeg");
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert("Validation", "Name cannot be empty.");
      return;
    }
    setIsSaving(true);
    try {
      // Build JSON body — base64 is reliable in React Native unlike FormData multipart
      const body: Record<string, string> = { name: fullName.trim() };
      if (imageBase64) {
        body.imageBase64 = imageBase64;
        body.imageMimeType = imageMimeType;
      }

      console.log("[DEBUG Frontend] Request body keys:", Object.keys(body));
      console.log("[DEBUG Frontend] Sending name:", body.name);
      console.log("[DEBUG Frontend] Sending imageBase64 length:", body.imageBase64 ? body.imageBase64.length : 0);

      const response = await fetch(`${API_BASE_URL}/api/auth/update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to update profile. Server returned status ${response.status}`);
      }

      // Update local AuthContext with new values from backend
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: data.user.name,
              profileImage: data.user.avatar || prev.profileImage,
            }
          : prev
      );

      Alert.alert(
        "Success",
        "Profile updated successfully.",
        [{ text: "OK", onPress: () => router.replace("/profile") }]
      );
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = (user?.name ?? "U")[0].toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm">
        <Pressable
          onPress={() => router.replace("/profile")}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#0f172a" />
        </Pressable>

        <Text className="absolute left-0 right-0 text-center text-[20px] font-extrabold tracking-tight text-slate-900">
          Edit Profile
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 32,
          paddingBottom: 120,
        }}
      >
        {/* Profile Photo */}
        <View className="items-center">
          <Pressable
            onPress={handlePickImage}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            className="relative"
          >
            <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-white shadow-lg shadow-slate-200/60">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="h-32 w-32 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-5xl font-extrabold text-[#15803d]">
                  {initials}
                </Text>
              )}
            </View>

            {/* Edit badge */}
            <View className="absolute bottom-1 right-1 h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-[#15803d] shadow-lg shadow-[#15803d]/30">
              <Ionicons name="pencil" size={18} color="white" />
            </View>
          </Pressable>

          <Pressable
            onPress={handlePickImage}
            className="mt-4"
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
          >
            <Text className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#15803d]">
              Change Profile Photo
            </Text>
          </Pressable>
        </View>

        {/* Full Name Field */}
        <View className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
          <Text className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-slate-600">
            Full Name
          </Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your name"
            placeholderTextColor="#94a3b8"
            className="h-12 rounded-xl border border-gray-200 bg-white px-4 text-[15px] text-slate-900 shadow-sm"
            selectionColor="#15803d"
            maxLength={60}
          />
        </View>

        {/* Save Button */}
        <View className="mt-8">
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            className="w-full rounded-2xl bg-[#15803d] py-4 px-6 shadow-md active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Save changes"
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-[18px] font-bold tracking-wide text-white">
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
