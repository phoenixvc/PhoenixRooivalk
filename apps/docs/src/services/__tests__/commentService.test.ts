/**
 * Unit Tests for Comment Service
 *
 * Tests for validation, sanitization, and type guards
 * Note: Firestore operations require mocking and are tested separately
 */

import {
  sanitizeContent,
  validateContent,
  validateCreateInput,
  isValidCategory,
  isValidStatus,
  isValidAuthor,
  isComment,
} from "../commentService";
import type {
  Comment,
  CommentCategory,
  CommentStatus,
  CommentAuthor,
  CreateCommentInput,
} from "../../types/comments";

describe("Comment Service - Sanitization", () => {
  describe("sanitizeContent", () => {
    it("should remove HTML tags", () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitizeContent(input);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("</script>");
    });

    it("should strip HTML-like tags and escape remaining special characters", () => {
      // HTML-like tags are stripped, not escaped
      const input = 'Hello <World> & "Friends"';
      const result = sanitizeContent(input);
      // <World> is stripped as an HTML tag
      expect(result).not.toContain("<World>");
      // Remaining special characters are escaped
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;");
    });

    it("should escape ampersand and quote characters", () => {
      const input = 'Test & "quoted"';
      const result = sanitizeContent(input);
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;");
    });

    it("should preserve newlines", () => {
      const input = "Line 1\nLine 2\r\nLine 3";
      const result = sanitizeContent(input);
      expect(result).toContain("\n");
      expect(result.split("\n")).toHaveLength(3);
    });

    it("should remove control characters", () => {
      const input = "Hello\x00World\x1F";
      const result = sanitizeContent(input);
      expect(result).toBe("HelloWorld");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeContent(input);
      expect(result).toBe("Hello World");
    });

    it("should handle empty string", () => {
      const result = sanitizeContent("");
      expect(result).toBe("");
    });
  });
});

describe("Comment Service - Validation", () => {
  describe("validateContent", () => {
    it("should accept valid content", () => {
      const result = validateContent("This is a valid comment");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject empty content", () => {
      const result = validateContent("");
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Content is required");
    });

    it("should reject content that is too short after sanitization", () => {
      const result = validateContent("   ");
      expect(result.valid).toBe(false);
    });

    it("should reject content that exceeds max length", () => {
      const longContent = "a".repeat(5001);
      const result = validateContent(longContent);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("5000");
    });

    it("should accept content at max length", () => {
      const maxContent = "a".repeat(5000);
      const result = validateContent(maxContent);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateCreateInput", () => {
    const validInput: CreateCommentInput = {
      content: "This is a valid comment",
      pageId: "test-page",
      pageTitle: "Test Page",
      pageUrl: "/test-page",
      category: "comment",
      sendForReview: false,
    };

    it("should accept valid input", () => {
      const result = validateCreateInput(validInput);
      expect(result.valid).toBe(true);
    });

    it("should reject invalid content", () => {
      const input = { ...validInput, content: "" };
      const result = validateCreateInput(input);
      expect(result.valid).toBe(false);
    });

    it("should reject missing pageId", () => {
      const input = { ...validInput, pageId: "" };
      const result = validateCreateInput(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Page ID is required");
    });

    it("should reject missing pageTitle", () => {
      const input = { ...validInput, pageTitle: "" };
      const result = validateCreateInput(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Page title is required");
    });

    it("should reject missing pageUrl", () => {
      const input = { ...validInput, pageUrl: "" };
      const result = validateCreateInput(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Page URL is required");
    });

    it("should reject invalid category", () => {
      const input = { ...validInput, category: "invalid" as CommentCategory };
      const result = validateCreateInput(input);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("Invalid comment category");
    });
  });
});

describe("Comment Service - Type Guards", () => {
  describe("isValidCategory", () => {
    const validCategories: CommentCategory[] = [
      "comment",
      "change_request",
      "question",
      "suggestion",
      "bug_report",
    ];

    it("should return true for valid categories", () => {
      validCategories.forEach((category) => {
        expect(isValidCategory(category)).toBe(true);
      });
    });

    it("should return false for invalid categories", () => {
      expect(isValidCategory("invalid")).toBe(false);
      expect(isValidCategory("")).toBe(false);
      expect(isValidCategory(null)).toBe(false);
      expect(isValidCategory(undefined)).toBe(false);
      expect(isValidCategory(123)).toBe(false);
    });
  });

  describe("isValidStatus", () => {
    const validStatuses: CommentStatus[] = [
      "draft",
      "pending",
      "approved",
      "rejected",
      "implemented",
      "resolved",
    ];

    it("should return true for valid statuses", () => {
      validStatuses.forEach((status) => {
        expect(isValidStatus(status)).toBe(true);
      });
    });

    it("should return false for invalid statuses", () => {
      expect(isValidStatus("invalid")).toBe(false);
      expect(isValidStatus("")).toBe(false);
      expect(isValidStatus(null)).toBe(false);
      expect(isValidStatus(undefined)).toBe(false);
    });
  });

  describe("isValidAuthor", () => {
    const validAuthor: CommentAuthor = {
      uid: "user123",
      displayName: "John Doe",
      email: "john@example.com",
      photoURL: "https://example.com/photo.jpg",
    };

    it("should return true for valid author", () => {
      expect(isValidAuthor(validAuthor)).toBe(true);
    });

    it("should return true for author with null optional fields", () => {
      const author = {
        uid: "user123",
        displayName: null,
        email: null,
        photoURL: null,
      };
      expect(isValidAuthor(author)).toBe(true);
    });

    it("should return false for missing uid", () => {
      const author = { ...validAuthor, uid: "" };
      expect(isValidAuthor(author)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isValidAuthor(null)).toBe(false);
      expect(isValidAuthor(undefined)).toBe(false);
    });

    it("should return false for non-object", () => {
      expect(isValidAuthor("string")).toBe(false);
      expect(isValidAuthor(123)).toBe(false);
    });
  });

  describe("isComment", () => {
    const validComment: Comment = {
      id: "comment123",
      content: "Test comment",
      pageId: "page123",
      pageTitle: "Test Page",
      pageUrl: "/test",
      category: "comment",
      status: "pending",
      author: {
        uid: "user123",
        displayName: "John",
        email: "john@example.com",
        photoURL: null,
      },
      useAIVersion: false,
      sendForReview: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      isEdited: false,
    };

    it("should return true for valid comment", () => {
      expect(isComment(validComment)).toBe(true);
    });

    it("should return false for missing required fields", () => {
      const { id, ...missingId } = validComment;
      expect(isComment(missingId)).toBe(false);

      const { content, ...missingContent } = validComment;
      expect(isComment(missingContent)).toBe(false);
    });

    it("should return false for invalid category", () => {
      const comment = { ...validComment, category: "invalid" };
      expect(isComment(comment)).toBe(false);
    });

    it("should return false for invalid status", () => {
      const comment = { ...validComment, status: "invalid" };
      expect(isComment(comment)).toBe(false);
    });

    it("should return false for invalid author", () => {
      const comment = { ...validComment, author: { uid: "" } };
      expect(isComment(comment)).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isComment(null)).toBe(false);
      expect(isComment(undefined)).toBe(false);
    });
  });
});
