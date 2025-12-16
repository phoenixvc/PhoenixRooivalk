---
id: adr-0029-secrets-management
title: "ADR 0029: Secrets Management Architecture"
sidebar_label: "ADR 0029: Secrets Management"
difficulty: intermediate
estimated_reading_time: 8
points: 35
tags:
  - technical
  - architecture
  - security
  - secrets
  - key-vault
  - devops
prerequisites:
  - architecture-decision-records
  - adr-0007-security-architecture
---

# ADR 0029: Secrets Management Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Secrets (API keys, connection strings, certificates) need secure
   storage, rotation, and access control across edge nodes, cloud services, and
   CI/CD pipelines
2. **Decision**: Implement hierarchical secrets management with Azure Key Vault
   as primary store, GitHub Secrets for CI/CD, and edge-local HSM for offline
   operation
3. **Trade-off**: Management complexity vs. security isolation and audit
   compliance

---

## Context

### Current Challenges

- Multiple secret sources: Azure, GitHub, edge devices
- Manual rotation creates security gaps
- No unified audit trail for secret access
- Edge nodes need offline secret access

### Requirements

| Requirement        | Specification                              |
| ------------------ | ------------------------------------------ |
| Zero plaintext     | Secrets never stored in plaintext in repos |
| Rotation support   | Automated rotation without downtime        |
| Audit trail        | All secret access logged                   |
| Offline capability | Edge nodes operate without cloud access    |
| Least privilege    | Secrets scoped to specific services        |

---

## Decision

Adopt **hierarchical secrets management** with three tiers:

### Tier 1: Azure Key Vault (Cloud Primary)

```
┌─────────────────────────────────────────────────────────────┐
│                    Azure Key Vault                           │
│                  nl-prod-rooivalk-kv-eus2                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Keys      │  │   Secrets    │  │ Certificates │      │
│  │              │  │              │  │              │      │
│  │ • Signing    │  │ • API keys   │  │ • TLS certs  │      │
│  │ • Encryption │  │ • Conn strs  │  │ • mTLS       │      │
│  │ • Wrapping   │  │ • Tokens     │  │ • Code sign  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  Access: Managed Identity, RBAC                             │
│  Audit: Azure Monitor, Log Analytics                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tier 2: GitHub Secrets (CI/CD)

| Secret Category   | Example                | Scope       |
| ----------------- | ---------------------- | ----------- |
| Azure credentials | `AZURE_CLIENT_ID`      | Repository  |
| Deployment tokens | `SWA_DEPLOYMENT_TOKEN` | Environment |
| API keys          | `OPENAI_API_KEY`       | Repository  |
| Signing keys      | `CODESIGN_CERTIFICATE` | Repository  |

### Tier 3: Edge HSM (Offline)

```rust
pub struct EdgeSecretStore {
    /// TPM-backed key storage
    tpm: TpmContext,
    /// Encrypted local cache
    cache: EncryptedCache,
    /// Sync state with cloud
    sync_status: SyncStatus,
}

impl EdgeSecretStore {
    /// Get secret, preferring local cache for offline operation
    pub async fn get_secret(&self, name: &str) -> Result<Secret, SecretError> {
        // Try local TPM first (offline capable)
        if let Ok(secret) = self.tpm.get_secret(name).await {
            return Ok(secret);
        }

        // Fall back to encrypted cache
        if let Ok(secret) = self.cache.get(name).await {
            return Ok(secret);
        }

        // Cloud sync if online
        self.sync_from_cloud(name).await
    }
}
```

---

## Secret Categories

### Application Secrets

| Secret                      | Storage   | Rotation | Access             |
| --------------------------- | --------- | -------- | ------------------ |
| Database connection strings | Key Vault | 90 days  | Functions MI       |
| API keys (OpenAI, etc.)     | Key Vault | Manual   | Functions MI       |
| JWT signing keys            | Key Vault | 365 days | Auth service       |
| Webhook secrets             | Key Vault | 90 days  | Specific functions |

### Infrastructure Secrets

| Secret                   | Storage        | Rotation  | Access          |
| ------------------------ | -------------- | --------- | --------------- |
| Azure service principal  | GitHub Secrets | 90 days   | CI/CD workflows |
| SWA deployment tokens    | GitHub Secrets | On-demand | Deploy workflow |
| Container registry creds | Key Vault      | 90 days   | Build workflow  |

### Edge Secrets

| Secret               | Storage   | Rotation      | Access        |
| -------------------- | --------- | ------------- | ------------- |
| Device identity cert | TPM       | 2 years       | Edge runtime  |
| Cloud auth token     | TPM cache | 24 hours      | Sync engine   |
| Encryption keys      | TPM       | On compromise | Local storage |

---

## Rotation Policies

### Automated Rotation

```bicep
// Key Vault secret with rotation policy
resource apiKeySecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'openai-api-key'
  properties: {
    attributes: {
      enabled: true
      exp: dateTimeAdd(utcNow(), 'P90D') // 90 day expiry
    }
  }
}
```

### Rotation Workflow

```yaml
# .github/workflows/rotate-secrets.yml
name: Secret Rotation
on:
  schedule:
    - cron: "0 0 1 */3 *" # Quarterly
  workflow_dispatch:

jobs:
  rotate:
    runs-on: ubuntu-latest
    steps:
      - name: Generate new secret
        run: |
          NEW_SECRET=$(openssl rand -base64 32)
          az keyvault secret set --vault-name ${{ vars.KEY_VAULT }} \
            --name ${{ matrix.secret }} --value "$NEW_SECRET"

      - name: Update dependent services
        run: |
          # Restart functions to pick up new secret
          az functionapp restart --name ${{ vars.FUNCTION_APP }}
```

---

## Access Control

### RBAC Roles

| Role                      | Permissions        | Assigned To             |
| ------------------------- | ------------------ | ----------------------- |
| Key Vault Administrator   | Full access        | Jurie (break-glass)     |
| Key Vault Secrets Officer | Read/write secrets | CI/CD service principal |
| Key Vault Secrets User    | Read secrets       | Function App MI         |
| Key Vault Crypto User     | Use keys           | Edge devices            |

### Managed Identity Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Function   │────▶│   Managed   │────▶│  Key Vault  │
│    App      │     │  Identity   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │    RBAC     │
                    │ Assignment  │
                    └─────────────┘
```

---

## Audit & Monitoring

### Audit Events

All secret access logged to Azure Monitor:

```kusto
// Query secret access patterns
AzureDiagnostics
| where ResourceProvider == "MICROSOFT.KEYVAULT"
| where OperationName in ("SecretGet", "SecretSet", "SecretList")
| summarize AccessCount = count() by CallerIPAddress, Identity, OperationName
| order by AccessCount desc
```

### Alerts

| Alert                  | Condition           | Action                 |
| ---------------------- | ------------------- | ---------------------- |
| Unauthorized access    | 403 errors > 5/hour | Page on-call           |
| Secret expiring        | Days to expiry < 14 | Create rotation ticket |
| Unusual access pattern | Access from new IP  | Security review        |

---

## Implementation Phases

### Phase 1: Foundation (Current)

- [x] Azure Key Vault deployed
- [x] GitHub Secrets configured
- [ ] RBAC roles assigned
- [ ] Audit logging enabled

### Phase 2: Automation

- [ ] Automated rotation workflows
- [ ] Expiry monitoring alerts
- [ ] Secret versioning

### Phase 3: Edge Integration

- [ ] TPM integration for edge nodes
- [ ] Offline secret caching
- [ ] Sync protocol implementation

---

## Consequences

### Positive

- **Security**: No plaintext secrets in code or configs
- **Audit**: Complete access trail for compliance
- **Automation**: Reduced manual rotation burden
- **Offline**: Edge nodes operate independently

### Negative

- **Complexity**: Multiple secret stores to manage
- **Cost**: Key Vault transactions, HSM modules
- **Latency**: Secret retrieval adds milliseconds

---

## Related ADRs

- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture)
- [ADR 0025: Azure Naming Conventions](./adr-0025-azure-naming-conventions)
- [ADR 0040: Edge-Cloud Communication](./adr-0040-edge-cloud-communication)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
