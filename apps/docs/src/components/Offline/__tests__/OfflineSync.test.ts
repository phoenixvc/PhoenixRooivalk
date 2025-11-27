/**
 * Offline Sync Tests
 */

import {
  isOnline,
  getQueuedUpdates,
  queueUpdate,
  removeFromQueue,
  clearQueue,
  getPendingCount,
} from "../OfflineSync";

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

describe("OfflineSync", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    // Reset navigator.onLine to default state between tests
    Object.defineProperty(navigator, "onLine", {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  describe("isOnline", () => {
    it("should return true when navigator.onLine is true", () => {
      Object.defineProperty(navigator, "onLine", {
        value: true,
        writable: true,
        configurable: true,
      });
      expect(isOnline()).toBe(true);
    });

    it("should return false when navigator.onLine is false", () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        writable: true,
        configurable: true,
      });
      expect(isOnline()).toBe(false);
    });
  });

  describe("queueUpdate", () => {
    it("should add an update to the queue", () => {
      queueUpdate({
        type: "progress",
        data: { test: true },
      });

      const queue = getQueuedUpdates();
      expect(queue).toHaveLength(1);
      expect(queue[0].type).toBe("progress");
      expect(queue[0].data).toEqual({ test: true });
    });

    it("should generate unique IDs for updates", () => {
      queueUpdate({ type: "progress", data: { a: 1 } });
      queueUpdate({ type: "progress", data: { b: 2 } });

      const queue = getQueuedUpdates();
      expect(queue[0].id).not.toBe(queue[1].id);
    });

    it("should include timestamp", () => {
      const before = Date.now();
      queueUpdate({ type: "progress", data: {} });
      const after = Date.now();

      const queue = getQueuedUpdates();
      expect(queue[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(queue[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("getQueuedUpdates", () => {
    it("should return empty array when no updates queued", () => {
      expect(getQueuedUpdates()).toEqual([]);
    });

    it("should return all queued updates", () => {
      queueUpdate({ type: "progress", data: { a: 1 } });
      queueUpdate({ type: "analytics", data: { b: 2 } });

      const queue = getQueuedUpdates();
      expect(queue).toHaveLength(2);
    });

    it("should handle corrupted localStorage gracefully", () => {
      localStorageMock.setItem("phoenix-docs-offline-queue", "not-valid-json");
      expect(getQueuedUpdates()).toEqual([]);
    });
  });

  describe("removeFromQueue", () => {
    it("should remove specific update by ID", () => {
      queueUpdate({ type: "progress", data: { a: 1 } });
      queueUpdate({ type: "progress", data: { b: 2 } });

      const queue = getQueuedUpdates();
      const idToRemove = queue[0].id;

      removeFromQueue(idToRemove);

      const updatedQueue = getQueuedUpdates();
      expect(updatedQueue).toHaveLength(1);
      expect(updatedQueue[0].data).toEqual({ b: 2 });
    });

    it("should do nothing if ID not found", () => {
      queueUpdate({ type: "progress", data: { a: 1 } });

      removeFromQueue("non-existent-id");

      expect(getQueuedUpdates()).toHaveLength(1);
    });
  });

  describe("clearQueue", () => {
    it("should remove all updates", () => {
      queueUpdate({ type: "progress", data: { a: 1 } });
      queueUpdate({ type: "progress", data: { b: 2 } });
      queueUpdate({ type: "analytics", data: { c: 3 } });

      clearQueue();

      expect(getQueuedUpdates()).toEqual([]);
      expect(getPendingCount()).toBe(0);
    });
  });

  describe("getPendingCount", () => {
    it("should return 0 when queue is empty", () => {
      expect(getPendingCount()).toBe(0);
    });

    it("should return correct count", () => {
      queueUpdate({ type: "progress", data: {} });
      expect(getPendingCount()).toBe(1);

      queueUpdate({ type: "progress", data: {} });
      expect(getPendingCount()).toBe(2);

      queueUpdate({ type: "analytics", data: {} });
      expect(getPendingCount()).toBe(3);
    });

    it("should update after removal", () => {
      queueUpdate({ type: "progress", data: {} });
      queueUpdate({ type: "progress", data: {} });

      const queue = getQueuedUpdates();
      removeFromQueue(queue[0].id);

      expect(getPendingCount()).toBe(1);
    });
  });
});
