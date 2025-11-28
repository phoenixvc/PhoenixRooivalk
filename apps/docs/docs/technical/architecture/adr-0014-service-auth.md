---
id: adr-0014-service-auth
title: "ADR 0014: Service-to-Service Auth & Secrets"
sidebar_label: "ADR 0014: Service Auth"
difficulty: expert
estimated_reading_time: 6
points: 40
tags:
  - technical
  - architecture
  - security
  - zero-trust
  - secrets
prerequisites:
  - adr-0013-identity-auth
---

# ADR 0014: Service-to-Service Auth & Secrets (Zero-Trust Core)

**Date**: 2025-11-27  
**Status**: Accepted (API Keys with Secret Manager, mTLS roadmap)

---

## Executive Summary

1. **Problem**: How do Firebase Functions authenticate to Azure AI services securely?
2. **Decision**: API keys stored in Firebase Functions Config (Secret Manager), with mTLS roadmap for high-security
3. **Trade-off**: API keys are simpler but less secure than managed identities; acceptable for current phase

---

## Context

The Phoenix Rooivalk runtime has service-to-service calls:

```
Firebase Cloud Functions
    ├──▶ Azure AI Search (API key)
    ├──▶ Azure OpenAI (API key)
    └──▶ Firestore (implicit with Firebase Admin SDK)
```

We need to:
- Securely store and access API keys
- Rotate secrets without downtime
- Audit secret access
- Plan for higher-security deployments (mTLS, private endpoints)

---

## Decision

**API keys stored in Firebase Functions Config** (backed by Secret Manager) with:
- Rotation via `firebase functions:config:set`
- Access audit via Cloud Audit Logs
- mTLS roadmap for defence-grade deployments

---

## Current Secret Architecture

### Secret Storage

| Secret | Storage | Access Pattern |
|--------|---------|----------------|
| Azure AI Search API key | Firebase Config | `functions.config().azure.search_key` |
| Azure OpenAI API key | Firebase Config | `functions.config().azure.openai_key` |
| Azure Endpoint URL | Firebase Config | `functions.config().azure.endpoint` |
| Firebase Admin credentials | Auto-injected | `admin.initializeApp()` |

### Configuration Commands

```bash
# Set secrets (encrypted at rest)
firebase functions:config:set \
  azure.endpoint="https://phoenix-ai.openai.azure.com" \
  azure.openai_key="sk-..." \
  azure.search_endpoint="https://phoenix-search.search.windows.net" \
  azure.search_key="..."

# View current config (redacted)
firebase functions:config:get

# Deploy with new config
firebase deploy --only functions
```

---

## Options Considered

### Option 1: Firebase Functions Config ✅ Selected

| Aspect | Details |
|--------|---------|
| **Storage** | Google Secret Manager (via Firebase) |
| **Encryption** | AES-256 at rest |
| **Access** | Runtime injection to Cloud Functions |
| **Rotation** | Manual via CLI, requires redeploy |
| **Audit** | Cloud Audit Logs |

**Pros**:
- Native to Firebase ecosystem
- Zero additional setup
- Free (included in Firebase)

**Cons**:
- Manual rotation requires redeploy
- No dynamic secret refresh
- API keys (not managed identities)

---

### Option 2: Google Secret Manager (Direct)

| Aspect | Details |
|--------|---------|
| **Storage** | Google Secret Manager |
| **Access** | `@google-cloud/secret-manager` SDK |
| **Rotation** | Automatic with versioning |
| **Audit** | Cloud Audit Logs |

**Pros**:
- Automatic rotation support
- Version history
- Fine-grained IAM

**Cons**:
- Additional SDK and configuration
- Cold start impact (fetch on init)
- Marginal benefit for current scale

---

### Option 3: Azure Key Vault

| Aspect | Details |
|--------|---------|
| **Storage** | Azure Key Vault |
| **Access** | Azure SDK with managed identity |
| **Rotation** | Automatic rotation policies |
| **Audit** | Azure Monitor |

**Pros**:
- Same platform as AI services
- Managed identity support
- HSM-backed (Premium tier)

**Cons**:
- Cross-cloud access from Firebase is complex
- Requires Azure identity in GCP environment
- Overkill for current requirements

---

### Option 4: HashiCorp Vault

| Aspect | Details |
|--------|---------|
| **Storage** | Self-hosted or HCP Vault |
| **Access** | Vault SDK, dynamic secrets |
| **Rotation** | Automatic with leases |
| **Audit** | Built-in audit log |

**Pros**:
- Industry standard for secrets
- Dynamic secrets (short-lived tokens)
- Multi-cloud native

**Cons**:
- Significant operational overhead
- Additional cost (HCP) or infrastructure
- Not needed for documentation site

---

## Rationale

### Why Firebase Config (Not Key Vault)?

| Factor | Firebase Config | Azure Key Vault | Winner |
|--------|-----------------|-----------------|--------|
| **Setup complexity** | Zero | High (cross-cloud) | Firebase |
| **Cost** | Free | $0.03/10K ops | Firebase |
| **Rotation** | Manual | Automatic | Key Vault |
| **HSM backing** | ❌ | ✅ (Premium) | Key Vault |
| **Current integration** | ✅ Native | New setup | Firebase |

**Decision**: For a documentation site, Firebase Config is sufficient. Azure Key Vault is the target for defence-grade deployments.

---

## Zero-Trust Principles Applied

### Principle 1: Never Trust, Always Verify

```typescript
// Every Azure call verifies key is present
async function callAzureOpenAI(prompt: string) {
  const key = functions.config().azure?.openai_key;
  if (!key) {
    logger.error('Azure OpenAI key not configured');
    throw new Error('Service misconfigured');
  }
  
  // Proceed with authenticated call
}
```

### Principle 2: Least Privilege

| Service | Required Permissions |
|---------|---------------------|
| Azure AI Search | Query (no admin) |
| Azure OpenAI | Chat completions (no fine-tuning) |
| Firestore | Read/write specific collections |

### Principle 3: Assume Breach

- API keys scoped to specific services
- Rate limiting prevents key abuse
- Monitoring for anomalous usage
- Immediate rotation capability

---

## Rotation Strategy

### Current (Manual)

```bash
# 1. Generate new key in Azure Portal
# 2. Update Firebase config
firebase functions:config:set azure.openai_key="new-key"

# 3. Deploy functions (zero-downtime with traffic split)
firebase deploy --only functions

# 4. Revoke old key in Azure Portal
```

**Downtime**: Zero (Firebase handles gradual traffic shift)

### Future (Automatic)

```typescript
// Planned: Fetch from Secret Manager with caching
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

let cachedKey: string | null = null;
let cacheExpiry = 0;

async function getAzureKey(): Promise<string> {
  if (cachedKey && Date.now() < cacheExpiry) {
    return cachedKey;
  }
  
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: 'projects/phoenix/secrets/azure-openai-key/versions/latest'
  });
  
  cachedKey = version.payload?.data?.toString() || '';
  cacheExpiry = Date.now() + 300000; // 5 min cache
  
  return cachedKey;
}
```

---

## High-Security Roadmap (mTLS)

### Phase 1: Current (API Keys)

```
Firebase Functions ──[API Key]──▶ Azure AI Search
                   ──[API Key]──▶ Azure OpenAI
```

**Security Level**: Standard (suitable for documentation site)

### Phase 2: Private Endpoints

```
Firebase Functions ──[VPC Peering]──▶ Azure Private Endpoints
                                         ├── AI Search (private)
                                         └── OpenAI (private)
```

**Requirements**: 
- Azure VNet with private endpoints
- GCP-Azure VPN or interconnect
- IP allow-listing

### Phase 3: mTLS (Defence-Grade)

```
Rust Backend ──[mTLS]──▶ Azure AI Services
    │
    └── Client certificate issued by internal CA
```

**Requirements**:
- Internal Certificate Authority
- Certificate lifecycle management
- HSM for private keys (Azure Key Vault Premium)

---

## Monitoring & Audit

### Secret Access Logging

| Event | Logged | Alert |
|-------|--------|-------|
| Config access at deploy | ✅ | ❌ |
| Runtime secret fetch | ✅ | ❌ |
| Failed auth to Azure | ✅ | ✅ (> 5/min) |
| Unusual usage pattern | ✅ | ✅ |

### Azure API Key Audit

```bash
# Azure CLI: Check key usage
az monitor activity-log list \
  --resource-group phoenix-ai \
  --start-time 2025-11-01 \
  --query "[?operationName.value=='Microsoft.Search/searchServices/listAdminKeys/action']"
```

---

## Consequences

### Positive

- **Zero additional infrastructure**: Uses existing Firebase/GCP
- **Free**: No secret management costs
- **Simple rotation**: CLI command + deploy
- **Audited**: Cloud Audit Logs capture access

### Negative

- **Manual rotation**: No automatic key refresh
- **API keys**: Less secure than managed identities
- **Cross-cloud gap**: No unified identity between Firebase and Azure
- **Redeploy required**: Config changes need function redeploy

### Security Gaps

| Gap | Risk | Mitigation |
|-----|------|------------|
| Long-lived API keys | Medium | Rotate quarterly |
| Keys in memory | Low | Firebase handles securely |
| No HSM backing | Low | Use Key Vault for defence |
| Cross-cloud latency | Low | Not security-relevant |

---

## Migration Path

### To Azure Key Vault (Defence-Grade)

1. Create Azure Key Vault (Premium for HSM)
2. Store secrets in Key Vault
3. Create Azure Managed Identity for access
4. Implement cross-cloud auth (service principal or workload identity federation)
5. Update Functions to fetch from Key Vault
6. Enable automatic rotation policies
7. Retire Firebase Config secrets

**Effort**: 1-2 weeks  
**Prerequisites**: Azure VPN/interconnect for private access

### Alternative: Cognitive Mesh (Full Platform Shift)

Cognitive Mesh provides **built-in zero-trust service authentication** without manual secret management.

| Aspect | Firebase Config | Cognitive Mesh |
|--------|-----------------|----------------|
| **Secret storage** | Firebase Config (manual) | Built-in secure vault |
| **Rotation** | Manual redeploy | Automatic with governance |
| **Service auth** | API keys | Zero-trust service mesh |
| **Audit** | Cloud Audit Logs | Comprehensive per-call logging |
| **mTLS** | Roadmap (Phase 3) | Built-in capability |

**Repository**: [github.com/justaghost/cognitive-mesh](https://github.com/justaghost/cognitive-mesh)

**When to Consider**:
- mTLS becomes mandatory for defense deployments
- Automatic secret rotation required
- Zero-trust service mesh needed
- Cross-service audit logging mandated

**Current CM Status**: ~40% complete. Security & Zero-Trust Framework (P0) complete; this provides the foundation for service auth capabilities.

**Resource Trade-off Note**: CM migration is a platform shift, not incremental improvement. Time spent here planning is time not spent maturing CM. Firebase Config approach remains valid for documentation site.

---

## Appendix

For detailed weighted analysis, threat models, and high-security roadmap, see:
- [ADR 0014 Appendix: Service-to-Service Auth Weighted Analysis](./adr-0014-appendix-service-auth-analysis.md)

---

## Related ADRs

- [ADR 0000: ADR Management](./adr-0000-adr-management.md) - Platform decision framework
- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture)
- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [ADR 0013: Identity & Auth Strategy](./adr-0013-identity-auth.md)

---

_© 2025 Phoenix Rooivalk. Confidential._
