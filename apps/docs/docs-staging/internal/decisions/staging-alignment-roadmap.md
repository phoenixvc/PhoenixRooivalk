# Staging alignment roadmap (Phase C)

Implementation and migration roadmap for **Phase C**: making assets outside `docs-staging/` inherit from or conform to the staging docs so that staging is the single source of truth. See [Phase B / Phase C: Staging as single source of truth](./phase-b-c-staging-single-source-of-truth.md) for context.

This document is a living roadmap; more aspects will be added as we proceed.

---

## Overview

| Aspect                  | Source of truth (staging)                                                                            | Current state outside staging                                                                | Phase C direction                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product catalog**     | [Product catalog source](../../business/portfolio/product-catalog-source.mdx) and data-model section | `apps/docs/src/data/products/*` (types, catalog, tiers, platforms, storage); product list UI | Align code and data with staging-defined schema (e.g. type-safe IDs, BOM delta-only, validation); consider codegen or validation against staging-derived spec. |
| *(further aspects TBD)* |                                                                                                      |                                                                                              |                                                                                                                                                                |

---

## 1. Product catalog alignment

- **Staging authority:** [product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx) and its "Data model and consistency" section (Phase B).
- **Consumers today:** `apps/docs/src/data/products/` (catalog.ts, types.ts, tiers.ts, platforms.ts, storage-options.ts, index.ts); export scripts; any app that imports from `@site/src/data/products` or equivalent.
- **Migration / implementation (Phase C):**
  - [ ] Define how code will align: e.g. refactor to match staging schema (type-safe IDs, sentinels, BOM delta-only, validation helper), or generate/validate from a staging-derived schema.
  - [ ] Identify all consumers (docs app, marketing app, configurator, export scripts) and update them to use the aligned catalog.
  - [ ] Optionally: shared package (e.g. `packages/catalog`) that implements the staging-defined model and is consumed by apps.
  - [ ] Document any breaking changes and migration steps for existing data or config.

- **Phase C implementation checklist (code):** types.ts (ID unions, sentinels, verify productName remains absent); tiers.ts (typed IDs, validateConfiguratorData, delta-only); platforms.ts (stable IDs); storage-options.ts (optional price fields); catalog.ts (consistency); index.ts (exports). See [product-catalog-source](../../business/portfolio/product-catalog-source.mdx) and [Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md) for the target schema and "Data model and consistency" rules.
- **Implementation order (recommended):** Execute refactors in this sequence to avoid broken references: (1) types.ts, (2) tiers.ts, (3) platforms.ts, (4) storage-options.ts, (5) catalog.ts, (6) index.ts. Types first so all consumers compile against new ID unions; tiers next as the main consumer; then platforms, storage-options, catalog, and finally the barrel export.
- **Export type safety:** Preserve typed exports (e.g. Confidence, product types) in export scripts; do not widen to `any`.

*(More detail to be added as Phase C is planned.)*

---

## 2. Further aspects (TBD)

Additional alignment aspects will be added here as we proceed (e.g. authority/control contracts, data contracts, other doc–code boundaries).

---

## Related

- [Phase B / Phase C: Staging as single source of truth](./phase-b-c-staging-single-source-of-truth.md)
- [Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md)
