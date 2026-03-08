import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "@phoenix-rooivalk/utils";

describe("serializeJsonLd", () => {
  it("should stringify a simple object", () => {
    const data = { key: "value" };
    expect(serializeJsonLd(data)).toBe('{"key":"value"}');
  });

  it("should escape < and > characters to prevent </script> breakout", () => {
    const data = {
      description: "This is a </script><script>alert('XSS')</script> test",
    };
    const result = serializeJsonLd(data);
    expect(result).not.toContain("</script>");
    expect(result).not.toContain("<script>");
    expect(result).toContain("\\u003c/script\\u003e");
    expect(result).toContain("\\u003cscript\\u003e");
    expect(result).toBe(
      '{"description":"This is a \\u003c/script\\u003e\\u003cscript\\u003ealert(\'XSS\')\\u003c/script\\u003e test"}'
    );
  });

  it("should handle nested objects", () => {
    const data = {
      "@context": "https://schema.org",
      mainEntity: [
        {
          name: "<b>Question</b>",
        },
      ],
    };
    const result = serializeJsonLd(data);
    expect(result).toContain("\\u003cb\\u003eQuestion\\u003c/b\\u003e");
  });

  it("should return empty object string for non-serializable data", () => {
    // JSON.stringify returns undefined for functions
    expect(serializeJsonLd(() => {})).toBe("{}");
  });
});
