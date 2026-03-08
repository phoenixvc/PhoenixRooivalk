# Security Rules

- Never commit `.env` files, credentials, API keys, or private keys
- Never add `native-tls` features — use `rustls` only (RUSTSEC-2025-0004)
- Validate all user input at system boundaries (API endpoints, CLI args)
- OWASP Top 10: no XSS, no injection, no path traversal, no SSRF
- No `eval()`, `dangerouslySetInnerHTML`, or `unsafe` blocks
- API endpoints must check auth/authz — use middleware, not inline checks
- x402 payment endpoint is M2M-only (rejects browser cookies)
- Unsafe deserialization: never trust external data without validation
- Secrets in CI: use GitHub **Secrets** (not Variables) for sensitive values
- Docusaurus env vars: use GitHub **Variables** (not Secrets) for build-time
  values that get embedded in static bundles
- Azure Entra tokens: validate audience, issuer, and expiry
- SQLite: foreign keys enforced via PRAGMA, extended result codes enabled
