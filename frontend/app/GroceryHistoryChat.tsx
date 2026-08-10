import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChatMessage = {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  isError?: boolean;
  // YouTube recommendation (safe search URL — never an invented video ID)
  youtubeSearchUrl?: string;
  youtubeLabel?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Build the enriched cooking prompt sent to the AI.
 * The visible USER bubble shows only the card title;
 * the AI receives a more detailed prompt so it knows to explain cooking steps.
 */
function buildCookingPrompt(recipeTitle: string): string {
  return (
    `I want to cook: ${recipeTitle}.\n\n` +
    `Please give me complete, beginner-friendly, step-by-step cooking instructions for this recipe.\n\n` +
    `Structure your response exactly like this:\n` +
    `🍳 Recipe name and number of people\n` +
    `⏱ Estimated total cooking time\n` +
    `🥘 Ingredients with exact quantities scaled for the number of people mentioned\n` +
    `👨‍🍳 Step-by-step instructions — each step clearly titled and numbered\n` +
    `✅ A few beginner tips at the end\n\n` +
    `Important:\n` +
    `- Use simple everyday language. Assume I have never cooked this before.\n` +
    `- For each step, tell me what to do, which ingredient to use, how much, what heat level, how long to cook, and what I should see/smell/feel to know it is ready.\n` +
    `- Scale the ingredient quantities correctly for the number of people in the title.\n` +
    `- For meat or poultry, include a food safety check (e.g. no pink inside, juices run clear).`
  );
}

/**
 * Returns a guaranteed-real YouTube search URL for the recipe.
 * Strips quantity phrases like "for 10 People" so the search focuses on the dish name.
 * NEVER invents video IDs — always uses youtube.com/results?search_query=...
 */
function buildYouTubeSearchUrl(recipeTitle: string): string {
  const baseName = recipeTitle
    .replace(/\bfor\s+\d+\s*(people|persons|servings|pax|person)?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const query = encodeURIComponent(`${baseName} recipe step by step cooking tutorial`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/** Returns a short display label for the YouTube card. */
function buildYouTubeLabel(recipeTitle: string): string {
  const baseName = recipeTitle
    .replace(/\bfor\s+\d+\s*(people|persons|servings|pax|person)?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return `${baseName} – Step-by-Step Cooking Tutorial`;
}

/**
 * Returns true when the user's message is asking for a video.
 * Used to attach a YouTube card to follow-up AI replies.
 */
function isVideoRequest(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("video") ||
    lower.includes("youtube") ||
    lower.includes("tutorial") ||
    lower.includes("watch") ||
    lower.includes("show me")
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GroceryHistoryChat() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipeTitle?: string }>();

  // The recipe title passed from the Recent Recipes card click.
  // Empty when opened without a selected recipe (never fall back to a hardcoded recipe).
  const selectedRecipeTitle = params.recipeTitle?.trim() || "";

  const scrollViewRef = useRef<ScrollView>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Guard: fire the automatic first AI request only once, even if component re-renders
  const initSentRef = useRef(false);

  // Pulse animation for typing indicator
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  // Separate pulse animation for the microphone button
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  // ── Pulse animation (typing indicator) ──────────────────────────────────────

  useEffect(() => {
    if (isTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0.3);
    }
  }, [isTyping]);

  // ── Pulse animation (microphone button) ──────────────────────────────────────

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulseAnim.stopAnimation();
      micPulseAnim.setValue(1);
    }
  }, [isListening]);

  // ── Scroll helper ────────────────────────────────────────────────────────────

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // ── Core AI request ──────────────────────────────────────────────────────────

  /**
   * Sends `userText` to the real AI backend (/api/ai/chat) and appends the
   * AI reply as an agent message.  `historySnapshot` is the conversation so
   * far (excluding `userText`) so the AI retains full context.
   */
  const sendToAI = async (
    userText: string,
    historySnapshot: ChatMessage[],
    // Optional YouTube search URL + label to attach to this AI reply
    youtubeSearchUrl?: string,
    youtubeLabel?: string
  ): Promise<void> => {
    setIsTyping(true);
    scrollToBottom();

    // Abort the request after 55 s so the loading indicator never hangs forever.
    // (The backend itself times out at 45 s, so this is a safety net.)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: userText,
          // Pass conversation history so the AI remembers the selected recipe
          history: historySnapshot.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.reply) {
          const agentMsg: ChatMessage = {
            id: `agent-${Date.now()}`,
            sender: "agent",
            text: data.reply,
            timestamp: nowTime(),
            // Attach the YouTube card if one was requested for this reply
            youtubeSearchUrl,
            youtubeLabel,
          };
          setMessages((prev) => [...prev, agentMsg]);
          setIsTyping(false);
          scrollToBottom();
          return;
        }
      }

      // HTTP-level error
      throw new Error("AI service returned an unsuccessful response.");
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn("AI Chat request failed:", err);

      const isTimeout = err?.name === "AbortError" || err?.message?.includes("timed out");
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: "agent",
        text: isTimeout
          ? "The AI is taking too long to respond. Please try again in a moment."
          : "Sorry, I couldn't generate the cooking instructions right now. Please try again.",
        timestamp: nowTime(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setIsTyping(false);
      scrollToBottom();
    }
  };


  // ── Automatic first message on mount ─────────────────────────────────────────

  useEffect(() => {
    // Prevent duplicate auto-requests on re-render / fast-refresh
    if (initSentRef.current) return;
    initSentRef.current = true;

    // No recipe was passed in (e.g. deep link). Do NOT auto-send a made-up recipe.
    if (!selectedRecipeTitle) {
      return;
    }

    // Show the card title as the first USER message (visible on the RIGHT)
    const firstUserMsg: ChatMessage = {
      id: "auto-user-1",
      sender: "user",
      text: selectedRecipeTitle,
      timestamp: nowTime(),
    };

    setMessages([firstUserMsg]);

    // Build a detailed cooking prompt and send it to the real AI.
    // The user sees the card title; the AI receives a richer cooking prompt.
    // Always attach a YouTube search card to the first (recipe) response.
    const cookingPrompt = buildCookingPrompt(selectedRecipeTitle);
    sendToAI(
      cookingPrompt,
      [firstUserMsg],
      buildYouTubeSearchUrl(selectedRecipeTitle),
      buildYouTubeLabel(selectedRecipeTitle)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual send (follow-up questions) ─────────────────────────────────────────

  const handleSend = () => {
    const text = inputMessage.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: nowTime(),
    };

    // If the user is explicitly asking for a video, attach the YouTube card to the reply.
    const wantsVideo = isVideoRequest(text);
    const ytUrl = wantsVideo && selectedRecipeTitle
      ? buildYouTubeSearchUrl(selectedRecipeTitle)
      : undefined;
    const ytLabel = wantsVideo && selectedRecipeTitle
      ? buildYouTubeLabel(selectedRecipeTitle)
      : undefined;

    setMessages((prev) => {
      // Send with the history BEFORE this new message; the backend appends the
      // current message itself, so passing it again would duplicate it.
      sendToAI(text, prev, ytUrl, ytLabel);
      return [...prev, userMsg];
    });
    setInputMessage("");
    scrollToBottom();
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-[#fcfdfa]" edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View className="flex-row items-center justify-between px-4 py-3.5 border-b border-[#e1e5dd] bg-white">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-9 w-9 items-center justify-center rounded-full bg-[#f4f7f4] active:bg-slate-100 border border-slate-200"
          >
            <Ionicons name="chevron-back" size={22} color="#0d631b" />
          </Pressable>

          <View className="flex-row items-center gap-2.5">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#0d631b] border border-[#0d631b]/30">
              <Ionicons name="sparkles" size={20} color="#ffffff" />
            </View>
            <View>
              <View className="flex-row items-center gap-1.5">
                <Text className="text-[16px] font-bold text-[#0d631b] tracking-tight">
                  MKB Smart AI
                </Text>
                <View className="h-2 w-2 rounded-full bg-[#16a34a]" />
              </View>
              <Text
                className="text-[11px] font-semibold text-slate-500"
                numberOfLines={1}
              >
                {selectedRecipeTitle || "Cooking Assistant"}
              </Text>
            </View>
          </View>
        </View>

        <View className="h-9 w-9 items-center justify-center rounded-full bg-[#f4f7f4] border border-slate-200">
          <Ionicons name="restaurant-outline" size={18} color="#0d631b" />
        </View>
      </View>

      {/* ── Chat area ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {/* ── Empty state (no recipe passed in) ── */}
          {messages.length === 0 && !selectedRecipeTitle && !isTyping && (
            <View className="items-center justify-center py-14 px-6">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-[#0d631b]/10 border border-[#0d631b]/20 mb-4">
                <Ionicons name="restaurant-outline" size={30} color="#0d631b" />
              </View>
              <Text className="text-[16px] font-bold text-slate-900 text-center mb-2">
                Ask me how to cook anything
              </Text>
              <Text className="text-[13px] text-slate-500 text-center leading-5">
                Pick a recipe from Recent Recipes, or type a dish (e.g. "Chicken Curry for 10
                people") below and I'll guide you step by step.
              </Text>
            </View>
          )}

          {/* ── Messages ── */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <View
                key={msg.id}
                className={`mb-4 flex-row ${isUser ? "justify-end" : "justify-start"}`}
              >
                {/* AI avatar on LEFT */}
                {!isUser && (
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-[#0d631b] mr-2.5 mt-0.5 shadow-xs">
                    <Ionicons name="sparkles" size={15} color="white" />
                  </View>
                )}

                <View className={`max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                  <View
                    className={`p-4 rounded-2xl shadow-xs ${isUser
                      ? "bg-[#0d631b] rounded-tr-xs"
                      : msg.isError
                        ? "bg-rose-50 border border-rose-200 rounded-tl-xs"
                        : "bg-[#f0fdf4] border border-[#bbf7d0] rounded-tl-xs"
                      }`}
                  >
                    <Text
                      className={`text-[15px] leading-6 ${isUser
                        ? "text-white font-medium"
                        : msg.isError
                          ? "text-rose-700 font-medium"
                          : "text-slate-900 font-medium"
                        }`}
                    >
                      {msg.text}
                    </Text>

                    {/* ── YouTube recommendation card ── */}
                    {!isUser && msg.youtubeSearchUrl && (
                      <View className="mt-4 pt-3 border-t border-[#bbf7d0]">
                        <View className="flex-row items-center gap-1.5 mb-2">
                          <Ionicons name="logo-youtube" size={16} color="#dc2626" />
                          <Text className="text-[13px] font-bold text-slate-800">
                            📺 Watch a Video Tutorial
                          </Text>
                        </View>
                        <Text
                          className="text-[12px] text-slate-600 mb-3 leading-[18px]"
                          numberOfLines={2}
                        >
                          {msg.youtubeLabel}
                        </Text>
                        <Text className="text-[11px] text-slate-400 mb-2.5 leading-[16px]">
                          This video shows the cooking method. Your recipe quantities above are
                          already scaled for {selectedRecipeTitle.match(/\d+/)?.[0] || "your"} people.
                        </Text>
                        <Pressable
                          onPress={() => Linking.openURL(msg.youtubeSearchUrl!)}
                          className="flex-row items-center gap-2 self-start bg-[#dc2626] active:bg-[#b91c1c] px-4 py-2.5 rounded-xl shadow-sm"
                        >
                          <Ionicons name="play-circle" size={16} color="white" />
                          <Text className="text-[13px] font-bold text-white">
                            ▶ Watch on YouTube
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                  <Text className="text-[10px] font-medium text-slate-400 mt-1 px-1">
                    {msg.timestamp}
                  </Text>
                </View>
              </View>
            );
          })}

          {/* ── Typing / thinking indicator ── */}
          {isTyping && (
            <View className="flex-row items-center gap-2.5 mb-4">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-[#0d631b]">
                <Ionicons name="sparkles" size={15} color="white" />
              </View>
              <View className="p-3.5 rounded-2xl rounded-tl-xs bg-[#f0fdf4] border border-[#bbf7d0] flex-row items-center gap-1.5">
                <Animated.View
                  style={{ opacity: pulseAnim }}
                  className="h-2.5 w-2.5 rounded-full bg-[#0d631b]"
                />
                <Animated.View
                  style={{ opacity: pulseAnim }}
                  className="h-2.5 w-2.5 rounded-full bg-[#0d631b]"
                />
                <Animated.View
                  style={{ opacity: pulseAnim }}
                  className="h-2.5 w-2.5 rounded-full bg-[#0d631b]"
                />
                <Text className="text-[13px] text-[#0d631b] font-medium ml-1.5">
                  AI is thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Input bar ── */}
        <View className="px-4 pt-3 pb-2 bg-white border-t border-slate-200/60">
          {/* Pill row: text input + mic + send */}
          <View className="flex-row items-end rounded-3xl bg-[#f5f8f5] border border-[#0d631b]/20 px-3 py-2 gap-x-2">
            {/* Text field */}
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Ask a follow-up cooking question..."
              placeholderTextColor="#94a3b8"
              multiline
              style={{ flex: 1, fontSize: 15, color: "#0f172a", maxHeight: 96, paddingVertical: 6, lineHeight: 20 }}
            />

            {/* Thin vertical divider */}
            <View style={{ width: 1, height: 28, backgroundColor: "#d1fae5", alignSelf: "center", marginHorizontal: 2 }} />

            {/* Microphone button */}
            <Pressable
              onPress={() => setIsListening(prev => !prev)}
              accessibilityRole="button"
              accessibilityLabel={isListening ? "Stop voice input" : "Start voice input"}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Animated.View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isListening ? "#10B981" : "#ecfdf5",
                  transform: [{ scale: micPulseAnim }],
                  shadowColor: isListening ? "#10B981" : "transparent",
                  shadowOpacity: isListening ? 0.45 : 0,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: isListening ? 4 : 0,
                }}
              >
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={17}
                  color={isListening ? "#ffffff" : "#059669"}
                />
              </Animated.View>
            </Pressable>

            {/* Send button */}
            <Pressable
              onPress={handleSend}
              disabled={!inputMessage.trim() || isTyping}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: inputMessage.trim() && !isTyping ? "#0d631b" : "#e2e8f0",
              }}
            >
              <Ionicons
                name="arrow-up"
                size={18}
                color={inputMessage.trim() && !isTyping ? "#ffffff" : "#94a3b8"}
              />
            </Pressable>
          </View>

          {/* Disclaimer */}
          <Text style={{ fontSize: 10, textAlign: "center", color: "#a1a1aa", marginTop: 6 }}>
            MKB Smart AI can make mistakes. Verify cooking details before serving.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

