/**
 * Unit tests for utility functions
 */

import {
  generateId,
  generateShortId,
  generateNumericId,
} from "../lib/utils/ids";

describe("ID Generation", () => {
  describe("generateId", () => {
    it("should generate a valid UUID", () => {
      const id = generateId();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it("should generate unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000);
    });

    it("should generate ID with prefix", () => {
      const id = generateId("user");
      expect(id).toMatch(/^user_[0-9a-f-]+$/i);
    });
  });

  describe("generateShortId", () => {
    it("should generate short ID of correct length", () => {
      const id = generateShortId(8);
      expect(id.length).toBe(8);
    });

    it("should use alphanumeric characters only", () => {
      const id = generateShortId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe("generateNumericId", () => {
    it("should generate numeric ID of correct length", () => {
      const id = generateNumericId(6);
      expect(id.length).toBe(6);
      expect(id).toMatch(/^[0-9]+$/);
    });
  });
});
