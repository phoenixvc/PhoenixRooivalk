/**
 * Support HTTP Endpoints
 *
 * Thin HTTP handler layer that delegates to SupportService.
 * Uses shared utilities for error handling and rate limiting.
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
import { supportService, ContactFormData } from "../services";

/**
 * Submit contact form handler
 */
async function submitContactFormHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Rate limiting for form submissions
  const rateLimit = applyRateLimit(request, "contact-form", RateLimits.form);
  if (!rateLimit.allowed) return rateLimit.response!;

  try {
    const data = (await request.json()) as ContactFormData;

    // Validate input
    const validationError = supportService.validateContactForm(data);
    if (validationError) {
      return Errors.badRequest(validationError, request);
    }

    // Check for authenticated user
    const authResult = await validateAuthHeader(
      request.headers.get("authorization"),
    );

    const result = await supportService.submitContactForm(
      data,
      authResult.valid ? authResult.userId : undefined,
    );

    context.log(`Contact form submitted: ${result.ticketNumber}`);

    return successResponse(
      {
        success: true,
        ticketNumber: result.ticketNumber,
        message:
          "Your message has been received. We'll respond within 1-2 business days.",
      },
      200,
      request,
    );
  } catch (error) {
    context.error("Failed to submit contact form:", error);
    return Errors.internal(
      "Failed to submit contact form. Please try again.",
      request,
    );
  }
}

/**
 * Get latest content timestamps handler
 */
async function getLatestContentTimestampsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  try {
    const timestamps = await supportService.getLatestTimestamps();
    return successResponse(timestamps, 200, request);
  } catch (error) {
    context.error("Failed to get content timestamps:", error);
    return Errors.internal("Failed to get content timestamps", request);
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
    return Errors.unauthenticated("Must be signed in", request);
  }

  try {
    const result = await supportService.getUserTickets(authResult.userId!);
    return successResponse({ tickets: result.items }, 200, request);
  } catch (error) {
    context.error("Failed to get user tickets:", error);
    return Errors.internal("Failed to get tickets", request);
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
    return Errors.forbidden("Admin access required", request);
  }

  try {
    const { status, category, limit } = Object.fromEntries(
      request.query.entries(),
    );

    const result = await supportService.getAdminTickets(
      { status, category },
      parseInt(limit || "100", 10),
    );

    return successResponse({ tickets: result.items }, 200, request);
  } catch (error) {
    context.error("Failed to get admin tickets:", error);
    return Errors.internal("Failed to get tickets", request);
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
    return Errors.forbidden("Admin access required", request);
  }

  try {
    const { ticketId, status, response } = (await request.json()) as {
      ticketId: string;
      status: string;
      response?: string;
    };

    if (!ticketId || !status) {
      return Errors.badRequest("ticketId and status are required", request);
    }

    const ticket = await supportService.updateTicketStatus(
      ticketId,
      status as "new" | "in_progress" | "resolved" | "closed",
      response,
      authResult.userId,
    );

    if (!ticket) {
      return Errors.notFound("Ticket not found", request);
    }

    context.log(`Ticket ${ticketId} updated to ${status}`);

    return successResponse({ success: true }, 200, request);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid status") {
      return Errors.badRequest("Invalid status", request);
    }
    context.error("Failed to update ticket:", error);
    return Errors.internal("Failed to update ticket", request);
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
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "getLatestContentTimestamps",
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
