import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";

type UserProfile = {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  token?: string;
  profileImage?: string;
};

type AuthContextValue = {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (value: { name: string; email: string; phone?: string; password: string; otp: string }) => Promise<void>;
  sendOtp: (email: string) => Promise<{ success: boolean; message: string; previewUrl?: string }>;
  forgotPassword: (email: string) => Promise<any>;
  verifyForgotOtp: (email: string, otp: string) => Promise<any>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<any>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
};

const getApiBaseUrl = () => {
  // First, prefer an explicit env/config value so `userFrontend/.env` can control the host.
  const envUrl = (typeof process !== 'undefined' && (process as any).env && (process as any).env.VITE_BACKEND_URL)
    || (Constants.manifest && (Constants.manifest as any).extra && (Constants.manifest as any).extra.VITE_BACKEND_URL)
    || (Constants.expoConfig && (Constants.expoConfig as any).extra && (Constants.expoConfig as any).extra.VITE_BACKEND_URL)
    || (typeof (global as any).VITE_BACKEND_URL !== 'undefined' ? (global as any).VITE_BACKEND_URL : undefined);

  if (envUrl) {
    return envUrl.replace(/\/+$/, '');
  }

  if (Platform.OS === "web") {
    return "http://localhost:3000";
  }

  const debuggerHost =
    (typeof Constants.manifest === "object" && Constants.manifest?.debuggerHost)
    || (typeof Constants.manifest2 === "object" && Constants.manifest2?.debuggerHost)
    || (typeof Constants.expoConfig === "object" && (Constants.expoConfig as any)?.hostUri);

  if (debuggerHost) {
    const host = debuggerHost.split(":")[0];
    if (host) {
      if (host === "localhost" && Platform.OS === "android") {
        return "http://10.0.2.2:3000";
      }
      if (host === "localhost" && Platform.OS === "ios") {
        return "http://192.168.100.253:3000";
      }
      return `http://${host}:3000`;
    }
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  // Fallback for iOS physical devices or unknown expo host.
  return "http://192.168.100.253:3000";
};

export const API_BASE_URL = getApiBaseUrl();

const STORAGE_KEY = "@mkb_grocery_auth";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!mounted) return;
        if (!raw) {
          setIsAuthReady(true);
          return;
        }

        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && "email" in parsed && "name" in parsed) {
          setUser(parsed as UserProfile);
        }
      } catch {
        // ignore invalid or missing storage data
      } finally {
        if (mounted) {
          setIsAuthReady(true);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (user) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // ignore storage errors
      }
    })();
  }, [user]);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      throw new Error("Email and password are required.");
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Login failed. Please try again.");
    }

    if (!data?.user || !data?.token) {
      throw new Error("Login failed. Invalid response from server.");
    }

    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone: data.user.phone,
      token: data.token,
      profileImage: data.user.avatar || undefined,
    });
  };

  const register = async ({ name, email, phone, password, otp }: { name: string; email: string; phone?: string; password: string; otp: string }) => {
    if (!name || !email || !password || !otp) {
      throw new Error("Name, email, password, and verification OTP are required.");
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, otp }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Registration failed. Please try again.");
    }

    if (!data?.user || !data?.token) {
      throw new Error("Registration failed. Invalid response from server.");
    }

    setUser({
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      phone,
      token: data.token,
    });
  };

  const sendOtp = async (email: string) => {
    if (!email) {
      throw new Error("Email is required.");
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Failed to send OTP. Please try again.");
    }

    return data;
  };

  const forgotPassword = async (email: string) => {
    if (!email) {
      throw new Error("Email is required.");
    }
    const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Forgot password request failed.");
    }
    return data;
  };

  const verifyForgotOtp = async (email: string, otp: string) => {
    if (!email || !otp) {
      throw new Error("Email and OTP are required.");
    }
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "OTP verification failed.");
    }
    return data;
  };

  const resetPassword = async (email: string, otp: string, newPassword: string) => {
    if (!email || !otp || !newPassword) {
      throw new Error("Email, OTP, and new password are required.");
    }
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || "Password reset failed.");
    }
    return data;
  };

  const logout = () => {
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isAuthReady,
      login,
      register,
      sendOtp,
      forgotPassword,
      verifyForgotOtp,
      resetPassword,
      logout,
      setUser,
    }),
    [user, isAuthReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
