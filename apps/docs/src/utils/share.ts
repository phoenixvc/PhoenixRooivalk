/**
 * Share Utility
 *
 * Provides cross-platform sharing functionality using Web Share API
 * with fallbacks for unsupported browsers.
 * Includes support for rich share previews via OG meta tags.
 * AI-enhanced share text generation (Wave 4)
 */

import { aiService } from "../services/aiService";

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

// ============================================================
// AI-Enhanced Share Text Generation (Wave 4)
// ============================================================

/**
 * Platform-specific character limits
 */
const PLATFORM_LIMITS: Record<SharePlatform, number> = {
  twitter: 280,
  linkedin: 700,
  facebook: 500,
  reddit: 300,
  hackernews: 200,
  whatsapp: 1000,
  telegram: 1000,
  email: 2000,
};

/**
 * Platform-specific tone/style
 */
const PLATFORM_STYLES: Record<SharePlatform, string> = {
  twitter: "concise, engaging, use relevant hashtags",
  linkedin: "professional, insightful, thought-leadership style",
  facebook: "friendly, conversational, engaging",
  reddit: "informative, direct, community-focused",
  hackernews: "technical, factual, understated",
  whatsapp: "casual, friendly, personal recommendation style",
  telegram: "direct, informative, with key highlights",
  email: "formal, detailed, professional summary",
};

/**
 * AI-generated share text result
 */
export interface AIShareText {
  /** Generated share text */
  text: string;
  /** Suggested hashtags */
  hashtags: string[];
  /** Platform this was optimized for */
  platform: SharePlatform;
  /** Confidence in the generation */
  confidence: number;
}

/**
 * Article content for share text generation
 */
export interface ArticleContent {
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  author?: string;
  source?: string;
}

/**
 * Generate AI-enhanced share text optimized for a specific platform
 */
export async function generateAIShareText(
  article: ArticleContent,
  platform: SharePlatform,
): Promise<AIShareText> {
  const charLimit = PLATFORM_LIMITS[platform];
  const style = PLATFORM_STYLES[platform];

  try {
    const context = `
Article to share:
Title: ${article.title}
${article.summary ? `Summary: ${article.summary}` : ""}
${article.category ? `Category: ${article.category}` : ""}
${article.source ? `Source: ${article.source}` : ""}
${article.content ? `Content excerpt: ${article.content.substring(0, 500)}...` : ""}
    `.trim();

    const prompt = `
Generate share text for ${SHARE_PLATFORMS[platform].name}:

${context}

Requirements:
- Maximum ${charLimit} characters (this is critical)
- Style: ${style}
- Make it compelling and shareable
- Include 2-3 relevant hashtags at the end for Twitter
- Focus on the key insight or value proposition
- Do NOT include the URL (it will be added automatically)

Respond with ONLY the share text, nothing else.
    `;

    const result = await aiService.askDocumentation(prompt, {
      format: "concise",
    });

    // Extract text and hashtags
    let text = result.answer.trim();
    const hashtagMatches = text.match(/#\w+/g) || [];
    const hashtags = hashtagMatches.map((h) => h.substring(1));

    // Remove hashtags from main text for non-Twitter platforms
    if (platform !== "twitter" && hashtags.length > 0) {
      text = text.replace(/#\w+\s*/g, "").trim();
    }

    // Ensure we're within character limit
    if (text.length > charLimit) {
      text = text.substring(0, charLimit - 3) + "...";
    }

    return {
      text,
      hashtags,
      platform,
      confidence:
        result.confidence === "high"
          ? 0.9
          : result.confidence === "medium"
            ? 0.7
            : 0.5,
    };
  } catch (error) {
    console.warn("Failed to generate AI share text:", error);
    // Fallback to simple share text
    return {
      text: article.summary || article.title,
      hashtags: [],
      platform,
      confidence: 0,
    };
  }
}

/**
 * Generate share text for multiple platforms at once
 */
export async function generateMultiPlatformShareText(
  article: ArticleContent,
  platforms: SharePlatform[] = ["twitter", "linkedin", "facebook"],
): Promise<Map<SharePlatform, AIShareText>> {
  const results = new Map<SharePlatform, AIShareText>();

  // Generate for all platforms in parallel
  const promises = platforms.map(async (platform) => {
    const shareText = await generateAIShareText(article, platform);
    results.set(platform, shareText);
  });

  await Promise.all(promises);
  return results;
}

/**
 * Generate AI-enhanced share data with optimized text
 */
export async function createAIEnhancedShareData(
  article: ArticleContent,
  url: string,
  platform?: SharePlatform,
): Promise<ShareData> {
  // If platform specified, generate optimized text
  if (platform) {
    const aiText = await generateAIShareText(article, platform);
    return {
      title: article.title,
      text: aiText.text,
      url,
      hashtags: aiText.hashtags,
    };
  }

  // Default: generate generic share text
  const aiText = await generateAIShareText(article, "twitter");
  return {
    title: article.title,
    text: aiText.text,
    url,
    hashtags: aiText.hashtags,
  };
}

/**
 * Share with AI-enhanced text
 */
export async function shareWithAI(
  article: ArticleContent,
  url: string,
  platform?: SharePlatform,
): Promise<boolean> {
  const shareData = await createAIEnhancedShareData(article, url, platform);

  if (platform) {
    shareOnPlatform(platform, shareData);
    return true;
  }

  return shareContent(shareData);
}
