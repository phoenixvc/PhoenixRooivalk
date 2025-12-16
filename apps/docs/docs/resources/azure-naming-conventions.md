---
id: azure-naming-conventions
title: "Azure Naming Conventions v2.1"
sidebar_label: "Azure Naming Conventions"
description:
  A unified naming standard for all Azure resources across NeuralLiquid, Phoenix
  VC, Twines & Straps, and Mystira
keywords:
  - azure
  - naming
  - conventions
  - infrastructure
  - bicep
  - resources
difficulty: intermediate
timeEstimate: 10
xpReward: 50
---

# Azure Naming Conventions v2.1

A unified, opinionated naming standard for all Azure resources across:

- **nl** – NeuralLiquid (Jurie)
- **pvc** – Phoenix VC (Eben)
- **tws** – Twines & Straps (Martyn)
- **mys** – Mystira (Eben)

This document is designed for both humans and AI systems. All patterns herein
MUST be followed unless explicitly superseded.

---

## Table of Contents

1. [Core Naming Pattern](#1-core-naming-pattern)
2. [Segment Vocabulary](#2-segment-vocabulary)
3. [Examples](#3-examples)
4. [AI Guidance](#4-ai-guidance-for-llms--tools)
5. [Renaming, Moving, Recreating Resources](#5-renaming-moving-recreating-resources)
6. [Legacy Mapping (Old → New)](#6-legacy-mapping-old--new)
7. [Bicep Naming Module](#7-bicep-naming-module)
8. [Resource Discovery Commands](#8-resource-discovery-commands-azure-cli)

---

## 1. Core Naming Pattern

### Resources

```text
[org]-[env]-[project]-[type]-[region]
```

### Resource Groups

```text
[org]-[env]-[project]-rg-[region]
```

### Rules

- Lowercase only
- Allowed characters: `a–z`, `0–9`, `-`
- No spaces, underscores, or trailing hyphens
- Naming must be stable, predictable, and machine-derivable

---

## 2. Segment Vocabulary

### 2.1 Org Codes (Ownership)

| Code | Organisation / Brand | Owner  | Notes                                       |
| ---- | -------------------- | ------ | ------------------------------------------- |
| nl   | NeuralLiquid         | Jurie  | Core AI, defence, Autopr, Rooivalk          |
| pvc  | Phoenix VC           | Eben   | VC brand, investor tooling, market data     |
| tws  | Twines & Straps      | Martyn | E-commerce & operations, Tassa integrations |
| mys  | Mystira              | Eben   | Mystira platform + Story generator          |

These codes are **authoritative** — NEVER invent new org codes.

---

### 2.2 Environment Codes

| Env     | Meaning             |
| ------- | ------------------- |
| dev     | Development         |
| staging | Pre-production / QA |
| prod    | Production          |

No additional values allowed without updating this doc.

---

### 2.3 Project Codes (Per Org)

#### NeuralLiquid (nl)

| Project  | Description                             |
| -------- | --------------------------------------- |
| rooivalk | Counter-UAS platform (Phoenix Rooivalk) |
| autopr   | Autopr automation platform              |
| nl-core  | Shared NL foundation services           |
| nl-ai    | Shared NL AI services                   |

#### Phoenix VC (pvc)

| Project | Description              |
| ------- | ------------------------ |
| website | Public brand website     |
| portal  | Investor portal (future) |
| mktdata | Market/crypto pipelines  |

#### Twines & Straps (tws)

| Project    | Description                 |
| ---------- | --------------------------- |
| website    | Public e-commerce frontend  |
| backoffice | Internal management systems |
| tassa-int  | Tassa integration services  |

#### Mystira (mys)

| Project       | Description                          |
| ------------- | ------------------------------------ |
| mystira       | Core storytelling/AI engine          |
| mystira-story | Dedicated Story Generator deployment |

**Project naming rules:**

- Do **not** repeat the org inside the project name
  - `tws-prod-website-rg-san` ✅
  - `tws-prod-tws-website-rg-san` ❌
- Keep them short, stable, and descriptive
- If a new project is needed, add it to the relevant table here

---

### 2.4 Type Codes (Resource Types)

| Type    | Meaning                               |
| ------- | ------------------------------------- |
| app     | App Service / Web frontend            |
| api     | Backend API                           |
| func    | Function App                          |
| swa     | Static Web App                        |
| db      | Database (SQL/Postgres/etc.)          |
| storage | Storage account                       |
| kv      | Key Vault                             |
| queue   | Service Bus / queues                  |
| cache   | Redis or similar                      |
| ai      | AI services (OpenAI/Cog/etc.)         |
| acr     | Container registry                    |
| vnet    | Virtual network                       |
| subnet  | Subnet                                |
| dns     | DNS zone or DNS resource              |
| log     | Monitoring / log workspace            |
| rg      | **Reserved** for resource groups only |
| cosmos  | Cosmos DB                             |
| appi    | Application Insights                  |
| nhns    | Notification Hub Namespace            |
| nh      | Notification Hub                      |

Do not invent new `type` values ad hoc. Extend this table explicitly.

---

### 2.5 Region Codes

| Code | Azure Region           |
| ---- | ---------------------- |
| euw  | West Europe            |
| eun  | North Europe           |
| wus  | West US                |
| wus2 | West US 2              |
| eus  | East US                |
| eus2 | East US 2              |
| cus  | Central US             |
| san  | South Africa North     |
| saf  | South Africa West      |
| swe  | Sweden (Central/North) |
| uks  | UK South               |
| ukw  | UK West                |
| eas  | East Asia              |
| seas | Southeast Asia         |
| aue  | Australia East         |
| glob | Global / regionless    |

`saf` (South Africa West) exists but not all services are available. Always
verify service support before using it.

---

## 3. Examples

### 3.1 Resource Groups

Pattern: `[org]-[env]-[project]-rg-[region]`

```text
nl-dev-rooivalk-rg-euw
nl-prod-rooivalk-rg-eus2
nl-prod-autopr-rg-san
pvc-prod-mktdata-rg-euw
pvc-prod-website-rg-euw
tws-prod-website-rg-san
mys-dev-mystira-rg-swe
```

### 3.2 App Services / APIs / Functions

Pattern: `[org]-[env]-[project]-[type]-[region]`

```text
nl-prod-rooivalk-swa-eus2
nl-prod-rooivalk-func-eus2
nl-dev-autopr-app-san
pvc-prod-mktdata-func-euw
pvc-prod-website-swa-euw
tws-prod-backoffice-api-san
mys-prod-mystira-story-app-swe
```

### 3.3 Data + AI

```text
nl-prod-rooivalk-cosmos-eus2
nl-prod-rooivalk-kv-eus2
nl-prod-rooivalk-appi-eus2
pvc-prod-mktdata-db-euw
nl-dev-rooivalk-storage-san
```

### 3.4 Storage Accounts (Special Case)

Storage accounts cannot have hyphens and have a 24-character limit:

Pattern: `[org][env][project]st[region]` (no hyphens, abbreviated)

```text
nlprodrooivalksteus2
nldevrooivalkstsan
pvcprodmktdatsteuw
```

---

## 4. AI Guidance (for LLMs / tools)

AI systems working with this environment MUST:

- Treat `[org]-[env]-[project]-[type]-[region]` as a structured ID
- Only use `org`, `env`, `project`, `type`, `region` values from this document
- Never invent new vocabulary values
- Assume resource names are **immutable**
- For "rename", propose **new resource + migration**, not in-place rename
- Derive names from parameters in IaC (Bicep/Terraform), not hard-coded strings
- Prefer reusing existing project codes instead of creating near-duplicates

---

## 5. Renaming, Moving, Recreating Resources

Most Azure resource names are **immutable**.

- **Rename (change the name)** → generally not supported
- **Move (change RG/subscription)** → often supported
- **Recreate/Migrate** → how you "rename" in practice

### 5.1 Capabilities Matrix

| Resource Type               | Rename Name? | Move RG/Sub? | Typical Action to Fix Naming          |
| --------------------------- | ------------ | ------------ | ------------------------------------- |
| Resource Group              | ❌ No        | n/a          | New RG + move resources if supported  |
| App Service                 | ❌ No        | ✅ Often     | New app + DNS/traffic cutover         |
| Function App                | ❌ No        | ✅ Often     | New app + config migration            |
| Static Web App              | ❌ No        | ⚠ Limited    | New SWA + rebind domains              |
| Storage Account             | ❌ No        | ⚠ Limited    | New account + data migration          |
| SQL / DB / Managed Instance | ❌ No        | ⚠ Depends    | New server/db + data migration        |
| Key Vault                   | ❌ No        | ⚠ Limited    | New vault + re-seed secrets           |
| VNet / Subnet               | ❌ No        | ⚠ Limited    | New VNet/Subnets + reattach resources |
| DNS Zone                    | ❌ No        | ⚠ Limited    | New zone (domain = name)              |
| Log Analytics Workspace     | ❌ No        | ✅ Often     | New workspace + update diagnostics    |
| Cosmos DB                   | ❌ No        | ⚠ Limited    | New account + data migration          |
| Dashboards / Workbooks      | ✅ Yes       | n/a          | Rename in portal                      |
| Tags                        | ✅ Yes       | n/a          | Edit freely                           |

Always verify current Azure documentation before planning large migrations.

---

## 6. Legacy Mapping (Old → New)

The previous naming convention used: `{env}-{region}-{type}-rooivalk`

| Old Name (Legacy)               | New Name (v2.1)                     | Notes                        |
| ------------------------------- | ----------------------------------- | ---------------------------- |
| dev-eus2-rg-rooivalk            | nl-dev-rooivalk-rg-eus2             | NeuralLiquid owns Rooivalk   |
| prd-eus2-rg-rooivalk            | nl-prod-rooivalk-rg-eus2            |                              |
| dev-eus2-swa-rooivalk           | nl-dev-rooivalk-swa-eus2            |                              |
| prd-eus2-swa-rooivalk           | nl-prod-rooivalk-swa-eus2           |                              |
| dev-eus2-func-rooivalk          | nl-dev-rooivalk-func-eus2           |                              |
| prd-eus2-func-rooivalk          | nl-prod-rooivalk-func-eus2          |                              |
| dev-eus2-cosmos-rooivalk        | nl-dev-rooivalk-cosmos-eus2         |                              |
| prd-eus2-cosmos-rooivalk        | nl-prod-rooivalk-cosmos-eus2        |                              |
| dev-eus2-kv-rooivalk            | nl-dev-rooivalk-kv-eus2             |                              |
| prd-eus2-kv-rooivalk            | nl-prod-rooivalk-kv-eus2            |                              |
| deveus2strooivalk               | nldevrooivalksteus2                 | Storage account (no hyphens) |
| prdeus2strooivalk               | nlprodrooivalksteus2                |                              |
| dev-eus2-swa-marketing-rooivalk | nl-dev-rooivalk-marketing-swa-eus2  | Marketing site               |
| prd-eus2-swa-marketing-rooivalk | nl-prod-rooivalk-marketing-swa-eus2 |                              |

---

## 7. Bicep Naming Module

Reference implementation for consistent naming in Bicep templates:

```bicep
@description('Owning organisation code')
@allowed([
  'nl'
  'pvc'
  'tws'
  'mys'
])
param org string

@description('Deployment environment')
@allowed([
  'dev'
  'staging'
  'prod'
])
param env string

@description('Logical project / system name')
param project string

@description('Short region code')
@allowed([
  'euw'
  'eun'
  'wus'
  'wus2'
  'eus'
  'eus2'
  'cus'
  'san'
  'saf'
  'swe'
  'uks'
  'ukw'
  'eas'
  'seas'
  'aue'
  'glob'
])
param region string

var base = '${org}-${env}-${project}'

// Resource group
output rgName string = '${base}-rg-${region}'

// Common resource names
output name_app string     = '${base}-app-${region}'
output name_api string     = '${base}-api-${region}'
output name_func string    = '${base}-func-${region}'
output name_swa string     = '${base}-swa-${region}'
output name_db string      = '${base}-db-${region}'
output name_cosmos string  = '${base}-cosmos-${region}'
output name_storage string = '${org}${env}${project}st${region}'  // No hyphens for storage
output name_kv string      = '${base}-kv-${region}'
output name_ai string      = '${base}-ai-${region}'
output name_appi string    = '${base}-appi-${region}'
output name_dns string     = '${base}-dns-${region}'
output name_log string     = '${base}-log-${region}'
```

---

## 8. Resource Discovery Commands (Azure CLI)

Standard commands for auditing your Azure estate and enforcing naming.

### 8.1 List all resource groups

```bash
az group list --query "[].{name:name, location:location}" -o table
```

### 8.2 List all resources

```bash
az resource list --query "[].{name:name, type:type, rg:resourceGroup, location:location}" -o table
```

### 8.3 List resources inside a resource group

```bash
az resource list -g <resource-group-name> \
  --query "[].{name:name, type:type, location:location}" -o table
```

### 8.4 Filter by resource type

**Static Web Apps:**

```bash
az resource list --resource-type "Microsoft.Web/staticSites" -o table
```

**Function Apps:**

```bash
az resource list --resource-type "Microsoft.Web/sites" \
  --query "[?kind=='functionapp']" -o table
```

### 8.5 List non-compliant resource groups

```bash
az group list --query "[? !starts_with(name, 'nl-')
                        && !starts_with(name, 'pvc-')
                        && !starts_with(name, 'tws-')
                        && !starts_with(name, 'mys-')].name" -o table
```

---

## 9. Migration Strategy

When migrating from legacy naming to v2.1:

1. **Do NOT rename existing resources in-place** — most Azure resource names are
   immutable
2. **Create new resources with correct names** in the new resource group
3. **Migrate data/configuration** from old to new resources
4. **Update DNS/traffic routing** to point to new resources
5. **Decommission old resources** after validation

---

**Last Updated:** December 12, 2025

**Version:** 2.1
