---
id: adr-0016-db-driven-configuration
title: "ADR 0016: Database-Driven Configuration Management"
sidebar_label: "ADR 0016: DB-Driven Config"
difficulty: intermediate
estimated_reading_time: 8
points: 40
tags:
  - technical
  - architecture
  - configuration
  - database
  - admin
  - prompts
prerequisites:
  - adr-0011
  - adr-0012
---

# ADR 0016: Database-Driven Configuration Management

**Date**: 2025-11-30 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Static configuration (categories, roles, prompts) limits
   flexibility and requires code deployments for changes
2. **Decision**: Store configuration in Cosmos DB with admin management and
   optional AI-assisted optimization
3. **Trade-off**: Added complexity for CRUD operations vs. flexibility and
   dynamic updates

---

## Context

The Phoenix Rooivalk documentation platform currently uses hardcoded
configuration for:

- **News categories** (counter-uas, defense-tech, etc.)
- **Target roles** (Technical, Business, Executive, etc.)
- **Target interests** (ai, hardware, compliance, etc.)
- **AI prompts** (competitor analysis, SWOT, categorization, etc.)
- **News topics** for ingestion
- **Trusted domains** for news sources

This approach has limitations:

1. **Deployment Required**: Any change requires code changes and deployment
2. **No Admin Control**: Non-developers cannot modify configuration
3. **No Analytics Integration**: Cannot optimize based on usage patterns
4. **No A/B Testing**: Cannot test prompt variations without deployment
5. **Content Mismatch**: Categories may not reflect actual content distribution

Key stakeholders:

- **Admins**: Need to manage configuration without developer involvement
- **AI Team**: Want to optimize prompts based on performance
- **Content Team**: Need to add/modify categories as content evolves
- **Operations**: Want reduced deployment frequency for config changes

---

## Options Considered

### Option 1: Cosmos DB with Admin API [✅ Selected]

| Aspect          | Details                                                                       |
| --------------- | ----------------------------------------------------------------------------- |
| **Description** | Store all configuration in Cosmos DB collections with REST API for management |
| **Pros**        | Full flexibility, admin dashboard integration, versioning, audit trail        |
| **Cons**        | More complex, requires careful caching, potential cold start issues           |

### Option 2: Environment Variables + Config Files [❌ Rejected]

| Aspect          | Details                                                             |
| --------------- | ------------------------------------------------------------------- |
| **Description** | Use environment variables for simple config, JSON files for complex |
| **Pros**        | Simple, no DB dependency, fast cold starts                          |
| **Cons**        | Requires deployment for changes, no admin UI, no versioning         |

### Option 3: External Configuration Service (Azure App Configuration) [❌ Rejected]

| Aspect          | Details                                                            |
| --------------- | ------------------------------------------------------------------ |
| **Description** | Use Azure App Configuration service for centralized config         |
| **Pros**        | Enterprise-grade, feature flags, A/B testing built-in              |
| **Cons**        | Additional cost, another service to manage, limited prompt storage |

---

## Decision

**Store all dynamic configuration in Cosmos DB with a ConfigurationRepository
pattern, admin management APIs, and optional AI-assisted optimization.**

---

## Rationale

### Why Cosmos DB Over Alternatives?

| Factor             | Cosmos DB    | Env Vars | Azure App Config | Winner    |
| ------------------ | ------------ | -------- | ---------------- | --------- |
| **Flexibility**    | High         | Low      | Medium           | Cosmos DB |
| **Admin Access**   | Full API     | None     | Portal only      | Cosmos DB |
| **Prompt Storage** | Unlimited    | N/A      | Limited          | Cosmos DB |
| **Versioning**     | Custom       | None     | Built-in         | Tie       |
| **Cost**           | Existing     | Free     | Additional       | Cosmos DB |
| **Integration**    | Already used | Simple   | New service      | Cosmos DB |

Cosmos DB is already used for other data storage, making it the natural choice
for configuration without adding new dependencies.

---

## Implementation

### Database Schema

```typescript
// Configuration collection schema
interface ConfigItem {
  id: string; // e.g., "category:counter-uas"
  type: ConfigType; // "category" | "role" | "interest" | "prompt" | "topic"
  name: string;
  description: string;
  metadata: Record<string, unknown>;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

type ConfigType =
  | "category" // News categories
  | "role" // Target roles
  | "interest" // Target interests
  | "prompt" // AI prompts
  | "topic" // News topics
  | "domain" // Trusted domains
  | "setting"; // General settings

// Prompt-specific schema
interface PromptConfig extends ConfigItem {
  type: "prompt";
  metadata: {
    category: "analysis" | "generation" | "retrieval" | "research";
    systemPrompt: string;
    userTemplate: string;
    requiredVariables: string[];
    optionalVariables: Record<string, string>;
    recommendedModel: "chat" | "chatFast" | "chatAdvanced";
    maxTokens: number;
    temperature: number;
    outputFormat: "text" | "json" | "markdown";
    tags: string[];
    usageCount: number;
    avgLatencyMs: number;
    successRate: number;
  };
}
```

### Repository Pattern

```typescript
class ConfigurationRepository {
  // Core CRUD
  async get(id: string): Promise<ConfigItem | null>;
  async getByType(type: ConfigType): Promise<ConfigItem[]>;
  async getActive(type: ConfigType): Promise<ConfigItem[]>;
  async create(item: Omit<ConfigItem, "id" | "version">): Promise<ConfigItem>;
  async update(id: string, updates: Partial<ConfigItem>): Promise<ConfigItem>;
  async deactivate(id: string): Promise<void>;

  // Versioning
  async getVersion(id: string, version: number): Promise<ConfigItem | null>;
  async getHistory(id: string): Promise<ConfigItem[]>;
  async revert(id: string, version: number): Promise<ConfigItem>;

  // Bulk operations
  async importConfig(items: ConfigItem[]): Promise<ImportResult>;
  async exportConfig(type?: ConfigType): Promise<ConfigItem[]>;
}
```

### Caching Strategy

```typescript
// In-memory cache with TTL
const configCache = new Map<string, { item: ConfigItem; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getCachedConfig(type: ConfigType): Promise<ConfigItem[]> {
  const cacheKey = `config:${type}`;
  const cached = configCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.item;
  }

  const items = await configRepository.getActive(type);
  configCache.set(cacheKey, {
    item: items,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return items;
}

// Invalidate on updates
async function invalidateCache(type: ConfigType): Promise<void> {
  configCache.delete(`config:${type}`);
}
```

### AI-Assisted Optimization

```typescript
interface ConfigOptimization {
  type: ConfigType;
  suggestion: string;
  reason: string;
  confidence: number;
  basedOn: {
    usageData: boolean;
    contentAnalysis: boolean;
    userFeedback: boolean;
  };
}

async function analyzeConfigOptimizations(): Promise<ConfigOptimization[]> {
  // Analyze content distribution vs. categories
  // Suggest new categories based on clustering
  // Identify unused/low-usage config items
  // Recommend prompt improvements based on success rates
}
```

### Admin API Endpoints

```
GET    /api/admin/config                    # List all config
GET    /api/admin/config/{type}             # List by type
GET    /api/admin/config/{type}/{id}        # Get specific
POST   /api/admin/config/{type}             # Create new
PUT    /api/admin/config/{type}/{id}        # Update
DELETE /api/admin/config/{type}/{id}        # Deactivate
POST   /api/admin/config/import             # Bulk import
GET    /api/admin/config/export             # Bulk export
GET    /api/admin/config/{id}/history       # Version history
POST   /api/admin/config/{id}/revert/{ver}  # Revert to version
GET    /api/admin/config/optimize           # AI suggestions
```

---

## Consequences

### Positive

- **No Deployment Required**: Admins can update configuration instantly
- **Full Audit Trail**: All changes tracked with user and timestamp
- **Version Control**: Can revert to previous versions if needed
- **A/B Testing**: Can test prompt variations without deployment
- **Analytics Integration**: Track usage and optimize based on data
- **AI Optimization**: Can suggest improvements automatically

### Negative

- **Added Complexity**: More code to maintain for configuration CRUD
- **Cache Invalidation**: Need careful cache management
- **Cold Start**: Initial load may be slower (mitigated by caching)
- **Validation Required**: Must validate config changes to prevent errors

### Neutral

- **Migration Required**: Need to migrate existing static config to DB
- **Admin UI Needed**: Requires building admin dashboard components

---

## Risks and Mitigations

| Risk                         | Likelihood | Impact | Mitigation                                   |
| ---------------------------- | ---------- | ------ | -------------------------------------------- |
| Invalid config breaks system | Medium     | High   | Strict validation, rollback capability       |
| Cache inconsistency          | Low        | Medium | TTL-based expiration, invalidation on update |
| Performance degradation      | Low        | Medium | Aggressive caching, lazy loading             |
| Unauthorized access          | Low        | High   | Admin-only endpoints, audit logging          |

---

## Related ADRs

- [ADR 0011: Vector Database Selection](./adr-0011-vector-database-selection.md)
- [ADR 0012: Azure Functions Architecture](./adr-0012-azure-functions-architecture.md)

---

## References

- [Azure Cosmos DB Best Practices](https://docs.microsoft.com/en-us/azure/cosmos-db/best-practices)
- [Configuration Management Patterns](https://martinfowler.com/articles/configuration-management.html)
- [Feature Flags Best Practices](https://launchdarkly.com/blog/feature-flags-best-practices/)

---

_© 2025 Phoenix Rooivalk. Confidential._
