"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CartItem {
  variantId: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
  stockAvailable: number; // Nuevo campo para controlar el stock
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem, stockAvailable: number) => void; // Añadimos stockAvailable  removeItem: (variantId: string) => void;
  removeOne: (variantId: string) => void; // Quitar de 1 en 1
  removeItem: (variantId: string) => void; // Quitar todos
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (newItem: CartItem, stockAvailable: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId);
      if (existing) {
        // Usamos el stock que ya guardamos en el item
        if (existing.quantity >= existing.stockAvailable) {
          alert(`STOCK MÁXIMO ALCANZADO (${existing.stockAvailable} UDS)`);
          return prev;
        }
        return prev.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      // Cuando es nuevo, guardamos el stock disponible que viene del servidor
      return [...prev, { ...newItem, stockAvailable }];
    });
  };

  const removeOne = (variantId: string) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variantId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.variantId === variantId ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }
      // Si solo queda 1, lo eliminamos por completo
      return prev.filter((i) => i.variantId !== variantId);
    });
  };

  const removeItem = (variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, clearCart, removeOne }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de un CartProvider");
  }
  return context;
}
