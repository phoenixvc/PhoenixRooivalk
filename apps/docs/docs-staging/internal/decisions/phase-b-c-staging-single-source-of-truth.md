# Phase B / Phase C: Staging as Single Source of Truth

## Problem

Currently **nothing outside docs-staging inherits data from the staging docs**. Product catalog code (`apps/docs/src/data/products/`), product list UI, and any packages use their own sources. That split is wrong for long-term consistency: staging should be the single source of truth, and other assets should align with or inherit from it in a future phase.

## Phase B (docs-staging only)

- **Scope:** All required changes **inside** `docs-staging/` only. No edits to catalog code, product data, or packages under `apps/docs` or repo root.
- **Goal:** Make staging docs **internally consistent** and establish a **single source of truth for information within the staging tree**. Any catalog-related facts (data model, BOM rules, platform IDs, pricing consistency, validation) live and are cross-referenced within staging so that staging is coherent and authoritative by the end of Phase B.
- **Deliverables:** Updates to [product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx), [phase1/index.mdx](../../engineering/phase1/index.mdx), [compute.mdx](../../engineering/common/compute.mdx), and any other staging docs needed so that:
  - One place defines the target catalog schema and consistency rules (type-safe IDs, BOM delta-only, validation, platform IDs, pricing).
  - Other staging docs reference that place and do not duplicate or contradict it.
  - Staging is ready for Phase C consumers to depend on it.

## Phase C (future alignment)

- **Scope:** Changes **outside** docs-staging so that catalog code, product data, packages, and/or build tooling **inherit from or align with** the staging docs.
- **Goal:** Fix the current wrong state: staging becomes the source of truth that code and data follow (e.g. codegen from staging, or validation against staging-defined schemas).
- **Implementation:** The migration and implementation plan for Phase C is documented in the [Staging alignment roadmap](./staging-alignment-roadmap.md). More aspects will be added there as we proceed.

## Summary

| Phase | Where | What |
|-------|--------|------|
| **B** | Inside `docs-staging/` only | Required doc changes; staging internally consistent and single source of truth for catalog (and related) information. |
| **C** | Outside `docs-staging/` | Alignment so other assets inherit from or conform to staging. |

- **Phase B execution plan:** [Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md).
- **Phase C implementation / migration:** [Staging alignment roadmap](./staging-alignment-roadmap.md).
