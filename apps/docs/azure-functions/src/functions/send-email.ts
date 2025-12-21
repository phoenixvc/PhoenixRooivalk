/**
 * Send Email HTTP Endpoint
 *
 * Provides authenticated email sending capabilities via SendGrid or Azure Communication Services.
 * Requires authentication and applies rate limiting to prevent abuse.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader } from "../lib/auth";
import {
  Errors,
  successResponse,
  applyRateLimit,
  RateLimits,
} from "../lib/utils";
import { sendEmail, EmailMessage } from "../lib/email";

/**
 * Email request payload
 */
interface SendEmailRequest {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

/**
 * Validate email request
 */
function validateEmailRequest(data: SendEmailRequest): string | null {
  if (!data.to?.trim()) {
    return "Recipient email is required";
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const recipients = data.to
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);

  for (const email of recipients) {
    if (!emailRegex.test(email)) {
      return `Invalid email address: ${email}`;
    }
  }

  if (!data.subject?.trim()) {
    return "Subject is required";
  }

  if (!data.body?.trim()) {
    return "Email body is required";
  }

  // Limit body length to prevent abuse
  if (data.body.length > 50000) {
    return "Email body exceeds maximum length (50,000 characters)";
  }

  return null;
}

/**
 * Send email handler
 */
async function sendEmailHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Rate limiting - strict limits for email sending
  const rateLimit = applyRateLimit(request, "send-email", {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 emails per hour per IP
  });
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    // Require authentication
    const authResult = await validateAuthHeader(
      request.headers.get("authorization"),
    );

    if (!authResult.valid) {
      return Errors.unauthenticated("Authentication required to send emails", request);
    }

    const data = (await request.json()) as SendEmailRequest;

    // Validate input
    const validationError = validateEmailRequest(data);
    if (validationError) {
      return Errors.badRequest(validationError, request);
    }

    // Parse recipients
    const toRecipients = data.to
      .split(/[,;]/)
      .map((e) => e.trim())
      .filter(Boolean);

    // Build email message
    const message: EmailMessage = {
      to: toRecipients,
      subject: data.subject,
    };

    if (data.isHtml) {
      message.html = data.body;
    } else {
      message.text = data.body;
    }

    // Send the email
    const result = await sendEmail(message);

    if (result.success) {
      context.log(
        `Email sent successfully to ${toRecipients.length} recipients`,
        {
          userId: authResult.userId,
          messageId: result.messageId,
        },
      );

      return successResponse({
        success: true,
        messageId: result.messageId,
      }, 200, request);
    } else {
      context.warn("Email sending failed", {
        userId: authResult.userId,
        error: result.error,
      });

      return Errors.internal(result.error || "Failed to send email", request);
    }
  } catch (error) {
    context.error("Send email handler error:", error);
    return Errors.internal("Failed to send email. Please try again.", request);
  }
}

/**
 * Check email service status
 */
async function emailStatusHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const hasProvider = !!(
      process.env.SENDGRID_API_KEY ||
      process.env.AZURE_COMMUNICATION_CONNECTION_STRING
    );

    return successResponse({
      available: hasProvider,
      provider:
        process.env.EMAIL_PROVIDER ||
        (process.env.SENDGRID_API_KEY
          ? "sendgrid"
          : process.env.AZURE_COMMUNICATION_CONNECTION_STRING
            ? "azure"
            : "none"),
    }, 200, request);
  } catch (error) {
    context.error("Email status check failed:", error);
    return Errors.internal("Failed to check email status", request);
  }
}

// Register functions
app.http("sendEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "email/send",
  handler: sendEmailHandler,
});

app.http("emailStatus", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "email/status",
  handler: emailStatusHandler,
});
