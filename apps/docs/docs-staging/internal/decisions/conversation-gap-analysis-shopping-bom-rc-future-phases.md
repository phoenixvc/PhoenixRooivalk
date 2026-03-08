# Gap Analysis: Shopping/BOM/RC/Platform Conversation vs Docs-Staging (incl. Future Phases)

This document compares the LLM conversation on R2000 shopping and cart review,
Platform BOM v1, RC/drone control (FlySky, MAVLink), turret/receiver
replacement, salvage/zero-purchase path, and "downing a drone" / non-destructive
boundary with current docs-staging. It identifies **missing docs**, **missing
details**, and **future-phase gaps** so preparation for Phase 2+ starts now.
Prior gap analyses are cross-referenced.

---

## Prior gap analyses

- [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md)
  — Authority, data contracts, serial protocol, ESP32 contract, control
  interface options, application structure.
- [conversation-gap-analysis-esp32-catalog.md](./conversation-gap-analysis-esp32-catalog.md)
  — ESP32 pan/tilt POC, wiring, catalog/tiers/platforms.
- [conversation-gap-analysis-types-tier-phase1.md](./conversation-gap-analysis-types-tier-phase1.md)
  — Types/tiers/catalog, Phase-1 Buy Now vs Later, ADR tagging,
  solenoids/steppers deferred to Phase 2.
- [address-catalog-gaps-phase-b-plan.md](./address-catalog-gaps-phase-b-plan.md)
  — Catalog schema, BOM delta-only, validation, platform IDs.

---

## A. Shopping / BOM / cart (this conversation)

| Conversation                                                                                                                                                                   | Docs-staging                                                                                                                                                                                                            | Gap                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **DO NOT BUY:** L298N, L293D, OV7670 on ESP32, brushless motors, ESCs, flight controller, XT60 PDB, 360° servos for pan/tilt, duplicate IMU families, TCA9548A until needed    | [Avoid list](../../engineering/phase1/avoid-list.mdx) and [platform-bom-v1](../../engineering/phase1/platform-bom-v1.mdx) cover L298N, L293D, OV7670, brushless/ESC/XT60, 360° vs 180° servos, duplicate IMUs, TCA9548A | **OK** — Avoid list and [Actuator](../../engineering/common/actuator.mdx) state 180° positional not 360° for pan/tilt. |
| **Cart review before checkout:** Remove L293D, OV7670, XT60 PDB, 360° servos; confirm MG90S 180° positional; drop duplicate IMUs (e.g. MPU9250 if using BMI160)                | No explicit "cart review" or "remove before checkout" checklist                                                                                                                                                         | **Missing:** Explicit cart-review or "remove before checkout" checklist in one place (platform BOM or playbook).       |
| **Quantities cheat sheet:** ESP32×2, RP2040×2, PCA9685×1, MP1584EN×3, INA219×2, TB6612 1–2, BTS7960×1, MG90S 2–4, IMU 1–2, VL53L0X×1, ESP32-CAM×1 (optional TCA9548A, MicroSD) | [Platform BOM v1](../../engineering/phase1/platform-bom-v1.mdx) has buy now / buy soon / buy later; no quantities table                                                                                                 | **Missing:** Quantities cheat sheet in platform Bom v1 (or linked doc) for one platform build + spares.                |
| **R2000 priority order:** Power + compute spares → actuation stack → motor drivers → sensing → camera                                                                          | Platform BOM has "Optional priority order if budget is limited" one line                                                                                                                                                | **Partial** — One line exists; conversation adds explicit order; can expand in platform BOM.                           |

**Recommendation:** Add to
[platform-bom-v1.mdx](../../engineering/phase1/platform-bom-v1.mdx): (1) short
"Remove before checkout" list (L293D, OV7670, XT60 PDB, 360° servos for
pan/tilt, duplicate IMUs); (2) "Quantities cheat sheet" table (e.g. ESP32×2,
RP2040×2, PCA9685×1, MP1584EN×3, INA219×2, MG90S 2–4, TB6612, BTS7960, one IMU,
VL53L0X, ESP32-CAM). Optionally add a "Purchase validation / cart review"
checklist to
[component-qualification-checklist.mdx](../../engineering/playbooks/component-qualification-checklist.mdx)
or a short playbook linking to avoid list and platform BOM.

---

## B. RC / drone / vehicle control (this conversation)

| Conversation                                                                                                                      | Docs-staging                                                                                                                                                                                               | Gap                                                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **2.4GHz proprietary (e.g. FlySky):** No clean PC SDK; replace control stack or replace TX/RX with USB HID / trainer port         | [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md) recommends "Control interface options" (replace receiver, hardware switch, analog injection); no RF emulation | **See control-turret** for replace receiver / switch / injection.                                                                      |
| **MAVLink as SDK boundary** for drone control; pilot app, supervisor in Rust, AI as suggestion engine, vehicle adapter            | Control-turret gap analysis does not name MAVLink or "replace control stack" vs "RF reverse engineering not recommended"                                                                                   | **Missing:** MAVLink as recommended SDK boundary for drone/vehicle control; short note that RF reverse engineering is not recommended. |
| **Turret:** Replace receiver with MCU (ESP32); transport abstraction (Serial/WiFi/Simulated); laptop cannot drive servos directly | Actuator and transport docs cover ESP32, PCA9685, transport abstraction                                                                                                                                    | **OK** — Covered.                                                                                                                      |

**Recommendation:** When implementing control-turret gap analysis
recommendations, add to [Actuator](../../engineering/common/actuator.mdx) or a
"Vehicle adapter / RC control options" subsection: (1) for drone control,
MAVLink is the recommended SDK boundary; (2) replace control stack (flight
controller + MAVLink) rather than RF reverse engineering; (3) pilot app,
supervisor, AI as suggestion engine, vehicle adapter pattern. Optional: short
dedicated note under `technical/control/` or
`technical/architecture/interfaces/` for vehicle adapter options.

---

## C. Non-destructive boundary / "downing a drone" (this conversation)

| Conversation                                                                                                                                                                           | Docs-staging                                                                                                                                              | Gap                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hobby Tesla coil / destructive methods:** Effectively useless for "downing" drones; legally sensitive; document path = detection, tracking, logging, non-destructive countermeasures | [Safety boundary](../../engineering/phase1/safety-boundary.mdx) and phase1 index state no weaponization; detection, tracking, alarm, inert actuation only | **Partial** — Weaponization and harmful hardware are out of scope; destructive or "downing" methods (e.g. hobby EMP/Tesla coil) not explicitly called out.                                                                 |
| **Odds assessment:** Destructive hobby electronics do not meaningfully disable drones at range; focus on detection, tracking, telemetry, safe demo                                     | Not in docs                                                                                                                                               | **Optional:** One sentence in safety-boundary or legal: destructive or "downing" methods (e.g. hobby EMP/Tesla coil) are out of scope and not documented; focus is detection, tracking, logging, non-destructive response. |

**Recommendation:** Add one sentence to
[safety-boundary.mdx](../../engineering/phase1/safety-boundary.mdx) (or legal
policies if preferred): destructive or "downing" methods (e.g. hobby EMP/Tesla
coil) are out of scope and not documented; the documented path is detection,
tracking, logging, and non-destructive response only.

---

## D. Future phases (Phase 2+)

This section lists gaps that are **not** Phase 1 but should be **planned and
documented now** so we are prepared. Phase 1 defers solenoids, steppers, and
related items; we do not ignore them — we capture what to document when we start
Phase 2+.

| Topic                                           | Staging status                                                                                                                                                  | Gap / preparation                                                                                                                                                                                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Solenoids / trigger mechanisms**              | [Avoid list](../../engineering/phase1/avoid-list.mdx) and phase1 index: "Deferred to Phase 2 (not avoid): Solenoids (for trigger)"                              | **Preparation now:** Document in a single place _when_ and _how_ they enter (e.g. non-weapon demo relay/latch only); what docs will be needed (actuator expansion, safety interlocks). See [future-phases-outline.md](./future-phases-outline.md). |
| **Stepper motors / drivers**                    | Avoid list: "stepper motors/drivers — intentional later additions"                                                                                              | **Preparation now:** Use cases (pan/tilt upgrade, linear motion); driver selection and where it lives (platform BOM motor tiers already have TB6612/BTS7960 for DC). See future-phases-outline.                                                    |
| **Dual camera / stiffer mechanics**             | [phase1 index](../../engineering/phase1/index.mdx): "Phase 2: Dual camera, stiffer mechanics; out of scope for this doc set"                                    | **Preparation now:** When we start Phase 2, document interfaces and BOM impact; future-phases outline should list "what to document when."                                                                                                         |
| **Structural BOM / component-based BOM engine** | [product-catalog-source](../../business/portfolio/product-catalog-source.mdx): structural BOM mutations may require component-based BOM engine in a later phase | **Preparation now:** Future-phases outline references this; when product lines need full component BOM mutations, document approach in outline or catalog decisions.                                                                               |

**Recommendation:** Create and maintain
[future-phases-outline.md](./future-phases-outline.md) as the single entry point
for Phase 2+ scope (solenoids, steppers, dual camera, structural BOM). Link from
phase1 index and from this gap analysis. New gap analyses should include a
"Future-phase gaps" subsection where relevant.

---

## E. Priority and suggested files

| Priority   | Item                              | Action                                                                                                                                                                                                                    |
| ---------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **High**   | Future phases visible and planned | Create [future-phases-outline.md](./future-phases-outline.md); link from phase1 index and this gap analysis.                                                                                                              |
| **High**   | Roadmap reference                 | Update [roadmap-consolidation-prior-plan-reference.md](./roadmap-consolidation-prior-plan-reference.md) to reference Shopping/BOM/RC/future-phases conversation and this gap analysis (Option A and Option B).            |
| **Medium** | Cart review / quantities          | Add "Remove before checkout" and "Quantities cheat sheet" to [platform-bom-v1.mdx](../../engineering/phase1/platform-bom-v1.mdx).                                                                                         |
| **Medium** | Non-destructive boundary          | Add one sentence to [safety-boundary.mdx](../../engineering/phase1/safety-boundary.mdx): destructive/downing methods out of scope; focus detection, tracking, logging, non-destructive response.                          |
| **Low**    | Purchase validation playbook      | Optional: add "Purchase validation / cart review" checklist to [component-qualification-checklist.mdx](../../engineering/playbooks/component-qualification-checklist.mdx) or link from it to avoid list and platform BOM. |
| **Low**    | MAVLink / vehicle adapter         | When control-turret gaps are implemented: add or reference "Vehicle adapter / RC control options" (MAVLink recommended for drone SDK boundary; replace control stack; no RF emulation) in actuator or technical/control.  |

**Suggested new/updated files:**

| File                                                                                                                             | Purpose                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [conversation-gap-analysis-shopping-bom-rc-future-phases.md](./conversation-gap-analysis-shopping-bom-rc-future-phases.md)       | This gap analysis.                                                                                           |
| [future-phases-outline.md](./future-phases-outline.md)                                                                           | Phase 2+ scope (solenoids, steppers, dual camera, structural BOM); preparation-now list; linked from phase1. |
| [roadmap-consolidation-prior-plan-reference.md](./roadmap-consolidation-prior-plan-reference.md)                                 | Add Shopping/BOM/RC/future-phases conversation and link to this gap analysis (Option A and Option B).        |
| [engineering/phase1/index.mdx](../../engineering/phase1/index.mdx)                                                               | Add line: Phase 2+ scope and preparation: see [Future phases outline](./future-phases-outline.md).           |
| [engineering/phase1/platform-bom-v1.mdx](../../engineering/phase1/platform-bom-v1.mdx)                                           | Optional: "Remove before checkout" list; "Quantities cheat sheet" table.                                     |
| [engineering/phase1/safety-boundary.mdx](../../engineering/phase1/safety-boundary.mdx)                                           | Optional: one sentence on destructive/downing methods out of scope.                                          |
| [engineering/playbooks/component-qualification-checklist.mdx](../../engineering/playbooks/component-qualification-checklist.mdx) | Optional: purchase validation / cart review checklist or link.                                               |
| [engineering/common/actuator.mdx](../../engineering/common/actuator.mdx) or technical/control                                    | Optional (after control-turret): Vehicle adapter / RC control options; MAVLink as drone SDK boundary.        |

---

## F. Doc-generation and export

| Topic                     | Status        | Note                                                                                                 |
| ------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Cart validator / export   | Not requested | Conversation does not require a new doc-generation or tooling artifact (e.g. cart validator script). |
| Product list / BOM export | OK            | Existing export and product list MDX; no change.                                                     |

No new doc-generation functions required from this conversation.
