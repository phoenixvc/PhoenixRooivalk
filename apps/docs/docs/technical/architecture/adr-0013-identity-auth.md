---
id: adr-0013-identity-auth
title: "ADR 0013: Identity & AuthN/AuthZ Strategy"
sidebar_label: "ADR 0013: Identity & Auth"
difficulty: expert
estimated_reading_time: 8
points: 40
tags:
  - technical
  - architecture
  - security
  - authentication
  - authorization
prerequisites:
  - adr-0012-runtime-functions
---

# ADR 0013: Identity & AuthN/AuthZ Strategy

**Date**: 2025-11-27  
**Status**: Accepted (Firebase Auth + Custom Claims)

---

## Executive Summary

1. **Problem**: Need unified identity and authorization for documentation, AI
   features, and future defence deployments
2. **Decision**: Firebase Auth as primary IdP with custom claims for RBAC, Entra
   ID federation for enterprise
3. **Trade-off**: Firebase lock-in is acceptable for current phase; migration
   path preserved for high-security deployments

---

## Context

The Phoenix Rooivalk documentation site requires:

- **User authentication** for protected documentation areas
- **Role-based access** for AI features (viewer, editor, admin)
- **Rate limiting** tied to user identity
- **Future federation** with enterprise IdPs (airports, law enforcement)
- **Compliance** with defence sector requirements

### Current State

- Firebase Auth deployed for docs site
- Anonymous users can view public docs
- AI features require authentication
- No RBAC beyond authenticated/unauthenticated

---

## Decision

**Firebase Auth** as primary Identity Provider with:

- **Custom claims** for role-based access control
- **Entra ID federation** for enterprise SSO (future)
- **Token-based authorization** in Cloud Functions

---

## Identity Model

### User Types

| Type           | Description                        | Auth Method                    |
| -------------- | ---------------------------------- | ------------------------------ |
| **Public**     | Anonymous documentation viewers    | None                           |
| **Registered** | Authenticated users with AI access | Email/Password, Google, GitHub |
| **Enterprise** | SSO users from partner orgs        | Entra ID federation            |
| **Admin**      | System administrators              | Email/Password + MFA           |

### Role Model

| Role      | Scope        | Permissions                                      |
| --------- | ------------ | ------------------------------------------------ |
| `viewer`  | Default      | Read public docs, use AI chat, 50 queries/hr     |
| `editor`  | Contributors | + Edit suggestions, 200 queries/hr               |
| `admin`   | Operators    | + Admin panels, unlimited queries, config access |
| `auditor` | Compliance   | + Read-only access to all logs and metrics       |

### Claims Structure

```typescript
interface CustomClaims {
  role: "viewer" | "editor" | "admin" | "auditor";
  org?: string; // Organization ID for enterprise users
  tier?: "free" | "pro"; // Subscription tier (future)
  features?: string[]; // Feature flags
}
```

---

## Options Considered

### Option 1: Firebase Auth (Current) ✅ Selected

| Aspect            | Details                                    |
| ----------------- | ------------------------------------------ |
| **Providers**     | Email, Google, GitHub, Microsoft, Phone    |
| **Federation**    | SAML, OIDC (Entra ID, Okta)                |
| **Custom claims** | Up to 1000 bytes per user                  |
| **MFA**           | SMS, TOTP via Firebase extensions          |
| **Cost**          | Free up to 10K MAU, then $0.0025-0.006/MAU |

**Pros**:

- Already deployed and integrated
- Native Firebase Functions integration
- Custom claims for RBAC
- Federation-ready for enterprise

**Cons**:

- Limited MFA options (no hardware keys natively)
- 1000-byte claim limit
- Firebase-specific token format

---

### Option 2: Entra ID (Azure AD B2C)

| Aspect            | Details                                  |
| ----------------- | ---------------------------------------- |
| **Providers**     | Microsoft, Social, Custom                |
| **Federation**    | SAML, OIDC, WS-Fed                       |
| **Custom claims** | Unlimited via extension attributes       |
| **MFA**           | Full suite including FIDO2               |
| **Cost**          | First 50K MAU free, then $0.003-0.01/MAU |

**Pros**:

- Enterprise-grade for defence sector
- Same platform as Azure AI (unified identity)
- FIDO2 hardware key support
- Conditional access policies

**Cons**:

- Requires migration from Firebase Auth
- More complex configuration
- Separate from Firebase ecosystem

---

### Option 3: Auth0

| Aspect            | Details                              |
| ----------------- | ------------------------------------ |
| **Providers**     | 60+ social, enterprise, passwordless |
| **Federation**    | SAML, OIDC, WS-Fed, LDAP             |
| **Custom claims** | Rules/Actions for dynamic claims     |
| **MFA**           | Full suite                           |
| **Cost**          | 7K MAU free, then $0.015+/MAU        |

**Pros**:

- Most flexible and feature-rich
- Excellent developer experience
- Strong compliance certifications

**Cons**:

- Additional vendor and cost
- No native Firebase integration
- Overkill for current scale

---

### Option 4: Self-Hosted (Keycloak/ORY)

| Aspect         | Details                |
| -------------- | ---------------------- |
| **Providers**  | Fully customizable     |
| **Federation** | Full SAML/OIDC support |
| **Cost**       | Infrastructure only    |

**Pros**:

- Full control and customization
- No vendor lock-in
- Required for classified deployments

**Cons**:

- Significant operational overhead
- Security responsibility on us
- Not needed for documentation site

---

## Rationale

### Why Firebase Auth (Not Entra ID)?

| Factor                    | Firebase    | Entra ID      | Winner   |
| ------------------------- | ----------- | ------------- | -------- |
| **Current deployment**    | ✅ Deployed | New setup     | Firebase |
| **Firestore integration** | Native      | SDK needed    | Firebase |
| **Functions integration** | Native      | Manual verify | Firebase |
| **Enterprise federation** | ✅ OIDC     | Native        | Tie      |
| **Defence-grade MFA**     | ❌ Limited  | ✅ FIDO2      | Entra ID |
| **Complexity**            | Low         | Medium        | Firebase |

**Decision**: Firebase Auth meets current requirements. Entra ID is the
migration target for high-security deployments (airports, prisons) in Phase 2.

---

## Authorization Flow

### Token-Based Flow

```
Browser
    │ Login (Firebase Auth)
    ▼
Firebase Auth
    │ Returns JWT with custom claims
    ▼
Browser (stores token)
    │ API call with Bearer token
    ▼
Firebase Functions
    │ context.auth.token.role
    │ Apply RBAC policies
    ▼
Protected Resources
```

### Custom Claims Management

```typescript
// Set claims (Admin SDK only)
await admin.auth().setCustomUserClaims(uid, {
  role: "editor",
  org: "phoenix-team",
  features: ["ai-panel", "admin-suggestions"],
});

// Verify in Cloud Function
export const protectedFunction = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    const role = context.auth.token.role || "viewer";

    if (role !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admin required",
      );
    }

    // Proceed with admin action
  },
);
```

---

## AI Feature Authorization

### RAG Context Filtering by Role

```typescript
interface RAGAuthzPolicy {
  role: string;
  allowedCategories: string[];
  maxChunksPerQuery: number;
  rateLimitPerHour: number;
}

const POLICIES: Record<string, RAGAuthzPolicy> = {
  viewer: {
    allowedCategories: ["public", "tutorial", "api"],
    maxChunksPerQuery: 5,
    rateLimitPerHour: 50,
  },
  editor: {
    allowedCategories: ["public", "tutorial", "api", "internal"],
    maxChunksPerQuery: 10,
    rateLimitPerHour: 200,
  },
  admin: {
    allowedCategories: ["*"],
    maxChunksPerQuery: 20,
    rateLimitPerHour: Infinity,
  },
};
```

### AI Tool Access Gating

| Tool                 | viewer | editor | admin |
| -------------------- | ------ | ------ | ----- |
| Ask Docs (RAG)       | ✅     | ✅     | ✅    |
| Summarize            | ✅     | ✅     | ✅    |
| Explain              | ✅     | ✅     | ✅    |
| Related Docs         | ✅     | ✅     | ✅    |
| Suggest Improvements | ❌     | ✅     | ✅    |
| Competitor Analysis  | ❌     | ❌     | ✅    |
| SWOT Generator       | ❌     | ❌     | ✅    |
| Reindex Docs         | ❌     | ❌     | ✅    |
| Clear Cache          | ❌     | ❌     | ✅    |

---

## Federation Strategy (Future)

### Entra ID Federation for Enterprise

```
Enterprise User (Airport Ops)
    │ Login via Entra ID
    ▼
Entra ID (Enterprise IdP)
    │ OIDC redirect
    ▼
Firebase Auth (OIDC provider)
    │ Map claims, create Firebase user
    ▼
Firebase Functions
    │ auth.token includes enterprise claims
    ▼
Protected Resources
```

### Claim Mapping

| Entra ID Claim       | Firebase Custom Claim |
| -------------------- | --------------------- |
| `preferred_username` | `email`               |
| `groups`             | `role` (mapped)       |
| `tenant_id`          | `org`                 |
| `roles`              | `features` (filtered) |

---

## Consequences

### Positive

- **Zero migration cost**: Firebase Auth already deployed
- **Native integration**: Seamless with Functions and Firestore
- **RBAC ready**: Custom claims enable role-based access
- **Federation ready**: OIDC support for enterprise SSO

### Negative

- **MFA limitations**: No FIDO2 hardware keys
- **Claim size limit**: 1000 bytes max per user
- **Firebase lock-in**: Token format is Firebase-specific
- **Migration needed**: For defence-grade deployments

### Security Gaps to Address

| Gap                   | Risk     | Mitigation                       |
| --------------------- | -------- | -------------------------------- |
| No hardware MFA       | Medium   | Use TOTP via Firebase extensions |
| Token in localStorage | Low      | Use sessionStorage, short expiry |
| Claim tampering       | Very Low | Claims verified server-side      |
| Rate limit bypass     | Low      | Per-IP rate limiting as backup   |

---

## Compliance Considerations

### Defence Sector Requirements

| Requirement     | Firebase Auth Status | Mitigation                  |
| --------------- | -------------------- | --------------------------- |
| MFA required    | ✅ TOTP available    | Enforce in security rules   |
| Session timeout | ✅ Configurable      | Set to 1 hour               |
| Audit logging   | ✅ Firebase logs     | Export to SIEM              |
| FIDO2/PIV       | ❌ Not supported     | Migrate to Entra ID         |
| On-prem option  | ❌ Cloud only        | Use Keycloak for classified |

### Migration Path to Entra ID

1. Enable Entra ID as OIDC provider in Firebase
2. Create claim mapping rules
3. Test with pilot enterprise users
4. Migrate remaining users (optional)
5. For classified: Deploy Keycloak on-prem

---

## Appendix

For detailed weighted analysis, RBAC matrices, and federation flows, see:

- [ADR 0013 Appendix: Identity & Auth Weighted Analysis](./adr-0013-appendix-identity-auth-analysis.md)

---

## Related ADRs

- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture)
- [ADR 0012: Runtime Functions Architecture](./adr-0012-runtime-functions.md)
- [ADR 0014: Service-to-Service Auth](./adr-0014-service-auth.md)

---

_© 2025 Phoenix Rooivalk. Confidential._
