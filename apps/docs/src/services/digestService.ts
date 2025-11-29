/**
 * Digest Service
 *
 * Handles weekly/daily digest generation for comment notifications.
 * Aggregates comment activity and prepares digest data.
 * Features AI-generated personalized summaries (Wave 2).
 */

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  getDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { isFirebaseConfigured } from "./firebase";
import { aiService } from "./aiService";

export type DigestFrequency = "none" | "daily" | "weekly";

export interface CommentActivity {
  commentId: string;
  pageUrl: string;
  pageTitle: string;
  type: "reply" | "enhancement" | "approval" | "mention";
  actorName: string;
  actorEmail?: string;
  content: string;
  createdAt: string;
}

export interface DigestData {
  userId: string;
  email: string;
  frequency: DigestFrequency;
  periodStart: string;
  periodEnd: string;
  activities: CommentActivity[];
  stats: {
    totalReplies: number;
    totalEnhancements: number;
    totalApprovals: number;
    totalMentions: number;
    topPages: { url: string; title: string; count: number }[];
  };
  generatedAt: string;
  // AI-generated personalized summary (Wave 2)
  aiSummary?: {
    overview: string;
    highlights: string[];
    recommendation: string;
  };
}

export interface UserDigestPreferences {
  userId: string;
  email: string;
  frequency: DigestFrequency;
  lastDigestSent: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const PREFERENCES_COLLECTION = "digest_preferences";
const DIGEST_HISTORY_COLLECTION = "digest_history";

/**
 * Get user's digest preferences
 */
export async function getDigestPreferences(
  userId: string,
): Promise<UserDigestPreferences | null> {
  if (!isFirebaseConfigured()) return null;

  try {
    const db = getFirestore();
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserDigestPreferences;
    }
    return null;
  } catch (error) {
    console.error("Failed to get digest preferences:", error);
    return null;
  }
}

/**
 * Update user's digest preferences
 */
export async function updateDigestPreferences(
  userId: string,
  email: string,
  frequency: DigestFrequency,
): Promise<boolean> {
  if (!isFirebaseConfigured()) return false;

  try {
    const db = getFirestore();
    const docRef = doc(db, PREFERENCES_COLLECTION, userId);
    const existing = await getDoc(docRef);

    const now = new Date().toISOString();
    const data: UserDigestPreferences = {
      userId,
      email,
      frequency,
      lastDigestSent: existing.exists()
        ? existing.data().lastDigestSent
        : null,
      enabled: frequency !== "none",
      createdAt: existing.exists() ? existing.data().createdAt : now,
      updatedAt: now,
    };

    await setDoc(docRef, data);
    return true;
  } catch (error) {
    console.error("Failed to update digest preferences:", error);
    return false;
  }
}

/**
 * Get comment activities for a user within a time period
 */
export async function getCommentActivities(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<CommentActivity[]> {
  if (!isFirebaseConfigured()) return [];

  try {
    const db = getFirestore();

    // Query notifications for this user within the time period
    const notificationsRef = collection(db, "comment_notifications");
    const q = query(
      notificationsRef,
      where("authorId", "==", userId),
      where("createdAt", ">=", startDate.toISOString()),
      where("createdAt", "<=", endDate.toISOString()),
      orderBy("createdAt", "desc"),
      limit(100),
    );

    const snapshot = await getDocs(q);
    const activities: CommentActivity[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        commentId: data.commentId,
        pageUrl: data.pageUrl,
        pageTitle: data.pageTitle,
        type: determineActivityType(data),
        actorName: data.reviewerEmail?.split("@")[0] || "Someone",
        actorEmail: data.reviewerEmail,
        content: data.reviewNotes || "Interacted with your comment",
        createdAt: data.createdAt,
      });
    });

    return activities;
  } catch (error) {
    console.error("Failed to get comment activities:", error);
    return [];
  }
}

/**
 * Determine activity type from notification data
 */
function determineActivityType(
  data: Record<string, unknown>,
): CommentActivity["type"] {
  if (data.status === "approved") return "approval";
  if (data.aiEnhanced) return "enhancement";
  if (data.isReply) return "reply";
  return "mention";
}

/**
 * Generate digest data for a user
 */
export async function generateDigest(
  userId: string,
  email: string,
  frequency: DigestFrequency,
): Promise<DigestData | null> {
  if (frequency === "none") return null;

  const now = new Date();
  let startDate: Date;

  if (frequency === "daily") {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(0, 0, 0, 0);
  } else {
    // Weekly
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);
  }

  const activities = await getCommentActivities(userId, startDate, now);

  if (activities.length === 0) {
    return null; // No activities to report
  }

  // Calculate stats
  const stats = {
    totalReplies: activities.filter((a) => a.type === "reply").length,
    totalEnhancements: activities.filter((a) => a.type === "enhancement")
      .length,
    totalApprovals: activities.filter((a) => a.type === "approval").length,
    totalMentions: activities.filter((a) => a.type === "mention").length,
    topPages: calculateTopPages(activities),
  };

  return {
    userId,
    email,
    frequency,
    periodStart: startDate.toISOString(),
    periodEnd: now.toISOString(),
    activities,
    stats,
    generatedAt: now.toISOString(),
  };
}

/**
 * Calculate top pages by activity count
 */
function calculateTopPages(
  activities: CommentActivity[],
): { url: string; title: string; count: number }[] {
  const pageCounts: Record<string, { title: string; count: number }> = {};

  activities.forEach((activity) => {
    if (!pageCounts[activity.pageUrl]) {
      pageCounts[activity.pageUrl] = { title: activity.pageTitle, count: 0 };
    }
    pageCounts[activity.pageUrl].count++;
  });

  return Object.entries(pageCounts)
    .map(([url, data]) => ({ url, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * AI-powered: Generate a personalized summary for the digest
 * Uses AI to create engaging, personalized content
 */
export async function generateAIDigestSummary(
  digest: DigestData,
  userName?: string,
): Promise<DigestData["aiSummary"]> {
  try {
    // Build context for AI
    const activitySummary = digest.activities
      .slice(0, 10)
      .map((a) => `${a.type}: ${a.pageTitle} - ${a.content}`)
      .join("\n");

    const statsContext = `
Stats for this ${digest.frequency} period:
- ${digest.stats.totalReplies} replies to your comments
- ${digest.stats.totalApprovals} comments approved
- ${digest.stats.totalEnhancements} AI enhancements
- Most active pages: ${digest.stats.topPages.map((p) => p.title).join(", ")}
    `.trim();

    const prompt = `
Generate a brief, personalized digest summary for ${userName || "a user"} about their documentation activity.

${statsContext}

Recent activities:
${activitySummary}

Provide:
1. A 1-2 sentence personalized overview (friendly, encouraging tone)
2. 2-3 key highlights from their activity
3. A recommendation for what to read or engage with next

Keep it concise and actionable.
    `;

    const result = await aiService.askDocumentation(prompt, {
      format: "detailed",
    });

    // Parse the AI response
    const lines = result.answer.split("\n").filter((l) => l.trim());
    const overview = lines[0] || "You've been active in the community!";

    const highlights: string[] = [];
    const highlightLines = lines.filter(
      (l) => l.trim().startsWith("-") || l.trim().startsWith("•"),
    );
    highlights.push(
      ...highlightLines
        .slice(0, 3)
        .map((l) => l.replace(/^[-•]\s*/, "").trim()),
    );

    // Find recommendation (usually the last substantial line)
    const recommendation =
      lines.find((l) => l.toLowerCase().includes("recommend")) ||
      "Keep engaging with the documentation to earn more XP!";

    return {
      overview: overview.substring(0, 200),
      highlights: highlights.length > 0 ? highlights : ["Great activity this period!"],
      recommendation: recommendation.substring(0, 200),
    };
  } catch (error) {
    console.warn("Failed to generate AI digest summary:", error);
    // Return a default summary if AI fails
    return {
      overview: `You've had ${digest.activities.length} activities this ${digest.frequency === "daily" ? "day" : "week"}!`,
      highlights: [
        `${digest.stats.totalReplies} people replied to your comments`,
        `${digest.stats.totalApprovals} of your comments were approved`,
      ],
      recommendation: "Keep contributing to earn more XP and badges!",
    };
  }
}

/**
 * Record that a digest was sent
 */
export async function recordDigestSent(
  userId: string,
  digest: DigestData,
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    const db = getFirestore();

    // Update last sent timestamp
    const prefsRef = doc(db, PREFERENCES_COLLECTION, userId);
    await setDoc(
      prefsRef,
      { lastDigestSent: new Date().toISOString() },
      { merge: true },
    );

    // Store digest history
    const historyRef = doc(
      collection(db, DIGEST_HISTORY_COLLECTION),
      `${userId}_${Date.now()}`,
    );
    await setDoc(historyRef, digest);
  } catch (error) {
    console.error("Failed to record digest sent:", error);
  }
}

/**
 * Format digest as HTML email
 */
export function formatDigestEmail(digest: DigestData): string {
  const periodLabel =
    digest.frequency === "daily" ? "Daily" : "Weekly";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${periodLabel} Comment Digest</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a2e; color: #fff; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 20px; border: 1px solid #e0e0e0; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { text-align: center; padding: 15px; background: #f5f5f5; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: bold; color: #4fd1c5; }
    .stat-label { font-size: 12px; color: #666; }
    .activity { padding: 15px; border-bottom: 1px solid #eee; }
    .activity-type { font-size: 12px; color: #888; text-transform: uppercase; }
    .activity-content { margin-top: 5px; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your ${periodLabel} Comment Digest</h1>
      <p>Here's what happened with your comments</p>
    </div>
    <div class="content">
      ${
        digest.aiSummary
          ? `
      <div style="background: linear-gradient(135deg, #4fd1c5 0%, #38b2ac 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 16px;">${digest.aiSummary.overview}</p>
        <ul style="margin: 0; padding-left: 20px;">
          ${digest.aiSummary.highlights.map((h) => `<li>${h}</li>`).join("")}
        </ul>
        <p style="margin: 15px 0 0 0; font-style: italic; font-size: 14px;">${digest.aiSummary.recommendation}</p>
      </div>
      `
          : ""
      }

      <div class="stats">
        <div class="stat">
          <div class="stat-value">${digest.stats.totalReplies}</div>
          <div class="stat-label">Replies</div>
        </div>
        <div class="stat">
          <div class="stat-value">${digest.stats.totalApprovals}</div>
          <div class="stat-label">Approved</div>
        </div>
        <div class="stat">
          <div class="stat-value">${digest.stats.totalEnhancements}</div>
          <div class="stat-label">AI Enhanced</div>
        </div>
      </div>

      <h2>Recent Activity</h2>
      ${digest.activities
        .slice(0, 10)
        .map(
          (a) => `
        <div class="activity">
          <div class="activity-type">${a.type}</div>
          <div class="activity-content">
            <strong>${a.actorName}</strong> on <a href="${a.pageUrl}">${a.pageTitle}</a>
            <p>${a.content}</p>
          </div>
        </div>
      `,
        )
        .join("")}
    </div>
    <div class="footer">
      <p>You're receiving this because you subscribed to ${digest.frequency} digests.</p>
      <p><a href="/profile-settings">Manage your notification preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Format digest as plain text
 */
export function formatDigestText(digest: DigestData): string {
  const periodLabel =
    digest.frequency === "daily" ? "Daily" : "Weekly";

  let text = `Your ${periodLabel} Comment Digest\n`;
  text += `${"=".repeat(40)}\n\n`;

  text += `Summary:\n`;
  text += `- ${digest.stats.totalReplies} replies\n`;
  text += `- ${digest.stats.totalApprovals} comments approved\n`;
  text += `- ${digest.stats.totalEnhancements} AI enhancements\n\n`;

  text += `Recent Activity:\n`;
  text += `${"-".repeat(40)}\n`;

  digest.activities.slice(0, 10).forEach((a) => {
    text += `\n[${a.type.toUpperCase()}]\n`;
    text += `${a.actorName} on "${a.pageTitle}"\n`;
    text += `${a.content}\n`;
  });

  text += `\n${"-".repeat(40)}\n`;
  text += `Manage preferences: /profile-settings\n`;

  return text;
}

export default {
  getDigestPreferences,
  updateDigestPreferences,
  getCommentActivities,
  generateDigest,
  generateAIDigestSummary,
  recordDigestSent,
  formatDigestEmail,
  formatDigestText,
};
