import { formatCurrency } from "../utils/formatter";

describe("formatCurrency", () => {
  it("should format a whole number as USD", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("should format zero", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("should format large numbers with commas", () => {
    expect(formatCurrency(1000000)).toBe("$1,000,000");
  });

  it("should truncate decimal places", () => {
    // maximumFractionDigits: 0 means no decimals
    expect(formatCurrency(99.99)).toBe("$100");
  });

  it("should format negative values", () => {
    const result = formatCurrency(-500);
    expect(result).toContain("500");
    expect(result).toContain("$");
  });
});
