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
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  storeId: string;
  storeName: string;
}

interface CartContextType {
  items: CartItemWeb[];
  totalItems: number;
  totalPrice: number;
  storeId: string | null;
  storeName: string | null;
  addItem: (item: CartItemWeb) => { success: boolean; message?: string };
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProviderWeb({ children }: { children: ReactNode }) {
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

  useEffect(() => {
    localStorage.setItem("cartWeb", JSON.stringify(items));
  }, [items]);

  const storeId = items.length > 0 ? items[0].storeId : null;
  const storeName = items.length > 0 ? items[0].storeName : null;

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const addItem = (newItem: CartItemWeb): { success: boolean; message?: string } => {
    if (items.length > 0 && newItem.storeId !== items[0].storeId) {
      return {
        success: false,
        message: `Solo puedes agregar productos de la misma sucursal. Actualmente tu carrito tiene productos de ${items[0].storeName}.`,
      };
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === newItem.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === newItem.variantId
            ? { ...i, quantity: i.quantity + newItem.quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
    return { success: true };
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
        storeId,
        storeName,
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