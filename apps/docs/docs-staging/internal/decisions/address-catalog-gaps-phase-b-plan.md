# Phase B Plan: Address Catalog Gaps in docs-staging (Single Source of Truth)

**Origin:** This plan was created at the start of this planning session from the
**catalog-consistency LLM conversation** (product catalog data model gaps in
types.ts, tiers.ts, catalog.ts, platforms.ts, storage-options.ts, index.ts). It
corresponds to the Cursor plan **"Address catalog gaps in docs-staging"** (e.g.
`address_catalog_gaps_in_docs-staging_a85c9cbe.plan.md` in `.cursor/plans/`). It
is the basis for Phase B catalog/schema work and is referenced by the
consolidated roadmaps in [internal/roadmaps/](../roadmaps/roadmap-overview.md).

**Scope:** Changes **inside** `docs-staging/` only. No changes to
`apps/docs/src/data/products/`, packages, or any path outside docs-staging. See
[Phase B/C staging single source of truth](./phase-b-c-staging-single-source-of-truth.md)
for Phase B vs Phase C.

**Goal:** Make staging internally consistent and the single source of truth for
catalog-related information (schema, BOM model, platform IDs, pricing,
validation). Phase C will later align code and data outside staging to inherit
from or conform to staging.

---

## 1. [product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx)

Add a new section **"Data model and consistency (Phase B)"** (or **"Planned
schema and consistency"**) after "What the catalog contains", with subsections:

- **Type-safe IDs and sentinels** — Tier IDs (compute, camera, connectivity,
  storage) will use literal union types (e.g. `ComputeTierId`) derived from tier
  dictionaries; sentinel values (e.g. `none`, `server`, `enterprise`, `fixed`,
  `mixed`, `cloud`, `mesh_radio`) are explicit for non-standard base tiers;
  product display name comes from a single authoritative source (no redundant
  `productName` in config objects).
- **BOM calculation** — Use a small BOM engine capable of structural mutations
  (add/remove/replace) and auditable deltas. When legacy `newBomTotal` targets
  exist, honor them via an explicit reconciliation line rather than a silent
  override. This keeps configurator math predictable and auditable while
  supporting modular structural BOM changes.
- **Validation** — A validation step (e.g. `validateConfiguratorData`) will
  check: every config SKU exists in the catalog; every referenced tier ID exists
  in the corresponding tier dictionary; and every key in tierPricing /
  cameraPricing / connectivityPricing / storagePricing is contained in that
  product's availableTiers / availableCameras / availableConnectivity /
  availableStorage for that dimension. Recommended at build or config load time.
- **Pricing consistency** — Display `priceRange` must stay aligned with numeric
  `priceMin`/`priceMax`; base BOM costs should align with tier pricing logic.
  Storage options will gain structured fields (`priceMin`, `priceMax`,
  `priceUnit`, `currency`) for programmatic use; tier vocabulary for storage
  will use the same ID unions as elsewhere.
- **Platform and accelerator IDs** — Compute platforms and AI accelerators will
  use stable string IDs (e.g. `pi4_2gb`) in `platforms.ts`, benchmarks, and
  recommendations instead of free-text names.
- **API surface** — `index.ts` is the single import surface; Phase C (code
  alignment) will expose type-safe ID types and validation helpers from the
  barrel.

Add one upfront sentence: these items are **documented here** so staging is the
single source of truth and Phase C can align code/data to it.

---

## 2. [engineering/phase1/index.mdx](../../engineering/phase1/index.mdx)

In the **"Platform BOM v1"** section, add:

- BOM totals are computed from base product BOM plus tier deltas only (no
  override).
- Tier IDs are (or will be) type-safe for configurator integrity.

Link to
[Product catalog source](../../business/portfolio/product-catalog-source.mdx)
for the full schema and consistency rules.

---

## 3. [engineering/common/compute.mdx](../../engineering/common/compute.mdx)

Add a short subsection **"Platform and accelerator IDs"**:

- Compute platforms and AI accelerators will use **stable string IDs** (e.g.
  `pi4_2gb`) in data and docs for benchmarks and platform recommendations,
  instead of free-text names.
- Platform list prices in `platforms.ts` may differ from catalog BOM totals
  (e.g. MSRP vs street price); document or resolve in Phase C.

---

## 4. Cross-references and consistency

- Ensure staging docs that mention catalog schema, BOM rules, or platform IDs
  point to
  [product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx)
  (or the new section) as the single place for that information; avoid
  duplicating or contradicting it.
- [product-list.mdx](../../business/portfolio/product-list.mdx) already links to
  product-catalog-source; confirm it stays consistent with the new section.

---

## 5. Out of scope for Phase B

- **internal/catalog/** (source-of-truth, tier-model, normalization) — These
  govern _documentation_ structure, not product data; no changes needed for
  catalog data gaps unless they should reference the new single source of truth
  for product catalog (optional cross-link).
- **New storage.mdx** — Not required; storage pricing and tier vocabulary are
  covered in product-catalog-source.
- **Code or data outside docs-staging** — Deferred to Phase C.

---

## Order of implementation

**Phase B (staging docs):**

1. product-catalog-source.mdx — add full "Data model and consistency (Phase B)"
   section.
2. engineering/phase1/index.mdx — add BOM model and type-safe tier note + link.
3. engineering/common/compute.mdx — add platform IDs and price note.
4. Review other staging docs for references to catalog/BOM/platforms and align
   with the single source of truth (cross-links, no contradiction).

**Phase C (code refactors):** Use the implementation order in
[Staging alignment roadmap (Phase C)](./staging-alignment-roadmap.md#1-product-catalog-alignment):
types.ts → tiers.ts → platforms.ts → storage-options.ts → catalog.ts → index.ts.
LLM prompts per file:
[Catalog refactor LLM prompts](./catalog-refactor-llm-prompts.md).
