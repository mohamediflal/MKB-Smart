import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// i18n Dictionary for Assistant States (English, expandable to Sinhala/Tamil)
const I18N_LABELS = {
  idleTitle: "AI Voice Shopping",
  idleSubtitle: "Add by Voice",
  listeningTitle: "Listening...",
  listeningSubtitle: "Add products using your voice",
  processingTitle: "Processing...",
  completedTitle: "Voice Command Recognized",
  errorPermission: "Microphone permission denied",
  errorUnavailable: "Voice recognition unavailable",
};

export type VoiceState = "idle" | "listening" | "processing" | "completed" | "error";

interface AIVoiceShoppingAssistantProps {
  onRecognizedText?: (text: string) => void;
}

export function AIVoiceShoppingAssistant({ onRecognizedText }: AIVoiceShoppingAssistantProps) {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Web speech recognition reference
  const recognitionRef = useRef<any>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wave1Anim = useRef(new Animated.Value(0)).current;
  const wave2Anim = useRef(new Animated.Value(0)).current;
  const micBounceAnim = useRef(new Animated.Value(1)).current;

  // Concentric wave ripple animation & mic bounce for "listening" state
  useEffect(() => {
    let waveLoop: Animated.CompositeAnimation | null = null;
    let pulseLoop: Animated.CompositeAnimation | null = null;
    let micLoop: Animated.CompositeAnimation | null = null;

    if (voiceState === "listening") {
      // Core button pulse animation
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.12,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Mic icon subtle bounce animation
      micLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(micBounceAnim, {
            toValue: 1.2,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(micBounceAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      micLoop.start();

      // Concentric wave 1 & 2 ripples
      wave1Anim.setValue(0);
      wave2Anim.setValue(0);

      waveLoop = Animated.loop(
        Animated.parallel([
          Animated.timing(wave1Anim, {
            toValue: 1,
            duration: 1600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(wave2Anim, {
            toValue: 1,
            duration: 1600,
            delay: 450,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      waveLoop.start();
    } else {
      pulseAnim.setValue(1);
      micBounceAnim.setValue(1);
      wave1Anim.setValue(0);
      wave2Anim.setValue(0);
    }

    return () => {
      pulseLoop?.stop();
      micLoop?.stop();
      waveLoop?.stop();
    };
  }, [voiceState]);

  // Speech Recognition trigger
  const startListening = () => {
    setErrorMessage("");
    setRecognizedText("");
    setVoiceState("listening");

    // Check Web Speech API availability (for web environment)
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = "en-US";

          recognition.onstart = () => {
            setVoiceState("listening");
          };

          recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            setRecognizedText(transcript);
            if (event.results[0]?.isFinal) {
              handleRecognitionComplete(transcript);
            }
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
              setErrorMessage(I18N_LABELS.errorPermission);
            } else {
              setErrorMessage(I18N_LABELS.errorUnavailable);
            }
            setVoiceState("error");
          };

          recognition.onend = () => {
            if (voiceState === "listening") {
              setVoiceState("processing");
              setTimeout(() => {
                setVoiceState("completed");
              }, 800);
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch (e) {
          console.warn("Web Speech API error, falling back:", e);
        }
      }
    }

    // Mobile / Native simulation for voice commands
    simulateVoiceInput();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (voiceState === "listening") {
      setVoiceState("processing");
      setTimeout(() => {
        setVoiceState("completed");
      }, 800);
    }
  };

  const simulateVoiceInput = () => {
    // Sample product addition voice commands
    const sampleCommands = [
      "Add 2 kg Basmati Rice to my cart",
      "Add 1 L Fresh Milk",
      "Add 5 red apples to my cart",
      "Add 1 kg Chicken Curry cut",
      "Add 2 packs of noodles",
    ];

    const randomCommand = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];

    let currentText = "";
    const words = randomCommand.split(" ");
    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        currentText += (index === 0 ? "" : " ") + words[index];
        setRecognizedText(currentText);
        index++;
      } else {
        clearInterval(interval);
        setVoiceState("processing");
        setTimeout(() => {
          handleRecognitionComplete(randomCommand);
        }, 700);
      }
    }, 320);
  };

  const handleRecognitionComplete = (text: string) => {
    setRecognizedText(text);
    setVoiceState("completed");
    if (onRecognizedText) {
      onRecognizedText(text);
    }
  };

  const handlePress = () => {
    if (voiceState === "idle" || voiceState === "completed" || voiceState === "error") {
      startListening();
    } else if (voiceState === "listening") {
      stopListening();
    }
  };

  // Interpolate wave animations for expanding rings
  const wave1Scale = wave1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const wave1Opacity = wave1Anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  const wave2Scale = wave2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.3],
  });
  const wave2Opacity = wave2Anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.65, 0.35, 0],
  });

  return (
    <View className="items-end">
      {/* Floating Status / Recognized Text Popup */}
      {voiceState !== "idle" && (
        <View className="mb-2.5 bg-slate-900/95 border border-slate-700/80 rounded-2xl px-4 py-3 shadow-2xl max-w-[290px]">
          {voiceState === "listening" && (
            <View className="gap-1">
              <View className="flex-row items-center gap-2">
                <View className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                <Text className="text-xs font-extrabold text-emerald-400">
                  🎤 {I18N_LABELS.listeningTitle}
                </Text>
              </View>
              <Text className="text-[11px] font-medium text-slate-300">
                {I18N_LABELS.listeningSubtitle}
              </Text>
              {recognizedText !== "" && (
                <Text className="text-xs font-semibold text-white mt-1 italic bg-slate-800/80 p-2 rounded-xl border border-slate-700/60" numberOfLines={2}>
                  "{recognizedText}"
                </Text>
              )}
            </View>
          )}

          {voiceState === "processing" && (
            <View className="flex-row items-center gap-2.5 py-0.5">
              <ActivityIndicator size="small" color="#34d399" />
              <Text className="text-xs font-bold text-emerald-300">
                {I18N_LABELS.processingTitle}
              </Text>
            </View>
          )}

          {voiceState === "completed" && (
            <View className="gap-1.5">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="checkmark-circle" size={14} color="#34d399" />
                  <Text className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    {I18N_LABELS.completedTitle}
                  </Text>
                </View>
                <Pressable onPress={() => setVoiceState("idle")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </Pressable>
              </View>
              <Text className="text-xs font-bold text-white bg-slate-800/90 p-2.5 rounded-xl border border-slate-700/80" numberOfLines={2}>
                "{recognizedText}"
              </Text>
            </View>
          )}

          {voiceState === "error" && (
            <View className="gap-1">
              <Text className="text-xs font-bold text-rose-400">
                {errorMessage || I18N_LABELS.errorUnavailable}
              </Text>
              <Pressable onPress={startListening}>
                <Text className="text-[11px] font-bold text-white underline mt-0.5">
                  Tap to retry
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Main AI Voice Agent Capsule Container */}
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel="AI Voice Shopping Assistant - Add products using your voice"
        className="flex-row items-center gap-2.5 active:opacity-90"
      >
        {/* Left Floating Badge: Clearly identifies AI Voice Shopping functionality */}
        {voiceState === "idle" && (
          <View className="bg-white/95 border border-slate-200/90 rounded-2xl py-2 px-3.5 shadow-md flex-col items-end">
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={11} color="#0d631b" />
              <Text className="text-xs font-extrabold text-slate-900 tracking-tight">
                {I18N_LABELS.idleTitle}
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-[#0d631b]">
              {I18N_LABELS.idleSubtitle}
            </Text>
          </View>
        )}

        {/* Circular Floating AI Agent Button with Concentric Wave Animations */}
        <View className="relative items-center justify-center">
          {/* Ripple Wave Ring 1 */}
          {voiceState === "listening" && (
            <Animated.View
              style={{
                position: "absolute",
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#0d631b",
                transform: [{ scale: wave1Scale }],
                opacity: wave1Opacity,
              }}
            />
          )}

          {/* Ripple Wave Ring 2 */}
          {voiceState === "listening" && (
            <Animated.View
              style={{
                position: "absolute",
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "#15803d",
                transform: [{ scale: wave2Scale }],
                opacity: wave2Opacity,
              }}
            />
          )}

          {/* Core Circular AI Agent Button */}
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View
              className={`h-14 w-14 items-center justify-center rounded-full bg-[#0d631b] border-2 shadow-xl ${
                voiceState === "listening"
                  ? "border-emerald-300"
                  : "border-white"
              }`}
              style={{
                elevation: 8,
                shadowColor: voiceState === "listening" ? "#10b981" : "#0d631b",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
              }}
            >
              {/* Microphone Icon with listening animation */}
              <Animated.View style={{ transform: [{ scale: micBounceAnim }] }}>
                {voiceState === "listening" ? (
                  <Ionicons name="mic" size={26} color="#ffffff" />
                ) : voiceState === "processing" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : voiceState === "completed" ? (
                  <Ionicons name="sparkles" size={24} color="#ffffff" />
                ) : (
                  <Ionicons name="mic-outline" size={24} color="#ffffff" />
                )}
              </Animated.View>

              {/* Prominent Overlaid AI Sparkle Symbol Badge */}
              <View className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-400 border border-white items-center justify-center shadow-xs">
                <Ionicons name="sparkles" size={10} color="#000000" />
              </View>
            </View>
          </Animated.View>
        </View>
      </Pressable>
    </View>
  );
}
