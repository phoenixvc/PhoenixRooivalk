/**
 * Health Check Endpoint
 *
 * Provides health and readiness checks for the Azure Functions.
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { getContainer } from "../lib/cosmos";

/**
 * Health check response
 */
interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    cosmos: "ok" | "error";
    openai: "ok" | "error" | "not-configured";
  };
  errors?: string[];
}

const startTime = Date.now();

/**
 * Basic health check handler
 */
async function healthHandler(
  _request: HttpRequest,
  _context: InvocationContext,
): Promise<HttpResponseInit> {
  return {
    status: 200,
    jsonBody: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
    },
  };
}

/**
 * Detailed health check with dependency checks
 */
async function readinessHandler(
  _request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  const errors: string[] = [];
  const checks = {
    cosmos: "ok" as "ok" | "error",
    openai: "not-configured" as "ok" | "error" | "not-configured",
  };

  // Check Cosmos DB
  try {
    const container = getContainer("configuration");
    await container.items.query("SELECT TOP 1 * FROM c").fetchAll();
  } catch (error) {
    checks.cosmos = "error";
    errors.push(
      `Cosmos DB: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }

  // Check OpenAI configuration
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
    checks.openai = "ok";
  }

  const status: HealthStatus = {
    status:
      errors.length === 0
        ? "healthy"
        : checks.cosmos === "error"
          ? "unhealthy"
          : "degraded",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    checks,
    errors: errors.length > 0 ? errors : undefined,
  };

  return {
    status:
      status.status === "healthy"
        ? 200
        : status.status === "degraded"
          ? 200
          : 503,
    jsonBody: status,
  };
}

// Register endpoints
app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health",
  handler: healthHandler,
});

app.http("readiness", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health/ready",
  handler: readinessHandler,
});
