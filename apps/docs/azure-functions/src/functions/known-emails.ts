/**
 * Known Emails HTTP Endpoints
 *
 * HTTP handlers for managing known internal user email mappings.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { validateAuthHeader } from "../lib/auth";
import { Errors, successResponse } from "../lib/utils";
import {
  knownEmailsService,
  AddKnownEmailData,
  UpdateKnownEmailData,
  AVAILABLE_PROFILE_KEYS,
} from "../services/known-emails.service";

/**
 * Get all known emails handler (admin)
 */
async function getKnownEmailsHandler(
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
    const search = request.query.get("search") || undefined;
    const profileKey = request.query.get("profileKey") || undefined;
    const isActive = request.query.get("isActive");
    const limit = parseInt(request.query.get("limit") || "100", 10);

    const result = await knownEmailsService.getEmails(
      {
        search,
        profileKey,
        isActive: isActive !== null ? isActive === "true" : undefined,
      },
      { limit },
    );

    return successResponse({
      emails: result.items,
      hasMore: result.hasMore,
    }, 200, request);
  } catch (error) {
    context.error("Failed to get known emails:", error);
    return Errors.internal("Failed to get known emails", request);
  }
}

/**
 * Get a single known email handler (admin)
 */
async function getKnownEmailHandler(
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
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Email ID is required", request);
    }

    const email = await knownEmailsService.getEmail(id);
    if (!email) {
      return Errors.notFound("Email not found", request);
    }

    return successResponse({ email }, 200, request);
  } catch (error) {
    context.error("Failed to get known email:", error);
    return Errors.internal("Failed to get email", request);
  }
}

/**
 * Add a known email handler (admin)
 */
async function addKnownEmailHandler(
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
    const data = (await request.json()) as AddKnownEmailData;

    const result = await knownEmailsService.addEmail(data, authResult.userId);

    if (!result.success) {
      return Errors.badRequest(result.error || "Failed to add email", request);
    }

    context.log(
      `Known email added: ${result.email?.email} for profile ${result.email?.profileKey} by ${authResult.userId}`,
    );

    return successResponse({ success: true, email: result.email }, 200, request);
  } catch (error) {
    context.error("Failed to add known email:", error);
    return Errors.internal("Failed to add email", request);
  }
}

/**
 * Update a known email handler (admin)
 */
async function updateKnownEmailHandler(
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
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Email ID is required", request);
    }

    const data = (await request.json()) as UpdateKnownEmailData;

    const result = await knownEmailsService.updateEmail(id, data);

    if (!result.success) {
      return Errors.badRequest(result.error || "Failed to update email", request);
    }

    context.log(`Known email updated: ${id} by ${authResult.userId}`);

    return successResponse({ success: true, email: result.email }, 200, request);
  } catch (error) {
    context.error("Failed to update known email:", error);
    return Errors.internal("Failed to update email", request);
  }
}

/**
 * Delete a known email handler (admin)
 */
async function deleteKnownEmailHandler(
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
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Email ID is required", request);
    }

    // Check if we should hard delete or soft delete
    const hardDelete = request.query.get("hard") === "true";

    let result;
    if (hardDelete) {
      result = await knownEmailsService.deleteEmail(id);
    } else {
      result = await knownEmailsService.deactivateEmail(id);
    }

    if (!result.success) {
      return Errors.badRequest(result.error || "Failed to delete email", request);
    }

    context.log(
      `Known email ${hardDelete ? "deleted" : "deactivated"}: ${id} by ${authResult.userId}`,
    );

    return successResponse({ success: true }, 200, request);
  } catch (error) {
    context.error("Failed to delete known email:", error);
    return Errors.internal("Failed to delete email", request);
  }
}

/**
 * Check if an email is a known internal email (public - used by frontend)
 */
async function checkKnownEmailHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  // Allow authenticated users to check their own email
  if (!authResult.valid) {
    return Errors.unauthenticated("Must be signed in", request);
  }

  try {
    // Get email from query parameter (required for this endpoint)
    const email = request.query.get("email");
    if (!email) {
      return Errors.badRequest("Email query parameter is required", request);
    }

    const profileKey = await knownEmailsService.getProfileKeyForEmail(email);

    return successResponse({
      isKnown: !!profileKey,
      profileKey: profileKey || null,
    }, 200, request);
  } catch (error) {
    context.error("Failed to check known email:", error);
    return Errors.internal("Failed to check email", request);
  }
}

/**
 * Get available profile keys (admin)
 */
async function getProfileKeysHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden("Admin access required", request);
  }

  return successResponse({
    profileKeys: AVAILABLE_PROFILE_KEYS,
  }, 200, request);
}

/**
 * Get known emails count (admin)
 */
async function getKnownEmailsCountHandler(
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
    const count = await knownEmailsService.getActiveCount();
    return successResponse({ count }, 200, request);
  } catch (error) {
    context.error("Failed to get known emails count:", error);
    return Errors.internal("Failed to get count", request);
  }
}

// Register endpoints
// IMPORTANT: Specific literal routes must be registered BEFORE parameterized routes
// Otherwise Azure Functions will match "check", "profile-keys", "count" as {id} values

// Base route - GET all known emails
app.http("getKnownEmails", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails",
  handler: getKnownEmailsHandler,
});

// POST to base route - add email
app.http("addKnownEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "known-emails",
  handler: addKnownEmailHandler,
});

// Specific literal routes - must come BEFORE parameterized {id} routes
app.http("checkKnownEmail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails/check",
  handler: checkKnownEmailHandler,
});

app.http("getProfileKeys", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails/profile-keys",
  handler: getProfileKeysHandler,
});

app.http("getKnownEmailsCount", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails/count",
  handler: getKnownEmailsCountHandler,
});

// Parameterized routes - must come AFTER specific literal routes
app.http("getKnownEmail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails/{id}",
  handler: getKnownEmailHandler,
});

app.http("updateKnownEmail", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "known-emails/{id}",
  handler: updateKnownEmailHandler,
});

app.http("deleteKnownEmail", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "known-emails/{id}",
  handler: deleteKnownEmailHandler,
});
