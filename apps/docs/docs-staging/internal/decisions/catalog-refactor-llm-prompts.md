---
title: Catalog refactor LLM prompts (Phase C)
sidebar_label: Catalog refactor prompts
---

# Catalog refactor LLM prompts (Phase C)

Short prompts for applying the catalog refactors per file. Use in the order
below so types and dependencies stay consistent. Source: catalog-consistency LLM
conversation; see
[Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md) and
[Staging alignment roadmap](./staging-alignment-roadmap.md).

**Execution order:** types.ts → tiers.ts → platforms.ts → storage-options.ts →
catalog.ts → index.ts.

---

## types.ts

Update types.ts to introduce strong ID unions for
compute/camera/connectivity/storage tiers and sentinel/base IDs (none, fixed,
mixed, enterprise, cloud, server, mesh_radio). Replace string IDs and string[]
in tier/config interfaces with these unions and Partial<Record<...>>. Remove
productName from Product\*Config interfaces to avoid drift; callers should
derive it from productBySku.

---

## tiers.ts

Refactor tiers.ts to use typed tier IDs (ComputeTierId, CameraTierId, etc.)
rather than string IDs. Remove productName from all product config entries.
Convert tier dictionaries to const … satisfies Record<IdUnion, TierType>. Add a
validation function that throws if SKUs are unknown, referenced tier IDs are
missing, or pricing keys aren't in available lists. Scaffold and integrate a
small BOM engine that can apply structural mutations (add/remove/replace) plus
auditable deltas; if legacy newBomTotal targets exist, honor them via an
explicit reconciliation line rather than a silent override.

---

## platforms.ts

Update platforms.ts to add stable IDs to compute platforms and AI accelerators
(e.g. pi4_2gb, coral_usb). Replace free-text references in fpsBenchmarks and
platformRecommendations with platformId/acceleratorId fields to prevent drift.
Keep human-readable display fields for UI.

---

## storage-options.ts

Extend storage-options.ts/StorageOption to support optional structured pricing
(priceMin/priceMax, priceUnit, currency) while keeping the existing string price
for display. Ensure recommendation tier keys align with tier IDs used in
configurator logic.

---

## catalog.ts

Review catalog.ts for consistency between priceRange and numeric
priceMin/priceMax, especially for per-node and subscription products. Ensure
base BOM and the tier config assumptions (baseComputeCost, deltas) are
consistent. If possible, add or expose a helper to validate SKU uniqueness and
catalog invariants.

---

## index.ts

Update index.ts exports to include newly added tier ID union types and any
validation helpers introduced during refactors. Ensure exports remain consistent
after removing productName fields and after changing benchmark/platform
identifiers.
