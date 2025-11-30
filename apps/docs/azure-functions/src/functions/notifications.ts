/**
 * Notifications HTTP Endpoints
 *
 * Subscription and notification management endpoints.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader, requireAuth } from "../lib/auth";
import { Errors, successResponse } from "../lib/utils";
import { notificationsService } from "../services";

/**
 * Subscribe to breaking news handler
 */
async function subscribeHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(request);
  if (!auth.authenticated) {
    return Errors.unauthenticated();
  }

  try {
    const { categories, pushEnabled, emailEnabled, pushToken, email } =
      (await request.json()) as {
        categories?: string[];
        pushEnabled?: boolean;
        emailEnabled?: boolean;
        pushToken?: string;
        email?: string;
      };

    const result = await notificationsService.subscribe(auth.userId!, {
      email,
      categories,
      pushEnabled,
      emailEnabled,
      pushToken,
    });

    context.log(`User ${auth.userId} subscribed to notifications`);

    return successResponse({
      success: true,
      ...result,
    });
  } catch (error) {
    context.error("Subscribe error:", error);
    return Errors.internal("Failed to subscribe");
  }
}

/**
 * Unsubscribe from notifications handler
 */
async function unsubscribeHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(request);
  if (!auth.authenticated) {
    return Errors.unauthenticated();
  }

  try {
    await notificationsService.unsubscribe(auth.userId!);

    context.log(`User ${auth.userId} unsubscribed from notifications`);

    return successResponse({ success: true });
  } catch (error) {
    context.error("Unsubscribe error:", error);
    return Errors.internal("Failed to unsubscribe");
  }
}

/**
 * Get subscription status handler
 */
async function getSubscriptionHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const auth = requireAuth(request);
  if (!auth.authenticated) {
    return Errors.unauthenticated();
  }

  try {
    const subscription = await notificationsService.getSubscription(
      auth.userId!,
    );

    return successResponse({
      isSubscribed: !!subscription,
      subscription: subscription
        ? {
            categories: subscription.categories,
            pushEnabled: subscription.pushEnabled,
            emailEnabled: subscription.emailEnabled,
          }
        : null,
    });
  } catch (error) {
    context.error("Get subscription error:", error);
    return Errors.internal("Failed to get subscription");
  }
}

/**
 * Mark article as breaking news handler (admin only)
 */
async function markBreakingHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const { articleId, isBreaking } = (await request.json()) as {
      articleId: string;
      isBreaking: boolean;
    };

    if (!articleId || typeof isBreaking !== "boolean") {
      return Errors.badRequest("articleId and isBreaking are required");
    }

    await notificationsService.markAsBreaking(articleId, isBreaking);

    context.log(
      `Article ${articleId} marked as ${isBreaking ? "breaking" : "normal"}`,
    );

    return successResponse({ success: true });
  } catch (error) {
    context.error("Mark breaking error:", error);
    return Errors.internal("Failed to update article");
  }
}

/**
 * Process email queue handler (admin/scheduled)
 */
async function processEmailQueueHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    // In production, you would pass a real email sending function
    // that integrates with SendGrid, Mailgun, etc.
    const result = await notificationsService.processEmailQueue();

    context.log(`Processed ${result.processed} emails, ${result.failed} failed`);

    return successResponse(result);
  } catch (error) {
    context.error("Process email queue error:", error);
    return Errors.internal("Failed to process email queue");
  }
}

/**
 * Send digest handler (admin/scheduled)
 */
async function sendDigestHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden();
  }

  try {
    const { frequency } = (await request.json()) as {
      frequency: "daily" | "weekly";
    };

    if (!frequency || !["daily", "weekly"].includes(frequency)) {
      return Errors.badRequest("frequency must be 'daily' or 'weekly'");
    }

    const result = await notificationsService.sendDigest(frequency);

    context.log(`Queued ${result.emailsQueued} ${frequency} digest emails`);

    return successResponse(result);
  } catch (error) {
    context.error("Send digest error:", error);
    return Errors.internal("Failed to send digest");
  }
}

// Register endpoints
app.http("subscribeToNews", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "notifications/subscribe",
  handler: subscribeHandler,
});

app.http("unsubscribeFromNews", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "notifications/unsubscribe",
  handler: unsubscribeHandler,
});

app.http("getNotificationSubscription", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "notifications/subscription",
  handler: getSubscriptionHandler,
});

app.http("markAsBreaking", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "news/breaking",
  handler: markBreakingHandler,
});

app.http("processEmailQueue", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "notifications/process-queue",
  handler: processEmailQueueHandler,
});

app.http("sendDigest", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "notifications/send-digest",
  handler: sendDigestHandler,
});
