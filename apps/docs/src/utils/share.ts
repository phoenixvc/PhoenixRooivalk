/**
 * Share Utility
 *
 * Provides cross-platform sharing functionality using Web Share API
 * with fallbacks for unsupported browsers.
 * Includes support for rich share previews via OG meta tags.
 */

export interface ShareData {
  title: string;
  text?: string;
  url: string;
  image?: string;
  hashtags?: string[];
}

export type SharePlatform =
  | "twitter"
  | "linkedin"
  | "facebook"
  | "reddit"
  | "hackernews"
  | "email"
  | "whatsapp"
  | "telegram";

/**
 * Check if native sharing is supported
 */
export function isShareSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.share;
}

/**
 * Share content using native share dialog or fallback
 * @returns true if shared successfully, false if cancelled/failed
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  // Try native share API first
  if (isShareSupported()) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name === "AbortError") {
        return false;
      }
      // Fall through to clipboard fallback
    }
  }

  // Fallback: Copy to clipboard
  try {
    await copyToClipboard(data.url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Generate share URL for specific platforms
 */
export function getShareUrl(platform: SharePlatform, data: ShareData): string {
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title);
  const encodedText = encodeURIComponent(data.text || data.title);
  const hashtags = data.hashtags?.join(",") || "";

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}${hashtags ? `&hashtags=${hashtags}` : ""}`;

    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

    case "reddit":
      return `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;

    case "hackernews":
      return `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`;

    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;

    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;

    case "email":
      return `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;

    default:
      return data.url;
  }
}

/**
 * Open platform-specific share dialog in new window
 */
export function shareOnPlatform(platform: SharePlatform, data: ShareData): void {
  const url = getShareUrl(platform, data);

  if (platform === "email") {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "width=600,height=400,noopener,noreferrer");
  }
}

/**
 * Platform configuration for UI display
 */
export const SHARE_PLATFORMS: Record<
  SharePlatform,
  { name: string; icon: string; color: string }
> = {
  twitter: { name: "Twitter/X", icon: "twitter", color: "#1DA1F2" },
  linkedin: { name: "LinkedIn", icon: "linkedin", color: "#0A66C2" },
  facebook: { name: "Facebook", icon: "facebook", color: "#1877F2" },
  reddit: { name: "Reddit", icon: "reddit", color: "#FF4500" },
  hackernews: { name: "Hacker News", icon: "hackernews", color: "#FF6600" },
  whatsapp: { name: "WhatsApp", icon: "whatsapp", color: "#25D366" },
  telegram: { name: "Telegram", icon: "telegram", color: "#0088CC" },
  email: { name: "Email", icon: "mail", color: "#6B7280" },
};

/**
 * Track share analytics
 */
export function trackShare(
  platform: SharePlatform,
  articleId: string,
  url: string,
): void {
  // This would integrate with your analytics service
  if (typeof window !== "undefined" && "gtag" in window) {
    (window as unknown as { gtag: Function }).gtag("event", "share", {
      method: platform,
      content_type: "article",
      content_id: articleId,
      item_id: url,
    });
  }
}
