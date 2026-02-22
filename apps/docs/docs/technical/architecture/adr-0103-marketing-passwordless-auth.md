---
id: adr-0103-marketing-passwordless-auth
title: "ADR 0103: Marketing Site Passwordless Authentication via localStorage"
sidebar_label: "ADR 0103: Passwordless Auth"
difficulty: intermediate
estimated_reading_time: 5
points: 20
tags:
  - technical
  - architecture
  - security
prerequisites: []
---

# ADR 0103: Marketing Site Passwordless Authentication via localStorage

**Date**: 2026-02-22 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: The marketing site needs user identification for preorders,
   career applications, and profile management — but a full auth system with
   passwords, MFA, and account recovery is excessive for a pre-launch product.
2. **Decision**: Email-only authentication where `POST /auth/login` with just
   an email address creates a session. Session ID stored in `localStorage`.
   No passwords, no OAuth, no external auth providers.
3. **Trade-off**: Lower security than password-based auth (vulnerable to XSS
   session theft), but zero user friction and no password infrastructure to
   maintain.

---

## Context

The marketing site serves three authenticated use cases:

1. **Preorder submission**: Name, email, shipping address, product selection
2. **Career applications**: Position, cover letter (team members are rejected)
3. **Profile management**: Name, LinkedIn, Discord handle

None of these handle financial transactions (preorders are quotes, not
payments). The threat model is low — the worst outcome of session theft is
someone filing a fake preorder or career application.

---

## Decision

### Authentication Flow

```
User enters email → POST /auth/login → Server creates session → Returns session_id
                                         ↓
                              Frontend stores in localStorage
                                         ↓
                    Subsequent requests include session_id as Bearer token
```

### Session Storage

Sessions are stored in `localStorage` (not cookies) because:

- **No CSRF surface**: `localStorage` is not automatically sent with requests
- **No cookie consent banner needed**: Simplifies EU compliance
- **Client-controlled**: User can clear sessions by clearing storage
- **Works with static export**: No server-side session management needed

### Security Implications

| Risk              | Mitigation                                         |
| ----------------- | -------------------------------------------------- |
| XSS session theft | CSP headers, React's built-in XSS protection       |
| Session fixation  | Server generates unique session IDs                |
| No rate limiting  | API-level rate limiting on `/auth/login`            |
| No email verify   | Team member detection prevents impersonation        |
| Session expiry    | `expires_at` timestamp enforced server-side         |

### Team Member Detection

The API maintains a `team_members` table. When an authenticated user's email
matches a team member, `is_team_member: true` is set in the response. Team
members cannot submit career applications (409 Conflict).

---

## Consequences

### Positive

- Zero friction signup (no password to remember)
- No password infrastructure (reset flows, hashing, breach monitoring)
- No external auth provider dependency
- Works entirely with static Next.js export

### Negative

- XSS vulnerability could steal session from localStorage
- No email verification (anyone can claim any email)
- Cannot revoke sessions server-side without DB cleanup
- Not suitable for financial transactions or sensitive data

---

## Migration Path

When the platform matures to handle payments, this auth system should be
replaced with:

1. **Option A**: Azure Entra ID (B2C) — aligns with docs site auth
2. **Option B**: Passkeys/WebAuthn — passwordless with strong security
3. **Option C**: Magic links via email — keeps email-only UX with verification

---

## Change Log

| Date       | Change              | Author   |
| ---------- | ------------------- | -------- |
| 2026-02-22 | Initial ADR created | AI Agent |
