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

  // Check Cosmos DB connection string
  if (!process.env.COSMOS_DB_CONNECTION_STRING) {
    checks.cosmos = "error";
    errors.push("Cosmos DB: COSMOS_DB_CONNECTION_STRING not configured");
  } else {
    // Check Cosmos DB connectivity
    try {
      const container = getContainer("configuration");
      await container.items.query("SELECT TOP 1 * FROM c").fetchAll();
      context.log("[Health] Cosmos DB connection successful");
    } catch (error) {
      checks.cosmos = "error";
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Cosmos DB: ${errorMessage}`);
      context.error("[Health] Cosmos DB connection failed:", errorMessage);
    }
  }

  // Check OpenAI configuration
  const openAIConfigs = [
    { endpoint: "AZURE_OPENAI_ENDPOINT", key: "AZURE_OPENAI_API_KEY" },
    { endpoint: "AZURE_AI_ENDPOINT", key: "AZURE_AI_API_KEY" },
  ];

  const hasOpenAI = openAIConfigs.some(
    (config) => process.env[config.endpoint] && process.env[config.key],
  );

  if (hasOpenAI) {
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

  context.log("[Health] Status check completed:", {
    status: status.status,
    checks,
    errorCount: errors.length,
  });

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
