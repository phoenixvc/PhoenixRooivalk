---
id: adr-0014-appendix-service-auth-analysis
title: "ADR 0014 Appendix: Service-to-Service Auth Analysis"
sidebar_label: "Appendix: Service Auth Analysis"
difficulty: expert
estimated_reading_time: 10
points: 30
tags:
  - technical
  - architecture
  - analysis
  - security
  - secrets
  - zero-trust
---

# ADR 0014 Appendix: Service-to-Service Auth Weighted Analysis

This appendix provides the detailed technical analysis supporting
[ADR 0014: Service-to-Service Auth & Secrets](./adr-0014-service-auth.md).

---

## Weighted Decision Matrix

### Evaluation Criteria

| Criterion                  | Weight | Rationale                             |
| -------------------------- | ------ | ------------------------------------- |
| **Operational Simplicity** | 22%    | Minimize secret management overhead   |
| **Firebase Integration**   | 18%    | Native support with Cloud Functions   |
| **Security Level**         | 16%    | Protection against compromise         |
| **Cost Efficiency**        | 14%    | Budget for documentation site         |
| **Rotation Capability**    | 12%    | Reduce exposure from compromised keys |
| **Audit & Compliance**     | 10%    | Logging and regulatory requirements   |
| **Defence-Grade Path**     | 8%     | Future high-security deployments      |

---

### Option Scoring (1-10 Scale)

| Criterion              | Firebase Config | Google Secret Manager | Azure Key Vault | HashiCorp Vault |
| ---------------------- | --------------- | --------------------- | --------------- | --------------- |
| Operational Simplicity | 10              | 7                     | 5               | 3               |
| Firebase Integration   | 10              | 8                     | 4               | 5               |
| Security Level         | 6               | 8                     | 9               | 10              |
| Cost Efficiency        | 10              | 8                     | 6               | 4               |
| Rotation Capability    | 4               | 8                     | 9               | 10              |
| Audit & Compliance     | 7               | 9                     | 9               | 10              |
| Defence-Grade Path     | 4               | 6                     | 9               | 10              |

---

### Weighted Scores Calculation

| Option                | Weighted Score | Rank   |
| --------------------- | -------------- | ------ |
| **Firebase Config**   | **7.86**       | 🥇 1st |
| Google Secret Manager | 7.46           | 🥈 2nd |
| Azure Key Vault       | 6.94           | 🥉 3rd |
| HashiCorp Vault       | 6.44           | 4th    |

**Calculation for Firebase Config**:

```
(10×0.22) + (10×0.18) + (6×0.16) + (10×0.14) + (4×0.12) + (7×0.10) + (4×0.08)
= 2.2 + 1.8 + 0.96 + 1.4 + 0.48 + 0.7 + 0.32
= 7.86
```

**Note**: Firebase Config and Google Secret Manager are very close. Firebase
Config wins due to zero-setup requirement.

---

## Feature Comparison Matrix

### Secret Storage Capabilities

| Feature               | Firebase Config | Google Secret Manager | Azure Key Vault | HashiCorp Vault |
| --------------------- | --------------- | --------------------- | --------------- | --------------- |
| Encryption at Rest    | ✅ AES-256      | ✅ AES-256            | ✅ AES-256/HSM  | ✅ AES-256      |
| Encryption in Transit | ✅ TLS 1.3      | ✅ TLS 1.3            | ✅ TLS 1.3      | ✅ TLS 1.3      |
| Version History       | ❌              | ✅                    | ✅              | ✅              |
| Automatic Rotation    | ❌              | ✅                    | ✅              | ✅              |
| Dynamic Secrets       | ❌              | ❌                    | ❌              | ✅              |
| HSM Support           | ❌              | ⚠️ Cloud HSM          | ✅ Premium      | ✅ Enterprise   |
| Multi-Region          | ✅ Global       | ✅                    | ✅              | ✅              |
| Cross-Cloud Access    | ⚠️ Limited      | ⚠️ GCP native         | ⚠️ Azure native | ✅ Native       |

### Access Control

| Feature               | Firebase Config | Google Secret Manager  | Azure Key Vault | HashiCorp Vault |
| --------------------- | --------------- | ---------------------- | --------------- | --------------- |
| IAM Integration       | ✅ Firebase     | ✅ GCP IAM             | ✅ Azure RBAC   | ✅ Native       |
| Fine-Grained Policies | ❌              | ✅                     | ✅              | ✅              |
| Managed Identity      | ❌              | ✅ (Workload Identity) | ✅              | ✅              |
| Service Account Auth  | ✅              | ✅                     | ✅              | ✅              |
| API Key Auth          | ❌              | ❌                     | ✅              | ✅              |
| Certificate Auth      | ❌              | ❌                     | ✅              | ✅              |

### Audit & Compliance

| Feature        | Firebase Config | Google Secret Manager | Azure Key Vault    | HashiCorp Vault |
| -------------- | --------------- | --------------------- | ------------------ | --------------- |
| Access Logging | ✅ Cloud Audit  | ✅ Cloud Audit        | ✅ Diagnostic Logs | ✅ Audit Device |
| SIEM Export    | ⚠️ Manual       | ✅                    | ✅                 | ✅              |
| SOC 2          | ✅              | ✅                    | ✅                 | ✅              |
| FedRAMP        | ⚠️ GovCloud     | ✅                    | ✅                 | ✅ Enterprise   |
| HIPAA          | ✅              | ✅                    | ✅                 | ✅              |

---

## Cost Analysis (24 Months)

### Firebase Config (Current)

| Component  | Monthly | 24-Month |
| ---------- | ------- | -------- |
| Storage    | $0      | $0       |
| Access     | $0      | $0       |
| Operations | $0      | $0       |
| **Total**  | **$0**  | **$0**   |

### Google Secret Manager

| Component              | Monthly        | 24-Month |
| ---------------------- | -------------- | -------- |
| Active secret versions | ~$0.06/version | ~$30     |
| Access operations      | $0.03/10K ops  | ~$2      |
| **Total**              | **~$1.50**     | **~$36** |

### Azure Key Vault (Standard)

| Component           | Monthly       | 24-Month |
| ------------------- | ------------- | -------- |
| Secrets operations  | $0.03/10K ops | ~$15     |
| Advanced operations | $0.03/10K ops | ~$5      |
| **Total**           | **~$1**       | **~$20** |

**Note**: Covered by Azure Foundry credits.

### Azure Key Vault (Premium + HSM)

| Component          | Monthly       | 24-Month |
| ------------------ | ------------- | -------- |
| HSM-protected keys | $1/key/month  | ~$48     |
| Operations         | $0.03/10K ops | ~$15     |
| **Total**          | **~$3**       | **~$63** |

### HashiCorp Vault (HCP)

| Component        | Monthly    | 24-Month   |
| ---------------- | ---------- | ---------- |
| Development tier | $60/month  | $1,440     |
| Starter tier     | $400/month | $9,600     |
| **Total (Dev)**  | **$60**    | **$1,440** |

### HashiCorp Vault (Self-Hosted)

| Component         | Monthly   | 24-Month     |
| ----------------- | --------- | ------------ |
| Cluster (3 nodes) | ~$120     | ~$2,880      |
| Storage backend   | ~$20      | ~$480        |
| Operations effort | ~$300     | ~$7,200      |
| **Total**         | **~$440** | **~$10,560** |

---

## Secret Rotation Analysis

### Current: Manual Rotation

```
┌────────────────────────────────────────────────────────────────┐
│                    Manual Rotation Process                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Generate new API key in Azure Portal                       │
│     └── Human action, ~2 minutes                               │
│                                                                 │
│  2. Update Firebase config                                      │
│     └── firebase functions:config:set azure.key="..."          │
│     └── ~1 minute                                               │
│                                                                 │
│  3. Deploy functions                                            │
│     └── firebase deploy --only functions                        │
│     └── ~3-5 minutes                                            │
│                                                                 │
│  4. Verify deployment                                           │
│     └── Test API calls, ~2 minutes                             │
│                                                                 │
│  5. Revoke old key in Azure Portal                             │
│     └── Human action, ~1 minute                                │
│                                                                 │
│  Total time: ~10-15 minutes                                     │
│  Downtime: Zero (Firebase gradual rollout)                     │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Future: Automatic Rotation with Secret Manager

```typescript
// Automatic rotation with caching
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

interface SecretCache {
  value: string;
  expiry: number;
}

const secretCache = new Map<string, SecretCache>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function getSecret(secretName: string): Promise<string> {
  // Check cache first
  const cached = secretCache.get(secretName);
  if (cached && Date.now() < cached.expiry) {
    return cached.value;
  }

  // Fetch from Secret Manager
  const client = new SecretManagerServiceClient();
  const [version] = await client.accessSecretVersion({
    name: `projects/phoenix-rooivalk/secrets/${secretName}/versions/latest`,
  });

  const value = version.payload?.data?.toString() || "";

  // Update cache
  secretCache.set(secretName, {
    value,
    expiry: Date.now() + CACHE_TTL_MS,
  });

  return value;
}

// Usage in function
export const ragQuery = functions.https.onCall(async (data, context) => {
  const azureKey = await getSecret("azure-openai-key");
  // Use key for Azure API call
});
```

### Rotation Frequency Recommendations

| Secret Type          | Rotation Period | Rationale                   |
| -------------------- | --------------- | --------------------------- |
| Azure OpenAI API Key | 90 days         | Balance security/operations |
| Azure AI Search Key  | 90 days         | Match OpenAI rotation       |
| Service Account Keys | 365 days        | Google manages rotation     |
| Admin Credentials    | 30 days         | Higher privilege            |
| MFA Backup Codes     | 180 days        | On-demand regeneration      |

---

## Zero-Trust Implementation

### Principle 1: Never Trust, Always Verify

```typescript
// Every external call validates credentials
async function callAzureService(
  endpoint: string,
  method: "GET" | "POST",
  body?: unknown,
): Promise<Response> {
  const startTime = Date.now();

  // 1. Get current secret (with caching)
  const apiKey = await getSecret("azure-api-key");

  if (!apiKey) {
    logger.error("Azure API key not available");
    throw new functions.https.HttpsError(
      "internal",
      "Service configuration error",
    );
  }

  // 2. Make authenticated request
  const response = await fetch(endpoint, {
    method,
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // 3. Log access (without sensitive data)
  logger.info("Azure API call", {
    endpoint: endpoint.replace(/\/[a-f0-9-]{36}/g, "/<id>"), // Redact IDs
    method,
    status: response.status,
    latencyMs: Date.now() - startTime,
  });

  return response;
}
```

### Principle 2: Least Privilege

| Service         | Required Permission    | Granted Permission   | Justification              |
| --------------- | ---------------------- | -------------------- | -------------------------- |
| Azure AI Search | Query documents        | Query only           | No index management needed |
| Azure OpenAI    | Chat completions       | Completions only     | No fine-tuning access      |
| Firestore       | Read/write collections | Specific collections | No admin access            |
| Firebase Auth   | Read user claims       | Read only            | No user management         |

### Principle 3: Assume Breach

```typescript
// Defense in depth for secret exposure
const SECURITY_CONFIG = {
  // Rate limiting even for valid keys
  maxRequestsPerMinute: 100,

  // Automatic key rotation trigger
  suspiciousActivityThreshold: 10, // 10x normal usage

  // IP allowlisting for admin functions
  adminAllowedIPs: ["10.0.0.0/8", "172.16.0.0/12"],

  // Automatic alerting
  alertOnUnusualPatterns: true,
};

async function detectAnomalousActivity(
  userId: string,
  action: string,
): Promise<boolean> {
  const recentActions = await getRecentActions(userId, 60); // Last 60 minutes
  const normalRate = await getNormalRate(userId, action);

  if (
    recentActions.length >
    normalRate * SECURITY_CONFIG.suspiciousActivityThreshold
  ) {
    await triggerSecurityAlert({
      type: "anomalous_activity",
      userId,
      action,
      rate: recentActions.length,
      threshold: normalRate * SECURITY_CONFIG.suspiciousActivityThreshold,
    });
    return true;
  }

  return false;
}
```

---

## High-Security Roadmap

### Phase 1: Current (API Keys in Firebase Config)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 1: API Keys                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Firebase Cloud Functions                                       │
│        │                                                         │
│        ├──[API Key Header]──▶ Azure AI Search                   │
│        │                                                         │
│        └──[API Key Header]──▶ Azure OpenAI                      │
│                                                                  │
│   Security Level: Standard                                       │
│   Use Case: Documentation site                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 2: Managed Identity + Private Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 2: Private Network                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Google Cloud VPC                    Azure VNet                 │
│   ┌───────────────────┐               ┌──────────────────────┐  │
│   │ Firebase Functions│──[VPN/IC]───▶│ Private Endpoints    │  │
│   │                   │               │  ├─ AI Search        │  │
│   │ (Workload ID)     │               │  └─ OpenAI           │  │
│   └───────────────────┘               └──────────────────────┘  │
│                                                                  │
│   Security Level: Enhanced                                       │
│   Use Case: Enterprise deployments                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: mTLS + HSM (Defence-Grade)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Phase 3: mTLS + HSM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   On-Premises / Azure                                            │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                                                          │   │
│   │   Rust Backend                                           │   │
│   │        │                                                 │   │
│   │        ├──[mTLS]──▶ Azure AI Search (Private)           │   │
│   │        │     └── Client cert from internal CA            │   │
│   │        │                                                 │   │
│   │        └──[mTLS]──▶ Azure OpenAI (Private)              │   │
│   │              └── HSM-protected private key               │   │
│   │                                                          │   │
│   │   Azure Key Vault Premium (HSM)                          │   │
│   │        └── Certificate lifecycle management              │   │
│   │                                                          │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│   Security Level: Defence-grade                                  │
│   Use Case: Airports, prisons, law enforcement                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Threat Analysis

### Secret Exposure Scenarios

| Scenario         | Likelihood | Impact | Detection        | Response                           |
| ---------------- | ---------- | ------ | ---------------- | ---------------------------------- |
| Key in logs      | Low        | High   | Log scanning     | Immediate rotation                 |
| Key in git       | Very Low   | High   | Pre-commit hooks | Immediate rotation                 |
| Key exfiltration | Very Low   | High   | Usage anomaly    | Immediate rotation + investigation |
| Key brute force  | Very Low   | Low    | Rate limiting    | Automatic block                    |
| Insider threat   | Low        | High   | Audit logging    | Investigation + rotation           |

### Mitigation Controls

```bash
# Pre-commit hook to prevent secret leaks
# .husky/pre-commit

#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for potential secrets in staged files
if git diff --cached | grep -iE "(api[_-]?key|secret|password|token)" | grep -vE "^[+-].*//|^[+-].*#|functions.config\(\)"; then
  echo "⚠️  Potential secret detected in commit!"
  echo "Please remove or use Firebase Config for secrets."
  exit 1
fi
```

### Incident Response Procedure

```
┌────────────────────────────────────────────────────────────────┐
│                Secret Compromise Response Plan                   │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. IMMEDIATE (< 5 minutes)                                     │
│     ├── Generate new key in Azure Portal                        │
│     ├── Update Firebase config                                  │
│     └── Deploy functions                                        │
│                                                                  │
│  2. CONTAINMENT (< 15 minutes)                                  │
│     ├── Revoke compromised key                                  │
│     ├── Enable enhanced monitoring                              │
│     └── Check for unauthorized usage                            │
│                                                                  │
│  3. INVESTIGATION (< 24 hours)                                  │
│     ├── Analyze audit logs                                      │
│     ├── Identify exposure source                                │
│     └── Assess data access                                      │
│                                                                  │
│  4. REMEDIATION (< 48 hours)                                    │
│     ├── Implement additional controls                           │
│     ├── Update rotation schedule                                │
│     └── Document lessons learned                                │
│                                                                  │
│  5. POST-INCIDENT (< 1 week)                                    │
│     ├── Complete incident report                                │
│     ├── Update runbooks                                         │
│     └── Security review                                         │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Alerting

### Key Metrics

| Metric            | Normal   | Warning     | Critical    | Action                   |
| ----------------- | -------- | ----------- | ----------- | ------------------------ |
| API call failures | < 1%     | 1-5%        | > 5%        | Investigate key validity |
| Response latency  | < 200ms  | 200-500ms   | > 500ms     | Check network/quota      |
| Daily API calls   | Baseline | 2x baseline | 5x baseline | Usage anomaly alert      |
| Auth failures     | 0        | 1-5/hour    | > 5/hour    | Possible key compromise  |

### Alert Configuration

```typescript
// Monitoring alert definitions
const ALERT_RULES = [
  {
    name: "azure_auth_failures",
    condition: "count(status=401) > 5 in 1h",
    severity: "critical",
    action: "page_oncall",
    runbook: "https://docs.phoenix/runbooks/azure-auth-failure",
  },
  {
    name: "unusual_api_usage",
    condition: "rate > baseline * 3",
    severity: "warning",
    action: "slack_security",
    runbook: "https://docs.phoenix/runbooks/usage-anomaly",
  },
  {
    name: "secret_access_spike",
    condition: "secret_access_count > 100 in 5m",
    severity: "warning",
    action: "slack_security",
    runbook: "https://docs.phoenix/runbooks/secret-access-spike",
  },
];
```

---

## Decision Summary

| Criterion              | Firebase Config  | Notes                      |
| ---------------------- | ---------------- | -------------------------- |
| **Recommended**        | ✅ Yes           | Best fit for current phase |
| **Primary benefit**    | Zero setup       | Already integrated         |
| **Main trade-off**     | Manual rotation  | No auto-refresh            |
| **Migration effort**   | N/A              | Already deployed           |
| **24-month cost**      | $0               | Free                       |
| **Risk level**         | Low-Medium       | Acceptable for docs site   |
| **Defence-grade path** | Key Vault + mTLS | Planned for Phase 2-3      |

---

## References

- [Firebase Functions Configuration](https://firebase.google.com/docs/functions/config-env)
- [Google Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/)
- [HashiCorp Vault](https://www.vaultproject.io/docs)
- [Zero Trust Architecture - NIST SP 800-207](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf)

---

_© 2025 Phoenix Rooivalk. Confidential._
