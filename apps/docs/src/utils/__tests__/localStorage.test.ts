/**
 * LocalStorage Utilities Tests
 */

import {
  clearOnboardingData,
  clearAllLocalStorage,
  getOnboardingDiagnostics,
  isOnboardingDataCorrupted,
  autoFixOnboardingData,
} from "../localStorage";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
  writable: true,
});

describe("clearOnboardingData", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("should clear all onboarding-related keys", () => {
    // Set up some onboarding data
    localStorage.setItem("phoenix-docs-onboarding-completed", "true");
    localStorage.setItem("phoenix-docs-profile-confirmed", "true");
    localStorage.setItem("phoenix-docs-user-details", "{}");
    localStorage.setItem("unrelated-key", "should-remain");

    clearOnboardingData();

    expect(
      localStorage.getItem("phoenix-docs-onboarding-completed"),
    ).toBeNull();
    expect(localStorage.getItem("phoenix-docs-profile-confirmed")).toBeNull();
    expect(localStorage.getItem("phoenix-docs-user-details")).toBeNull();
    expect(localStorage.getItem("unrelated-key")).toBe("should-remain");
  });

  it("should not throw if keys don't exist", () => {
    expect(() => clearOnboardingData()).not.toThrow();
  });
});

describe("clearAllLocalStorage", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("should clear all localStorage data", () => {
    localStorage.setItem("key1", "value1");
    localStorage.setItem("key2", "value2");
    localStorage.setItem("key3", "value3");

    clearAllLocalStorage();

    expect(localStorage.length).toBe(0);
  });
});

describe("getOnboardingDiagnostics", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("should return diagnostics for onboarding keys", () => {
    localStorage.setItem(
      "phoenix-docs-profile-confirmed",
      JSON.stringify({ userId: "123", confirmed: true }),
    );
    localStorage.setItem(
      "phoenix-docs-user-profile",
      JSON.stringify({ profileKey: "developer" }),
    );

    const diagnostics = getOnboardingDiagnostics();

    expect(diagnostics.keys.length).toBeGreaterThan(0);
    expect(diagnostics.totalSize).toBeGreaterThan(0);

    const profileConfirmed = diagnostics.keys.find(
      (k) => k.key === "phoenix-docs-profile-confirmed",
    );
    expect(profileConfirmed?.parsed).toEqual({
      userId: "123",
      confirmed: true,
    });
  });

  it("should handle non-JSON values", () => {
    localStorage.setItem("phoenix-docs-onboarding-step", "invalid-json");

    const diagnostics = getOnboardingDiagnostics();
    const stepKey = diagnostics.keys.find(
      (k) => k.key === "phoenix-docs-onboarding-step",
    );

    expect(stepKey?.value).toBe("invalid-json");
    expect(stepKey?.parsed).toBeUndefined();
  });

  it("should handle empty localStorage", () => {
    const diagnostics = getOnboardingDiagnostics();

    expect(diagnostics.keys.length).toBeGreaterThan(0);
    expect(diagnostics.totalSize).toBe(0);
  });
});

describe("isOnboardingDataCorrupted", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("should return false for valid data", () => {
    localStorage.setItem(
      "phoenix-docs-profile-confirmed",
      JSON.stringify({ userId: "123", confirmed: true }),
    );
    localStorage.setItem(
      "phoenix-docs-user-profile",
      JSON.stringify({ profileKey: "developer" }),
    );

    expect(isOnboardingDataCorrupted()).toBe(false);
  });

  it("should detect when profile is confirmed but data is missing", () => {
    localStorage.setItem(
      "phoenix-docs-profile-confirmed",
      JSON.stringify({ userId: "123", confirmed: true }),
    );
    // No profile data

    expect(isOnboardingDataCorrupted()).toBe(true);
  });

  it("should return false when profile was skipped", () => {
    localStorage.setItem(
      "phoenix-docs-profile-confirmed",
      JSON.stringify({ userId: "123", confirmed: true, skipped: true }),
    );
    // No profile data, but that's OK because it was skipped

    expect(isOnboardingDataCorrupted()).toBe(false);
  });

  it("should detect when onboarding is completed but no profile confirmation", () => {
    localStorage.setItem(
      "phoenix-docs-onboarding-completed",
      JSON.stringify({ userId: "123", completed: true }),
    );
    // No profile confirmation

    expect(isOnboardingDataCorrupted()).toBe(true);
  });

  it("should return true for malformed JSON", () => {
    localStorage.setItem("phoenix-docs-profile-confirmed", "invalid-json");

    expect(isOnboardingDataCorrupted()).toBe(true);
  });

  it("should return false when no onboarding data exists", () => {
    expect(isOnboardingDataCorrupted()).toBe(false);
  });
});

describe("autoFixOnboardingData", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("should clear data when corruption is detected", () => {
    localStorage.setItem(
      "phoenix-docs-profile-confirmed",
      JSON.stringify({ userId: "123", confirmed: true }),
    );
    // No profile data - this is corrupted

    const result = autoFixOnboardingData();

    expect(result).toBe(true);
    expect(localStorage.getItem("phoenix-docs-profile-confirmed")).toBeNull();
  });

  it("should not clear data when no corruption is detected", () => {
    localStorage.setItem(
      "phoenix-docs-profile-confirmed",
      JSON.stringify({ userId: "123", confirmed: true }),
    );
    localStorage.setItem(
      "phoenix-docs-user-profile",
      JSON.stringify({ profileKey: "developer" }),
    );

    const result = autoFixOnboardingData();

    expect(result).toBe(false);
    expect(
      localStorage.getItem("phoenix-docs-profile-confirmed"),
    ).not.toBeNull();
  });

  it("should return false when no onboarding data exists", () => {
    const result = autoFixOnboardingData();

    expect(result).toBe(false);
  });
});
