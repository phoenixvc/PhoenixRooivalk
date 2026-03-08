<#
.SYNOPSIS
  Create GitHub issues for hardware phase future work (Phase 2-5 docs).

.DESCRIPTION
  Creates 12 issues: Phase 2 (2), Phase 3 (3), Phase 4 (3), Phase 5 (3), plus Hugging Face + MCP integration (1).
  Requires: gh CLI authenticated (gh auth login).
  New docs go first to docs-staging (apps/docs/docs-staging/technical/hardware/phaseN/), then promote to apps/docs/docs/ when ready. Sidebar: sidebars-staging.ts for staging, sidebars.ts for main.

.NOTES
  Bash version: scripts/create-hardware-phase-issues.sh (run on Linux/macOS).
#>
$ErrorActionPreference = "Stop"
$Repo = "phoenixvc/PhoenixRooivalk"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Error "GitHub CLI 'gh' not found. Install from https://cli.github.com/ and run 'gh auth login'."
  exit 1
}

$tempDir = Join-Path $env:TEMP "hardware-phase-issues"
if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }

function New-Issue {
  param([string]$Title, [string]$Body)
  $f = Join-Path $tempDir ([System.Guid]::NewGuid().ToString("N") + ".md")
  [System.IO.File]::WriteAllText($f, $Body, [System.Text.UTF8Encoding]::new($false))
  gh issue create --repo $Repo --title $Title --label "documentation,enhancement" --body-file $f
  Remove-Item $f -Force -ErrorAction SilentlyContinue
}

Write-Host "Creating hardware phase future work issues..." -ForegroundColor Cyan
Write-Host ""

# 1: SkyWatch Standard v2
$body1 = @'
## Summary

The Phase 2 hardware overview lists **SkyWatch Standard v2** as Product #2 in the product set table, but no dedicated documentation page exists for it.

## Context

- Phase 2 overview: `apps/docs/docs/technical/hardware/phase2/overview.md` (product set table, line ~78)
- Existing Phase 2 docs in repo: SkyWatch Nano v2, Turret Tracker v2, SkyWatch Hub (each has a dedicated page). **Missing:** SkyWatch Standard v2, Trigger Node v2.
- SkyWatch Standard v2 is the mid-tier consumer unit (Pi + Coral + PIR sensor fusion).

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase2/skywatch-standard-v2.md` with frontmatter `id: phase2-skywatch-standard-v2`, covering:
- [ ] Bill of materials (Pi Zero 2W + Coral + PIR array upgrade from Phase 1)
- [ ] Architecture diagram (PIR + camera + MQTT)
- [ ] Build steps (upgrade path from Phase 1 SkyWatch Standard)
- [ ] Acceptance criteria
- [ ] Upgrade path to Phase 3
- [ ] Add to `apps/docs/sidebars-staging.ts` under Phase 2 hardware. When promoting to main docs, add to `apps/docs/sidebars.ts` and move file to `apps/docs/docs/technical/hardware/phase2/`.

## References

- Phase 1 SkyWatch Standard: `apps/docs/docs/technical/hardware/phase1/skywatch-standard.md` (id: phase1-skywatch-standard)
- Phase 2 overview product table; existing Phase 2 docs (phase2-skywatch-nano-v2, phase2-turret-tracker-v2, phase2-skywatch-hub)
'@
New-Issue -Title "docs: add SkyWatch Standard v2 hardware spec (Phase 2)" -Body $body1
Write-Host "Created: SkyWatch Standard v2 docs"

# 2: Trigger Node v2
$body2 = @'
## Summary

The Phase 2 hardware overview lists **Trigger Node v2** as Product #4 in the product set table, but no dedicated documentation page exists for it.

## Context

- Phase 2 overview: `apps/docs/docs/technical/hardware/phase2/overview.md` (product set table, line ~80)
- Trigger Node v2 uses Pi Zero 2W (no ML needed) with MQTT-based command receiving. **No dedicated doc yet.**

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase2/trigger-node-v2.md` with frontmatter `id: phase2-trigger-node-v2`, covering:
- [ ] Bill of materials (Pi Zero 2W, relay module upgrade, MQTT client)
- [ ] Architecture diagram (MQTT subscribe + relay + safety interlocks)
- [ ] MQTT command protocol (`POST /fire` -> MQTT subscribe `skywatch/hub/commands/`)
- [ ] Enhanced safety interlocks (token-based auth replacing IP allowlist)
- [ ] Multi-channel relay support (preparation for Phase 3)
- [ ] Build steps and acceptance criteria
- [ ] Upgrade path to Phase 3
- [ ] Add to `apps/docs/sidebars-staging.ts` under Phase 2 hardware. When promoting to main docs, add to `apps/docs/sidebars.ts` and move file to `apps/docs/docs/technical/hardware/phase2/`.

## References

- Phase 1 Trigger Node: `apps/docs/docs/technical/hardware/phase1/trigger-node.md` (id: phase1-trigger-node)
- Phase 2 overview product table; existing Phase 2 docs
'@
New-Issue -Title "docs: add Trigger Node v2 hardware spec (Phase 2)" -Body $body2
Write-Host "Created: Trigger Node v2 docs"

# 3: Phase 3 Communications
$body3 = @'
## Summary

Phase 3 overview covers LoRa/LTE/WiFi at a high level but needs a dedicated deep-dive doc for the communications architecture, including protocol selection, range testing methodology, and failover logic.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase3/communications.md` with frontmatter `id: phase3-communications`, covering:
- [ ] LoRa link budget calculation and range estimation
- [ ] LTE Cat-M1 failover trigger conditions and timing
- [ ] WiFi local debug access (WPA3 config, production disable)
- [ ] Message serialization format (compressed JSON vs CBOR vs Protobuf)
- [ ] AES-128 key management for LoRa
- [ ] Antenna selection and placement guidelines
- [ ] Range testing methodology and pass/fail criteria
- [ ] Power consumption comparison across comms modes
- [ ] Add to `sidebars-staging.ts` under Phase 3; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase3/`.

## References

- Phase 3 overview: `apps/docs/docs/technical/hardware/phase3/overview.md` (id: phase3-hardware-overview)
- Phase 3 sensor integration: `phase3-sensor-integration`; LoRa/LTE specs in overview
'@
New-Issue -Title "docs: add Phase 3 communications architecture spec" -Body $body3
Write-Host "Created: Phase 3 communications"

# 4: Phase 3 Power Systems
$body4 = @'
## Summary

Phase 3 overview lists PoE and Solar power options but needs a dedicated spec covering power budget analysis, battery sizing, MPPT configuration, and runtime calculations.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase3/power-systems.md` with frontmatter `id: phase3-power-systems`, covering:
- [ ] Detailed power budget table (idle vs active vs peak per subsystem)
- [ ] PoE design: 802.3af vs 802.3at selection, splitter wiring, inline UPS
- [ ] Solar design: panel sizing calculator, MPPT controller config, battery chemistry comparison (LiFePO4 vs Li-ion)
- [ ] Battery management: charge profiles, temperature compensation, fuel gauge integration
- [ ] Runtime calculations for different duty cycles and solar conditions
- [ ] Power state machine (SLEEP -> WAKE -> ALERT) with transition timing
- [ ] Wiring diagrams for both PoE and Solar configurations
- [ ] Cold-weather operation (battery heater, low-temp cutoff)
- [ ] Add to `sidebars-staging.ts` under Phase 3; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase3/`.

## References

- Phase 3 overview: `apps/docs/docs/technical/hardware/phase3/overview.md` (power autonomy, PoE/solar)
- Phase 3 sensor integration: `phase3-sensor-integration` (power management)
'@
New-Issue -Title "docs: add Phase 3 power systems spec (PoE + Solar)" -Body $body4
Write-Host "Created: Phase 3 power systems"

# 5: Phase 3 Enclosure Design
$body5 = @'
## Summary

Phase 3 overview describes enclosure requirements (IP65, cable glands, pole mount) but needs a dedicated spec with mechanical drawings, material selection, and environmental testing procedures.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase3/enclosure-design.md` with frontmatter `id: phase3-enclosure-design`, covering:
- [ ] Enclosure material comparison (FRP vs ASA vs ABS+UV)
- [ ] Dimensional drawing with internal component layout
- [ ] Cable gland placement and cable routing
- [ ] Ventilation design (IP65 breather vent + thermostat fan)
- [ ] Pole-mount bracket design (50-100mm clamp range)
- [ ] Quick-swap module bays (compute, comms, sensors)
- [ ] Thermal analysis (internal temp vs ambient in direct sun)
- [ ] IP65 test procedure and pass criteria
- [ ] Sensor dome optical requirements (transmittance, anti-fog)
- [ ] 3D print files for prototyping vs injection mold for production
- [ ] Add to `sidebars-staging.ts` under Phase 3; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase3/`.

## References

- Phase 3 overview: `apps/docs/docs/technical/hardware/phase3/overview.md` (enclosure, IP65)
- Phase 4 overview: custom PCB / injection-molded housing
'@
New-Issue -Title "docs: add Phase 3 enclosure and mounting design spec" -Body $body5
Write-Host "Created: Phase 3 enclosure design"

# 6: Phase 4 Manufacturing Process
$body6 = @'
## Summary

Phase 4 overview includes a high-level manufacturing process flow but needs a dedicated spec covering ICT fixture design, functional test procedures, quality gates, and supplier management.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase4/manufacturing-process.md` with frontmatter `id: phase4-manufacturing-process`, covering:
- [ ] SMT assembly line configuration (pick-and-place, reflow, AOI)
- [ ] ICT (In-Circuit Test) fixture design and test coverage
- [ ] Functional test procedure (boot test, sensor self-check, comms verify)
- [ ] Quality gates: incoming inspection -> SMT -> ICT -> functional -> system -> ship
- [ ] Defect tracking and root cause analysis process
- [ ] Supplier qualification and AVL (Approved Vendor List) management
- [ ] Conformal coating procedure and inspection
- [ ] Traceability: serial number scheme, component lot tracking
- [ ] Production metrics: yield, cycle time, throughput targets
- [ ] Rework procedures and acceptance criteria
- [ ] Add to `sidebars-staging.ts` under Phase 4; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase4/`.

## References

- Phase 4 overview: `apps/docs/docs/technical/hardware/phase4/overview.md` (DFM, manufacturing)
- Phase 4 custom PCB: `apps/docs/docs/technical/hardware/phase4/custom-pcb-design.md` (id: phase4-custom-pcb-design)
'@
New-Issue -Title "docs: add Phase 4 manufacturing process and quality control spec" -Body $body6
Write-Host "Created: Phase 4 manufacturing process"

# 7: Phase 4 Certification Plan
$body7 = @'
## Summary

Phase 4 overview lists required certifications (FCC, CE, CPSC, UL, MIL-STD) but needs a dedicated plan with timelines, test lab selection, pre-compliance strategy, and cost tracking.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase4/certification-plan.md` with frontmatter `id: phase4-certification-plan`, covering:
- [ ] Certification matrix: which certs needed for consumer (SkySnare) vs enterprise (AeroNet)
- [ ] FCC Part 15 pre-compliance test procedure and equipment
- [ ] CE RED directive requirements (EN 300 220, EN 301 489)
- [ ] MIL-STD-461G pre-compliance test plan (EMI/EMC)
- [ ] MIL-STD-810G environmental test selection and tailoring
- [ ] ITAR/EAR export control classification (ECCN determination)
- [ ] Test lab selection criteria and recommended labs
- [ ] Timeline: pre-compliance -> design fixes -> formal testing -> certification
- [ ] Cost tracking spreadsheet template
- [ ] Documentation requirements per certification body
- [ ] Add to `sidebars-staging.ts` under Phase 4; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase4/`.

## References

- Phase 4 overview: `apps/docs/docs/technical/hardware/phase4/overview.md` (certification-ready)
- Phase 5 overview: MIL-STD qualification
- Legal: `apps/docs/docs/legal/compliance-framework.md`
'@
New-Issue -Title "docs: add Phase 4 certification and compliance plan" -Body $body7
Write-Host "Created: Phase 4 certification plan"

# 8: Phase 4 OTA Firmware
$body8 = @'
## Summary

Phase 4 overview describes the OTA update strategy (dual-bank A/B, delta updates, Ed25519 signing) but needs a detailed spec covering the update pipeline, rollback logic, and LoRa-constrained delivery.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase4/ota-firmware.md` with frontmatter `id: phase4-ota-firmware`, covering:
- [ ] Update pipeline: build -> sign -> stage on hub -> push to nodes
- [ ] Dual-bank (A/B) partition layout on Jetson NVMe
- [ ] Rollback trigger conditions (3 failed boots, watchdog timeout)
- [ ] Delta update generation (mender.io or SWUpdate comparison)
- [ ] Ed25519 key management (signing key rotation, revocation)
- [ ] LoRa-constrained delivery: chunking, resume, integrity verification
- [ ] LTE delivery path for larger updates
- [ ] Update scheduling (maintenance windows, staggered rollout)
- [ ] Secure boot chain integration (signed U-Boot, dm-verity)
- [ ] Monitoring: update success/failure reporting to hub
- [ ] Add to `sidebars-staging.ts` under Phase 4; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase4/`.

## References

- Phase 4 overview: `apps/docs/docs/technical/hardware/phase4/overview.md` (OTA Update Strategy, dual-bank)
- Phase 5 overview: secure boot chain
'@
New-Issue -Title "docs: add Phase 4 OTA firmware update system spec" -Body $body8
Write-Host "Created: Phase 4 OTA firmware"

# 9: Phase 5 Coalition Interoperability
$body9 = @'
## Summary

Phase 5 overview mentions STANAG 4586, Link 16, and MADL but needs a dedicated spec covering message mapping, classification handling, and multi-national exercise procedures.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase5/coalition-interop.md` with frontmatter `id: phase5-coalition-interop`, covering:
- [ ] STANAG 4586 compliance level and message set
- [ ] Link 16 receive-only integration (J-series message mapping)
- [ ] MADL receive capability scope
- [ ] Track correlation: Phoenix tracks <-> coalition tracks (deduplication)
- [ ] Classification handling: UNCLASS <-> CUI <-> SECRET data boundaries
- [ ] Cross-domain solutions for multi-classification environments
- [ ] Exercise procedures: how to participate in multi-national C-UAS exercises
- [ ] Testing: coalition interop test plan with simulated Link 16 traffic
- [ ] Data sharing agreements and legal framework references
- [ ] Add to `sidebars-staging.ts` under Phase 5; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase5/`.

## References

- Phase 5 overview: `apps/docs/docs/technical/hardware/phase5/overview.md` (coalition-ready, comms, security)
- Investment phases / executive docs for coalition requirements
'@
New-Issue -Title "docs: add Phase 5 coalition interoperability spec" -Body $body9
Write-Host "Created: Phase 5 coalition interoperability"

# 10: Phase 5 Security Architecture
$body10 = @'
## Summary

Phase 5 overview covers HSM, FIPS 140-3, and secure boot at a high level but needs a dedicated security architecture document covering key management, incident response, and red team validation.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase5/security-architecture.md` with frontmatter `id: phase5-security-architecture`, covering:
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
- [ ] Add to `sidebars-staging.ts` under Phase 5; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase5/`.

## References

- Phase 5 overview: `apps/docs/docs/technical/hardware/phase5/overview.md` (Secure by design, HSM, FIPS)
- Phase 4 OTA / secure boot; `.claude/rules/security.md`
'@
New-Issue -Title "docs: add Phase 5 security architecture deep-dive" -Body $body10
Write-Host "Created: Phase 5 security architecture"

# 11: Phase 5 Operational Procedures
$body11 = @'
## Summary

Phase 5 overview includes deployment and readiness checklists but needs a full operational procedures document covering daily operations, maintenance schedules, emergency procedures, and training curriculum.

## Scope

## Scope

**First in docs-staging:** Create `apps/docs/docs-staging/technical/hardware/phase5/operational-procedures.md` with frontmatter `id: phase5-operational-procedures`, covering:
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
- [ ] Add to `sidebars-staging.ts` under Phase 5; when promoting, add to `sidebars.ts` and move to `apps/docs/docs/technical/hardware/phase5/`.

## References

- Phase 5 overview: `apps/docs/docs/technical/hardware/phase5/overview.md` (deployment, C-UAS site)
- Phase 5 RKV-M: `apps/docs/docs/technical/hardware/phase5/rkv-m-integration.md` (id: phase5-rkv-m-integration)
- Operations: `apps/docs/docs/operations/operations-manual.md`
'@
New-Issue -Title "docs: add Phase 5 C-UAS site operational procedures" -Body $body11
Write-Host "Created: Phase 5 operational procedures"

# 12: Hugging Face + MCP model training integration
$body12 = @'
## Summary

Integrate Hugging Face (Hub / Spaces) with the model training pipeline and expose training workflows via MCP (Model Context Protocol) so that datasets, training jobs, and model versions can be managed and triggered from MCP-enabled tools (e.g. Cursor, agents).

## Context

- Current training: Azure ML workspace and GPU compute in `infra/terraform/ml-training/`; detector training docs in `apps/detector/`.
- Hugging Face Hub provides datasets, model cards, and Spaces for demos and APIs; integration would allow reuse of public drone/object-detection datasets and consistent model versioning.
- MCP (Model Context Protocol) enables AI assistants and IDEs to call tools (e.g. "list datasets", "start training job", "push model to Hub"); adding MCP tools for Hugging Face + training would streamline experimentation and documentation.

## Scope

- [ ] **Hugging Face Hub integration:** Document or implement auth (HF token), dataset download/upload, and model push from Azure ML or local training (e.g. YOLO export to Hub).
- [ ] **Hugging Face Spaces (optional):** Evaluate Space for demo inference or training UI; document how to run or link from repo.
- [ ] **MCP server or tools:** Add MCP tools (or extend an existing MCP server) for: list/search Hub datasets, get dataset info, trigger training job (e.g. call Azure ML or local script), list/push models to Hub. Ensure compatibility with Cursor/agent workflows.
- [ ] **Docs:** Add a short doc (e.g. in `apps/docs/docs-staging/` or `apps/detector/docs/`) describing: HF token setup, MCP tool usage, and how to run a training pipeline that pushes to Hugging Face.
- [ ] **Security:** Use env-based or Key Vault for HF token; no secrets in repo or issue bodies.

## References

- Azure ML training: `infra/terraform/ml-training/README.md`, `apps/detector/docs/ADVANCED_SETUP.md`
- Detector training: `apps/detector/scripts/download_public_datasets.py`, detector classification docs
- MCP: Cursor MCP docs; existing MCP usage in project if any
'@
New-Issue -Title "feat: Hugging Face integration for model training with MCP" -Body $body12
Write-Host "Created: Hugging Face + MCP model training integration"

Write-Host ""
Write-Host "=== All 12 issues created successfully ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:"
Write-Host "  Phase 2: 2 issues (SkyWatch Standard v2, Trigger Node v2)"
Write-Host "  Phase 3: 3 issues (Communications, Power Systems, Enclosure Design)"
Write-Host "  Phase 4: 3 issues (Manufacturing, Certification, OTA Firmware)"
Write-Host "  Phase 5: 3 issues (Coalition Interop, Security Architecture, Operational Procedures)"
Write-Host "  Integration: 1 issue (Hugging Face + MCP model training)"
