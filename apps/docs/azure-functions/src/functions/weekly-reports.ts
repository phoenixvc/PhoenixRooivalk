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
    return Errors.forbidden();
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
    );
  }

  try {
    // Check GitHub configuration first
    const configError = gitHubService.getConfigurationError();
    if (configError) {
      return Errors.badRequest(configError);
    }

    const data = (await request.json()) as GenerateReportOptions;

    if (!data.repositories || data.repositories.length === 0) {
      return Errors.badRequest("At least one repository is required");
    }

    // Validate repositories array
    if (!Array.isArray(data.repositories)) {
      return Errors.badRequest("repositories must be an array");
    }

    if (data.repositories.length > 10) {
      return Errors.badRequest("Maximum 10 repositories allowed per report");
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
      return Errors.badRequest(result.error || "Failed to generate report");
    }

    context.log(`Weekly report generated: ${result.report?.reportNumber}`);

    return successResponse({
      success: true,
      report: result.report,
    });
  } catch (error) {
    context.error("Failed to generate weekly report:", error);
    return Errors.internal("Failed to generate report");
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
    return Errors.forbidden();
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

    return successResponse({
      reports: result.items,
      hasMore: result.hasMore,
    });
  } catch (error) {
    context.error("Failed to get reports:", error);
    return Errors.internal("Failed to get reports");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Report ID is required");
    }

    const report = await weeklyReportsService.getReport(id);
    if (!report) {
      return Errors.notFound("Report not found");
    }

    return successResponse({ report });
  } catch (error) {
    context.error("Failed to get report:", error);
    return Errors.internal("Failed to get report");
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
    return Errors.forbidden();
  }

  try {
    const report = await weeklyReportsService.getMostRecentReport();
    return successResponse({ report });
  } catch (error) {
    context.error("Failed to get most recent report:", error);
    return Errors.internal("Failed to get report");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Report ID is required");
    }

    const success = await weeklyReportsService.deleteReport(id);
    if (!success) {
      return Errors.badRequest("Failed to delete report");
    }

    context.log(`Report deleted: ${id} by ${authResult.userId}`);

    return successResponse({ success: true });
  } catch (error) {
    context.error("Failed to delete report:", error);
    return Errors.internal("Failed to delete report");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Report ID is required");
    }

    const result = await weeklyReportsService.regenerateReport(
      id,
      authResult.userId || "admin",
    );

    if (!result.success) {
      return Errors.badRequest(result.error || "Failed to regenerate report");
    }

    context.log(`Report regenerated: ${result.report?.reportNumber}`);

    return successResponse({
      success: true,
      report: result.report,
    });
  } catch (error) {
    context.error("Failed to regenerate report:", error);
    return Errors.internal("Failed to regenerate report");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Report ID is required");
    }

    const report = await weeklyReportsService.getReport(id);
    if (!report) {
      return Errors.notFound("Report not found");
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
    return Errors.internal("Failed to export report");
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
    return Errors.forbidden();
  }

  try {
    const id = request.params.id;
    if (!id) {
      return Errors.badRequest("Report ID is required");
    }

    const report = await weeklyReportsService.getReport(id);
    if (!report) {
      return Errors.notFound("Report not found");
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
    return Errors.internal("Failed to export report");
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
    return Errors.forbidden();
  }

  try {
    const counts = await weeklyReportsService.getReportCounts();
    return successResponse({ counts });
  } catch (error) {
    context.error("Failed to get report counts:", error);
    return Errors.internal("Failed to get counts");
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
    return Errors.forbidden();
  }

  try {
    const repoString = request.query.get("repository");
    if (!repoString) {
      return Errors.badRequest(
        "Repository parameter is required (format: owner/repo)",
      );
    }

    const parsed = gitHubService.parseRepository(repoString);
    if (!parsed) {
      return Errors.badRequest("Invalid repository format. Use owner/repo");
    }

    const isValid = await gitHubService.validateRepository(
      parsed.owner,
      parsed.repo,
    );

    return successResponse({
      repository: repoString,
      valid: isValid,
      configured: gitHubService.isConfigured(),
    });
  } catch (error) {
    context.error("Failed to validate repository:", error);
    return Errors.internal("Failed to validate repository");
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
    return Errors.forbidden();
  }

  return successResponse({
    configured: gitHubService.isConfigured(),
  });
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
