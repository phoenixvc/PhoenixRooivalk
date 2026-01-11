"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { CartContextType, CartItem } from "../types/cart";

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "phoenix-rooivalk-cart";

/**
 * Calculate the total price of items in the cart
 */
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Calculate the total number of items in the cart
 */
function calculateItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Load cart from localStorage
 */
function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    // Silent fail - return empty cart if storage is unavailable
    // This handles cases like private browsing or storage quota exceeded
  }
  return [];
}

/**
 * Save cart to localStorage
 */
function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    // Silent fail - cart will work in memory only if storage is unavailable
    // This handles cases like private browsing or storage quota exceeded
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const storedItems = loadCartFromStorage();
    setItems(storedItems);
    setIsInitialized(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(items);
    }
  }, [items, isInitialized]);

  const addItem = useCallback(
    (newItem: Omit<CartItem, "quantity">, quantity: number = 1) => {
      setItems((currentItems) => {
        const existingItem = currentItems.find(
          (item) => item.id === newItem.id,
        );

        if (existingItem) {
          // Update quantity if item already exists
          return currentItems.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + quantity }
              : item,
          );
        }

        // Add new item
        return [...currentItems, { ...newItem, quantity }];
      });
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((currentItems) => currentItems.filter((item) => item.id !== id));
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const getItemQuantity = useCallback(
    (id: string) => {
      const item = items.find((item) => item.id === id);
      return item?.quantity ?? 0;
    },
    [items],
  );

  const value: CartContextType = {
    items,
    total: calculateTotal(items),
    itemCount: calculateItemCount(items),
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
