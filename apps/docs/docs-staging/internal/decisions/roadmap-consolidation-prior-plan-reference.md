# Roadmap consolidation: reference to prior plans

When creating the four consolidated roadmap documents in [internal/roadmaps/](../roadmaps/) (roadmap-overview, phase-a, phase-b, phase-c), each must **reference the plans created in this planning session**:

- **Catalog-consistency LLM conversation** — product catalog data model gaps (types.ts, tiers.ts, catalog.ts, platforms.ts, storage-options.ts, index.ts: type-safe IDs, BOM delta-only, validation, platform IDs, structured pricing, etc.) and how to address those gaps in docs-staging.
- **Control-turret docs phased plan** — converts the control-turret gap analysis into Phase 1/2/3 (authority state machine, data contracts, serial protocol, control interface options, application structure). Its source in-repo is [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md); the phased content is incorporated into the Phase B detailed plan.
- **ESP32 + catalog conversation** — Second gap analysis: ESP32 pan/tilt POC (serial, wiring, firmware/sender) and product catalog / tiers / platforms (reinforces Phase B; optional wiring baseline and export/website notes). Source in-repo: [conversation-gap-analysis-esp32-catalog.md](./conversation-gap-analysis-esp32-catalog.md).
- **Phase-1 BOM and evolution conversation** — Phase 0/1/2 budget framing, detection+alarm only, standalone compute (Pi4+Coral default), ADR candidates (ADR-0001–0006), turret camera when needed, ESP32 variants, Buy Now vs Later summary, solenoid future spec. Source in-repo: [conversation-gap-analysis-phase1-bom-evolution.md](./conversation-gap-analysis-phase1-bom-evolution.md).
- **R2000 cart / RC / transport conversation** — Cart review, avoid list (CAN, BMP280, Arduino, TB6612 for servos), pre-checkout and power checklist, transport pluggable (USB/serial/WiFi; RF via proper interface only). Source: [conversation-gap-analysis-r2000-cart-rc-transport.md](./conversation-gap-analysis-r2000-cart-rc-transport.md).
- **Types/tiers/Phase-1 conversation** — types.ts/tiers.ts/catalog.ts/platforms.ts/storage-options.ts/index.ts update list (type-safe IDs, sentinels, delta-only BOM, validation, platform IDs); Phase-1 Buy Now vs Later artifact; ADR tagging (HW/SW/SYS); BOM delta-only recommendation; ESP32/servo/power/solenoid/stepper details. Source in-repo: [conversation-gap-analysis-types-tier-phase1.md](./conversation-gap-analysis-types-tier-phase1.md).
- **Shopping/BOM/RC/future-phases conversation** — R2000 cart review, Platform BOM v1 quantities, DO NOT BUY/GOOD TO BUY, RC/drone control (MAVLink, replace control stack), non-destructive boundary, and **future-phase gaps** (solenoids, steppers, dual camera, structural BOM). Source in-repo: [conversation-gap-analysis-shopping-bom-rc-future-phases.md](./conversation-gap-analysis-shopping-bom-rc-future-phases.md); [future-phases-outline.md](./future-phases-outline.md).
- **Salvage/RC/control-architecture conversation** — Salvage and zero-budget conclusions (what cannot/might be used for PWM), Parrot Bebop 2 clarification, FlySky analog injection, full control pipeline and data contracts, authority state machine. Source in-repo: [conversation-gap-analysis-salvage-rc-control-architecture.md](./conversation-gap-analysis-salvage-rc-control-architecture.md). Fleshed out in staging: [Salvage and zero-budget hardware](../../technical/hardware/salvage-and-zero-budget-hardware.mdx), [Control interface options](../../technical/control/control-interface-options.mdx), [Vision-to-actuator contracts](../../technical/architecture/interfaces/vision-to-actuator-contracts.mdx), [Authority and safety controller](../../technical/control/authority-and-safety-controller.mdx).
- **Lessons from RC/drone and platform BOM** — Single entry point for lessons and doc pointers: RC/drone control (no RF emulation, MAVLink, transport abstraction), cart review and Platform BOM v1, non-destructive boundary, avoiding MCU/sensor sprawl. See [lessons-from-rc-drone-and-platform-bom.md](./lessons-from-rc-drone-and-platform-bom.md).

**Prior plans (Cursor plan files):**

- **Catalog gaps** — Cursor plan **"Address catalog gaps in docs-staging"** (e.g. `address_catalog_gaps_in_docs-staging_a85c9cbe.plan.md` in your Cursor plans folder, e.g. `%USERPROFILE%\.cursor\plans\` or `~/.cursor/plans/`). Same content in-repo: **[Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md)**.
- **Control-turret phased** — Cursor plan **"Control-turret docs phased plan"** (e.g. `control-turret_docs_phased_plan_ef623175.plan.md` or `control-turret_docs_phased_plan_9d30c814.plan.md`). Source in-repo: [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md); Phase 1/2/3 steps (authority, data contracts, serial protocol, ESP32 contract, control interface options, application structure) are reflected in Phase B.

The consolidated roadmaps incorporate and expand on these plans (together with the cart/BOM/control conversation and Phase B/C decisions).

---

## Section to include in each of the four docs

Add the following section (or equivalent) to **roadmap-overview.md**, **phase-a.md**, **phase-b.md**, and **phase-c.md** so the prior plans are explicitly referenced:

**Option A — Short (e.g. in "Related" or "Source"):**

```markdown
## Prior plans

This roadmap consolidates work from: (1) **Catalog-consistency gap analysis** — Cursor plan "Address catalog gaps in docs-staging" (e.g. `address_catalog_gaps_in_docs-staging_a85c9cbe.plan.md`); same content in-repo: [Address catalog gaps Phase B plan](../decisions/address-catalog-gaps-phase-b-plan.md). (2) **Control-turret docs phased plan** — Cursor plan "Control-turret docs phased plan" (e.g. `control-turret_docs_phased_plan_ef623175.plan.md` or `control-turret_docs_phased_plan_9d30c814.plan.md`); source: [conversation-gap-analysis-control-turret.md](../decisions/conversation-gap-analysis-control-turret.md); Phase 1/2/3 reflected in Phase B. (3) **ESP32 + catalog gap analysis** — [conversation-gap-analysis-esp32-catalog.md](../decisions/conversation-gap-analysis-esp32-catalog.md); overlaps with control-turret and catalog Phase B; adds wiring baseline and optional export/website notes. (4) **Types/tiers/Phase-1 gap analysis** — [conversation-gap-analysis-types-tier-phase1.md](../decisions/conversation-gap-analysis-types-tier-phase1.md); reinforces Phase B schema and Phase C implementation checklist; Phase-1 doc and ADR tagging captured there. (5) **Shopping/BOM/RC/future-phases gap analysis** — [conversation-gap-analysis-shopping-bom-rc-future-phases.md](../decisions/conversation-gap-analysis-shopping-bom-rc-future-phases.md); cart review, quantities, RC/MAVLink, non-destructive boundary, future-phase outline ([future-phases-outline.md](../decisions/future-phases-outline.md)). (6) **Salvage/RC/control-architecture gap analysis** — [conversation-gap-analysis-salvage-rc-control-architecture.md](../decisions/conversation-gap-analysis-salvage-rc-control-architecture.md); salvage doc, control interface options, vision-to-actuator contracts, authority state machine.
```

**Option B — In roadmap-overview only (and "See roadmap-overview" in phase docs):**

In **roadmap-overview.md** only, add a subsection:

```markdown
## Source / prior plan

This roadmap consolidates and expands on:

- **Catalog-consistency plan** — Created at the start of this planning session from the LLM conversation on product catalog data model gaps (type-safe IDs, BOM delta-only, validation, platform IDs, pricing). Cursor plan "Address catalog gaps in docs-staging" (e.g. `address_catalog_gaps_in_docs-staging_a85c9cbe.plan.md`); same content in-repo: [Address catalog gaps Phase B plan](../decisions/address-catalog-gaps-phase-b-plan.md).
- **Control-turret docs phased plan** — Cursor plan "Control-turret docs phased plan" (e.g. `control-turret_docs_phased_plan_ef623175.plan.md` or `control-turret_docs_phased_plan_9d30c814.plan.md`); derived from [conversation-gap-analysis-control-turret.md](../decisions/conversation-gap-analysis-control-turret.md); Phase 1/2/3 (authority, data contracts, serial protocol, ESP32 contract, control interface options, application structure) reflected in Phase B.
- **ESP32 + catalog gap analysis** — [conversation-gap-analysis-esp32-catalog.md](../decisions/conversation-gap-analysis-esp32-catalog.md); overlaps with control-turret and catalog Phase B; adds wiring baseline and optional export/website notes.
- **Types/tiers/Phase-1 gap analysis** — [conversation-gap-analysis-types-tier-phase1.md](../decisions/conversation-gap-analysis-types-tier-phase1.md); reinforces Phase B schema and Phase C implementation checklist; Phase-1 doc and ADR tagging captured there.
- **Cart/BOM/control conversation** — Purchase validation, R2000/quantities, control/authority/transport (see [conversation-gap-analysis-control-turret.md](../decisions/conversation-gap-analysis-control-turret.md)).
- **Shopping/BOM/RC/future-phases conversation** — Cart review, Platform BOM quantities, RC/drone (MAVLink), non-destructive boundary, **future-phase gaps** (solenoids, steppers, dual camera, structural BOM). [conversation-gap-analysis-shopping-bom-rc-future-phases.md](../decisions/conversation-gap-analysis-shopping-bom-rc-future-phases.md); [future-phases-outline.md](../decisions/future-phases-outline.md).
- **Salvage/RC/control-architecture conversation** — Salvage and zero-budget, Parrot clarification, FlySky analog injection, control pipeline and data contracts, authority state machine. [conversation-gap-analysis-salvage-rc-control-architecture.md](../decisions/conversation-gap-analysis-salvage-rc-control-architecture.md); fleshed out in salvage doc, control interface options, vision-to-actuator contracts, authority doc.
- **Phase B/C decision** — [Phase B/C staging single source of truth](../decisions/phase-b-c-staging-single-source-of-truth.md); [Staging alignment roadmap (Phase C)](../decisions/staging-alignment-roadmap.md).
```

Then in **phase-a.md**, **phase-b.md**, **phase-c.md**, add one line in Related: "Prior plan and scope: [roadmap-overview](./roadmap-overview.md)#source--prior-plan" (or similar).

---

Use **Option A** in all four docs for a direct reference in each; or **Option B** to avoid repetition and keep the full "source" narrative in the overview only.
