import React, { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LANGUAGE_STORAGE_KEY = "@mkb_app_language";

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag?: string;
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English (US)",
  },
  {
    code: "si",
    name: "Sinhala",
    nativeName: "සිංහල",
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
  },
];

export default function LanguageScreen() {
  const router = useRouter();
  const [selectedLang, setSelectedLang] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved) {
          setSelectedLang(saved);
        }
      } catch (e) {
        console.error("Error loading language preference:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelectLanguage = async (code: string) => {
    setSelectedLang(code);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    } catch (e) {
      console.error("Error saving language preference:", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center border-b border-slate-100 bg-white px-4 py-3 shadow-xs">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </Pressable>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-slate-900">Language</Text>
          <Text className="text-xs text-slate-500">Choose your preferred language</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 py-4"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-500">
          Available Languages
        </Text>

        <View className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLang === lang.code;
            const isLast = index === LANGUAGES.length - 1;

            return (
              <Pressable
                key={lang.code}
                onPress={() => handleSelectLanguage(lang.code)}
                className={`flex-row items-center justify-between p-4 active:bg-slate-50 ${
                  !isLast ? "border-b border-slate-100" : ""
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Select ${lang.name}`}
              >
                <View className="flex-1">
                  <Text className={`text-base ${isSelected ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>
                    {lang.name}
                  </Text>
                  <Text className="mt-0.5 text-xs text-slate-400">
                    {lang.nativeName}
                  </Text>
                </View>

                <View className="ml-3">
                  {isSelected ? (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-[#15803d]">
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                    </View>
                  ) : (
                    <View className="h-6 w-6 rounded-full border-2 border-slate-300" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="information-circle-outline" size={20} color="#15803d" />
            <Text className="text-sm font-semibold text-emerald-950">App Localization</Text>
          </View>
          <Text className="mt-1 text-xs leading-relaxed text-emerald-800">
            Selecting a language updates your app interface preferences. New translations will automatically apply as they become available.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
