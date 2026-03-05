# Gap Analysis: Salvage / RC / Control-Architecture Conversation vs Docs-Staging

This document compares the LLM conversation on salvage and zero-budget hardware, Parrot Bebop 2 Skycontroller, FlySky analog injection, and the full control pipeline (data contracts, authority state machine, transport) with current docs-staging. It identifies **missing docs**, **missing details**, and **recommendations** so future-oriented content is fleshed out instead of deferred. Prior gap analyses are cross-referenced.

---

## Prior gap analyses

- [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md) — Authority, data contracts, serial protocol, ESP32 contract, control interface options, application structure.
- [conversation-gap-analysis-esp32-catalog.md](./conversation-gap-analysis-esp32-catalog.md) — ESP32 pan/tilt POC, wiring, catalog/tiers/platforms.
- [conversation-gap-analysis-types-tier-phase1.md](./conversation-gap-analysis-types-tier-phase1.md) — Types/tiers/catalog, Phase-1 Buy Now vs Later, ADR tagging, solenoids/steppers deferred to Phase 2.
- [conversation-gap-analysis-shopping-bom-rc-future-phases.md](./conversation-gap-analysis-shopping-bom-rc-future-phases.md) — Cart review, Platform BOM, RC/drone (MAVLink), non-destructive boundary, future-phase gaps.

---

## 1. Salvage / zero-budget hardware

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **Cannot use for servo PWM:** Routers (no real-time GPIO/hardware PWM), DVD/appliance boards (locked SoCs), Parrot Bebop controller (Linux, no GPIO), phones (no GPIO/PWM; vision/Wi-Fi node only), speakers/random PCBs (mains or non-real-time) | Not documented in one place | **Missing:** Single doc stating what *cannot* be salvaged for PWM and why. |
| **Might be salvageable:** Old drone flight controller (STM32, USB, motor/servo pads); old 3D printer board (RAMPS, Melzi); rarely RC toy mainboard with exposed headers | Not documented | **Missing:** What might be salvageable and under what conditions. |
| **Mechanical stick driving:** Using servos to move transmitter sticks still requires an MCU to drive injection; no zero-MCU solution | Not documented | **Missing:** Clarification that analog injection / stick driving does not eliminate need for MCU. |
| **Recommendation:** Build software pipeline (detection → tracking → supervisor → transport → simulated actuator) first; add hardware when available; bottleneck is architecture, not PWM hardware | [Virtual turret POC](../../engineering/playbooks/virtual-turret-poc.mdx) covers hardware-free pipeline | **Partial:** Virtual turret POC exists; no explicit "salvage vs buy" and software-first recommendation in a discoverable hardware context. |

**Recommendation:** Add a **Salvage and zero-budget hardware** doc (e.g. [technical/hardware/salvage-and-zero-budget-hardware.mdx](../../technical/hardware/salvage-and-zero-budget-hardware.mdx)) with: what cannot be used and why; what might be salvageable; mechanical stick driving still needs MCU; recommend software-first. Link from [Future phases outline](./future-phases-outline.md) and [Actuator](../../engineering/common/actuator.mdx).

---

## 2. Parrot Bebop 2 Skycontroller

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **What it is:** Linux computer, Wi-Fi, joystick input; talks to Bebop drones over IP; not a flight controller; no exposed GPIO or servo outputs | Not documented | **Missing:** Clarification that Parrot Skycontroller is not a flight controller and cannot replace receiver. |
| **Could be useful as:** AI vision / control node with external servo driver (still needs MCU or servo board) | Not documented | **Optional:** One sentence in salvage doc and control-interface options: usable as vision/Wi-Fi node only; actuation still requires external MCU/servo driver. |

**Recommendation:** Mention in the new Salvage doc and in Control interface options: Parrot Bebop 2 Skycontroller is not a flight controller; no GPIO/servo outputs; cannot replace receiver; can act as AI/Wi-Fi node only with external hardware for actuation.

---

## 3. FlySky analog injection

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **Approach:** Spoof transmitter stick inputs (DAC or digital potentiometer from MCU); do not emulate RF; transmitter and receiver stay unchanged | [conversation-gap-analysis-control-turret.md](./conversation-gap-analysis-control-turret.md) recommends "Control interface options" (replace receiver, hardware switch, analog injection) | **Missing:** Fleshed-out content: where to inject, safety (MANUAL/AUTO physical switch, revert to manual on MCU failure, clamp to safe range), minimum hardware (MCU, 2 analog outputs, common GND). |
| **Safety:** Physical toggle MANUAL (real pot) / AUTO (AI injection); if MCU dies, revert to manual; clamp output to safe mid-range | Authority and actuator docs mention arm/rate/timeout; no analog-injection-specific safety | **Missing:** Analog injection safety in control-interface or actuator doc. |

**Recommendation:** Add **Control interface options** content (in [Actuator](../../engineering/common/actuator.mdx) or new [technical/control/control-interface-options.mdx](../../technical/control/control-interface-options.mdx)): (1) Replace receiver with MCU; (2) Hardware switch (receiver vs MCU output); (3) **Analog injection** — spoof stick inputs with DAC/digital pot, MANUAL/AUTO switch, no RF emulation, safety rules. Link from actuator.

---

## 4. Control pipeline and data contracts

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **Pipeline:** Video In → Detector → Tracker → Intent Gen → Supervisor → Transport → Actuator | [Tracking–actuator bridge](../../technical/architecture/diagrams/tracking-actuator-bridge.mdx) has logical flow; no full pipeline with Intent Gen | **Missing:** Full pipeline diagram including Intent Gen and explicit "AI emits intent, supervisor converts to bounded motion." |
| **Detection output:** frame_id, timestamp, bbox (x,y,w,h), confidence | Not defined | **Missing:** Detection output schema (see control-turret gap analysis). |
| **Tracking state:** track_id, center (x,y), velocity (vx,vy), confidence | Not defined | **Missing:** Tracking state schema. |
| **Intent (AI → Supervisor):** type (e.g. TRACK_TARGET), error { dx, dy } normalized -1..1, confidence; no angles/PWM | Not defined | **Missing:** Intent contract. |
| **Control output (Supervisor → Transport):** yaw_rate, pitch_rate, mode, ttl_ms; only this shape reaches hardware | [Transport abstraction](../../technical/architecture/interfaces/transport-abstraction.mdx) says "serialization... should be documented in appendix or separate spec" | **Missing:** Concrete control schema and serial line format (e.g. Y:1500 P:1500 TTL:150). |

**Recommendation:** Add **Vision-to-actuator data contracts** doc (e.g. [technical/architecture/interfaces/vision-to-actuator-contracts.mdx](../../technical/architecture/interfaces/vision-to-actuator-contracts.mdx)) with: pipeline diagram; rule that AI never drives actuators directly; schemas for Detection, Tracking, Intent, Control output; reference to serial line format and watchdog. Reference from transport-abstraction and authority doc.

---

## 5. Authority state machine

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **States:** MANUAL, ASSISTED, AUTO_TRACK, FAILSAFE | [Authority and safety controller](../../technical/control/authority-and-safety-controller.mdx) describes single gate, limits, timeout — no state names | **Missing:** Explicit state names and transitions (see control-turret gap analysis). |
| **Rule:** Manual override always wins; document how override is signaled (key, button, physical switch) | Authority doc says "only designated controller" — doesn't state manual always wins or how override is triggered | **Missing:** "Manual override always wins" and how override is signaled. |

**Recommendation:** Add subsection (or linked page) to [Authority and safety controller](../../technical/control/authority-and-safety-controller.mdx): state machine (MANUAL / ASSISTED / AUTO_TRACK / FAILSAFE), transitions, and rule that manual override always wins with how override is signaled.

---

## 6. Application structure

| Conversation | Docs-staging | Gap |
|-------------|--------------|-----|
| **Recommended layout:** apps — vision, tracking, supervisor, pilot-ui, actuator; packages — contracts, safety, transport | [Application structure (recommended)](../../technical/architecture/application-structure.mdx) already describes this layout and mapping to existing repo | **OK** — No new gap; application structure matches conversation. |

---

## 7. What already matches

- **Virtual turret POC** — [Virtual turret POC](../../engineering/playbooks/virtual-turret-poc.mdx) covers hardware-free pipeline and authority.
- **Transport abstraction** — Exists; only concrete schemas and serial format are missing (add via vision-to-actuator-contracts).
- **ESP32 + PCA9685 + servos** — [Actuator](../../engineering/common/actuator.mdx), [Power](../../engineering/common/power.mdx), turret and avoid-list cover hardware; serial protocol and firmware contract are in other gap analyses.
- **Application structure** — [Application structure](../../technical/architecture/application-structure.mdx) has recommended layout.

---

## 8. Suggested new/updated files

| File | Purpose |
|------|---------|
| [conversation-gap-analysis-salvage-rc-control-architecture.md](./conversation-gap-analysis-salvage-rc-control-architecture.md) | This gap analysis. |
| [technical/hardware/salvage-and-zero-budget-hardware.mdx](../../technical/hardware/salvage-and-zero-budget-hardware.mdx) | Salvage and zero-budget content (what cannot/might be used, software-first recommendation). |
| [engineering/common/actuator.mdx](../../engineering/common/actuator.mdx) or [technical/control/control-interface-options.mdx](../../technical/control/control-interface-options.mdx) | Control interface options (replace receiver, switch, analog injection, Parrot note, MAVLink pointer). |
| [technical/architecture/interfaces/vision-to-actuator-contracts.mdx](../../technical/architecture/interfaces/vision-to-actuator-contracts.mdx) | Pipeline, data contracts (Detection, Tracking, Intent, Control), serial format reference. |
| [technical/control/authority-and-safety-controller.mdx](../../technical/control/authority-and-safety-controller.mdx) | State machine (MANUAL/ASSISTED/AUTO_TRACK/FAILSAFE), "manual override always wins." |
| [technical/architecture/interfaces/transport-abstraction.mdx](../../technical/architecture/interfaces/transport-abstraction.mdx) | Link to vision-to-actuator-contracts for concrete schema. |
| [future-phases-outline.md](./future-phases-outline.md) | Salvage subsection; Preparation now fleshing out. |
| [roadmap-consolidation-prior-plan-reference.md](./roadmap-consolidation-prior-plan-reference.md) | Reference this gap analysis and new/updated docs. |

---

## 9. Follow-up: USB servo driver and flight controller bridge

From the same conversation thread, two options were added to staging:

| Addition | Where | Purpose |
|----------|--------|--------|
| **When you have no microcontroller** | [control-interface-options.mdx](../../technical/control/control-interface-options.mdx) | **USB servo driver board** (e.g. PCA9685 USB): laptop → USB → driver → servos; no MCU or firmware. **Flashable flight controller**: PC → USB → flight controller → PWM → servos (Betaflight/MAVLink). |
| **No microcontroller yet: buy one option** | [salvage-and-zero-budget-hardware.mdx](../../technical/hardware/salvage-and-zero-budget-hardware.mdx) | Only no-MCU way to drive servos from laptop = USB servo driver; no household device can replace an MCU for servo PWM. Flight controller = best *salvage* USB→PWM bridge. |
| **Recommendation** (salvage doc) | Same | Explicit mention of SimulatedTransport when no hardware; link to control-interface-options for no-MCU and salvage options. |

These close the "no MCU / no ESP32 yet" and "flight controller as bridge" gaps from the conversation.
