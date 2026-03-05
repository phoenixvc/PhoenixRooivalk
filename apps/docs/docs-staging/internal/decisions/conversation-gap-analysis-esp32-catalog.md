# Gap Analysis: ESP32 + Catalog Conversation vs Docs-Staging

This document compares a second LLM conversation (ESP32 pan/tilt POC with serial protocol and wiring, plus product catalog / website / tiers deep-dive) with the current docs-staging content and identifies **missing docs** and **missing details**. Overlaps with the [control-turret gap analysis](./conversation-gap-analysis-control-turret.md) and the [Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md) are cross-referenced; only new or reinforcing gaps are called out here.

---

## Prior gap analyses

- [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md) — Authority, data contracts, serial protocol, ESP32 contract, control interface options, application structure.
- [address-catalog-gaps-phase-b-plan.md](./address-catalog-gaps-phase-b-plan.md) — Catalog schema, type-safe IDs, BOM delta-only, validation, platform IDs, product-catalog-source.

---

## A. ESP32 pan/tilt POC (this conversation)

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **Serial line format:** `Y:1500 P:1500 TTL:150` (µs), 1000–2000 µs range; watchdog 200 ms → neutral | See control-turret gap analysis | **See [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md)** for serial protocol, ESP32 firmware contract, and watchdog value. |
| **Wiring:** Servo power from separate 5V supply/BEC; common ground (ESP32 GND to servo supply GND); signal pins to 2× GPIO | [Wiring safety](../../engineering/common/wiring-safety.mdx) and [Actuator](../../engineering/common/actuator.mdx) cover general safety and ESP32/PCA9685; **no explicit "separate 5V for servos, common GND" baseline** | **Missing:** Explicit wiring baseline: separate 5V for servos (avoid USB brownout), common GND with ESP32. |
| **Laptop pipeline:** Webcam → detect/track → compute yaw/pitch (or PWM) → serial to ESP32 | [Tracking–actuator bridge](../../technical/architecture/diagrams/tracking-actuator-bridge.mdx) and [Application structure](../../technical/architecture/application-structure.mdx) describe the pipeline | **OK** — See tracking-actuator-bridge and application-structure. |
| **Manual override always wins;** keyboard/gamepad on laptop for now | See control-turret gap analysis | **See [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md)** for authority state machine and manual-override rule. |
| **Reference firmware/sender:** Arduino-style ESP32 sketch + Python test sender (Y/P/TTL sweep) | Not in docs | **Optional:** Reference implementation or protocol example (code snippet or appendix) for serial protocol; not mandatory. |

**Recommendation (new gap only):** Add one short subsection or bullet in [Wiring safety](../../engineering/common/wiring-safety.mdx) or [Actuator](../../engineering/common/actuator.mdx): servo power from separate 5V supply/BEC where possible; common GND between ESP32 and servo supply. For serial protocol, watchdog, and ESP32 contract, follow the control-turret gap analysis recommendations.

### What already matches (ESP32 POC)

- Virtual turret POC, transport abstraction, and actuator/ESP32 mentions in staging.
- Tracking–actuator bridge and application structure cover the laptop → detect/track → supervisor → serial pipeline.

---

## B. Product catalog / tiers / platforms (this conversation)

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **19 products, 6 lines;** catalog, tiers, platforms, storage in `apps/docs/src/data/products` | [Product catalog source](../../business/portfolio/product-catalog-source.mdx) and [Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md) define schema and consistency | **Addressed by Phase B** — This conversation reinforces [address-catalog-gaps-phase-b-plan.md](./address-catalog-gaps-phase-b-plan.md) and [product-catalog-source.mdx](../../business/portfolio/product-catalog-source.mdx). |
| **Type-safe IDs, sentinels, BOM delta-only, validation, platform IDs** | Phase B plan and product-catalog-source "Data model and consistency" section | **Addressed by Phase B** — No new gap. |
| **Export:** JSON/CSV from catalog (products.json, products.csv) | Export script and product list MDX documented | **OK** — No gap. |
| **Catalog-bundle or platforms export** (single artifact for tooling) | Not documented as recommended | **Optional:** Document or add script for catalog-bundle / platforms export if desired for external tooling; no mandatory change. |
| **Website (phoenixrooivalk.com) product list vs repo catalog** | Not stated | **Optional:** One sentence in product-catalog-source or internal: public website product list should align with repo catalog (single source of truth). |

**Recommendation:** No mandatory changes. Phase B covers schema and consistency. Optionally: document catalog-bundle/platforms export; add one line on website vs repo alignment in product-catalog-source or internal.

### What already matches (catalog)

- Product list MDX, product-catalog-source, export script (products JSON/CSV), and Phase B plan cover catalog structure and doc-generation.

---

## C. Priority and suggested files

| Priority | Item | Action |
|----------|------|--------|
| **High** | — | No new high-priority gaps beyond [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md) and [address-catalog-gaps-phase-b-plan.md](./address-catalog-gaps-phase-b-plan.md). |
| **Medium** | Wiring baseline | Add to [Wiring safety](../../engineering/common/wiring-safety.mdx) or [Actuator](../../engineering/common/actuator.mdx): separate 5V for servos (BEC), common GND with ESP32. |
| **Low / Optional** | Reference firmware/sender | Code example or appendix for serial protocol (see control-turret for protocol spec). |
| **Low / Optional** | Catalog-bundle or platforms export | Document or script if needed for tooling. |
| **Low / Optional** | Website vs repo alignment | One sentence in product-catalog-source or internal. |

**Suggested new/updated files (this conversation only):**

| File | Purpose |
|------|---------|
| Update [engineering/common/wiring-safety.mdx](../../engineering/common/wiring-safety.mdx) or [engineering/common/actuator.mdx](../../engineering/common/actuator.mdx) | Add wiring baseline: servo power from separate 5V/BEC; common GND with ESP32. |

All other suggested files (authority state machine, data contracts, serial protocol, ESP32 contract, control interface options, application structure, catalog schema) are in the control-turret gap analysis or the Phase B plan.

---

## D. Doc-generation and export

| Topic | Status | Note |
|-------|--------|------|
| Product list in MDX | OK | Uses catalog; no change. |
| Export products to JSON/CSV | OK | Script and outputs documented. |
| Export platforms or catalog-bundle | Optional | Add if desired for tooling; no mandatory doc-generation. |

No mandatory new doc-generation functions from this conversation.
