# Security Audit

Run a comprehensive security scan across all language stacks.

Arguments: $ARGUMENTS

If no argument is provided, run the full audit. If an argument is provided,
scope to that area (e.g., `rust`, `python`, `js`, `infra`, `secrets`).

## Full Audit Steps

Run sequentially and report all findings:

**Rust dependencies:**

1. `cargo audit` — Known vulnerability scan (if available)
2. Verify no `native-tls` features in Cargo.lock
3. Confirm `forbid(unsafe_code)` in workspace Cargo.toml

**Python dependencies:**

1. `cd apps/detector && bandit -r src/ -ll -ii -x tests/` — Security scan
2. `cd apps/detector && pip-audit` — Dependency vulnerabilities (if available)

**JavaScript dependencies:**

1. `pnpm audit` — npm advisory scan
2. Check for known vulnerable packages in pnpm-lock.yaml

**Secrets scan:**

1. Search for hardcoded API keys, tokens, passwords, connection strings
2. Verify no `.env` files tracked in git
3. Check for secrets in CI workflow files

**Infrastructure:**

1. Review Azure Bicep RBAC and network rules
2. Check Terraform state for exposed secrets
3. Validate CORS and CSP configurations

## Output Format

```text
[SEVERITY] Category — file_path:line_number
Description of the vulnerability.
Remediation steps.
```

At the end, provide a summary table by severity and a prioritized fix list.
