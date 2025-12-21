/**
 * Weekly Reports HTTP Endpoints
 *
 * HTTP handlers for AI-generated weekly reports with GitHub integration.
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
  checkRateLimitAsync,
  RateLimits,
} from "../lib/utils";
import {
  weeklyReportsService,
  GenerateReportOptions,
} from "../services/weekly-reports.service";
import { gitHubService } from "../services/github.service";
import { ReportStatus } from "../repositories/weekly-reports.repository";

/**
 * Generate a new weekly report handler (admin)
 */
async function generateReportHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden("Admin access required", request);
  }

  // Rate limit - expensive AI operation
  if (
    !(await checkRateLimitAsync(
      `weekly-report:${authResult.userId}`,
      RateLimits.ai,
    ))
  ) {
    return Errors.rateLimited(
      "Rate limit exceeded. Please wait before generating another report.",
      request,
    );
  }

  try {
    // Check GitHub configuration first
    const configError = gitHubService.getConfigurationError();
    if (configError) {
      return Errors.badRequest(configError, request);
    }

    const data = (await request.json()) as GenerateReportOptions;

    if (!data.repositories || data.repositories.length === 0) {
      return Errors.badRequest("At least one repository is required", request);
    }

    // Validate repositories array
    if (!Array.isArray(data.repositories)) {
      return Errors.badRequest("repositories must be an array", request);
    }

    if (data.repositories.length > 10) {
      return Errors.badRequest(
        "Maximum 10 repositories allowed per report",
        request,
      );
    }

    // Validate each repository format (owner/repo)
    const invalidRepos = data.repositories.filter((repo) => {
      if (typeof repo !== "string") return true;
      const parsed = gitHubService.parseRepository(repo);
      return !parsed;
    });

    if (invalidRepos.length > 0) {
      return Errors.badRequest(
        `Invalid repository format: ${invalidRepos.join(", ")}. Use owner/repo format.`,
      );
    }

    context.log(
      `Generating weekly report for ${data.repositories.length} repositories`,
    );

    const result = await weeklyReportsService.generateReport(
      data,
      authResult.userId || "admin",
    );

    if (!result.success) {
      return Errors.badRequest(
        result.error || "Failed to generate report",
        request,
      );
    }

    context.log(`Weekly report generated: ${result.report?.reportNumber}`);

    return successResponse(
      {
        success: true,
        report: result.report,
      },
      200,
      request,
    );
  } catch (error) {
    context.error("Failed to generate weekly report:", error);
    return Errors.internal("Failed to generate report", request);
  }
}

/**
 * Get all reports handler (admin)
 */
async function getReportsHandler(
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
    const status = request.query.get("status") as ReportStatus | null;
    const startDate = request.query.get("startDate");
    const endDate = request.query.get("endDate");
    const repository = request.query.get("repository");
    const limit = parseInt(request.query.get("limit") || "20", 10);

    const result = await weeklyReportsService.getReports(
      {
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        repository: repository || undefined,
      },
      { limit },
    );

    return successResponse(
      {
        reports: result.items,
        hasMore: result.hasMore,
      },
      200,
      request,
    );
  } catch (error) {
    context.error("Failed to get reports:", error);
    return Errors.internal("Failed to get reports", request);
  }
}

/**
 * Get a single report handler (admin)
 */
async function getReportHandler(
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
      return Errors.badRequest("Report ID is required", request);
    }

    const report = await weeklyReportsService.getReport(id);
    if (!report) {
      return Errors.notFound("Report not found", request);
    }

    return successResponse({ report }, 200, request);
  } catch (error) {
    context.error("Failed to get report:", error);
    return Errors.internal("Failed to get report", request);
  }
}

/**
 * Get most recent report handler (admin)
 */
async function getMostRecentReportHandler(
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
    const report = await weeklyReportsService.getMostRecentReport();
    return successResponse({ report }, 200, request);
  } catch (error) {
    context.error("Failed to get most recent report:", error);
    return Errors.internal("Failed to get report", request);
  }
}

/**
 * Delete a report handler (admin)
 */
async function deleteReportHandler(
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
      return Errors.badRequest("Report ID is required", request);
    }

    const success = await weeklyReportsService.deleteReport(id);
    if (!success) {
      return Errors.badRequest("Failed to delete report", request);
    }

    context.log(`Report deleted: ${id} by ${authResult.userId}`);

    return successResponse({ success: true }, 200, request);
  } catch (error) {
    context.error("Failed to delete report:", error);
    return Errors.internal("Failed to delete report", request);
  }
}

/**
 * Regenerate a report handler (admin)
 */
async function regenerateReportHandler(
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
      return Errors.badRequest("Report ID is required", request);
    }

    const result = await weeklyReportsService.regenerateReport(
      id,
      authResult.userId || "admin",
    );

    if (!result.success) {
      return Errors.badRequest(
        result.error || "Failed to regenerate report",
        request,
      );
    }

    context.log(`Report regenerated: ${result.report?.reportNumber}`);

    return successResponse(
      {
        success: true,
        report: result.report,
      },
      200,
      request,
    );
  } catch (error) {
    context.error("Failed to regenerate report:", error);
    return Errors.internal("Failed to regenerate report", request);
  }
}

/**
 * Export report as markdown handler (admin)
 */
async function exportReportHandler(
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
      return Errors.badRequest("Report ID is required", request);
    }

    const report = await weeklyReportsService.getReport(id);
    if (!report) {
      return Errors.notFound("Report not found", request);
    }

    const markdown = weeklyReportsService.exportAsMarkdown(report);

    return {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${report.reportNumber}.md"`,
      },
      body: markdown,
    };
  } catch (error) {
    context.error("Failed to export report:", error);
    return Errors.internal("Failed to export report", request);
  }
}

/**
 * Export report as MDX for docs/progress folder (admin)
 */
async function exportReportMDXHandler(
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
      return Errors.badRequest("Report ID is required", request);
    }

    const report = await weeklyReportsService.getReport(id);
    if (!report) {
      return Errors.notFound("Report not found", request);
    }

    const mdx = weeklyReportsService.exportAsMDX(report);
    const filePath = weeklyReportsService.getMDXFilePath(report);
    const fileName = filePath.split("/").pop() || "report.mdx";

    return {
      status: 200,
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-MDX-Path": filePath,
      },
      body: mdx,
    };
  } catch (error) {
    context.error("Failed to export report as MDX:", error);
    return Errors.internal("Failed to export report", request);
  }
}

/**
 * Get report counts handler (admin)
 */
async function getReportCountsHandler(
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
    const counts = await weeklyReportsService.getReportCounts();
    return successResponse({ counts }, 200, request);
  } catch (error) {
    context.error("Failed to get report counts:", error);
    return Errors.internal("Failed to get counts", request);
  }
}

/**
 * Validate GitHub repository handler (admin)
 */
async function validateRepositoryHandler(
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
    const repoString = request.query.get("repository");
    if (!repoString) {
      return Errors.badRequest(
        "Repository parameter is required (format: owner/repo)",
        request,
      );
    }

    const parsed = gitHubService.parseRepository(repoString);
    if (!parsed) {
      return Errors.badRequest(
        "Invalid repository format. Use owner/repo",
        request,
      );
    }

    const isValid = await gitHubService.validateRepository(
      parsed.owner,
      parsed.repo,
    );

    return successResponse(
      {
        repository: repoString,
        valid: isValid,
        configured: gitHubService.isConfigured(),
      },
      200,
      request,
    );
  } catch (error) {
    context.error("Failed to validate repository:", error);
    return Errors.internal("Failed to validate repository", request);
  }
}

/**
 * Check GitHub configuration handler (admin)
 */
async function checkGitHubConfigHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const authResult = await validateAuthHeader(
    request.headers.get("authorization"),
  );

  if (!authResult.valid || !authResult.isAdmin) {
    return Errors.forbidden("Admin access required", request);
  }

  return successResponse(
    {
      configured: gitHubService.isConfigured(),
    },
    200,
    request,
  );
}

// Register endpoints
app.http("generateWeeklyReport", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reports/weekly",
  handler: generateReportHandler,
});

app.http("getWeeklyReports", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/weekly",
  handler: getReportsHandler,
});

app.http("getWeeklyReport", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/weekly/{id}",
  handler: getReportHandler,
});

app.http("getMostRecentWeeklyReport", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/weekly/recent",
  handler: getMostRecentReportHandler,
});

app.http("deleteWeeklyReport", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "reports/weekly/{id}",
  handler: deleteReportHandler,
});

app.http("regenerateWeeklyReport", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "reports/weekly/{id}/regenerate",
  handler: regenerateReportHandler,
});

app.http("exportWeeklyReport", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/weekly/{id}/export",
  handler: exportReportHandler,
});

app.http("exportWeeklyReportMDX", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/weekly/{id}/export-mdx",
  handler: exportReportMDXHandler,
});

app.http("getWeeklyReportCounts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/weekly/counts",
  handler: getReportCountsHandler,
});

app.http("validateGitHubRepository", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/github/validate",
  handler: validateRepositoryHandler,
});

app.http("checkGitHubConfig", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "reports/github/config",
  handler: checkGitHubConfigHandler,
});
