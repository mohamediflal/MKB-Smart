import React, { useState, useRef } from "react";
import {
  Alert,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Enable LayoutAnimation for Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Support Contact Constants
const SUPPORT_PHONE = "+94112345678";
const SUPPORT_PHONE_DISPLAY = "+94 11 234 5678";
const SUPPORT_WHATSAPP = "94771234567";
const SUPPORT_EMAIL = "support@mkbsmart.com";
const STORE_HOURS = "Daily: 8:00 AM – 10:00 PM";

interface GuideStep {
  step: number;
  title: string;
  desc: string;
}

interface QuickGuide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  steps: GuideStep[];
  actionRoute?: string;
  actionText?: string;
}

const QUICK_GUIDES: QuickGuide[] = [
  {
    id: "g1",
    title: "How to Place an Order",
    subtitle: "5 simple steps to get fresh groceries delivered to your doorstep",
    badge: "Essential",
    icon: "bag-check-outline",
    steps: [
      {
        step: 1,
        title: "Browse or Search",
        desc: "Find products via the Home feed, Categories, or search bar.",
      },
      {
        step: 2,
        title: "Choose Quantity & Add to Cart",
        desc: "Select the desired quantity (kg, pieces, or packs) and tap 'Add to Cart'.",
      },
      {
        step: 3,
        title: "Review Your Cart",
        desc: "Tap the Cart tab to review your item list, quantities, and subtotal.",
      },
      {
        step: 4,
        title: "Provide Delivery Address",
        desc: "Select an existing address or add a new delivery location.",
      },
      {
        step: 5,
        title: "Select Payment & Confirm",
        desc: "Choose Card (Stripe) or Cash on Delivery (COD) and tap 'Place Order'.",
      },
    ],
    actionRoute: "/(tabs)",
    actionText: "Start Shopping",
  },
  {
    id: "g2",
    title: "Using the Smart AI Assistant",
    subtitle: "Generate instant recipes and calculate grocery ingredients automatically",
    badge: "Smart Feature",
    icon: "sparkles-outline",
    steps: [
      {
        step: 1,
        title: "Navigate to the AI Tab",
        desc: "Tap the 'AI' icon in the bottom navigation bar.",
      },
      {
        step: 2,
        title: "Specify Recipe & Servings",
        desc: "Type a dish name (e.g. 'Chicken Biryani') and specify the number of people (or kg/L).",
      },
      {
        step: 3,
        title: "Calculate Ingredients",
        desc: "The AI instantly breaks down exact portions of vegetables, spices, and meats required.",
      },
      {
        step: 4,
        title: "Add All to Cart in One Tap",
        desc: "Review the ingredient list and tap 'Add to Cart' to shop everything immediately.",
      },
    ],
    actionRoute: "/(tabs)/ai",
    actionText: "Try AI Assistant",
  },
  {
    id: "g3",
    title: "Real-Time Order Tracking",
    subtitle: "Monitor order progress from preparation to doorstep delivery",
    badge: "Tracking",
    icon: "location-outline",
    steps: [
      {
        step: 1,
        title: "Go to My Orders",
        desc: "Open your Profile tab and select 'My Orders'.",
      },
      {
        step: 2,
        title: "Select Active Order",
        desc: "Tap on any order to view its status timeline.",
      },
      {
        step: 3,
        title: "Follow the Stages",
        desc: "Live statuses: Pending ➔ Processing ➔ Shipped ➔ Delivered.",
      },
    ],
    actionRoute: "/myOrders",
    actionText: "View My Orders",
  },
  {
    id: "g4",
    title: "Managing Saved Addresses",
    subtitle: "Save home, work, or other frequent delivery locations",
    badge: "Convenience",
    icon: "map-outline",
    steps: [
      {
        step: 1,
        title: "Access Address Book",
        desc: "Go to Profile ➔ My Addresses.",
      },
      {
        step: 2,
        title: "Add or Edit Addresses",
        desc: "Enter recipient name, contact number, street, city, and postal code.",
      },
      {
        step: 3,
        title: "Set Primary Address",
        desc: "Set your default address so checkouts are always pre-filled seamlessly.",
      },
    ],
    actionRoute: "/myAddress",
    actionText: "Manage Addresses",
  },
];

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  highlights?: string[];
  actionRoute?: string;
  actionText?: string;
}

const FAQ_ITEMS: FAQItem[] = [
  // 1. Placing an Order
  {
    id: "faq_order_1",
    category: "ordering",
    question: "How do I place an order for groceries?",
    answer:
      "Placing an order on MKB Smart is fast and effortless! Explore categories or search for specific items using the search bar. Tap on any item to view details, choose your preferred quantity, and add it to your cart. Once ready, head to your Cart, choose your delivery address, select a payment method (Card or Cash on Delivery), and confirm your order.",
    highlights: [
      "Select unit quantities (kg, grams, pieces)",
      "Instant order summary with delivery fee breakdown",
      "Real-time order confirmation",
    ],
    actionRoute: "/(tabs)",
    actionText: "Browse Groceries",
  },

  // 2. Order Cancellation
  {
    id: "faq_order_2",
    category: "ordering",
    question: "Can I cancel or modify an order after placing it?",
    answer:
      "Yes! You can cancel an order directly from the 'My Orders' screen as long as its status is still 'Pending'. Once the store begins processing and packing your groceries (status changes to 'Processing' or 'Shipped'), orders can no longer be self-cancelled. Please contact our support team immediately if you need urgent changes.",
    actionRoute: "/myOrders",
    actionText: "Check Order Status",
  },

  // 3. Smart AI Shopping Assistant
  {
    id: "faq_ai_1",
    category: "ai",
    question: "What is the MKB Smart AI Assistant and how do I use it?",
    answer:
      "Our AI Assistant is your personal smart chef and grocery planner. Located in the 'AI' tab, it allows you to ask for recipes based on the number of people (or total weight in kg/liters). The AI calculates the exact quantity of each ingredient needed and provides a one-tap button to add all matching store ingredients directly into your shopping cart!",
    highlights: [
      "Dynamic portion calculations based on guest count",
      "Saves past recipes in your Recipe History",
      "One-click 'Add All Ingredients to Cart'",
    ],
    actionRoute: "/(tabs)/ai",
    actionText: "Open AI Assistant",
  },

  // 4. Cart Management
  {
    id: "faq_cart_1",
    category: "cart",
    question: "How do I manage items and change quantities in my cart?",
    answer:
      "In the Cart tab, you can increase or decrease the quantity of any item using the '+' and '-' buttons. To remove an item completely, decrease its quantity to zero or tap the trash icon. Your subtotal and total update instantly.",
    actionRoute: "/(tabs)/cart",
    actionText: "Go to Cart",
  },

  // 5. Payment Methods
  {
    id: "faq_pay_1",
    category: "payment",
    question: "What payment methods are supported?",
    answer:
      "We support two convenient payment options:\n1. Credit/Debit Card (Visa & Mastercard securely powered by Stripe)\n2. Cash on Delivery (COD) - pay with cash upon doorstep arrival.",
    highlights: [
      "Stripe 256-bit encrypted card processing",
      "No hidden payment processing surcharges",
      "Cash on Delivery verified upon receipt",
    ],
  },

  // 6. Payment Security
  {
    id: "faq_pay_2",
    category: "payment",
    question: "Is my credit/debit card information secure?",
    answer:
      "Yes, absolutely. We use Stripe's PCI-DSS Level 1 certified payment gateway. Your sensitive card numbers and security codes are never stored on our servers.",
  },

  // 7. Delivery Fee
  {
    id: "faq_del_1",
    category: "delivery",
    question: "How much is the delivery fee?",
    answer:
      "MKB Smart charges a transparent flat delivery fee of Rs. 150 per order, regardless of item weight or volume, within our active service zones.",
    highlights: ["Flat rate: Rs. 150 per order", "Standard express delivery"],
  },

  // 8. Delivery Duration & Tracking
  {
    id: "faq_del_2",
    category: "delivery",
    question: "How long does delivery take and how do I track my order?",
    answer:
      "Orders placed before 6:00 PM are delivered same-day within 2 to 4 hours. You can follow live progress in Profile ➔ My Orders across four stages: Pending, Processing, Shipped (out for delivery), and Delivered.",
    highlights: [
      "Same-day delivery in 2–4 hours",
      "Live order status timeline in My Orders",
    ],
    actionRoute: "/myOrders",
    actionText: "Track My Orders",
  },

  // 9. Returns & Refunds
  {
    id: "faq_ret_1",
    category: "returns",
    question: "What is the return and refund policy for groceries?",
    answer:
      "Your satisfaction with fresh groceries is our top priority. Inspect your items upon delivery. If any item arrives damaged, spoiled, expired, or incorrect, report it within 24 hours via phone, WhatsApp, or the support contact form for an immediate replacement or full refund (processed in 3–5 business days for card payments).",
    highlights: [
      "Fresh produce guarantee: 100% replacement or refund",
      "24-hour reporting window for perishable goods",
      "3–5 days card refund turnaround via Stripe",
    ],
  },

  // 10. Saved Addresses
  {
    id: "faq_acc_1",
    category: "account",
    question: "How do I save and manage multiple delivery addresses?",
    answer:
      "Navigate to Profile ➔ My Addresses. You can add multiple addresses (e.g. Home, Office, Parents) and set one as your 'Primary' address so it automatically pre-fills during checkout.",
    actionRoute: "/myAddress",
    actionText: "Manage Addresses",
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();

  // Accordion States
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>("faq_order_1");
  const [expandedGuideId, setExpandedGuideId] = useState<string | null>("g1");

  // Feedback State for FAQs (helpful yes/no)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, "yes" | "no">>({});

  const scrollViewRef = useRef<ScrollView>(null);

  // Toggle FAQ accordion with smooth animation
  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  // Toggle Guide accordion
  const toggleGuide = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedGuideId((prev) => (prev === id ? null : id));
  };

  // External contact link handlers
  const handleCall = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {
      Alert.alert("Unable to make call", `Please dial ${SUPPORT_PHONE_DISPLAY}`);
    });
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
      "Hello MKB Smart Support! I need help with my grocery order."
    )}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Unable to open WhatsApp", "Please make sure WhatsApp is installed.");
    });
  };

  const handleEmail = () => {
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("MKB Smart Customer Inquiry")}`
    ).catch(() => {
      Alert.alert("Unable to open mail app", `Please email us at ${SUPPORT_EMAIL}`);
    });
  };

  const handleFeedback = (faqId: string, type: "yes" | "no") => {
    setFeedbackGiven((prev) => ({ ...prev, [faqId]: type }));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f8fafc]" edges={["top"]}>
      {/* Top Header */}
      <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color="#0f172a" />
        </Pressable>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-bold text-slate-900">Help Center</Text>
          <Text className="text-xs text-slate-500">Guides, FAQs & Support</Text>
        </View>
        <View className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
          <Text className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
            24/7 Care
          </Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1 px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Support Card */}
        <View className="rounded-2xl border border-slate-200 bg-white p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5 self-start rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5">
                <View className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <Text className="text-[10px] font-bold text-emerald-800">
                  Support Available
                </Text>
              </View>
              <Text className="mt-2 text-base font-bold text-slate-900">
                How can we help you?
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                Contact our customer support team directly or browse guides below.
              </Text>
            </View>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
              <Ionicons name="headset-outline" size={20} color="#15803d" />
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View className="mt-4 flex-row gap-2">
            <Pressable
              onPress={handleCall}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 active:bg-slate-100"
              accessibilityLabel="Call helpline"
            >
              <Ionicons name="call-outline" size={15} color="#0f172a" />
              <Text className="text-xs font-semibold text-slate-900">Call</Text>
            </Pressable>

            <Pressable
              onPress={handleWhatsApp}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 py-2.5 active:bg-emerald-100"
              accessibilityLabel="Chat on WhatsApp"
            >
              <Ionicons name="logo-whatsapp" size={15} color="#15803d" />
              <Text className="text-xs font-bold text-[#15803d]">WhatsApp</Text>
            </Pressable>

            <Pressable
              onPress={handleEmail}
              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 active:bg-slate-100"
              accessibilityLabel="Send email"
            >
              <Ionicons name="mail-outline" size={15} color="#0f172a" />
              <Text className="text-xs font-semibold text-slate-900">Email</Text>
            </Pressable>
          </View>

          {/* Store Hours note */}
          <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="time-outline" size={13} color="#64748b" />
              <Text className="text-[11px] text-slate-500">{STORE_HOURS}</Text>
            </View>
            <Text className="text-[11px] font-semibold text-emerald-700">Quick Response</Text>
          </View>
        </View>

        {/* Step-by-Step Guides */}
        <View className="mt-6">
          <View className="mb-2 px-1 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Quick Guides
            </Text>
            <Text className="text-[11px] text-slate-400">
              {QUICK_GUIDES.length} topics
            </Text>
          </View>

          <View className="space-y-2.5">
            {QUICK_GUIDES.map((guide) => {
              const isExpanded = expandedGuideId === guide.id;
              return (
                <View
                  key={guide.id}
                  style={{ borderColor: isExpanded ? "#10b981" : "#e2e8f0" }}
                  className="overflow-hidden rounded-2xl border bg-white"
                >
                  <Pressable
                    onPress={() => toggleGuide(guide.id)}
                    className="flex-row items-center justify-between p-3.5 active:bg-slate-50"
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle guide ${guide.title}`}
                  >
                    <View className="flex-row items-center gap-3 flex-1 pr-2">
                      <View
                        style={{ backgroundColor: isExpanded ? "#ecfdf5" : "#f8fafc" }}
                        className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200"
                      >
                        <Ionicons
                          name={guide.icon}
                          size={20}
                          color={isExpanded ? "#15803d" : "#475569"}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-sm font-bold text-slate-900">
                            {guide.title}
                          </Text>
                          <View className="rounded-md bg-slate-100 px-1.5 py-0.5 border border-slate-200">
                            <Text className="text-[9px] font-bold text-slate-600">
                              {guide.badge}
                            </Text>
                          </View>
                        </View>
                        <Text className="mt-0.5 text-xs text-slate-500" numberOfLines={1}>
                          {guide.subtitle}
                        </Text>
                      </View>
                    </View>

                    <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={isExpanded ? "#15803d" : "#64748b"}
                      />
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View className="border-t border-slate-100 bg-slate-50/60 p-3.5 pt-3">
                      <View className="space-y-2.5">
                        {guide.steps.map((st, idx) => (
                          <View key={idx} className="flex-row items-start gap-2.5">
                            <View className="h-5 w-5 items-center justify-center rounded-full bg-[#15803d] mt-0.5">
                              <Text className="text-[10px] font-bold text-white">
                                {st.step}
                              </Text>
                            </View>
                            <View className="flex-1">
                              <Text className="text-xs font-bold text-slate-900">
                                {st.title}
                              </Text>
                              <Text className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                                {st.desc}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>

                      {guide.actionRoute && guide.actionText ? (
                        <View className="mt-3.5 pt-3 border-t border-slate-200">
                          <Pressable
                            onPress={() => router.push(guide.actionRoute as any)}
                            className="flex-row items-center justify-center gap-1.5 rounded-xl bg-[#15803d] py-2.5 active:bg-emerald-800"
                            accessibilityRole="button"
                            accessibilityLabel={guide.actionText}
                          >
                            <Text className="text-xs font-bold text-white">
                              {guide.actionText}
                            </Text>
                            <Ionicons name="arrow-forward" size={14} color="#ffffff" />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* FAQs */}
        <View className="mt-6">
          <View className="mb-2 px-1 flex-row items-center justify-between">
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Frequently Asked Questions
            </Text>
            <Text className="text-[11px] text-slate-400">
              {FAQ_ITEMS.length} questions
            </Text>
          </View>

          <View className="space-y-2.5">
            {FAQ_ITEMS.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              const feedback = feedbackGiven[faq.id];

              return (
                <View
                  key={faq.id}
                  style={{ borderColor: isExpanded ? "#10b981" : "#e2e8f0" }}
                  className="overflow-hidden rounded-2xl border bg-white"
                >
                  <Pressable
                    onPress={() => toggleFaq(faq.id)}
                    className="flex-row items-start justify-between p-3.5 active:bg-slate-50"
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle question ${faq.question}`}
                  >
                    <View className="flex-1 pr-2">
                      <Text
                        style={{ color: isExpanded ? "#064e3b" : "#0f172a" }}
                        className="text-sm font-semibold leading-snug"
                      >
                        {faq.question}
                      </Text>
                    </View>
                    <View className="pt-0.5">
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={isExpanded ? "#15803d" : "#64748b"}
                        />
                      </View>
                    </View>
                  </Pressable>

                  {isExpanded && (
                    <View className="border-t border-slate-100 bg-slate-50/60 p-3.5 pt-3">
                      <Text className="text-xs leading-relaxed text-slate-600">
                        {faq.answer}
                      </Text>

                      {/* Highlights */}
                      {faq.highlights && faq.highlights.length > 0 && (
                        <View className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                          <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-1">
                            Key Details
                          </Text>
                          {faq.highlights.map((hl, i) => (
                            <View key={i} className="flex-row items-center gap-1.5 mt-1">
                              <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                              <Text className="text-xs text-emerald-950 flex-1">
                                {hl}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Shortcut */}
                      {faq.actionRoute && faq.actionText && (
                        <View className="mt-3">
                          <Pressable
                            onPress={() => router.push(faq.actionRoute as any)}
                            className="flex-row items-center gap-1.5 self-start rounded-lg bg-white border border-slate-200 px-3 py-1.5 active:bg-slate-50"
                            accessibilityRole="button"
                            accessibilityLabel={faq.actionText}
                          >
                            <Text className="text-xs font-semibold text-slate-800">
                              {faq.actionText}
                            </Text>
                            <Ionicons name="arrow-forward" size={12} color="#15803d" />
                          </Pressable>
                        </View>
                      )}

                      {/* Was this helpful? */}
                      <View className="mt-3.5 flex-row items-center justify-between border-t border-slate-200 pt-2.5">
                        <Text className="text-[11px] text-slate-400">
                          Was this helpful?
                        </Text>

                        {feedback ? (
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="checkmark-circle" size={14} color="#15803d" />
                            <Text className="text-[11px] font-semibold text-emerald-700">
                              Thanks for your feedback!
                            </Text>
                          </View>
                        ) : (
                          <View className="flex-row items-center gap-2">
                            <Pressable
                              onPress={() => handleFeedback(faq.id, "yes")}
                              className="flex-row items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 active:bg-slate-100"
                              accessibilityLabel="Helpful: Yes"
                            >
                              <Ionicons name="thumbs-up-outline" size={11} color="#475569" />
                              <Text className="text-[11px] font-medium text-slate-700">Yes</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleFeedback(faq.id, "no")}
                              className="flex-row items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 active:bg-slate-100"
                              accessibilityLabel="Helpful: No"
                            >
                              <Ionicons name="thumbs-down-outline" size={11} color="#475569" />
                              <Text className="text-[11px] font-medium text-slate-700">No</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Guarantees / Trust Policy */}
        <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-1">
            MKB Smart Guarantees
          </Text>

          <View className="space-y-3">
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100">
                <Ionicons name="leaf-outline" size={18} color="#15803d" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">Freshness Guaranteed</Text>
                <Text className="text-[11px] text-slate-500 mt-0.5">
                  Farm-fresh vegetables, dairy, and fruits inspected before packing.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 border-t border-slate-100 pt-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100">
                <Ionicons name="refresh-outline" size={18} color="#d97706" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">Hassle-Free Returns</Text>
                <Text className="text-[11px] text-slate-500 mt-0.5">
                  Fast replacements or prompt refunds if items do not meet expectations.
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3 border-t border-slate-100 pt-3">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
                <Ionicons name="lock-closed-outline" size={18} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-900">Secure Stripe Payments</Text>
                <Text className="text-[11px] text-slate-500 mt-0.5">
                  PCI-DSS Level 1 256-bit encrypted transactions and Cash on Delivery.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
