import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useAuth, API_BASE_URL } from "./AuthContext";

export type AddressLabel = "Home" | "Office" | "Parent's House" | "Gym" | "Other";

export type AddressEntry = {
  id: string;
  label: AddressLabel;
  fullName: string;
  phone: string;
  street: string;
  district: string;
  city: string;
  postalCode: string;
  isPrimary: boolean;
};

type AddressContextValue = {
  addresses: AddressEntry[];
  addAddress: (address: Omit<AddressEntry, "id">) => Promise<void>;
  updateAddress: (id: string, address: Omit<AddressEntry, "id">) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  syncAddresses: () => Promise<void>;
};

const AddressContext = createContext<AddressContextValue | null>(null);

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);
  const { user } = useAuth();

  // ─── Map a raw DB address row → AddressEntry ─────────────────────────────
  const mapDbAddress = (dbAddress: any): AddressEntry => ({
    id: dbAddress.id,
    label: dbAddress.label as AddressLabel,
    fullName: dbAddress.fullName,
    phone: dbAddress.phone || "",
    street: dbAddress.address,      // DB uses "address", we use "street"
    district: dbAddress.district || "",
    city: dbAddress.city,
    postalCode: dbAddress.zip,      // DB uses "zip", we use "postalCode"
    isPrimary: dbAddress.isDefault, // DB uses "isDefault", we use "isPrimary"
  });

  // ─── Fetch all addresses from DB ──────────────────────────────────────────
  const syncAddresses = useCallback(async () => {
    if (!user || !user.token) {
      setAddresses([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/address/list`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (!response.ok) {
        if (response.status === 401) {
          setAddresses([]);
          return;
        }
        console.error("syncAddresses failed:", response.status);
        return;
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses.map(mapDbAddress));
      }
    } catch (error) {
      console.error("Error syncing addresses:", error);
    }
  }, [user]);

  // Auto-sync when user logs in / out
  useEffect(() => {
    if (user && user.token) {
      syncAddresses();
    } else {
      setAddresses([]);
    }
  }, [user]);

  // ─── Add a new address ────────────────────────────────────────────────────
  // NOTE: no syncAddresses() call here — myAddress.tsx calls it via
  // useFocusEffect every time the screen gains focus, so the DB re-fetch
  // happens automatically after navigation.
  const addAddress = useCallback(async (address: Omit<AddressEntry, "id">) => {
    if (!user || !user.token) {
      Alert.alert("Not logged in", "Please log in to save addresses.");
      return;
    }

    // Optimistic update with temp id
    const tempId = `temp-${Date.now()}`;
    const newEntry: AddressEntry = { ...address, id: tempId };

    setAddresses((current) => {
      if (address.isPrimary) {
        return [newEntry, ...current.map((e) => ({ ...e, isPrimary: false }))];
      }
      return [...current, newEntry];
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/address/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fullName: address.fullName,
          label: address.label,
          phone: address.phone,
          street: address.street,
          district: address.district,
          city: address.city,
          postalCode: address.postalCode,
          isPrimary: address.isPrimary,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Roll back optimistic update
        setAddresses((current) => current.filter((e) => e.id !== tempId));
        Alert.alert("Save Failed", data?.message || "Failed to save address. Please try again.");
        return;
      }

      // Swap temp id for real DB id
      if (data.address?.id) {
        setAddresses((current) =>
          current.map((e) => (e.id === tempId ? { ...e, id: data.address.id } : e))
        );
      }
    } catch (error: any) {
      setAddresses((current) => current.filter((e) => e.id !== tempId));
      console.error("Error adding address:", error);
      Alert.alert("Network Error", "Could not reach server. Check your connection.");
    }
  }, [user]);

  // ─── Update an existing address ───────────────────────────────────────────
  const updateAddress = useCallback(async (id: string, address: Omit<AddressEntry, "id">) => {
    if (!user || !user.token) {
      Alert.alert("Not logged in", "Please log in to update addresses.");
      return;
    }

    // Snapshot for rollback
    const snapshot = addresses;

    // Optimistic update
    setAddresses((current) => {
      if (address.isPrimary) {
        return current.map((e) =>
          e.id === id ? { ...address, id } : { ...e, isPrimary: false }
        );
      }
      return current.map((e) => (e.id === id ? { ...address, id } : e));
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/address/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          fullName: address.fullName,
          label: address.label,
          phone: address.phone,
          street: address.street,
          district: address.district,
          city: address.city,
          postalCode: address.postalCode,
          isPrimary: address.isPrimary,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAddresses(snapshot); // Roll back
        Alert.alert("Update Failed", data?.message || "Failed to update address. Please try again.");
      }
    } catch (error: any) {
      setAddresses(snapshot); // Roll back
      console.error("Error updating address:", error);
      Alert.alert("Network Error", "Could not reach server. Check your connection.");
    }
  }, [user, addresses]);

  // ─── Delete an address ────────────────────────────────────────────────────
  const removeAddress = useCallback(async (id: string) => {
    if (!user || !user.token) {
      Alert.alert("Not logged in", "Please log in to delete addresses.");
      return;
    }

    // Snapshot for rollback
    const snapshot = addresses;
    setAddresses((current) => current.filter((e) => e.id !== id));

    try {
      const response = await fetch(`${API_BASE_URL}/api/address/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user.token}` },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setAddresses(snapshot); // Roll back
        Alert.alert("Delete Failed", data?.message || "Failed to delete address. Please try again.");
      }
    } catch (error: any) {
      setAddresses(snapshot); // Roll back
      console.error("Error deleting address:", error);
      Alert.alert("Network Error", "Could not reach server. Check your connection.");
    }
  }, [user, addresses]);

  const value = useMemo(
    () => ({
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      syncAddresses,
    }),
    [addresses, addAddress, updateAddress, removeAddress, syncAddresses],
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses() {
  const context = useContext(AddressContext);

  if (!context) {
    throw new Error("useAddresses must be used within an AddressProvider");
  }

  return context;
}