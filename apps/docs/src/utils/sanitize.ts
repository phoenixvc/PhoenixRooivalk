/**
 * HTML Sanitization Utilities
 *
 * Provides secure HTML sanitization using DOMPurify to prevent XSS attacks.
 * Use these functions whenever rendering user-generated or AI-generated content.
 */

import DOMPurify from "dompurify";

/**
 * Allowed HTML tags for rich text content
 */
const ALLOWED_TAGS = [
  // Text formatting
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "strike",
  // Code
  "code",
  "pre",
  "kbd",
  // Structure
  "p",
  "br",
  "hr",
  "div",
  "span",
  // Lists
  "ul",
  "ol",
  "li",
  // Headers
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // Links (href will be sanitized)
  "a",
  // Tables
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  // Quotes
  "blockquote",
  // Other
  "sup",
  "sub",
  "mark",
];

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTR = [
  "href",
  "target",
  "rel",
  "class",
  "id",
  "title",
  "aria-label",
  "aria-hidden",
  "role",
];

/**
 * Configure DOMPurify with secure defaults
 */
function getConfig() {
  return {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Force all links to open in new tab with security attributes
    ADD_ATTR: ["target", "rel"],
    // Prevent protocol-based XSS
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    // Don't allow data: URIs
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    // Prevent DOM clobbering
    SANITIZE_DOM: true,
  };
}

/**
 * Sanitize HTML content to prevent XSS attacks
 * Use this when rendering any user-generated or AI-generated HTML content.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering with dangerouslySetInnerHTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: use basic escaping
    return escapeHtml(html);
  }

  const clean = DOMPurify.sanitize(html, getConfig()) as string;

  // Add security attributes to all links
  const div = document.createElement("div");
  div.innerHTML = clean;
  div.querySelectorAll("a").forEach((link) => {
    if (link.href && !link.href.startsWith(window.location.origin)) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });

  return div.innerHTML;
}

/**
 * Sanitize and format markdown content
 * Converts basic markdown to HTML and sanitizes the result.
 *
 * @param markdown - The markdown string to process
 * @returns Sanitized HTML string
 */
export function sanitizeMarkdown(markdown: string): string {
  const html = formatMarkdown(markdown);
  return sanitizeHtml(html);
}

/**
 * Simple markdown to HTML formatter
 * Handles common markdown patterns:
 * - Headers (# ## ###)
 * - Bold (**text**)
 * - Italic (*text*)
 * - Code blocks (```code```)
 * - Inline code (`code`)
 * - Lists (- item)
 * - Horizontal rules (---)
 * - Line breaks
 */
export function formatMarkdown(text: string): string {
  if (!text) return "";

  return (
    text
      // Escape HTML first to prevent XSS from raw input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      // Headers (must be at start of line)
      .replace(/^### (.*$)/gm, "<h4>$1</h4>")
      .replace(/^## (.*$)/gm, "<h3>$1</h3>")
      .replace(/^# (.*$)/gm, "<h2>$1</h2>")
      // Bold (must not be adjacent to more asterisks)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // Italic (single asterisks) - handle beginning/end of string and after non-asterisk chars
      .replace(/(^|[^*])\*([^*]+)\*($|[^*])/gm, "$1<em>$2</em>$3")
      // Code blocks (triple backticks)
      .replace(
        /```(\w*)\n?([\s\S]*?)```/g,
        (_match, _lang, code) => `<pre><code>${code.trim()}</code></pre>`,
      )
      // Inline code (single backticks)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // Unordered lists (- item)
      .replace(/^- (.+)$/gm, "<li>$1</li>")
      // Wrap consecutive li elements in ul
      .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
      // Horizontal rule
      .replace(/^---$/gm, "<hr />")
      // Line breaks (double newline = paragraph break)
      .replace(/\n\n/g, "</p><p>")
      // Single line breaks
      .replace(/\n/g, "<br />")
      // Wrap in paragraph if needed
      .replace(/^(?!<[hupol]|<li|<hr|<pre|<code)(.+)$/gm, "<p>$1</p>")
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, "")
      .replace(/<p>(<[hupol])/g, "$1")
      .replace(/(<\/[hupol].*?>)<\/p>/g, "$1")
  );
}

/**
 * Basic HTML escape for server-side rendering
 * Use this only when DOMPurify is not available (SSR)
 */
export function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replace(/[&<>"']/g, (char) => escapeMap[char]);
}

/**
 * Strip all HTML tags from a string
 * Use this for plain text output where no HTML should be present.
 *
 * @param html - The HTML string to strip
 * @returns Plain text with all HTML tags removed
 */
export function stripHtml(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: repeatedly remove tags until none remain
    let prev;
    do {
      prev = html;
      html = html.replace(/<[^>]*>/g, "");
    } while (html !== prev);
    return html;
  }

  // First sanitize the HTML using DOMPurify to remove any malicious content
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }) as string;
  // Convert HTML entities back to plain text by using a temporary element
  const div = document.createElement("div");
  div.textContent = sanitized;
  // Since we set textContent, no HTML parsing happens, but we need to decode entities
  div.innerHTML = sanitized;
  return div.textContent || div.innerText || "";
}

/**
 * Sanitize a URL to prevent javascript: and data: attacks
 *
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return "";
  }

  return url;
}
