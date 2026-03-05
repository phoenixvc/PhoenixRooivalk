# Placement of "Common" Docs: Phase-1 vs Central

**Status: Implemented (Option B).** Common modules now live under `engineering/common/` in docs-staging; `phase1/common/` has been removed.

---

## Structure at evaluation time (pre-decision)

- **engineering/phase1/common/** — power, alarms, networking, actuator, compute, shared-parts, wiring-safety
- Phase-1 product docs and index linked to these via `../common/…`
- **technical/hardware/** — board-bringup, servo-selection, power-budgeting, prototype-compute-tiers (already central, not phase-scoped)

## Options (critical evaluation)

### Option A: Keep under `engineering/phase1/common/` (current)

| Pros | Cons |
|------|------|
| Clear that content is Phase-1–scoped. | Phase 2+ would need their own `phase2/common/` → duplication of *structure* and risk of duplicated *content* (e.g. "MQTT" in phase1 and phase2). |
| All Phase-1 links stay valid. | "Common" is not reusable by other phases or by non-phase engineering docs (e.g. playbooks). |
| No migration. | Discoverability: "common" is buried under Phase-1; someone looking for "networking" may look under Technical first. |

**Verdict:** Fine only if Phase-1 will stay the only phase with shared modules and you never want a single source of truth for "networking" or "power" across phases.

---

### Option B: Central under `engineering/common/` (phase-agnostic shared modules) — **chosen**

- **Location:** `engineering/common/` (sibling to `phase1/`, `playbooks/`).
- **Content:** Same topics (power, networking, actuator, compute, alarms, wiring-safety, shared-parts), written as **shared foundations**; phase-agnostic where possible (e.g. "Use MQTT as event spine; Phase-1 uses… Phase-2 adds…").
- **Phases:** `phase1/index.mdx` (and later phase2) **reference** these docs and add phase-specific sections or links (e.g. "Phase-1 stack: Pi4+Coral, ESP32; see [Common modules](../common/index.mdx). Phase-1 specifics: …").

| Pros | Cons |
|------|------|
| Single source of truth for power, networking, actuator, etc. | One-time migration and link updates (phase1 products, index, playbooks). |
| Phase 2+ can reference the same docs and add only phase-specific content. | Need to keep tone "foundation" not "Phase-1 only" (small edits). |
| Playbooks and other engineering docs can link to `engineering/common/` without going through Phase-1. | Sidebar/nav: "Common modules" appears under Engineering, not under Phase-1 (could add a Phase-1 nav entry that links to it). |
| Better discoverability: "Engineering → Common modules" is easy to find. | |

**Verdict:** Best if you expect multiple phases or want one place that "every phase builds on."

---

### Option C: Central under `technical/` (e.g. `technical/hardware/` or `technical/engineering-common/`)

- **Location:** e.g. `technical/hardware/power.mdx`, `technical/network/mqtt-and-http.mdx`, or a new `technical/engineering-common/` with power, networking, actuator, compute, alarms.
- **Content:** Same idea as B but under Technical; phases and engineering playbooks link into Technical.

| Pros | Cons |
|------|------|
| Fits "technical reference" mental model (power, networking, compute). | **technical/hardware/** already has power-budgeting, servo-selection, board-bringup — mixing "platform BOM / Phase-1 stack" (MP1584, Pi4+Coral, ESP32) with generic hardware could blur the line. |
| Reusable by any doc that needs hardware/network guidance. | Phase-1 is *engineering* (builds, BOMs, playbooks); "common" is shared *engineering* context. Technical is often read as "system/architecture," so "Phase-1 common" might feel less at home there. |

**Verdict:** Prefer **B** unless you explicitly want "common" to be part of the global Technical reference set and are okay merging or clearly separating from existing technical/hardware content.

---

### Option D: Hybrid — central foundation + phase overlays

- **Central:** `engineering/common/` holds **foundation** docs (e.g. "Power rails and safety," "MQTT and HTTP," "Actuator control (servos, drivers)").
- **Phase overlays:** `phase1/` keeps short docs that say "Phase-1 uses: Pi4+Coral, ESP32, PCA9685; see [Common: compute](../common/compute.mdx), [Common: actuator](../common/actuator.mdx)" and list Phase-1–specific choices and BOM pointers.

| Pros | Cons |
|------|------|
| Clear split: foundation vs phase-specific. | More files to maintain (phase overlay pages). |
| Phases "extend" central content without duplicating it. | Slightly more complex nav (Phase-1 links to both phase1 and common). |

**Verdict:** Strong option if you want to scale to many phases and keep phase docs thin and reference-heavy.

---

## Recommendation

- **Short term / single phase:** Option **A** is acceptable; no move required.
- **If you want one place for shared content and phases to build on:** Prefer **Option B** (`engineering/common/`) or **Option D** (same plus thin phase overlays).
- **Avoid** scattering the same topics under both `phase1/common/` and `technical/` without a clear rule (e.g. "technical = generic; phase1 = Phase-1 only") to prevent duplication and drift.

## Implementation (Option B)

1. Create `engineering/common/` and move power, alarms, networking, actuator, compute, shared-parts, wiring-safety (and index) there.
2. Update all links that point to `phase1/common/` to point to `engineering/common/` (phase1 index, phase1 product docs, playbooks).
3. In `phase1/index.mdx`, add a clear line: "Shared build blocks (power, networking, actuator, compute, alarms) live in [Common modules](../common/index.mdx). Phase-1 stack and BOMs are described in this section and in each product doc."
4. Use the **staging** sidebar (`sidebars-staging.ts`) so "Common modules" appears under Engineering. The main site sidebar (`sidebars.ts`) is for the real docs only.
5. Optionally add a short "Phase-1 stack summary" in phase1 that links into each common doc for readers who start from Phase-1.

**Completed:** Steps 1–3 and 5; `phase1/common/` removed. Common modules now live only in `engineering/common/`.
