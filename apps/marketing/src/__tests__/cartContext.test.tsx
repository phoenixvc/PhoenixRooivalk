import React from "react";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "../contexts/CartContext";
import type { CartItem } from "../types/cart";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

const makeItem = (
  overrides: Partial<Omit<CartItem, "quantity">> = {},
): Omit<CartItem, "quantity"> => ({
  id: "item-1",
  sku: "SKU-001",
  name: "Test Item",
  price: 100,
  image: "/test.png",
  phaseTimeline: "Phase 1",
  ...overrides,
});

describe("useCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should throw when used outside CartProvider", () => {
    // Suppress console.error for expected error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useCart())).toThrow(
      "useCart must be used within a CartProvider",
    );
    spy.mockRestore();
  });

  it("should start with empty cart", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.items).toHaveLength(0);
    expect(result.current.total).toBe(0);
    expect(result.current.itemCount).toBe(0);
  });

  describe("addItem", () => {
    it("should add a new item to the cart", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem());
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe("Test Item");
      expect(result.current.items[0].quantity).toBe(1);
    });

    it("should add with custom quantity", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem(), 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it("should increment quantity for existing item", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem());
      });
      act(() => {
        result.current.addItem(makeItem(), 3);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(4); // 1 + 3
    });

    it("should keep separate items for different IDs", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem({ id: "a", name: "Item A" }));
        result.current.addItem(makeItem({ id: "b", name: "Item B" }));
      });

      expect(result.current.items).toHaveLength(2);
    });
  });

  describe("removeItem", () => {
    it("should remove an item by ID", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem({ id: "a" }));
        result.current.addItem(makeItem({ id: "b" }));
      });
      act(() => {
        result.current.removeItem("a");
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe("b");
    });

    it("should be a no-op for non-existent ID", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem());
      });
      act(() => {
        result.current.removeItem("nonexistent");
      });

      expect(result.current.items).toHaveLength(1);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity for existing item", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem());
      });
      act(() => {
        result.current.updateQuantity("item-1", 10);
      });

      expect(result.current.items[0].quantity).toBe(10);
    });

    it("should remove item when quantity is 0", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem());
      });
      act(() => {
        result.current.updateQuantity("item-1", 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it("should remove item when quantity is negative", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem());
      });
      act(() => {
        result.current.updateQuantity("item-1", -1);
      });

      expect(result.current.items).toHaveLength(0);
    });
  });

  describe("clearCart", () => {
    it("should remove all items", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem({ id: "a" }));
        result.current.addItem(makeItem({ id: "b" }));
        result.current.addItem(makeItem({ id: "c" }));
      });
      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.total).toBe(0);
      expect(result.current.itemCount).toBe(0);
    });
  });

  describe("getItemQuantity", () => {
    it("should return quantity for existing item", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem(), 3);
      });

      expect(result.current.getItemQuantity("item-1")).toBe(3);
    });

    it("should return 0 for non-existent item", () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.getItemQuantity("nonexistent")).toBe(0);
    });
  });

  describe("total and itemCount", () => {
    it("should calculate total correctly", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem({ id: "a", price: 100 }), 2);
        result.current.addItem(makeItem({ id: "b", price: 50 }), 3);
      });

      expect(result.current.total).toBe(350); // 100*2 + 50*3
      expect(result.current.itemCount).toBe(5); // 2 + 3
    });

    it("should update totals after removal", () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.addItem(makeItem({ id: "a", price: 100 }), 2);
        result.current.addItem(makeItem({ id: "b", price: 50 }), 1);
      });
      act(() => {
        result.current.removeItem("a");
      });

      expect(result.current.total).toBe(50);
      expect(result.current.itemCount).toBe(1);
    });
  });

  describe("localStorage persistence", () => {
    it("should save items to localStorage", async () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      // Wait for initialization
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      act(() => {
        result.current.addItem(makeItem());
      });

      // Wait for save effect
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      const stored = localStorage.getItem("phoenix-rooivalk-cart");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].name).toBe("Test Item");
    });

    it("should load items from localStorage on mount", async () => {
      const existingItems: CartItem[] = [
        {
          id: "stored-1",
          sku: "SKU-S1",
          name: "Stored Item",
          price: 200,
          quantity: 2,
          phaseTimeline: "Phase 2",
        },
      ];
      localStorage.setItem(
        "phoenix-rooivalk-cart",
        JSON.stringify(existingItems),
      );

      const { result } = renderHook(() => useCart(), { wrapper });

      // Wait for async load
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].name).toBe("Stored Item");
      expect(result.current.total).toBe(400); // 200 * 2
    });

    it("should handle corrupt localStorage gracefully", async () => {
      localStorage.setItem("phoenix-rooivalk-cart", "not-valid-json{{{");

      const { result } = renderHook(() => useCart(), { wrapper });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(result.current.items).toHaveLength(0);
    });
  });
});
