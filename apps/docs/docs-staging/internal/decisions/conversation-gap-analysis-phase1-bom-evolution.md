# Conversation gap analysis: Phase-1 BOM and evolution (LLM conversation)

This document captures gaps and matches between a long LLM conversation on Phase-1 BOM finalization, evolution (Phase 0 → 1 → 2), standalone compute choice, alarm strategy, turret camera, ESP32 variants, and repo layout, and the current **docs-staging** content. It identifies what was added to staging as a result.

**Scope:** Staging docs only. No code changes.

---

## Conversation themes

- **Evolution order:** Phase 0 (no budget, prove architecture) → Phase 1 (limited budget, reliable demo) → Phase 2 (polish). Optimization: 1a = cost, 1b = speed, 1c = polish.
- **Detection + alarm only:** SkyWatch Nano (and Standard) can be configured as detection + alert only (no pan/tilt, no actuator); minimal = camera → detection → buzzer/siren/strobe + remote (Telegram/MQTT).
- **Standalone compute:** Phone (ultra-cheap), Pi4+Coral (recommended default), Pi5+Hailo (Phase 2). Weighted matrices for compute, alarm, actuator, doc structure.
- **ADR candidates:** ADR-0001 (MQTT backbone), ADR-0002 (Pi4+Coral), ADR-0003 (dual alarm), ADR-0004 (separate compute/actuator), ADR-0005 (doc structure: product + common), ADR-0006 (canonical hardware). Tagging: ADR-HW, ADR-SW, ADR-SYS.
- **Turret camera:** Not required for Phase 1; one camera enough. Second camera later for closed-loop, occlusion, zoom, UI polish. Phase 0 = no turret cam; Phase 1 = optional (ESP32-CAM or UVC to Pi).
- **ESP32 variants:** DevKitC/WROOM (general), WROVER (PSRAM), S3 (newer/camera), ESP32-CAM (OV2640 stream). Paired with PCA9685, MP1584EN, MOSFET/relay for alarm.
- **L298N:** Not for servos; use PCA9685. Solenoids/steppers = Phase 2+.
- **Phase 1 Hardware Specs — Buy Now vs Later:** Per-product “buy now” vs “leave for later” with why and build steps; shared baseline; folder plan (phase1/common/, phase1/products/; optional data under apps/docs/src/data/phase1/).
- **Safe actuation demo (solenoid later):** When solenoids are added, spec to include interlock, arming UI, timed pulse limits, watchdog.
- **Alarm:** Both local (buzzer + strobe) and remote (MQTT + Telegram); SMS later.
- **Repo layout:** One doc per product + common modules; optional phase1-products.ts and BOM schema in data.

---

## Gaps addressed in staging

| Topic | Staging change |
|-------|----------------|
| Detection + alarm only | Phase-1 index and/or Nano/Standard state that Nano and Standard can be run as “detection + alarm only” (no pan/tilt, no actuator). |
| Phase 0/1/2 budget framing | Phase-1 index: Phase 0 = minimal budget (prove architecture); Phase 1 = limited budget (reliable demo); Phase 2 = polish. |
| 1a/1b/1c mapping | Phase-1 index: 1a = cost-optimized, 1b = speed/reliability, 1c = polish. |
| Standalone compute | Compute.mdx: recommended default Pi4+Coral; phone = ultra-cheap fallback; Pi5+Hailo = Phase 2. |
| ADR candidate numbers | Phase-1 index: optional ADR-0001 … ADR-0006 titles so they are discoverable when formalized. |
| Turret camera when needed | Turret doc or common/compute: when to add turret camera (Phase 1 optional; Phase 2 dual-camera). |
| ESP32 variants | Actuator or platform BOM: ESP32 DevKitC/WROOM, WROVER, S3, ESP32-CAM and when to use each. |
| Buy Now vs Later summary | Single Phase-1 doc or expanded index section summarizing per-product buy now / leave for later. |
| Alarms both local + remote | Alarms.mdx: recommended pattern = both local (buzzer + strobe) and remote (MQTT + Telegram). |
| Solenoid future spec | Future-phases outline: when solenoids are introduced, spec will include interlock, arming UI, timed pulse limits, watchdog. |
| Phase-1 data and doc layout | Product-catalog-source or internal: docs under engineering/phase1/; optional data under apps/docs/src/data/phase1/. |

---

## Matches (already in staging)

- Canonical stack (Pi4+Coral, MQTT, ESP32+PCA9685, alarm, power) — phase1 index.
- Phase 0/1/2 evolution (minimal → optional turret cam → dual camera) — phase1 index.
- Deferred to Phase 2: solenoids, steppers — avoid list and future-phases outline.
- L298N not for servos; PCA9685 — avoid list, actuator, turret doc.
- MP1584EN preferred; bulk cap on servo rail — power, turret doc.
- Gimbal R31 vs R81 — turret doc.
- Response Relay (Demo) = safe actuation placeholder — product list and response-relay-demo.mdx.
- ADR tagging (ADR-HW, ADR-SW, ADR-SYS) — phase1 index.
- Six architectural decisions — phase1 index (table).
- Safety boundary (no weaponization, inert actuation only) — safety-boundary.mdx.

---

## Related

- [Address catalog gaps Phase B plan](./address-catalog-gaps-phase-b-plan.md)
- [Future phases outline](./future-phases-outline.md)
- [Phase-1 overview](../../engineering/phase1/index.mdx)
- [Conversation gap analysis: types/tier/Phase-1](./conversation-gap-analysis-types-tier-phase1.md)
