import React, { createContext, useContext, useMemo, useState } from "react";

export type AddressLabel = "Home" | "Office" | "Parent's House" | "Gym" | "Other";

export type AddressEntry = {
  id: string;
  label: AddressLabel;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  isPrimary: boolean;
};

type AddressContextValue = {
  addresses: AddressEntry[];
  addAddress: (address: Omit<AddressEntry, "id">) => void;
  updateAddress: (id: string, address: Omit<AddressEntry, "id">) => void;
  removeAddress: (id: string) => void;
};

const AddressContext = createContext<AddressContextValue | null>(null);

const initialAddresses: AddressEntry[] = [
  {
    id: "home",
    label: "Home",
    fullName: "Alexander Bennett",
    phone: "+1 (555) 012-3456",
    street: "42 Green Valley Road, Sector 5",
    city: "Central District, Smart City, 56001",
    postalCode: "",
    isPrimary: true,
  },
  {
    id: "office",
    label: "Office",
    fullName: "Alexander Bennett",
    phone: "+1 (555) 987-6543",
    street: "Tech Hub Tower, 12th Floor, Suite 404",
    city: "Innovation Park, Smart City, 56009",
    postalCode: "",
    isPrimary: false,
  },
  {
    id: "parents",
    label: "Parent's House",
    fullName: "Alexander Bennett",
    phone: "+1 (555) 246-8101",
    street: "88 Riverside Apartments, Block B",
    city: "South Bank Area, Smart City, 56012",
    postalCode: "",
    isPrimary: false,
  },
];

export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState(initialAddresses);

  const addAddress = (address: Omit<AddressEntry, "id">) => {
    setAddresses((current) => {
      const nextId = `address-${Date.now()}`;

      if (address.isPrimary) {
        return [
          { ...address, id: nextId },
          ...current.map((entry) => ({ ...entry, isPrimary: false })),
        ];
      }

      return [...current, { ...address, id: nextId }];
    });
  };

  const updateAddress = (id: string, address: Omit<AddressEntry, "id">) => {
    setAddresses((current) => {
      if (address.isPrimary) {
        return current.map((entry) =>
          entry.id === id
            ? { ...address, id }
            : { ...entry, isPrimary: false },
        );
      }

      return current.map((entry) => (entry.id === id ? { ...address, id } : entry));
    });
  };

  const removeAddress = (id: string) => {
    setAddresses((current) => current.filter((entry) => entry.id !== id));
  };

  const value = useMemo(
    () => ({
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
    }),
    [addresses],
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