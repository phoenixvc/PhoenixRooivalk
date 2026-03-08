# Future phases outline (Phase 2+)

This document states what is **deferred** from Phase 1 and what to **prepare
now** so Phase 2+ work is planned and not ignored. Phase 1 remains detection,
tracking, alarm, servo pan/tilt, and inert actuation only.

---

## Scope

- **Phase 0:** Survival build (zero-budget). See
  [Phase-0 overview](../../engineering/phase0/index.mdx).
- **Phase 1:** Detection, tracking, alarm, servo pan/tilt, inert actuation only.
  No weaponization. See [Phase-1 overview](../../engineering/phase1/index.mdx)
  and [Safety boundary](../../engineering/phase1/safety-boundary.mdx).
- **Phase 2:** Investor-grade demo (dual camera, stiffer mechanics,
  solenoid/stepper). See [Phase-2 overview](../../engineering/phase2/index.mdx).
- **Phase 3:** Production and scaling (manufacturing, enterprise, multi-node).
  See [Phase-3 overview](../../engineering/phase3/index.mdx).

This outline lists what is deferred from Phase 1 and what to prepare now.

---

## Salvage and zero-budget hardware

What **cannot** be salvaged for servo PWM: routers (no real-time GPIO/hardware
PWM), DVD/appliance boards (locked SoCs), Parrot Bebop 2 Skycontroller (Linux,
no GPIO; not a flight controller), phones (no GPIO/PWM; vision/Wi-Fi node only).
What **might** be salvageable: old drone flight controller (STM32, USB,
motor/servo pads), old 3D printer board (RAMPS, Melzi). Mechanical stick driving
(analog injection) still requires an MCU. **Recommendation:** Build the software
pipeline first; add hardware when available. See
[Salvage and zero-budget hardware](../../technical/hardware/salvage-and-zero-budget-hardware.mdx).

---

## Deferred but planned

### Solenoids

- **When:** After Phase 1 tracking and safe actuation are solid; for
  trigger/demo applications only (non-weapon).
- **Doc needs when we add:** Actuator expansion (solenoid drive, interlocks);
  safety interlocks and arm/disarm; where they fit in the platform BOM and
  product docs. When solenoids are introduced, the spec will include: interlock,
  arming UI, timed pulse limits, and watchdog so safe actuation demos remain
  controllable and auditable.
- **Reference:** [Avoid list](../../engineering/phase1/avoid-list.mdx) —
  "Deferred to Phase 2 (not avoid): Solenoids (for trigger)."

### Stepper motors / drivers

- **Use cases:** Pan/tilt upgrade, linear motion, or other precision positioning
  where servos are insufficient.
- **Doc needs when we add:** Driver selection (separate from DC motor tiers
  TB6612/BTS7960 in Platform BOM v1); interface and safety limits; link to
  platform BOM motor tiers where relevant.
- **Reference:** [Avoid list](../../engineering/phase1/avoid-list.mdx) —
  "stepper motors/drivers — intentional later additions."

### Dual camera / stiffer mechanics

- **When:** Phase 2 (called out in
  [Phase-1 index](../../engineering/phase1/index.mdx) as "out of scope for this
  doc set").
- **Doc needs when we start Phase 2:** Interfaces (vision/tracking for dual
  camera); BOM impact; mechanical specs for stiffer mounts.

### Structural BOM / component-based BOM engine

- **Context:**
  [Product catalog source](../../business/portfolio/product-catalog-source.mdx)
  states that for the demo phase, BOM totals are delta-only; structural BOM
  mutations may require a component-based BOM engine in a later phase.
- **Doc needs when we add:** Approach for full component BOM mutations (where to
  document, catalog decisions, or this outline).

---

## Preparation now (no implementation)

- Keep **"Deferred to Phase 2"** visible in
  [Avoid list](../../engineering/phase1/avoid-list.mdx) and
  [Phase-1 index](../../engineering/phase1/index.mdx).
- Link from Phase-1 index to this outline so future-phase work has a single
  entry point.
- When creating new gap analyses, include a **"Future-phase gaps"** subsection
  where relevant (e.g.
  [conversation-gap-analysis-shopping-bom-rc-future-phases.md](./conversation-gap-analysis-shopping-bom-rc-future-phases.md)).
- **Fleshing out future-oriented content:** Salvage conclusions and
  RC/transmitter options (analog injection, MAVLink) are documented in staging:
  [Salvage and zero-budget hardware](../../technical/hardware/salvage-and-zero-budget-hardware.mdx),
  [Control interface options](../../technical/control/control-interface-options.mdx).
  Control pipeline and data contracts are in
  [Vision-to-actuator contracts](../../technical/architecture/interfaces/vision-to-actuator-contracts.mdx);
  authority state machine in
  [Authority and safety controller](../../technical/control/authority-and-safety-controller.mdx).
  Source:
  [conversation-gap-analysis-salvage-rc-control-architecture.md](./conversation-gap-analysis-salvage-rc-control-architecture.md).

No code or Phase 1 scope change; this is planning and discoverability only.

## Phase docs

Each phase now has its own engineering directory:

- [Phase-0 survival build](../../engineering/phase0/index.mdx)
- [Phase-1 demo builds](../../engineering/phase1/index.mdx)
- [Phase-2 investor-grade demo](../../engineering/phase2/index.mdx)
- [Phase-3 production and scaling](../../engineering/phase3/index.mdx)
