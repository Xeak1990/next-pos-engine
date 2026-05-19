"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface CartItemWeb {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
}

interface CartContextType {
  items: CartItemWeb[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItemWeb) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProviderWeb({ children }: { children: ReactNode }) {
  // ✅ Inicialización perezosa: lee localStorage una sola vez al crear el estado
  const [items, setItems] = useState<CartItemWeb[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cartWeb");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Error parsing cart from localStorage", e);
          return [];
        }
      }
    }
    return [];
  });

  // ✅ Efecto solo para persistir los cambios (no para cargar inicialmente)
  useEffect(() => {
    localStorage.setItem("cartWeb", JSON.stringify(items));
  }, [items]);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const addItem = (newItem: CartItemWeb) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartWeb() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartWeb must be used within CartProviderWeb");
  }
  return context;
}