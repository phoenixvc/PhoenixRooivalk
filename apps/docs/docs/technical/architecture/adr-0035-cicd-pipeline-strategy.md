---
id: adr-0035-cicd-pipeline-strategy
title: "ADR 0035: CI/CD Pipeline Strategy"
sidebar_label: "ADR 0035: CI/CD Pipeline"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - devops
  - cicd
  - github-actions
  - deployment
prerequisites:
  - architecture-decision-records
  - adr-0025-azure-naming-conventions
---

# ADR 0035: CI/CD Pipeline Strategy

**Date**: 2025-12-12 **Status**: Accepted (Implemented)

---

## Executive Summary

1. **Problem**: Need reliable, automated deployment pipelines for monorepo with
   multiple apps, packages, and deployment targets
2. **Decision**: GitHub Actions with environment-based deployment gates,
   Turborepo for build orchestration, and Azure SWA CLI for preview deployments
3. **Trade-off**: GitHub Actions complexity vs. unified platform for code and
   deployments

---

## Context

### Current State

Phoenix Rooivalk uses a Turborepo monorepo with:

- **apps/docs**: Docusaurus documentation site → Azure SWA
- **apps/marketing**: Next.js marketing site → Azure SWA
- **apps/threat-simulator-desktop**: Tauri 2 desktop application → GitHub Releases
- **packages/\***: Shared libraries

### Requirements

| Requirement         | Specification                    |
| ------------------- | -------------------------------- |
| Monorepo support    | Build only affected packages     |
| Environment gates   | Require approval for production  |
| Preview deployments | PR previews for review           |
| Rollback capability | Quick revert to previous version |
| Secret management   | Secure credential handling       |

---

## Decision

Adopt **GitHub Actions** with the following architecture:

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         GitHub Actions                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                      On Push / PR                                ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           ││
│  │  │  Lint   │─▶│  Test   │─▶│  Build  │─▶│ Preview │           ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    On Merge to Main                              ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           ││
│  │  │  Build  │─▶│ Staging │─▶│ Approve │─▶│  Prod   │           ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘           ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Environment Strategy

| Environment | Trigger         | Approval | URL Pattern                        |
| ----------- | --------------- | -------- | ---------------------------------- |
| Preview     | PR created      | None     | `pr-{number}.preview.rooivalk.dev` |
| Staging     | Merge to main   | None     | `staging.rooivalk.dev`             |
| Production  | Staging success | Required | `rooivalk.dev`                     |

---

## Workflow Implementation

> **Implementation note**: The conceptual workflows below (`ci.yml`,
> `deploy.yml`, `preview.yml`, `rollback.yml`) were split into per-technology
> workflows during implementation: `ci-rust.yml`, `ci-marketing.yml`,
> `detector-ci.yml`, `deploy-docs-azure.yml`, `deploy-marketing-azure.yml`,
> `deploy-azure-functions.yml`, `release-desktop.yml`, and others. The
> architecture remains the same; only the file granularity changed.

### Build & Test Workflow

```yaml
# .github/workflows/ci.yml (conceptual — split into ci-rust.yml, ci-marketing.yml, detector-ci.yml)
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2 # For Turborepo change detection

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

      - name: Build (affected only)
        run: pnpm turbo build --filter='...[origin/main]'
```

### Deploy Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      docs-changed: ${{ steps.changes.outputs.docs }}
      marketing-changed: ${{ steps.changes.outputs.marketing }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            docs:
              - 'apps/docs/**'
              - 'packages/**'
            marketing:
              - 'apps/marketing/**'
              - 'packages/**'

      - name: Build docs
        if: steps.changes.outputs.docs == 'true'
        run: pnpm turbo build --filter=docs

      - name: Upload docs artifact
        if: steps.changes.outputs.docs == 'true'
        uses: actions/upload-artifact@v4
        with:
          name: docs-build
          path: apps/docs/build

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    if: needs.build.outputs.docs-changed == 'true'
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: docs-build
          path: build

      - name: Deploy to staging
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_TOKEN_STAGING }}
          action: upload
          app_location: build

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: docs-build
          path: build

      - name: Deploy to production
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_TOKEN_PROD }}
          action: upload
          app_location: build
```

### PR Preview Workflow

```yaml
# .github/workflows/preview.yml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: pnpm turbo build --filter=docs

      - name: Deploy preview
        id: deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_TOKEN_PROD }}
          action: upload
          app_location: apps/docs/build
          deployment_environment: pr-${{ github.event.pull_request.number }}

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Preview deployed: ${{ steps.deploy.outputs.static_web_app_url }}'
            })
```

---

## Deployment Gates

### Environment Protection Rules

| Environment | Rules                                                 |
| ----------- | ----------------------------------------------------- |
| staging     | Branch: main only                                     |
| production  | Reviewers: @JustAGhosT, Wait: 5 minutes after staging |

### Required Status Checks

- `build` - Must pass
- `lint` - Must pass
- `test` - Must pass
- `security` - Dependabot/CodeQL

---

## Rollback Strategy

### Immediate Rollback

```yaml
# .github/workflows/rollback.yml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Environment to rollback"
        required: true
        type: choice
        options:
          - staging
          - production
      version:
        description: "Git SHA or tag to rollback to"
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}

      - name: Build specific version
        run: pnpm turbo build --filter=docs

      - name: Deploy rollback
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_TOKEN }}
          action: upload
          app_location: apps/docs/build
```

---

## Secrets Configuration

### Repository Secrets

| Secret                  | Purpose               |
| ----------------------- | --------------------- |
| `AZURE_CLIENT_ID`       | OIDC authentication   |
| `AZURE_TENANT_ID`       | Azure AD tenant       |
| `AZURE_SUBSCRIPTION_ID` | Target subscription   |
| `SWA_TOKEN_STAGING`     | Staging deployment    |
| `SWA_TOKEN_PROD`        | Production deployment |

### Environment Secrets

Scoped per environment for isolation:

```
staging/
  └── SWA_DEPLOYMENT_TOKEN
production/
  └── SWA_DEPLOYMENT_TOKEN
```

---

## Monitoring

### Workflow Metrics

- Build duration trends
- Failure rates by workflow
- Deployment frequency
- Lead time to production

### Alerts

```yaml
# Alert on workflow failures
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    channel-id: "C0XXXXXXXXX"
    slack-message:
      "Workflow ${{ github.workflow }} failed: ${{ github.server_url }}/${{
      github.repository }}/actions/runs/${{ github.run_id }}"
```

---

## Consequences

### Positive

- **Automation**: No manual deployment steps
- **Safety**: Environment gates prevent accidents
- **Visibility**: PR previews for review
- **Speed**: Parallel jobs, Turborepo caching

### Negative

- **Complexity**: Multiple workflow files to maintain
- **Cost**: GitHub Actions minutes (2000 free/month)
- **Lock-in**: GitHub-specific workflow syntax

---

## Related ADRs

- [ADR 0025: Azure Naming Conventions](./adr-0025-azure-naming-conventions)
- [ADR 0029: Secrets Management](./adr-0029-secrets-management)
- [ADR-D001: Monorepo Structure](./architecture-decision-records#adr-d001-monorepo-structure-with-turborepo)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
