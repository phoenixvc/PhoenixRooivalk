/**
 * Configuration Admin HTTP Endpoints
 *
 * Admin endpoints for managing dynamic configuration.
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
  configurationService,
  ConfigOptimization,
} from "../services/configuration.service";
import {
  ConfigItem,
  ConfigType,
} from "../repositories/configuration.repository";

/**
 * Validate config type
 */
function isValidConfigType(type: string): type is ConfigType {
  return [
    "category",
    "role",
    "interest",
    "prompt",
    "topic",
    "domain",
    "setting",
  ].includes(type);
}

/**
 * List all configuration handler
 */
async function listConfigHandler(
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
    const type = request.query.get("type") as ConfigType | null;

    if (type && !isValidConfigType(type)) {
      return Errors.badRequest(
        `Invalid type. Must be one of: category, role, interest, prompt, topic, domain, setting`,
        request,
      );
    }

    const config = await configurationService.exportConfig(type || undefined);

    return successResponse({
      items: config,
      count: config.length,
    }, 200, request);
  } catch (error) {
    context.error("Error listing config:", error);
    return Errors.internal("Failed to list configuration", request);
  }
}

/**
 * Get configuration by type handler
 */
async function getConfigByTypeHandler(
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
    const type = request.params.type as string;

    if (!isValidConfigType(type)) {
      return Errors.badRequest(`Invalid type: ${type}`, request);
    }

    let items: ConfigItem[];
    switch (type) {
      case "category":
        items = await configurationService.getCategories();
        break;
      case "role":
        items = await configurationService.getRoles();
        break;
      case "interest":
        items = await configurationService.getInterests();
        break;
      case "prompt":
        items = await configurationService.getPrompts();
        break;
      case "topic":
        items = await configurationService.getTopics();
        break;
      case "domain":
        items = await configurationService.getDomains();
        break;
      default:
        items = await configurationService.exportConfig(type);
    }

    return successResponse({
      type,
      items,
      count: items.length,
    }, 200, request);
  } catch (error) {
    context.error("Error getting config:", error);
    return Errors.internal("Failed to get configuration", request);
  }
}

/**
 * Create configuration handler
 */
async function createConfigHandler(
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
    const type = request.params.type as string;

    if (!isValidConfigType(type)) {
      return Errors.badRequest(`Invalid type: ${type}`, request);
    }

    const body = (await request.json()) as {
      name: string;
      description: string;
      metadata?: Record<string, unknown>;
      order?: number;
    };

    if (!body.name || !body.description) {
      return Errors.badRequest("name and description are required", request);
    }

    const item = await configurationService.createConfig(
      {
        type,
        name: body.name,
        description: body.description,
        metadata: body.metadata || {},
        isActive: true,
        order: body.order,
      },
      authResult.userId,
    );

    context.log(`Created config: ${item.id}`);

    return successResponse(item, 201, request);
  } catch (error) {
    context.error("Error creating config:", error);
    return Errors.internal("Failed to create configuration", request);
  }
}

/**
 * Update configuration handler
 */
async function updateConfigHandler(
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
    const id = request.params.id as string;

    const body = (await request.json()) as {
      name?: string;
      description?: string;
      metadata?: Record<string, unknown>;
      isActive?: boolean;
      order?: number;
      reason?: string;
    };

    const updates: Partial<ConfigItem> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.metadata !== undefined) updates.metadata = body.metadata;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.order !== undefined) updates.order = body.order;

    const item = await configurationService.updateConfig(
      id,
      updates,
      authResult.userId,
      body.reason,
    );

    if (!item) {
      return Errors.notFound("Configuration not found", request);
    }

    context.log(`Updated config: ${item.id}`);

    return successResponse(item, 200, request);
  } catch (error) {
    context.error("Error updating config:", error);
    return Errors.internal("Failed to update configuration", request);
  }
}

/**
 * Delete (deactivate) configuration handler
 */
async function deleteConfigHandler(
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
    const id = request.params.id as string;

    await configurationService.deactivateConfig(id, authResult.userId);

    context.log(`Deactivated config: ${id}`);

    return successResponse({
      success: true,
      message: "Configuration deactivated",
    }, 200, request);
  } catch (error) {
    context.error("Error deleting config:", error);
    return Errors.internal("Failed to delete configuration", request);
  }
}

/**
 * Get configuration history handler
 */
async function getConfigHistoryHandler(
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
    const id = request.params.id as string;

    const history = await configurationService.getConfigHistory(id);

    return successResponse({
      configId: id,
      versions: history,
      count: history.length,
    }, 200, request);
  } catch (error) {
    context.error("Error getting history:", error);
    return Errors.internal("Failed to get configuration history", request);
  }
}

/**
 * Revert configuration to version handler
 */
async function revertConfigHandler(
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
    const id = request.params.id as string;
    const version = parseInt(request.params.version as string, 10);

    if (isNaN(version) || version < 1) {
      return Errors.badRequest("Invalid version number", request);
    }

    const item = await configurationService.revertConfig(
      id,
      version,
      authResult.userId,
    );

    if (!item) {
      return Errors.notFound("Configuration or version not found", request);
    }

    context.log(`Reverted config ${id} to version ${version}`);

    return successResponse(item, 200, request);
  } catch (error) {
    context.error("Error reverting config:", error);
    return Errors.internal("Failed to revert configuration", request);
  }
}

/**
 * Import configuration handler
 */
async function importConfigHandler(
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
    const body = (await request.json()) as {
      items: Array<{
        type: ConfigType;
        name: string;
        description: string;
        metadata?: Record<string, unknown>;
        order?: number;
      }>;
    };

    if (!body.items || !Array.isArray(body.items)) {
      return Errors.badRequest("items array is required", request);
    }

    const result = await configurationService.importConfig(
      body.items.map((item) => ({
        ...item,
        isActive: true,
        metadata: item.metadata || {},
      })),
      authResult.userId,
    );

    context.log(
      `Imported ${result.imported} configs, skipped ${result.skipped}`,
    );

    return successResponse(result, 200, request);
  } catch (error) {
    context.error("Error importing config:", error);
    return Errors.internal("Failed to import configuration", request);
  }
}

/**
 * Export configuration handler
 */
async function exportConfigHandler(
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
    const type = request.query.get("type") as ConfigType | null;
    const config = await configurationService.exportConfig(type || undefined);

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="config-export-${Date.now()}.json"`,
      },
      body: JSON.stringify(
        { items: config, exportedAt: new Date().toISOString() },
        null,
        2,
      ),
    };
  } catch (error) {
    context.error("Error exporting config:", error);
    return Errors.internal("Failed to export configuration", request);
  }
}

/**
 * Get optimization suggestions handler
 */
async function getOptimizationsHandler(
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
    const optimizations = await configurationService.analyzeOptimizations();

    return successResponse({
      suggestions: optimizations,
      count: optimizations.length,
      analyzedAt: new Date().toISOString(),
    }, 200, request);
  } catch (error) {
    context.error("Error analyzing optimizations:", error);
    return Errors.internal("Failed to analyze configuration", request);
  }
}

/**
 * Seed default configuration handler
 */
async function seedDefaultsHandler(
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
    const result = await configurationService.seedDefaults(authResult.userId);

    context.log(`Seeded ${result.seeded} default configs`);

    return successResponse({
      message: "Default configuration seeded",
      ...result,
    }, 200, request);
  } catch (error) {
    context.error("Error seeding defaults:", error);
    return Errors.internal("Failed to seed defaults", request);
  }
}

/**
 * Search configuration handler
 */
async function searchConfigHandler(
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
    const query = request.query.get("q");
    const type = request.query.get("type") as ConfigType | null;

    if (!query) {
      return Errors.badRequest("Query parameter 'q' is required", request);
    }

    const results = await configurationService.searchConfig(
      query,
      type || undefined,
    );

    return successResponse({
      query,
      results,
      count: results.length,
    }, 200, request);
  } catch (error) {
    context.error("Error searching config:", error);
    return Errors.internal("Failed to search configuration", request);
  }
}

// Register endpoints
app.http("listConfig", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/config",
  handler: listConfigHandler,
});

app.http("getConfigByType", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/config/{type}",
  handler: getConfigByTypeHandler,
});

app.http("createConfig", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "admin/config/{type}",
  handler: createConfigHandler,
});

app.http("updateConfig", {
  methods: ["PUT"],
  authLevel: "anonymous",
  route: "admin/config/{id}",
  handler: updateConfigHandler,
});

app.http("deleteConfig", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "admin/config/{id}",
  handler: deleteConfigHandler,
});

app.http("getConfigHistory", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/config/{id}/history",
  handler: getConfigHistoryHandler,
});

app.http("revertConfig", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "admin/config/{id}/revert/{version}",
  handler: revertConfigHandler,
});

app.http("importConfig", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "admin/config/import",
  handler: importConfigHandler,
});

app.http("exportConfig", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/config/export",
  handler: exportConfigHandler,
});

app.http("getOptimizations", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/config/optimize",
  handler: getOptimizationsHandler,
});

app.http("seedDefaults", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "admin/config/seed",
  handler: seedDefaultsHandler,
});

app.http("searchConfig", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "admin/config/search",
  handler: searchConfigHandler,
});
