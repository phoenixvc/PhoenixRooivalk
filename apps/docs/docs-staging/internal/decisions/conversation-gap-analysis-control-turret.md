# Gap Analysis: Control/Turret Conversation vs Docs-Staging

This document compares a detailed LLM conversation (tracking turret, authority,
transport, ESP32, product catalog) with the current docs-staging content and
identifies **missing docs**, **missing details**, and **missing doc-generation
functions**.

---

## 1. Authority and safety

| Conversation                                                         | Docs-staging                                                                                                                                                                 | Gap                                                                                                                                         |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **State machine:** MANUAL → ASSISTED → AUTO_TRACK, FAILSAFE on fault | [Authority and safety controller](../../technical/control/authority-and-safety-controller.mdx) describes single gate, limits, timeout, audit — **no state names or diagram** | **Missing:** Explicit authority state machine (MANUAL / ASSISTED / AUTO_TRACK / FAILSAFE) and transition rules.                             |
| **Rule:** "Manual override always wins," deadman key/button          | Authority doc says "only designated controller" — doesn't state that operator manual **always** wins or how override is signaled                                             | **Missing:** "Manual override always wins" and how override is triggered (key, button, physical switch).                                    |
| Supervisor: PID, rate limit, clamp, watchdog                         | [Tracking control loop](../../technical/control/tracking-control-loop.mdx) mentions PID and limits; authority doc mentions timeout                                           | **Partial:** PID/rate/clamp are in control loop; watchdog and "no command → neutral" could be stated in one place (authority or transport). |

**Recommendation:** Add a short subsection to the authority doc (or a linked
"Authority state machine" page) with: state names, transitions, and the rule
that manual override always wins and how it is signaled.

---

## 2. Data contracts (vision → tracking → supervisor → transport)

| Conversation                                                                                                 | Docs-staging                                                                                                                                                                                                                                 | Gap                                                                                              |
| ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Detection:** `frame_id`, `timestamp`, `bbox`, `confidence`                                                 | Not defined                                                                                                                                                                                                                                  | **Missing:** Detection output schema.                                                            |
| **Tracking:** `track_id`, `center`, `velocity`, `confidence`                                                 | Not defined                                                                                                                                                                                                                                  | **Missing:** Tracking state schema.                                                              |
| **Intent (AI → Supervisor):** `type: TRACK_TARGET`, `error: { dx, dy }` (-1..1), `confidence`; no angles/PWM | Not defined                                                                                                                                                                                                                                  | **Missing:** Intent / AI–supervisor contract (normalized error, no raw actuation).               |
| **Control (Supervisor → Transport):** `yaw_rate`, `pitch_rate`, `mode`, `ttl_ms`                             | [Transport abstraction](../../technical/architecture/interfaces/transport-abstraction.mdx) says ControlCommand has "intended effect" and "authority/session"; "serialization format... should be documented in an appendix or separate spec" | **Missing:** Concrete control message schema and the rule that only this shape reaches hardware. |

**Recommendation:** Add an **appendix or linked doc** (e.g. under
`technical/architecture/interfaces/` or `technical/control/`) that defines:
Detection output, Tracking state, Intent (AI→Supervisor), Control output
(Supervisor→Transport). Reference it from the transport and authority docs.

---

## 3. Serial / wire protocol and ESP32 firmware contract

| Conversation                                                                   | Docs-staging                                                                                                                                                                                              | Gap                                                                                                 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Line format:** `Y:1500 P:1500 TTL:150` (absolute µs) or rate-based           | Not documented                                                                                                                                                                                            | **Missing:** Concrete serial line format (e.g. `Y:<us> P:<us> TTL:<ms>`) and 1000–2000 µs range.    |
| **Watchdog:** No valid command within 200 ms → neutral                         | Transport doc says "timeout... transition to safe state" but no value                                                                                                                                     | **Missing:** Recommended/default timeout (e.g. 200 ms) and "neutral" behavior.                      |
| **ESP32:** Receives serial → PWM to 2 servos; timeout to neutral; optional ACK | [Actuator](../../engineering/common/actuator.mdx) and [NetSnare Lite Turret](../../engineering/phase1/products/netsnare-lite-turret.mdx) mention ESP32 + PCA9685; no serial protocol or firmware behavior | **Missing:** ESP32 firmware contract: parse format, PWM range, timeout value, safe state (neutral). |

**Recommendation:** Add a **Serial control protocol** section (in
transport-abstraction or a new
`technical/control/serial-actuator-protocol.mdx`): line format, units, TTL
range, watchdog value, and neutral/safe state. Optionally document that ESP32
(or PCA9685) implements this contract and reference it from actuator and turret
product docs.

---

## 4. RC / FlySky and "software control interface"

| Conversation                                                                                          | Docs-staging                                                              | Gap                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Options:** Replace receiver with MCU; hardware PWM switch (receiver vs MCU); analog stick injection | Not documented                                                            | **Missing:** Short doc or subsection on "how to get software control" when starting from RC: replace receiver, hardware switch, or inject into transmitter (no RF emulation). |
| **Clarification:** Servos need 50 Hz PWM; laptop cannot drive servos; need MCU or USB servo board     | Actuator and hardware docs assume ESP32/PCA9685; no "why" or alternatives | **Optional:** One paragraph in actuator or a "Control interface options" note: why MCU/USB driver is needed; alternatives (USB servo board, flight controller).               |

**Recommendation:** Add a short **Control interface options** subsection under
[Actuator](../../engineering/common/actuator.mdx) (or under hardware): replace
receiver with MCU, hardware switch, or analog injection; no RF emulation.
Improves discoverability for people with existing RC gear.

---

## 5. Recommended app/repo structure

| Conversation                                                                                                             | Docs-staging   | Gap                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------- |
| **Suggested layout:** `apps/` vision, tracking, supervisor, pilot-ui, actuator; `packages/` contracts, safety, transport | Not documented | **Missing:** Doc that recommends or describes this (or current) repo layout for control/tracking/actuator. |

**Recommendation:** Add a short **Application structure** section (e.g. in
[Tracking–actuator bridge](../../technical/architecture/diagrams/tracking-actuator-bridge.mdx)
or a new `technical/architecture/application-structure.mdx`): high-level modules
(vision, tracking, supervisor, pilot-ui, actuator) and shared packages
(contracts, safety, transport). Keeps conversation insight in one place.

---

## 6. What already matches

- **Virtual turret first:**
  [Virtual turret POC](../../engineering/playbooks/virtual-turret-poc.mdx)
  covers hardware-free pipeline and authority.
- **Transport abstraction:** Exists; only concrete schemas and serial format are
  missing.
- **Authority and safety controller:** Exists; only state machine and "manual
  always wins" are missing.
- **Tracking control loop:** Exists; mentions PID and limits.
- **ESP32 + PCA9685 + servos:**
  [Actuator](../../engineering/common/actuator.mdx),
  [Power](../../engineering/common/power.mdx),
  [Wiring safety](../../engineering/common/wiring-safety.mdx), turret and
  avoid-list cover hardware; only protocol/firmware contract is missing.
- **Product catalog:** [Product list](../../business/portfolio/product-list.mdx)
  uses `getProductLines`, `getProductListSummary`, `getProductsByLine`;
  [Product catalog source](../../business/portfolio/product-catalog-source.mdx)
  explains source and export. No missing product-list doc-generation functions.

---

## 7. Doc-generation and export functions

| Topic                                   | Status     | Note                                                                                                                                                                                                         |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product list in MDX                     | OK         | Uses `getProductLines`, `getProductListSummary`, `getProductsByLine`.                                                                                                                                        |
| Export products to JSON/CSV             | OK         | `scripts/export-products.ts` → `exports/products.json`, `exports/products.csv`.                                                                                                                              |
| Export platforms + benchmarks + storage | Optional   | Conversation suggested a "catalog-bundle" or platforms export; not required for current docs. Can add later (e.g. `exports/platforms.json` or `catalog-bundle.json`) if needed for tooling or external docs. |
| Generate product list as static text    | Not needed | MDX consumes live catalog; no extra generator needed.                                                                                                                                                        |

**Recommendation:** No mandatory new doc-generation functions. Optionally extend
the export script to emit platforms, benchmarks, and storage (or a single
bundle) if you want a single artifact for external use.

---

## 8. Priority summary

1. **High (safety/clarity):** Authority state machine + "manual override always
   wins" in authority doc (or linked page).
2. **High (implementation):** Data contracts (detection, tracking, intent,
   control) and serial protocol (e.g. `Y:/P:/TTL:` and watchdog) in transport
   appendix or dedicated control doc.
3. **Medium:** ESP32 firmware contract (parse format, timeout, neutral)
   referenced from actuator and turret.
4. **Medium:** Short "Control interface options" (replace receiver / hardware
   switch / analog injection) under actuator or hardware.
5. **Low:** Recommended app/repo structure (vision, tracking, supervisor,
   pilot-ui, actuator; contracts, safety, transport).
6. **Optional:** Export script extended for platforms/benchmarks/bundle.

---

## 9. Suggested new/updated files

| File                                                                                      | Purpose                                                                                                                |
| ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `technical/control/authority-state-machine.mdx` (or subsection in authority doc)          | State names (MANUAL, ASSISTED, AUTO_TRACK, FAILSAFE), transitions, manual-override-always-wins.                        |
| `technical/architecture/interfaces/control-data-contracts.mdx` (or appendix in transport) | Detection, Tracking, Intent, Control message schemas.                                                                  |
| `technical/control/serial-actuator-protocol.mdx` (or section in transport)                | Line format `Y: P: TTL:`, units, watchdog (e.g. 200 ms), neutral.                                                      |
| Update `engineering/common/actuator.mdx`                                                  | Add "Control interface options" (replace receiver / switch / injection); reference serial protocol and ESP32 contract. |
| `technical/architecture/application-structure.mdx` (optional)                             | High-level modules and packages for tracking/control/actuator.                                                         |

This keeps the conversation’s design in the docs without duplicating existing
staging content.
