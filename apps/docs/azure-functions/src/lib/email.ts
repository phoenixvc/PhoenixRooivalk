/**
 * Email Service
 *
 * Provides email sending capabilities using SendGrid or Azure Communication Services.
 *
 * Environment Variables:
 * - EMAIL_PROVIDER: "sendgrid" | "azure" (default: sendgrid)
 * - SENDGRID_API_KEY: SendGrid API key
 * - SENDGRID_FROM_EMAIL: Sender email address
 * - AZURE_COMMUNICATION_CONNECTION_STRING: Azure Communication Services connection string
 * - AZURE_COMMUNICATION_FROM_EMAIL: Azure sender email address
 */

import { createLogger, Logger } from "./logger";

const logger: Logger = createLogger({ feature: "email-service" });

/**
 * Email message structure
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, unknown>;
}

/**
 * Email send result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get the configured email provider
 */
function getEmailProvider(): "sendgrid" | "azure" | "none" {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  if (provider === "azure") return "azure";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.AZURE_COMMUNICATION_CONNECTION_STRING) return "azure";
  return "none";
}

/**
 * Send email via SendGrid
 */
async function sendViaSendGrid(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL || "noreply@phoenixrooivalk.com";

  if (!apiKey) {
    return { success: false, error: "SENDGRID_API_KEY not configured" };
  }

  const recipients = Array.isArray(message.to) ? message.to : [message.to];

  const payload: Record<string, unknown> = {
    personalizations: recipients.map((email) => ({
      to: [{ email }],
      dynamic_template_data: message.dynamicTemplateData,
    })),
    from: { email: fromEmail },
    subject: message.subject,
  };

  // Use template if provided
  if (message.templateId) {
    payload.template_id = message.templateId;
  } else {
    payload.content = [];
    if (message.text) {
      (payload.content as Array<{ type: string; value: string }>).push({
        type: "text/plain",
        value: message.text,
      });
    }
    if (message.html) {
      (payload.content as Array<{ type: string; value: string }>).push({
        type: "text/html",
        value: message.html,
      });
    }
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 202) {
      const messageId = response.headers.get("x-message-id") || undefined;
      logger.info("Email sent successfully via SendGrid", {
        recipients: recipients.length,
        messageId,
      });
      return { success: true, messageId };
    }

    const errorText = await response.text();
    logger.error("SendGrid API error", {
      status: response.status,
      error: errorText,
    });
    return { success: false, error: `SendGrid error: ${response.status}` };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to send email via SendGrid", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send email via Azure Communication Services
 */
async function sendViaAzure(message: EmailMessage): Promise<EmailResult> {
  const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;
  const fromEmail =
    process.env.AZURE_COMMUNICATION_FROM_EMAIL ||
    "DoNotReply@phoenixrooivalk.com";

  if (!connectionString) {
    return {
      success: false,
      error: "AZURE_COMMUNICATION_CONNECTION_STRING not configured",
    };
  }

  // Parse connection string
  const endpointMatch = connectionString.match(/endpoint=([^;]+)/i);
  const accessKeyMatch = connectionString.match(/accesskey=([^;]+)/i);

  if (!endpointMatch || !accessKeyMatch) {
    return { success: false, error: "Invalid Azure connection string format" };
  }

  const endpoint = endpointMatch[1];
  const accessKey = accessKeyMatch[1];

  const recipients = Array.isArray(message.to) ? message.to : [message.to];

  const payload = {
    senderAddress: fromEmail,
    recipients: {
      to: recipients.map((email) => ({ address: email })),
    },
    content: {
      subject: message.subject,
      plainText: message.text || "",
      html: message.html || "",
    },
  };

  try {
    // Azure Communication Services Email API
    const url = `${endpoint}/emails:send?api-version=2023-03-31`;

    // Create HMAC signature for authentication
    const date = new Date().toUTCString();
    const contentHash = await computeContentHash(JSON.stringify(payload));
    const stringToSign = `POST\n${new URL(url).pathname}${new URL(url).search}\n${date};${new URL(url).host};${contentHash}`;

    const signature = await computeHmacSha256(accessKey, stringToSign);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ms-date": date,
        "x-ms-content-sha256": contentHash,
        Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const result = (await response.json()) as { id?: string };
      logger.info("Email sent successfully via Azure", {
        recipients: recipients.length,
        messageId: result.id,
      });
      return { success: true, messageId: result.id };
    }

    const errorText = await response.text();
    logger.error("Azure Communication Services error", {
      status: response.status,
      error: errorText,
    });
    return { success: false, error: `Azure error: ${response.status}` };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to send email via Azure", { error: errorMessage });
    return { success: false, error: errorMessage };
  }
}

/**
 * Compute SHA-256 hash of content
 */
async function computeContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Compute HMAC-SHA256 signature
 */
async function computeHmacSha256(
  key: string,
  message: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = Uint8Array.from(atob(key), (c) => c.charCodeAt(0));
  const messageData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Send an email using the configured provider
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const provider = getEmailProvider();

  logger.info("Sending email", {
    provider,
    recipients: Array.isArray(message.to) ? message.to.length : 1,
    subject: message.subject,
  });

  switch (provider) {
    case "sendgrid":
      return sendViaSendGrid(message);
    case "azure":
      return sendViaAzure(message);
    case "none":
      logger.warn("No email provider configured, email not sent");
      return { success: false, error: "No email provider configured" };
  }
}

/**
 * Send a batch of emails
 */
export async function sendBatchEmails(
  messages: EmailMessage[],
): Promise<EmailResult[]> {
  logger.info("Sending batch emails", { count: messages.length });

  const results = await Promise.all(messages.map((msg) => sendEmail(msg)));

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info("Batch email complete", { successful, failed });

  return results;
}

/**
 * Email templates
 */
export const EmailTemplates = {
  /**
   * Breaking news alert
   */
  breakingNews: (article: {
    title: string;
    summary: string;
    url: string;
  }): EmailMessage => ({
    to: [], // filled in by caller
    subject: `🚨 Breaking News: ${article.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">🚨 Breaking News</h1>
        <h2>${article.title}</h2>
        <p>${article.summary}</p>
        <a href="${article.url}" style="display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          Read Full Article
        </a>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          You received this email because you subscribed to breaking news alerts from Phoenix Rooivalk.
          <a href="${process.env.BASE_URL || "https://docs-phoenixrooivalk.netlify.app"}/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `,
  }),

  /**
   * Daily digest
   */
  dailyDigest: (articles: Array<{ title: string; summary: string; url: string }>): EmailMessage => ({
    to: [],
    subject: "📰 Your Daily News Digest",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">📰 Daily Digest</h1>
        <p>Here are today's top stories:</p>
        ${articles
          .map(
            (article) => `
          <div style="margin: 16px 0; padding: 16px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0;">${article.title}</h3>
            <p style="margin: 0 0 12px 0; color: #666;">${article.summary}</p>
            <a href="${article.url}" style="color: #f97316;">Read more →</a>
          </div>
        `,
          )
          .join("")}
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          <a href="${process.env.BASE_URL || "https://docs-phoenixrooivalk.netlify.app"}/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `,
  }),

  /**
   * Weekly digest
   */
  weeklyDigest: (
    articles: Array<{ title: string; summary: string; url: string }>,
    stats: { totalArticles: number; topCategories: string[] },
  ): EmailMessage => ({
    to: [],
    subject: "📊 Your Weekly News Digest",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f97316;">📊 Weekly Digest</h1>
        <p>This week we published <strong>${stats.totalArticles}</strong> articles across ${stats.topCategories.join(", ")}.</p>
        <h2>Top Stories This Week</h2>
        ${articles
          .slice(0, 10)
          .map(
            (article) => `
          <div style="margin: 16px 0; padding: 16px; border: 1px solid #eee; border-radius: 8px;">
            <h3 style="margin: 0 0 8px 0;">${article.title}</h3>
            <p style="margin: 0 0 12px 0; color: #666;">${article.summary}</p>
            <a href="${article.url}" style="color: #f97316;">Read more →</a>
          </div>
        `,
          )
          .join("")}
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">
          <a href="${process.env.BASE_URL || "https://docs-phoenixrooivalk.netlify.app"}/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    `,
  }),
};
