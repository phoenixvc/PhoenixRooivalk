import React from "react";
import { vi, describe, it, expect } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => React.createElement("a", { href, ...props }, children),
}));

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) =>
    React.createElement("img", props),
}));

describe("Page data — products", () => {
  it("should export product data with required fields", async () => {
    const { products } = await import("../data/products");
    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);

    products.forEach((product) => {
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("sku");
      expect(product).toHaveProperty("priceRange");
      expect(product.priceRange.min).toBeGreaterThanOrEqual(0);
      expect(product.priceRange.max).toBeGreaterThan(0);
      expect(product.priceRange.max).toBeGreaterThanOrEqual(
        product.priceRange.min,
      );
    });
  });

  it("should have unique SKUs across all products", async () => {
    const { products } = await import("../data/products");
    const skus = products.map((p) => p.sku);
    const uniqueSkus = new Set(skus);
    expect(uniqueSkus.size).toBe(skus.length);
  });

  it("should have valid phase timelines", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(product).toHaveProperty("phaseTimeline");
      expect(typeof product.phaseTimeline).toBe("string");
      expect(product.phaseTimeline.length).toBeGreaterThan(0);
    });
  });

  it("should have valid product lines", async () => {
    const { products } = await import("../data/products");
    const validLines = [
      "skysnare",
      "netsnare",
      "skywatch",
      "netsentry",
      "aeronet",
      "rkv",
    ];
    products.forEach((product) => {
      expect(validLines).toContain(product.line);
    });
  });

  it("should have valid categories", async () => {
    const { products } = await import("../data/products");
    const validCategories = [
      "consumer",
      "diy-maker",
      "prosumer",
      "commercial",
      "enterprise",
      "military",
    ];
    products.forEach((product) => {
      expect(validCategories).toContain(product.category);
    });
  });

  it("should have valid phases", async () => {
    const { products } = await import("../data/products");
    const validPhases = ["seed", "series-a", "series-b", "series-c", "scale"];
    products.forEach((product) => {
      expect(validPhases).toContain(product.phase);
    });
  });
});

describe("Page data — product pricing", () => {
  it("every product should have positive COGS", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(product.cogs).toBeGreaterThan(0);
    });
  });

  it("every product should have a positive margin", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(product.margin).toBeGreaterThan(0);
      expect(product.margin).toBeLessThanOrEqual(1);
    });
  });

  it("products with monthlyFee should have positive monthly fee", async () => {
    const { products } = await import("../data/products");
    const withMonthly = products.filter((p) => p.monthlyFee != null);
    withMonthly.forEach((product) => {
      expect(product.monthlyFee).toBeGreaterThan(0);
    });
  });

  it("priceFormatted should be a non-empty string", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(typeof product.priceFormatted).toBe("string");
      expect(product.priceFormatted.length).toBeGreaterThan(0);
    });
  });
});

describe("Component rendering — basic smoke tests", () => {
  it("should export CartProvider from CartContext", async () => {
    const { CartProvider } = await import("../contexts/CartContext");
    expect(CartProvider).toBeDefined();
    expect(typeof CartProvider).toBe("function");
  });

  it("should export useCart hook", async () => {
    const { useCart } = await import("../contexts/CartContext");
    expect(useCart).toBeDefined();
    expect(typeof useCart).toBe("function");
  });

  it("should export formatCurrency from formatter", async () => {
    const { formatCurrency } = await import("../utils/formatter");
    expect(formatCurrency).toBeDefined();
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("should export analytics utilities", async () => {
    const analytics = await import("../utils/analytics");
    expect(analytics).toBeDefined();
  });

  it("should export downloadWhitepaper utility", async () => {
    const mod = await import("../utils/downloadWhitepaper");
    expect(mod).toBeDefined();
  });

  it("should export calendar utilities", async () => {
    const cal = await import("../utils/calendar");
    expect(cal).toBeDefined();
  });
});

describe("Data integrity — cross-page consistency", () => {
  it("product IDs should be unique", async () => {
    const { products } = await import("../data/products");
    const ids = products.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("product names should be non-empty strings", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(typeof product.name).toBe("string");
      expect(product.name.trim().length).toBeGreaterThan(0);
    });
  });

  it("product descriptions should be present", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(product).toHaveProperty("description");
      expect(typeof product.description).toBe("string");
    });
  });

  it("every product should have target markets", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(Array.isArray(product.targetMarket)).toBe(true);
      expect(product.targetMarket.length).toBeGreaterThan(0);
    });
  });

  it("every product should have a market segment", async () => {
    const { products } = await import("../data/products");
    products.forEach((product) => {
      expect(typeof product.marketSegment).toBe("string");
      expect(product.marketSegment.length).toBeGreaterThan(0);
    });
  });
});
