/**
 * Unit tests for validation schemas
 */

import {
  NewsArticleSchema,
  SupportTicketSchema,
  UserPreferencesSchema,
  PaginationSchema,
} from "../lib/utils/validation";

describe("Validation Schemas", () => {
  describe("NewsArticleSchema", () => {
    it("should validate a valid article", () => {
      const article = {
        title: "Test Article",
        content: "This is the content of the test article.",
        category: "technology",
        source: "test-source",
      };

      const result = NewsArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
    });

    it("should reject article with missing title", () => {
      const article = {
        content: "Content without title",
        category: "technology",
        source: "test-source",
      };

      const result = NewsArticleSchema.safeParse(article);
      expect(result.success).toBe(false);
    });

    it("should reject article with empty title", () => {
      const article = {
        title: "",
        content: "Content with empty title",
        category: "technology",
        source: "test-source",
      };

      const result = NewsArticleSchema.safeParse(article);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const article = {
        title: "Test Article",
        content:
          "This is the content of the test article with more than 10 characters.",
        category: "technology",
        source: "test-source",
        summary: "A summary",
        imageUrl: "https://example.com/image.jpg",
        author: "John Doe",
        tags: ["tech", "news"],
      };

      const result = NewsArticleSchema.safeParse(article);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toBe("A summary");
        expect(result.data.tags).toEqual(["tech", "news"]);
      }
    });
  });

  describe("SupportTicketSchema", () => {
    it("should validate a valid ticket", () => {
      const ticket = {
        subject: "Need help",
        message: "I have a question about the product.",
        email: "user@example.com",
      };

      const result = SupportTicketSchema.safeParse(ticket);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const ticket = {
        subject: "Need help",
        message: "I have a question",
        email: "not-an-email",
      };

      const result = SupportTicketSchema.safeParse(ticket);
      expect(result.success).toBe(false);
    });

    it("should accept optional priority", () => {
      const ticket = {
        subject: "Urgent issue",
        message: "This is critical",
        email: "user@example.com",
        priority: "high",
      };

      const result = SupportTicketSchema.safeParse(ticket);
      expect(result.success).toBe(true);
    });

    it("should reject invalid priority", () => {
      const ticket = {
        subject: "Issue",
        message: "Description",
        email: "user@example.com",
        priority: "super-urgent",
      };

      const result = SupportTicketSchema.safeParse(ticket);
      expect(result.success).toBe(false);
    });
  });

  describe("UserPreferencesSchema", () => {
    it("should validate valid preferences", () => {
      const prefs = {
        preferredCategories: ["technology", "security"],
        emailDigest: "daily",
        pushEnabled: true,
      };

      const result = UserPreferencesSchema.safeParse(prefs);
      expect(result.success).toBe(true);
    });

    it("should use defaults for missing optional fields", () => {
      const prefs = {};

      const result = UserPreferencesSchema.safeParse(prefs);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.preferredCategories).toEqual([]);
        expect(result.data.pushEnabled).toBe(false);
      }
    });

    it("should reject invalid email digest value", () => {
      const prefs = {
        emailDigest: "hourly",
      };

      const result = UserPreferencesSchema.safeParse(prefs);
      expect(result.success).toBe(false);
    });
  });

  describe("PaginationSchema", () => {
    it("should validate valid pagination", () => {
      const pagination = {
        limit: 20,
        offset: 0,
      };

      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(true);
    });

    it("should use defaults for missing values", () => {
      const pagination = {};

      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(0);
      }
    });

    it("should reject negative values", () => {
      const pagination = {
        limit: -5,
        offset: -1,
      };

      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(false);
    });

    it("should reject limit over maximum", () => {
      const pagination = {
        limit: 500,
      };

      const result = PaginationSchema.safeParse(pagination);
      expect(result.success).toBe(false);
    });
  });
});
