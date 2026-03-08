#!/usr/bin/env bash
# =============================================================================
# Create GitHub issues for hardware phase future work
# Run this script locally with: bash scripts/create-hardware-phase-issues.sh
# Requires: gh CLI authenticated (gh auth login)
# =============================================================================

set -euo pipefail

REPO="phoenixvc/PhoenixRooivalk"

echo "Creating hardware phase future work issues..."
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Issue 1: SkyWatch Standard v2 docs (Phase 2)
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add SkyWatch Standard v2 hardware spec (Phase 2)" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

The Phase 2 hardware overview lists **SkyWatch Standard v2** as Product #2 in the product set table, but no dedicated documentation page exists for it.

## Context

- Phase 2 overview: `apps/docs/docs/technical/hardware/phase2/overview.md` (line 78)
- Existing Phase 2 docs: SkyWatch Nano v2, Turret Tracker v2, SkyWatch Hub all have dedicated pages
- SkyWatch Standard v2 is the mid-tier consumer unit with Pi + Coral + PIR sensor fusion

## Scope

Create `apps/docs/docs/technical/hardware/phase2/skywatch-standard-v2.md` covering:
- [ ] Bill of materials (Pi Zero 2W + Coral + PIR array upgrade from Phase 1A)
- [ ] Architecture diagram (PIR + camera + MQTT)
- [ ] Build steps (upgrade path from Phase 1A SkyWatch Standard)
- [ ] Acceptance criteria
- [ ] Upgrade path to Phase 3

Add the doc ID `phase2-skywatch-standard-v2` to `sidebars.ts` under the Phase 2 category.

## References

- Phase 1A SkyWatch Standard: `apps/docs/docs/technical/hardware/phase1/skywatch-standard.md`
- Phase 2 overview product table
EOF
)"

echo "✓ Created: SkyWatch Standard v2 docs"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 2: Trigger Node v2 docs (Phase 2)
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Trigger Node v2 hardware spec (Phase 2)" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

The Phase 2 hardware overview lists **Trigger Node v2** as Product #4 in the product set table, but no dedicated documentation page exists for it.

## Context

- Phase 2 overview: `apps/docs/docs/technical/hardware/phase2/overview.md` (line 80)
- Trigger Node v2 uses Pi Zero 2W (no ML needed) with MQTT-based command receiving

## Scope

Create `apps/docs/docs/technical/hardware/phase2/trigger-node-v2.md` covering:
- [ ] Bill of materials (Pi Zero 2W, relay module upgrade, MQTT client)
- [ ] Architecture diagram (MQTT subscribe + relay + safety interlocks)
- [ ] MQTT command protocol (`POST /fire` → MQTT subscribe `skywatch/hub/commands/`)
- [ ] Enhanced safety interlocks (token-based auth replacing IP allowlist)
- [ ] Multi-channel relay support (preparation for Phase 3)
- [ ] Build steps and acceptance criteria
- [ ] Upgrade path to Phase 3

Add the doc ID to `sidebars.ts` under the Phase 2 category.

## References

- Phase 1A Trigger Node: `apps/docs/docs/technical/hardware/phase1/trigger-node.md`
- Phase 2 overview product table
EOF
)"

echo "✓ Created: Trigger Node v2 docs"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 3: Phase 3 Communications deep-dive
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 3 communications architecture spec" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 3 overview covers LoRa/LTE/WiFi at a high level but needs a dedicated deep-dive doc for the communications architecture, including protocol selection, range testing methodology, and failover logic.

## Scope

Create `apps/docs/docs/technical/hardware/phase3/communications.md` covering:
- [ ] LoRa link budget calculation and range estimation
- [ ] LTE Cat-M1 failover trigger conditions and timing
- [ ] WiFi local debug access (WPA3 config, production disable)
- [ ] Message serialization format (compressed JSON vs CBOR vs Protobuf)
- [ ] AES-128 key management for LoRa
- [ ] Antenna selection and placement guidelines
- [ ] Range testing methodology and pass/fail criteria
- [ ] Power consumption comparison across comms modes

Add to `sidebars.ts` under Phase 3 category.

## References

- Phase 3 overview: `apps/docs/docs/technical/hardware/phase3/overview.md`
- LoRa specs in overview (SX1276/RAK4631)
- LTE specs in overview (Quectel BG96)
EOF
)"

echo "✓ Created: Phase 3 communications"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 4: Phase 3 Power Systems deep-dive
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 3 power systems spec (PoE + Solar)" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 3 overview lists PoE and Solar power options but needs a dedicated spec covering power budget analysis, battery sizing, MPPT configuration, and runtime calculations.

## Scope

Create `apps/docs/docs/technical/hardware/phase3/power-systems.md` covering:
- [ ] Detailed power budget table (idle vs active vs peak per subsystem)
- [ ] PoE design: 802.3af vs 802.3at selection, splitter wiring, inline UPS
- [ ] Solar design: panel sizing calculator, MPPT controller config, battery chemistry comparison (LiFePO4 vs Li-ion)
- [ ] Battery management: charge profiles, temperature compensation, fuel gauge integration
- [ ] Runtime calculations for different duty cycles and solar conditions
- [ ] Power state machine (SLEEP → WAKE → ALERT) with transition timing
- [ ] Wiring diagrams for both PoE and Solar configurations
- [ ] Cold-weather operation (battery heater, low-temp cutoff)

Add to `sidebars.ts` under Phase 3 category.

## References

- Phase 3 overview power sections
- Phase 3 sensor integration power management section
EOF
)"

echo "✓ Created: Phase 3 power systems"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 5: Phase 3 Enclosure Design
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 3 enclosure and mounting design spec" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 3 overview describes enclosure requirements (IP65, cable glands, pole mount) but needs a dedicated spec with mechanical drawings, material selection, and environmental testing procedures.

## Scope

Create `apps/docs/docs/technical/hardware/phase3/enclosure-design.md` covering:
- [ ] Enclosure material comparison (FRP vs ASA vs ABS+UV)
- [ ] Dimensional drawing with internal component layout
- [ ] Cable gland placement and cable routing
- [ ] Ventilation design (IP65 breather vent + thermostat fan)
- [ ] Pole-mount bracket design (50–100mm clamp range)
- [ ] Quick-swap module bays (compute, comms, sensors)
- [ ] Thermal analysis (internal temp vs ambient in direct sun)
- [ ] IP65 test procedure and pass criteria
- [ ] Sensor dome optical requirements (transmittance, anti-fog)
- [ ] 3D print files for prototyping vs injection mold for production

Add to `sidebars.ts` under Phase 3 category.

## References

- Phase 3 overview enclosure section
- Phase 4 injection-molded housing spec
EOF
)"

echo "✓ Created: Phase 3 enclosure design"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 6: Phase 4 Manufacturing Process
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 4 manufacturing process and quality control spec" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 4 overview includes a high-level manufacturing process flow but needs a dedicated spec covering ICT fixture design, functional test procedures, quality gates, and supplier management.

## Scope

Create `apps/docs/docs/technical/hardware/phase4/manufacturing-process.md` covering:
- [ ] SMT assembly line configuration (pick-and-place, reflow, AOI)
- [ ] ICT (In-Circuit Test) fixture design and test coverage
- [ ] Functional test procedure (boot test, sensor self-check, comms verify)
- [ ] Quality gates: incoming inspection → SMT → ICT → functional → system → ship
- [ ] Defect tracking and root cause analysis process
- [ ] Supplier qualification and AVL (Approved Vendor List) management
- [ ] Conformal coating procedure and inspection
- [ ] Traceability: serial number scheme, component lot tracking
- [ ] Production metrics: yield, cycle time, throughput targets
- [ ] Rework procedures and acceptance criteria

Add to `sidebars.ts` under Phase 4 category.

## References

- Phase 4 overview manufacturing section
- Phase 4 custom PCB design DFM/DFT requirements
EOF
)"

echo "✓ Created: Phase 4 manufacturing process"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 7: Phase 4 Certification Plan
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 4 certification and compliance plan" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 4 overview lists required certifications (FCC, CE, CPSC, UL, MIL-STD) but needs a dedicated plan with timelines, test lab selection, pre-compliance strategy, and cost tracking.

## Scope

Create `apps/docs/docs/technical/hardware/phase4/certification-plan.md` covering:
- [ ] Certification matrix: which certs needed for consumer (SkySnare) vs enterprise (AeroNet)
- [ ] FCC Part 15 pre-compliance test procedure and equipment
- [ ] CE RED directive requirements (EN 300 220, EN 301 489)
- [ ] MIL-STD-461G pre-compliance test plan (EMI/EMC)
- [ ] MIL-STD-810G environmental test selection and tailoring
- [ ] ITAR/EAR export control classification (ECCN determination)
- [ ] Test lab selection criteria and recommended labs
- [ ] Timeline: pre-compliance → design fixes → formal testing → certification
- [ ] Cost tracking spreadsheet template
- [ ] Documentation requirements per certification body

Add to `sidebars.ts` under Phase 4 category.

## References

- Phase 4 overview certification section
- Phase 5 MIL-STD qualification tables
- Legal compliance framework: `apps/docs/docs/legal/compliance-framework.md`
EOF
)"

echo "✓ Created: Phase 4 certification plan"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 8: Phase 4 OTA Firmware Update System
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 4 OTA firmware update system spec" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 4 overview describes the OTA update strategy (dual-bank A/B, delta updates, Ed25519 signing) but needs a detailed spec covering the update pipeline, rollback logic, and LoRa-constrained delivery.

## Scope

Create `apps/docs/docs/technical/hardware/phase4/ota-firmware.md` covering:
- [ ] Update pipeline: build → sign → stage on hub → push to nodes
- [ ] Dual-bank (A/B) partition layout on Jetson NVMe
- [ ] Rollback trigger conditions (3 failed boots, watchdog timeout)
- [ ] Delta update generation (mender.io or SWUpdate comparison)
- [ ] Ed25519 key management (signing key rotation, revocation)
- [ ] LoRa-constrained delivery: chunking, resume, integrity verification
- [ ] LTE delivery path for larger updates
- [ ] Update scheduling (maintenance windows, staggered rollout)
- [ ] Secure boot chain integration (signed U-Boot, dm-verity)
- [ ] Monitoring: update success/failure reporting to hub

Add to `sidebars.ts` under Phase 4 category.

## References

- Phase 4 overview firmware architecture section
- Phase 5 secure boot chain
EOF
)"

echo "✓ Created: Phase 4 OTA firmware"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 9: Phase 5 Coalition Interoperability
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 5 coalition interoperability spec" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 5 overview mentions STANAG 4586, Link 16, and MADL but needs a dedicated spec covering message mapping, classification handling, and multi-national exercise procedures.

## Scope

Create `apps/docs/docs/technical/hardware/phase5/coalition-interop.md` covering:
- [ ] STANAG 4586 compliance level and message set
- [ ] Link 16 receive-only integration (J-series message mapping)
- [ ] MADL receive capability scope
- [ ] Track correlation: Phoenix tracks ↔ coalition tracks (deduplication)
- [ ] Classification handling: UNCLASS ↔ CUI ↔ SECRET data boundaries
- [ ] Cross-domain solutions for multi-classification environments
- [ ] Exercise procedures: how to participate in multi-national C-UAS exercises
- [ ] Testing: coalition interop test plan with simulated Link 16 traffic
- [ ] Data sharing agreements and legal framework references

Add to `sidebars.ts` under Phase 5 category.

## References

- Phase 5 overview communications architecture section
- Phase 5 overview security architecture section
- Investment phases: coalition interoperability requirements
EOF
)"

echo "✓ Created: Phase 5 coalition interoperability"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 10: Phase 5 Security Architecture
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 5 security architecture deep-dive" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 5 overview covers HSM, FIPS 140-3, and secure boot at a high level but needs a dedicated security architecture document covering key management, incident response, and red team validation.

## Scope

Create `apps/docs/docs/technical/hardware/phase5/security-architecture.md` covering:
- [ ] HSM integration: ATECC608B vs SE050 comparison, key hierarchy
- [ ] FIPS 140-3 Level 2 certification path and timeline
- [ ] Key management: device identity, operator auth, evidence signing, rotation
- [ ] Secure boot chain: fuse programming, certificate chain, recovery
- [ ] Runtime attestation: HSM challenge-response protocol
- [ ] Data-at-rest encryption: per-partition keys, key escrow
- [ ] Data-in-transit encryption: mTLS for MANET, AES-256-GCM
- [ ] Anti-tamper: physical intrusion detection, zeroization trigger
- [ ] Incident response: compromise detection, key revocation, fleet lockdown
- [ ] Red team validation plan: scope, rules of engagement, reporting

Add to `sidebars.ts` under Phase 5 category.

## References

- Phase 5 overview security architecture section
- Phase 4 secure boot chain
- Security rules: `.claude/rules/security.md`
EOF
)"

echo "✓ Created: Phase 5 security architecture"

# ─────────────────────────────────────────────────────────────────────────────
# Issue 11: Phase 5 Operational Procedures
# ─────────────────────────────────────────────────────────────────────────────
gh issue create --repo "$REPO" \
  --title "docs: add Phase 5 C-UAS site operational procedures" \
  --label "documentation,enhancement" \
  --body "$(cat <<'EOF'
## Summary

Phase 5 overview includes deployment and readiness checklists but needs a full operational procedures document covering daily operations, maintenance schedules, emergency procedures, and training curriculum.

## Scope

Create `apps/docs/docs/technical/hardware/phase5/operational-procedures.md` covering:
- [ ] Daily operations checklist (shift handover, system health check)
- [ ] Operator console procedures (engagement workflow, track management)
- [ ] RKV-M launch and recovery procedures (step-by-step)
- [ ] Maintenance schedule: daily / weekly / monthly / quarterly tasks
- [ ] Predictive maintenance: sensor health metrics, MTBF tracking
- [ ] Emergency procedures: lost link, friendly aircraft, civilian in area, system failure
- [ ] Net cartridge handling and storage
- [ ] Training curriculum: operator qualification levels, scenario-based exercises
- [ ] After-action review template
- [ ] Evidence chain-of-custody procedures for recovered drones

Add to `sidebars.ts` under Phase 5 category.

## References

- Phase 5 overview deployment checklist
- Phase 5 RKV-M integration engagement sequence
- Operations manual: `apps/docs/docs/operations/operations-manual.md`
EOF
)"

echo "✓ Created: Phase 5 operational procedures"

echo ""
echo "=== All 11 issues created successfully ==="
echo ""
echo "Summary:"
echo "  Phase 2: 2 issues (SkyWatch Standard v2, Trigger Node v2)"
echo "  Phase 3: 3 issues (Communications, Power Systems, Enclosure Design)"
echo "  Phase 4: 3 issues (Manufacturing, Certification, OTA Firmware)"
echo "  Phase 5: 3 issues (Coalition Interop, Security Architecture, Operational Procedures)"
