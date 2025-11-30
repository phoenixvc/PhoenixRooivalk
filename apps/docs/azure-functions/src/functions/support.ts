/**
 * Support Functions for Azure
 *
 * Handles contact form submissions, support tickets, and notification timestamps.
 * Ported from Firebase Cloud Functions to Azure Functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer, queryDocuments, upsertDocument } from "../lib/cosmos";
import { validateAuthHeader } from "../lib/auth";

/**
 * Contact form submission data
 */
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "general" | "technical" | "sales" | "partnership" | "feedback";
}

/**
 * Contact ticket stored in Cosmos DB
 */
interface ContactTicket extends ContactFormData {
  id: string;
  userId?: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  ticketNumber: string;
}

// In-memory rate limiting
const rateLimits = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit
 */
function checkRateLimit(
  key: string,
  maxRequests: number = 5,
  windowMs: number = 60000,
): boolean {
  const now = Date.now();
  const limit = rateLimits.get(key);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Generate a unique ticket number
 */
function generateTicketNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PHX-${timestamp}-${random}`;
}

/**
 * Determine priority based on category
 */
function determinePriority(
  category: ContactFormData["category"],
): ContactTicket["priority"] {
  switch (category) {
    case "technical":
      return "high";
    case "sales":
    case "partnership":
      return "medium";
    default:
      return "low";
  }
}

/**
 * Sanitize input (basic XSS prevention)
 */
function sanitize(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .trim();
}

/**
 * Submit contact form handler
 */
async function submitContactFormHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Rate limiting - use IP-based identifier for anonymous submissions
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
  const rateLimitKey = `contact_${clientIp}`;

  if (!checkRateLimit(rateLimitKey, 5, 60000)) {
    return {
      status: 429,
      jsonBody: {
        error: "Too many requests. Please wait before submitting another message.",
        code: "resource-exhausted",
      },
    };
  }

  try {
    const data = (await request.json()) as ContactFormData;

    // Validate input
    if (!data.name || !data.email || !data.subject || !data.message) {
      return {
        status: 400,
        jsonBody: {
          error: "Name, email, subject, and message are required",
          code: "invalid-argument",
        },
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        status: 400,
        jsonBody: { error: "Invalid email format", code: "invalid-argument" },
      };
    }

    // Validate category
    const validCategories = [
      "general",
      "technical",
      "sales",
      "partnership",
      "feedback",
    ];
    if (!validCategories.includes(data.category)) {
      data.category = "general";
    }

    // Check for authenticated user
    const authResult = await validateAuthHeader(
      request.headers.get("authorization"),
    );

    const ticketNumber = generateTicketNumber();
    const now = new Date().toISOString();
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const ticket: ContactTicket = {
      id: ticketId,
      name: sanitize(data.name),
      email: data.email.toLowerCase().trim(),
      subject: sanitize(data.subject),
      message: sanitize(data.message),
      category: data.category,
      userId: authResult.valid ? authResult.userId : undefined,
      status: "new",
      priority: determinePriority(data.category),
      ticketNumber,
      createdAt: now,
      updatedAt: now,
    };

    // Save to Cosmos DB
    await upsertDocument("support_tickets", ticket);

    context.log(`Contact form submitted: ${ticketNumber}`);

    // Update latest support timestamp for notifications
    await upsertDocument("metadata", {
      id: "latest_updates",
      supportUpdatedAt: now,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        ticketNumber,
        message:
          "Your message has been received. We'll respond within 1-2 business days.",
      },
    };
  } catch (error) {
    context.error("Failed to submit contact form:", error);
    return {
      status: 500,
      jsonBody: {
        error: "Failed to submit contact form. Please try again.",
        code: "internal",
      },
    };
  }
}

/**
 * Get latest content timestamps handler
 */
async function getLatestContentTimestampsHandler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const container = getContainer("metadata");

    try {
      const { resource } = await container
        .item("latest_updates", "latest_updates")
        .read();

      if (resource) {
        return {
          status: 200,
          jsonBody: {
            newsUpdatedAt: resource.newsUpdatedAt
              ? new Date(resource.newsUpdatedAt).getTime()
              : Date.now(),
            supportUpdatedAt: resource.supportUpdatedAt
              ? new Date(resource.supportUpdatedAt).getTime()
              : Date.now(),
            docsUpdatedAt: resource.docsUpdatedAt
              ? new Date(resource.docsUpdatedAt).getTime()
              : Date.now(),
          },
        };
      }
    } catch {
      // Document doesn't exist
    }

    // Initialize with current timestamps if not exists
    const now = new Date().toISOString();
    await upsertDocument("metadata", {
      id: "latest_updates",
      newsUpdatedAt: now,
      supportUpdatedAt: now,
      docsUpdatedAt: now,
    });

    return {
      status: 200,
      jsonBody: {
        newsUpdatedAt: Date.now(),
        supportUpdatedAt: Date.now(),
        docsUpdatedAt: Date.now(),
      },
    };
  } catch (error) {
    context.error("Failed to get content timestamps:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get content timestamps", code: "internal" },
    };
  }
}

/**
 * Get user's support tickets handler
 */
async function getUserTicketsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return {
      status: 401,
      jsonBody: { error: "Must be logged in to view tickets", code: "unauthenticated" },
    };
  }

  try {
    const tickets = await queryDocuments<ContactTicket>(
      "support_tickets",
      "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.createdAt DESC OFFSET 0 LIMIT 50",
      [{ name: "@userId", value: authResult.userId! }],
    );

    return {
      status: 200,
      jsonBody: { tickets },
    };
  } catch (error) {
    context.error("Failed to get user tickets:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get tickets", code: "internal" },
    };
  }
}

/**
 * Get admin tickets handler
 */
async function getAdminTicketsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: {
        error: "Only admins can view all tickets",
        code: "permission-denied",
      },
    };
  }

  try {
    const { status, category, limit } = Object.fromEntries(
      request.query.entries(),
    );

    let query = "SELECT * FROM c";
    const conditions: string[] = [];
    const parameters: Array<{ name: string; value: string }> = [];

    if (status) {
      conditions.push("c.status = @status");
      parameters.push({ name: "@status", value: status });
    }

    if (category) {
      conditions.push("c.category = @category");
      parameters.push({ name: "@category", value: category });
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += ` ORDER BY c.createdAt DESC OFFSET 0 LIMIT ${parseInt(limit || "100", 10)}`;

    const tickets = await queryDocuments<ContactTicket>(
      "support_tickets",
      query,
      parameters,
    );

    return {
      status: 200,
      jsonBody: { tickets },
    };
  } catch (error) {
    context.error("Failed to get admin tickets:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to get tickets", code: "internal" },
    };
  }
}

/**
 * Update ticket status handler
 */
async function updateTicketStatusHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return {
      status: 403,
      jsonBody: { error: "Only admins can update tickets", code: "permission-denied" },
    };
  }

  try {
    const { ticketId, status, response } = (await request.json()) as {
      ticketId: string;
      status: string;
      response?: string;
    };

    const validStatuses = ["new", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return {
        status: 400,
        jsonBody: { error: "Invalid status", code: "invalid-argument" },
      };
    }

    // Get existing ticket
    const container = getContainer("support_tickets");
    const { resource: existingTicket } = await container
      .item(ticketId, ticketId)
      .read<ContactTicket>();

    if (!existingTicket) {
      return {
        status: 404,
        jsonBody: { error: "Ticket not found", code: "not-found" },
      };
    }

    const now = new Date().toISOString();
    const updatedTicket = {
      ...existingTicket,
      status,
      updatedAt: now,
      ...(response && {
        adminResponse: response,
        respondedAt: now,
        respondedBy: authResult.userId,
      }),
    };

    await upsertDocument("support_tickets", updatedTicket);

    context.log(`Ticket ${ticketId} updated to ${status}`);

    return {
      status: 200,
      jsonBody: { success: true },
    };
  } catch (error) {
    context.error("Failed to update ticket:", error);
    return {
      status: 500,
      jsonBody: { error: "Failed to update ticket", code: "internal" },
    };
  }
}

// Register endpoints
app.http("submitContactForm", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "support/contact",
  handler: submitContactFormHandler,
});

app.http("getLatestContentTimestamps", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "support/timestamps",
  handler: getLatestContentTimestampsHandler,
});

app.http("getUserTickets", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "support/tickets/user",
  handler: getUserTicketsHandler,
});

app.http("getAdminTickets", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "support/tickets/admin",
  handler: getAdminTicketsHandler,
});

app.http("updateTicketStatus", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "support/tickets",
  handler: updateTicketStatusHandler,
});
