/**
 * Access Applications HTTP Endpoints
 *
 * HTTP handlers for team member access applications.
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
import {
  accessApplicationsService,
  SubmitApplicationData,
} from "../services/access-applications.service";
import { ApplicationStatus } from "../repositories/access-applications.repository";

/**
 * Submit access application handler
 */
async function submitApplicationHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  // Rate limiting
  const rateLimit = applyRateLimit(
    request,
    "access-application",
    RateLimits.form,
  );
  if (!rateLimit.allowed) return rateLimit.response!;

  // Require authentication
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );
  if (!authResult.valid) {
    return Errors.unauthenticated();
  }

  try {
    const data = (await request.json()) as SubmitApplicationData;

    // Validate input
    const validationError = accessApplicationsService.validateApplication(data);
    if (validationError) {
      return Errors.badRequest(validationError);
    }

    const result = await accessApplicationsService.submitApplication(
      data,
      authResult.userId!,
      authResult.email || "",
      authResult.name || "",
    );

    context.log(
      `Access application submitted: ${result.applicationNumber} by ${authResult.userId}`,
    );

    return successResponse({
      success: true,
      applicationNumber: result.applicationNumber,
      message:
        "Your application has been submitted. We'll review it and get back to you within 2-3 business days.",
    });
  } catch (error) {
    context.error("Failed to submit access application:", error);
    return Errors.internal("Failed to submit application. Please try again.");
  }
}

/**
 * Get user's applications handler
 */
async function getUserApplicationsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return Errors.unauthenticated();
  }

  try {
    const result = await accessApplicationsService.getUserApplications(
      authResult.userId!,
    );
    return successResponse({ applications: result.items });
  } catch (error) {
    context.error("Failed to get user applications:", error);
    return Errors.internal("Failed to get applications");
  }
}

/**
 * Get user's pending application handler
 */
async function getPendingApplicationHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return Errors.unauthenticated();
  }

  try {
    const application = await accessApplicationsService.getPendingApplication(
      authResult.userId!,
    );
    return successResponse({ application });
  } catch (error) {
    context.error("Failed to get pending application:", error);
    return Errors.internal("Failed to get application status");
  }
}

/**
 * Check if user has approved access handler
 */
async function checkApprovedAccessHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid) {
    return Errors.unauthenticated();
  }

  try {
    const role = request.query.get("role") || undefined;
    const hasAccess = await accessApplicationsService.hasApprovedAccess(
      authResult.userId!,
      role,
    );
    return successResponse({ hasAccess, role });
  } catch (error) {
    context.error("Failed to check access:", error);
    return Errors.internal("Failed to check access status");
  }
}

/**
 * Get admin applications handler
 */
async function getAdminApplicationsHandler(
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
    const status = request.query.get("status") as ApplicationStatus | null;
    const requestedRole = request.query.get("role");
    const limit = parseInt(request.query.get("limit") || "100", 10);

    const result = await accessApplicationsService.getApplications(
      {
        status: status || undefined,
        requestedRole: requestedRole || undefined,
      },
      { limit },
    );

    return successResponse({
      applications: result.items,
      hasMore: result.hasMore,
    });
  } catch (error) {
    context.error("Failed to get admin applications:", error);
    return Errors.internal("Failed to get applications");
  }
}

/**
 * Get application counts handler
 */
async function getApplicationCountsHandler(
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
    const counts = await accessApplicationsService.getApplicationCounts();
    return successResponse({ counts });
  } catch (error) {
    context.error("Failed to get application counts:", error);
    return Errors.internal("Failed to get counts");
  }
}

/**
 * Update application status handler (admin)
 */
async function updateApplicationStatusHandler(
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
    const { applicationId, status, reviewNotes } = (await request.json()) as {
      applicationId: string;
      status: ApplicationStatus;
      reviewNotes?: string;
    };

    if (!applicationId || !status) {
      return Errors.badRequest("applicationId and status are required");
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return Errors.badRequest("Invalid status");
    }

    const application = await accessApplicationsService.updateApplicationStatus(
      applicationId,
      status,
      authResult.userId,
      reviewNotes,
    );

    if (!application) {
      return Errors.notFound("Application not found");
    }

    context.log(
      `Application ${applicationId} updated to ${status} by ${authResult.userId}`,
    );

    return successResponse({ success: true, application });
  } catch (error) {
    context.error("Failed to update application:", error);
    return Errors.internal("Failed to update application");
  }
}

// Register endpoints
app.http("submitAccessApplication", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "access/applications",
  handler: submitApplicationHandler,
});

app.http("getUserAccessApplications", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "access/applications/user",
  handler: getUserApplicationsHandler,
});

app.http("getPendingAccessApplication", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "access/applications/pending",
  handler: getPendingApplicationHandler,
});

app.http("checkApprovedAccess", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "access/check",
  handler: checkApprovedAccessHandler,
});

app.http("getAdminAccessApplications", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "access/applications/admin",
  handler: getAdminApplicationsHandler,
});

app.http("getAccessApplicationCounts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "access/applications/counts",
  handler: getApplicationCountsHandler,
});

app.http("updateAccessApplicationStatus", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "access/applications",
  handler: updateApplicationStatusHandler,
});
