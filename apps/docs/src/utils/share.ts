/**
 * Share Utility
 *
 * Provides cross-platform sharing functionality using Web Share API
 * with fallbacks for unsupported browsers.
 */

export interface ShareData {
  title: string;
  text?: string;
  url: string;
}

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
export function getShareUrl(
  platform: "twitter" | "linkedin" | "email",
  data: ShareData
): string {
  const encodedUrl = encodeURIComponent(data.url);
  const encodedTitle = encodeURIComponent(data.title);
  const encodedText = encodeURIComponent(data.text || "");

  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "email":
      return `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0A${encodedUrl}`;
    default:
      return data.url;
  }
}

/**
 * Open platform-specific share dialog in new window
 */
export function shareOnPlatform(
  platform: "twitter" | "linkedin" | "email",
  data: ShareData
): void {
  const url = getShareUrl(platform, data);

  if (platform === "email") {
    window.location.href = url;
  } else {
    window.open(url, "_blank", "width=600,height=400,noopener,noreferrer");
  }
}
