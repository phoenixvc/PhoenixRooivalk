---
id: adr-0025-azure-naming-conventions
title: "ADR 0025: Azure Resource Naming Conventions v2.1"
sidebar_label: "ADR 0025: Azure Naming"
difficulty: intermediate
estimated_reading_time: 8
points: 30
tags:
  - technical
  - architecture
  - infrastructure
  - azure
  - naming
  - devops
prerequisites:
  - architecture-decision-records
---

# ADR 0025: Azure Resource Naming Conventions v2.1

**Date**: 2025-12-12 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: Multiple organizations (NeuralLiquid, Phoenix VC, Twines & Straps, Mystira) need consistent Azure resource naming across shared subscriptions
2. **Decision**: Adopt `[org]-[env]-[project]-[type]-[region]` naming pattern with controlled vocabulary
3. **Trade-off**: Longer names vs. clarity and predictability for automation

---

## Context

### Current Situation

Phoenix Rooivalk infrastructure spans multiple Azure subscriptions shared between organizations:

- **NeuralLiquid (nl)**: Core AI, defence, Rooivalk platform
- **Phoenix VC (pvc)**: VC brand and investor tooling
- **Twines & Straps (tws)**: E-commerce operations
- **Mystira (mys)**: Storytelling/AI platform

Prior naming conventions varied:
- Legacy pattern: `{env}-{region}-{type}-rooivalk` (e.g., `prd-eus2-swa-rooivalk`)
- Inconsistent org identification
- No machine-derivable naming rules

### Why Decision Needed

1. **Multi-org collaboration**: Multiple stakeholders deploying to shared subscriptions
2. **AI tooling**: Claude, Copilot, and automation tools need predictable naming
3. **Cost allocation**: Tag-based cost tracking requires consistent metadata
4. **Pipeline failures**: Inconsistent naming causing deployment issues

---

## Options Considered

### Option 1: Azure CAF Default ❌

Use Microsoft Cloud Adoption Framework default patterns.

**Pros**: Industry standard, well-documented
**Cons**: Doesn't include org identifier, verbose for multi-tenant

### Option 2: Environment-First Pattern ❌

Pattern: `{env}-{region}-{type}-{project}` (legacy)

**Pros**: Environment visible first
**Cons**: No org identifier, region placement inconsistent

### Option 3: Org-First Pattern ✅ Selected

Pattern: `[org]-[env]-[project]-[type]-[region]`

**Pros**:
- Org ownership immediately visible
- Consistent segment ordering
- Machine-derivable from parameters
- Supports cross-org queries

**Cons**:
- Longer names
- Migration required from legacy

---

## Decision

Adopt **Option 3: Org-First Pattern** as the standard for all Azure resources.

### Naming Pattern

```text
Resources:       [org]-[env]-[project]-[type]-[region]
Resource Groups: [org]-[env]-[project]-rg-[region]
```

### Controlled Vocabulary

#### Organization Codes (Authoritative)

| Code | Organisation     | Owner  |
|------|------------------|--------|
| nl   | NeuralLiquid     | Jurie  |
| pvc  | Phoenix VC       | Eben   |
| tws  | Twines & Straps  | Martyn |
| mys  | Mystira          | Eben   |

#### Environment Codes

| Code    | Meaning             |
|---------|---------------------|
| dev     | Development         |
| staging | Pre-production / QA |
| prod    | Production          |

#### Type Codes (Common)

| Type   | Resource                 |
|--------|--------------------------|
| swa    | Static Web App           |
| func   | Function App             |
| kv     | Key Vault                |
| cosmos | Cosmos DB                |
| appi   | Application Insights     |
| st     | Storage Account          |
| rg     | Resource Group           |

#### Region Codes

| Region          | Code |
|-----------------|------|
| eastus2         | eus2 |
| westeurope      | euw  |
| southafricanorth| san  |
| swedencentral   | swe  |

---

## Implementation

### Bicep Integration

Updated `infra/azure/main.bicep` with naming module:

```bicep
// Naming Convention v2.1: [org]-[env]-[project]-[type]-[region]
var org = 'nl'
var project = 'rooivalk'
var baseName = '${org}-${envStandard}-${project}'

// Example resource naming
module staticWebApp 'modules/staticwebapp.bicep' = {
  params: {
    name: '${baseName}-swa-${locationShort}'  // nl-prod-rooivalk-swa-eus2
  }
}
```

### Storage Account Exception

Storage accounts cannot contain hyphens and have a 24-character limit:

```bicep
// Pattern: [org][env][project]st[region]
name: '${org}${envStandard}${project}st${locationShort}'
// Result: nlprodrooivalksteus2
```

### Required Tags

All resources must include:

```bicep
var tags = {
  org: org
  project: project
  environment: envStandard
  managedBy: 'bicep'
  costCenter: 'phoenix-${envStandard}'
  owner: 'JustAGhosT'
}
```

---

## Migration

### Legacy to v2.1 Mapping

| Legacy Name              | New Name (v2.1)              |
|--------------------------|------------------------------|
| prd-eus2-swa-rooivalk    | nl-prod-rooivalk-swa-eus2    |
| prd-eus2-kv-rooivalk     | nl-prod-rooivalk-kv-eus2     |
| prdeus2strooivalk        | nlprodrooivalksteus2         |

### Migration Strategy

1. Deploy new resources with v2.1 naming
2. Migrate data/configuration
3. Update DNS/endpoints
4. Decommission legacy resources

**Note**: Azure resource names are immutable. Migration requires new resource creation.

---

## Consequences

### Positive

- **Clarity**: Org ownership visible in all resource names
- **Automation**: Predictable naming enables scripted operations
- **Cost tracking**: Consistent tagging for allocation reports
- **AI-friendly**: LLMs can derive names from parameters

### Negative

- **Migration effort**: Existing resources need recreation
- **Longer names**: More characters than minimal naming
- **Learning curve**: Teams must adopt new vocabulary

### Neutral

- **No breaking changes**: New pattern for new resources
- **Gradual adoption**: Can coexist with legacy during transition

---

## Compliance

### Azure Constraints Handled

| Constraint              | Solution                          |
|-------------------------|-----------------------------------|
| Storage: no hyphens     | Concatenate without hyphens       |
| Storage: 24 char max    | Short codes keep under limit      |
| Key Vault: 24 char max  | Short codes keep under limit      |
| Global uniqueness       | Org+project provides uniqueness   |

---

## Related Documents

- [Azure Naming Conventions v2.1](/docs/resources/azure-naming-conventions) - Full reference
- [ADR-D001: Monorepo Structure](./architecture-decision-records#adr-d001-monorepo-structure-with-turborepo)
- `infra/azure/main.bicep` - Implementation

---

## AI Guidance

When asked to create or reference Azure resources:

1. **Always use v2.1 pattern**: `[org]-[env]-[project]-[type]-[region]`
2. **Never invent org codes**: Only use nl, pvc, tws, mys
3. **Check type codes**: Use standard abbreviations from vocabulary
4. **Derive region code**: Use locationShortMap in main.bicep

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
