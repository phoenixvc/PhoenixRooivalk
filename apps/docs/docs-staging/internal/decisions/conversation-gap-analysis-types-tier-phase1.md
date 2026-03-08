# Gap Analysis: Types/Tiers/Phase-1 Conversation vs Docs-Staging

This document compares the "types/tiers/catalog LLM update list + Phase-1
hardware specs (Buy Now vs Later) + ADR tagging" conversation with current
docs-staging and identifies what is already covered, what to add to staging, and
what to add to the roadmap. Overlaps with
[address-catalog-gaps-phase-b-plan.md](./address-catalog-gaps-phase-b-plan.md),
[conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md),
and
[conversation-gap-analysis-esp32-catalog.md](./conversation-gap-analysis-esp32-catalog.md)
are cross-referenced.

---

## Prior gap analyses

- [address-catalog-gaps-phase-b-plan.md](./address-catalog-gaps-phase-b-plan.md)
  — Catalog schema, type-safe IDs, BOM delta-only, validation, platform IDs,
  product-catalog-source.
- [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md)
  — Authority, data contracts, serial protocol, ESP32 contract, control
  interface options, application structure.
- [conversation-gap-analysis-esp32-catalog.md](./conversation-gap-analysis-esp32-catalog.md)
  — ESP32 pan/tilt POC, wiring, catalog/tiers/platforms reinforcement.

---

## A. Types/tiers/catalog/platforms/storage/index (this conversation)

| Topic                                                                    | Staging status                                                                                               | Action                                                                                                                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Type-safe ID unions (ComputeTierId, CameraTierId, etc.)                  | Phase B plan and product-catalog-source "Data model and consistency" describe target schema; code in Phase C | Document in staging; Phase C implements in types.ts, tiers.ts.                                                               |
| Sentinel IDs (none, server, enterprise, fixed, mixed, cloud, mesh_radio) | Phase B plan mentions sentinels                                                                              | No new gap; Phase C implements.                                                                                              |
| Remove productName from config interfaces                                | Phase B plan: "product display name from single authoritative source"                                        | No new gap; Phase C implements.                                                                                              |
| Delta-only BOM (no newBomTotal override)                                 | Phase B plan and staging-alignment-roadmap specify delta-only                                                | Optional: one sentence in product-catalog-source that structural BOM mutations may require component-based BOM engine later. |
| validateConfiguratorData                                                 | Phase B plan lists validation step                                                                           | No new gap; Phase C implements in tiers.ts.                                                                                  |
| Platforms stable IDs (e.g. pi4_2gb)                                      | Phase B plan: "Platform and accelerator IDs"                                                                 | No new gap; Phase C implements in platforms.ts.                                                                              |
| Storage optional price fields (priceMin, priceMax, priceUnit, currency)  | Phase B plan: "Storage options will gain structured fields"                                                  | No new gap; Phase C implements.                                                                                              |
| Execution order (types → tiers → platforms → storage → catalog → index)  | Not in staging                                                                                               | Add Phase C implementation checklist (one line per file) in product-catalog-source or staging-alignment-roadmap.             |

**Recommendation:** Add a short **Phase C implementation checklist** in
[product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx)
or [staging-alignment-roadmap.md](./staging-alignment-roadmap.md): types.ts (ID
unions, sentinels, drop productName); tiers.ts (typed IDs,
validateConfiguratorData, delta-only); platforms.ts (stable IDs);
storage-options.ts (optional price fields); catalog.ts (consistency); index.ts
(exports). Link to "Data model and consistency" section.

---

## B. Phase-1 products and Buy Now vs Later (this conversation)

| Conversation                                                                                                                                                                      | Staging                                                                                                                                                                                 | Gap                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Phase 1 Hardware Specs — Buy Now vs Later" artifact: four products (Nano, Standard, Turret Tracker, Trigger Node) with Buy now / Leave for later / Build steps / Why per product | Staging has six products (adds Mesh Demo, SkySnare Handheld); Phase-1 index has "Buy now vs later" section pointing to product docs; platform-bom-v1 has buy now / buy soon / buy later | Staging is superset. Add explicit **Leave for later** subsection where missing in product docs (Nano, Standard, Mesh, SkySnare, Response Relay). NetSnare Lite Turret already has Optional/Phase 2; others can get a short bullet list. |
| Naming: "Trigger Node (Demo)" in conversation                                                                                                                                     | Staging uses **Response Relay (Demo)**                                                                                                                                                  | No change — keep Response Relay.                                                                                                                                                                                                        |

**Recommendation:** For each of SkyWatch Nano, SkyWatch Standard, Mesh Demo,
SkySnare Handheld, Response Relay: add a short **Leave for later** bullet list
(e.g. Pi/Jetson upgrade, PoE/LTE, enclosures, SMS) if not already present.
NetSnare Lite Turret can keep or add one line pointing to Optional/Phase 2.

---

## C. ADR and BOM (this conversation)

| Topic                                                                                                                   | Staging                                                                                                                 | Gap                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR tagging: ADR-HW (hardware/BOM/interfaces), ADR-SW (protocols, data models), ADR-SYS (event bus, safety, deployment) | Phase-1 index lists six "architectural decisions" to be formalized as ADRs; no tagging scheme                           | **Missing:** Add ADR tagging to Phase-1 index (or platform-bom-v1). Optionally map the six decisions to tags (e.g. MQTT = ADR-SYS, Pi4+Coral = ADR-HW).                |
| BOM delta-only + long-term structural BOM                                                                               | Phase B plan specifies delta-only; conversation noted structural mutations may require component-based BOM engine later | Optional one sentence in product-catalog-source: for demo phase BOM is delta-only; structural BOM mutations may require a component-based BOM engine in a later phase. |

**Recommendation:** Add **ADR tagging** subsection to
[engineering/phase1/index.mdx](../../engineering/phase1/index.mdx) (or
platform-bom-v1): ADR-HW, ADR-SW, ADR-SYS definitions and map the six Phase-1
decisions to these tags.

---

## D. Hardware and details (this conversation)

| Topic                                                                        | Staging                                                                                                                            | Gap                                                                                                                                                                                         |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Solenoids / stepper motors "Phase 2+"; Phase 1 = servo pan/tilt + alarm only | Avoid list covers L298N, OV7670, etc.; no explicit "deferred to Phase 2" for solenoids/steppers                                    | **Missing:** Add **Deferred to Phase 2 (not avoid):** Solenoids (for trigger), stepper motors/drivers — intentional later additions.                                                        |
| Phase 0/1/2 optimization order: cost → speed → polish                        | Phase-1 index has "Evolution: Phase 0 → 1 → 2" (minimal/blind → optional turret cam → dual camera); no explicit optimization order | Add one line: **Optimization order:** Phase 0 = cost, Phase 1 = speed/reliability, Phase 2 = polish.                                                                                        |
| Canonical stack one-place checklist                                          | Pi4+Coral, MQTT, ESP32, PCA9685 mentioned in Phase-1 index and common modules; alarm and power details scattered                   | Add **Canonical stack (one-place):** Pi4+Coral, Pi Camera v3, MQTT, local alarm (12V siren + strobe), remote (Telegram), ESP32 + PCA9685, power (EPS → buck 5V for Pi, buck 6V for servos). |

**Recommendation:** Add to
[engineering/phase1/index.mdx](../../engineering/phase1/index.mdx): optimization
order under Evolution; canonical stack short bullet list; add to avoid list or
phase1 index: "Deferred to Phase 2 (not avoid): Solenoids (for trigger), stepper
motors/drivers."

---

## E. Priority and suggested files

| Priority   | Item                                                                  | Action                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **High**   | Gap analysis and roadmap reference                                    | Create this doc; update [roadmap-consolidation-prior-plan-reference.md](./roadmap-consolidation-prior-plan-reference.md) to reference Types/tiers/Phase-1 conversation and this gap analysis. |
| **Medium** | ADR tagging, canonical stack, optimization order, Deferred to Phase 2 | Add to Phase-1 index (and avoid list where applicable).                                                                                                                                       |
| **Medium** | Leave for later per product                                           | Add subsection to product docs (Nano, Standard, Mesh, SkySnare, Response Relay) where missing.                                                                                                |
| **Low**    | Phase C implementation checklist                                      | Add to product-catalog-source or staging-alignment-roadmap.                                                                                                                                   |
| **Low**    | Structural BOM sentence                                               | Optional one sentence in product-catalog-source "Data model" section.                                                                                                                         |

**Suggested new/updated files (this conversation):**

| File                                                                                                                                                | Purpose                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [conversation-gap-analysis-types-tier-phase1.md](./conversation-gap-analysis-types-tier-phase1.md)                                                  | This gap analysis.                                                                                          |
| [roadmap-consolidation-prior-plan-reference.md](./roadmap-consolidation-prior-plan-reference.md)                                                    | Add Types/tiers/Phase-1 conversation and link to this gap analysis (Option A and Option B).                 |
| [engineering/phase1/index.mdx](../../engineering/phase1/index.mdx)                                                                                  | ADR tagging, optimization order, canonical stack; optionally "Deferred to Phase 2" or link from avoid list. |
| [engineering/phase1/avoid-list.mdx](../../engineering/phase1/avoid-list.mdx) or phase1 index                                                        | Deferred to Phase 2: solenoids, stepper motors/drivers.                                                     |
| Product docs (skywatch-nano, skywatch-standard, mesh-demo, skysnare-handheld-spotter, response-relay-demo)                                          | Add "Leave for later" subsection where missing.                                                             |
| [product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx) or [staging-alignment-roadmap.md](./staging-alignment-roadmap.md) | Phase C implementation checklist; optional structural BOM sentence.                                         |

No code or data changes in `apps/docs/src/data/products/` — Phase C only.
