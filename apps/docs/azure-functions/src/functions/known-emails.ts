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
    return Errors.forbidden();
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
    });
  } catch (error) {
    context.error("Failed to get known emails:", error);
    return Errors.internal("Failed to get known emails");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Email ID is required");
    }

    const email = await knownEmailsService.getEmail(id);
    if (!email) {
      return Errors.notFound("Email not found");
    }

    return successResponse({ email });
  } catch (error) {
    context.error("Failed to get known email:", error);
    return Errors.internal("Failed to get email");
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
    return Errors.forbidden();
  }

  try {
    const data = (await request.json()) as AddKnownEmailData;

    const result = await knownEmailsService.addEmail(data, authResult.userId);

    if (!result.success) {
      return Errors.badRequest(result.error || "Failed to add email");
    }

    context.log(
      `Known email added: ${result.email?.email} for profile ${result.email?.profileKey} by ${authResult.userId}`,
    );

    return successResponse({ success: true, email: result.email });
  } catch (error) {
    context.error("Failed to add known email:", error);
    return Errors.internal("Failed to add email");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Email ID is required");
    }

    const data = (await request.json()) as UpdateKnownEmailData;

    const result = await knownEmailsService.updateEmail(id, data);

    if (!result.success) {
      return Errors.badRequest(result.error || "Failed to update email");
    }

    context.log(`Known email updated: ${id} by ${authResult.userId}`);

    return successResponse({ success: true, email: result.email });
  } catch (error) {
    context.error("Failed to update known email:", error);
    return Errors.internal("Failed to update email");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Email ID is required");
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
      return Errors.badRequest(result.error || "Failed to delete email");
    }

    context.log(
      `Known email ${hardDelete ? "deleted" : "deactivated"}: ${id} by ${authResult.userId}`,
    );

    return successResponse({ success: true });
  } catch (error) {
    context.error("Failed to delete known email:", error);
    return Errors.internal("Failed to delete email");
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
    return Errors.unauthenticated();
  }

  try {
    // Get email from query parameter (required for this endpoint)
    const email = request.query.get("email");
    if (!email) {
      return Errors.badRequest("Email query parameter is required");
    }

    const profileKey = await knownEmailsService.getProfileKeyForEmail(email);

    return successResponse({
      isKnown: !!profileKey,
      profileKey: profileKey || null,
    });
  } catch (error) {
    context.error("Failed to check known email:", error);
    return Errors.internal("Failed to check email");
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
    return Errors.forbidden();
  }

  return successResponse({
    profileKeys: AVAILABLE_PROFILE_KEYS,
  });
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
    return Errors.forbidden();
  }

  try {
    const count = await knownEmailsService.getActiveCount();
    return successResponse({ count });
  } catch (error) {
    context.error("Failed to get known emails count:", error);
    return Errors.internal("Failed to get count");
  }
}

// Register endpoints
app.http("getKnownEmails", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails",
  handler: getKnownEmailsHandler,
});

app.http("getKnownEmail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "known-emails/{id}",
  handler: getKnownEmailHandler,
});

app.http("addKnownEmail", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "known-emails",
  handler: addKnownEmailHandler,
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
