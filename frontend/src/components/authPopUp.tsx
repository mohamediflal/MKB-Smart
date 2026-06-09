import React from "react";
import { Modal, Pressable, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function AuthPopUp() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = params.returnTo ?? "/";

  const closePopup = () => {
    if (router.canDismiss?.()) {
      router.dismiss();
    } else if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace(returnTo);
    }
  };

  const openAuthRoute = (pathname: string) => {
    const navigateTo = () => router.replace({ pathname, params: { returnTo } });

    if (router.canDismiss?.()) {
      router.dismiss();
      setTimeout(navigateTo, 0);
    } else if (router.canGoBack?.()) {
      router.back();
      setTimeout(navigateTo, 0);
    } else {
      navigateTo();
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closePopup} statusBarTranslucent>
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Pressable
          style={styles.backdrop}
          onPress={closePopup}
          accessibilityRole="button"
          accessibilityLabel="Close authentication popup"
        />

        <View style={styles.sheetWrapper}>
          <View style={styles.sheet}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.title}>MKB - Smart</Text>
                <Text style={styles.subtitle}>Your Smart Grocery Partner</Text>
              </View>
              <TouchableOpacity
                onPress={closePopup}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close popup"
              >
                <Ionicons name="close" size={22} color="#334155" />
              </TouchableOpacity>
            </View>

            

            <TouchableOpacity
              onPress={() => openAuthRoute('/login')}
              style={[styles.actionButton, styles.primaryButton]}
              accessibilityRole="button"
            >
              <Ionicons name="log-in" size={20} color="#ffffff" />
              <Text style={[styles.actionText, styles.primaryText]}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => openAuthRoute('/register')}
              style={[styles.actionButton, styles.secondaryButton]}
              accessibilityRole="button"
            >
              <Ionicons name="person-add" size={20} color="#0f7d3e" />
              <Text style={[styles.actionText, styles.secondaryText]}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={closePopup} style={styles.footerButton} accessibilityRole="button">
              <Text style={styles.footerText}>Continue browsing</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 92,
  },
  sheet: {
    borderRadius: 32,
    backgroundColor: "#ffffff",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -14 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 24,
    maxHeight: "78%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f7d3e",
    
  },
  subtitle: {
    marginTop: 4,
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f7d3e",
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: "#0f7d3e",
  },
  secondaryButton: {
    backgroundColor: "#f8faf9",
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  actionText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  primaryText: {
    color: "#ffffff",
  },
  secondaryText: {
    color: "#0f7d3e",
  },
  footerButton: {
    marginTop: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    paddingVertical: 14,
    backgroundColor: "#f1f5f9",
  },
  footerText: {
    color: "#475569",
    fontWeight: "700",
    fontSize: 14,
  },
});
