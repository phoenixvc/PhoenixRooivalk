/**
 * Cookie Consent Tests
 */

import { getConsentStatus, isAnalyticsAllowed } from "../CookieConsent";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

const CONSENT_KEY = "phoenix-analytics-consent";
const CONSENT_VERSION = "1";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("getConsentStatus", () => {
    it("should return null when no consent stored", () => {
      expect(getConsentStatus()).toBeNull();
    });

    it("should return stored consent data", () => {
      const consentData = {
        status: "accepted",
        version: CONSENT_VERSION,
        timestamp: "2024-01-01T00:00:00.000Z",
        analytics: true,
        functional: true,
      };
      localStorageMock.setItem(CONSENT_KEY, JSON.stringify(consentData));

      const result = getConsentStatus();
      expect(result).toEqual(consentData);
    });

    it("should return null for outdated consent version", () => {
      const consentData = {
        status: "accepted",
        version: "0", // Old version
        timestamp: "2024-01-01T00:00:00.000Z",
        analytics: true,
        functional: true,
      };
      localStorageMock.setItem(CONSENT_KEY, JSON.stringify(consentData));

      expect(getConsentStatus()).toBeNull();
    });

    it("should handle corrupted localStorage gracefully", () => {
      localStorageMock.setItem(CONSENT_KEY, "not-valid-json");
      expect(getConsentStatus()).toBeNull();
    });
  });

  describe("isAnalyticsAllowed", () => {
    it("should return false when no consent", () => {
      expect(isAnalyticsAllowed()).toBe(false);
    });

    it("should return false when declined", () => {
      const consentData = {
        status: "declined",
        version: CONSENT_VERSION,
        timestamp: "2024-01-01T00:00:00.000Z",
        analytics: false,
        functional: false,
      };
      localStorageMock.setItem(CONSENT_KEY, JSON.stringify(consentData));

      expect(isAnalyticsAllowed()).toBe(false);
    });

    it("should return false when accepted but analytics disabled", () => {
      const consentData = {
        status: "accepted",
        version: CONSENT_VERSION,
        timestamp: "2024-01-01T00:00:00.000Z",
        analytics: false,
        functional: true,
      };
      localStorageMock.setItem(CONSENT_KEY, JSON.stringify(consentData));

      expect(isAnalyticsAllowed()).toBe(false);
    });

    it("should return true when accepted with analytics", () => {
      const consentData = {
        status: "accepted",
        version: CONSENT_VERSION,
        timestamp: "2024-01-01T00:00:00.000Z",
        analytics: true,
        functional: true,
      };
      localStorageMock.setItem(CONSENT_KEY, JSON.stringify(consentData));

      expect(isAnalyticsAllowed()).toBe(true);
    });
  });
});
