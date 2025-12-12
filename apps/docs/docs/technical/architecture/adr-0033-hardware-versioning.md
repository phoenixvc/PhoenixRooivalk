---
id: adr-0033-hardware-versioning
title: "ADR 0033: Hardware Versioning Strategy"
sidebar_label: "ADR 0033: Hardware Versioning"
difficulty: intermediate
estimated_reading_time: 8
points: 35
tags:
  - technical
  - architecture
  - hardware
  - versioning
  - firmware
  - compatibility
prerequisites:
  - architecture-decision-records
  - adr-0030-net-launcher-architecture
---

# ADR 0033: Hardware Versioning Strategy

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Hardware iterations, firmware updates, and component changes must be tracked with clear compatibility matrices to prevent field failures
2. **Decision**: Implement semantic versioning for hardware with firmware compatibility matrices, OTA update capability, and rollback support
3. **Trade-off**: Version management overhead vs. deployment reliability

---

## Context

### Hardware Components

| Component | Update Frequency | Criticality |
|-----------|------------------|-------------|
| Flight controller firmware | Monthly | Critical |
| Sensor firmware | Quarterly | High |
| Effector controller | As needed | Critical |
| Edge compute OS | Monthly | High |
| AI models | Weekly | Medium |

### Challenges

- Hardware revisions may not be backward compatible
- Firmware updates can brick devices in field
- Mixed fleet of hardware versions
- Model updates may require firmware changes

---

## Decision

Implement **semantic versioning with compatibility matrices**:

### Version Format

```
Hardware: HW-[Component]-[Major].[Minor].[Patch]
Firmware: FW-[Component]-[Major].[Minor].[Patch]-[Build]
Software: SW-[App]-[Major].[Minor].[Patch]

Examples:
HW-RKV-2.1.0          # Rooivalk hardware revision 2.1.0
FW-FC-3.2.1-b1234     # Flight controller firmware 3.2.1 build 1234
FW-NL-1.0.0-b0042     # Net launcher firmware 1.0.0 build 42
SW-EDGE-4.1.0         # Edge software version 4.1.0
```

### Compatibility Matrix

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Compatibility Matrix                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Hardware     Firmware        Software         AI Model             │
│  ─────────────────────────────────────────────────────────          │
│  HW-RKV-2.x   FW-FC-3.x       SW-EDGE-4.x      MODEL-v2.x          │
│  HW-RKV-2.x   FW-FC-2.x       SW-EDGE-3.x      MODEL-v1.x          │
│  HW-RKV-1.x   FW-FC-2.x       SW-EDGE-3.x      MODEL-v1.x          │
│  HW-RKV-1.x   FW-FC-1.x       SW-EDGE-2.x      MODEL-v1.x          │
│                                                                      │
│  Legend:                                                            │
│  Major.x = Any minor/patch within major version                     │
│  Specific versions listed where breaking changes exist              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Version Metadata

### Hardware Manifest

```rust
#[derive(Serialize, Deserialize)]
pub struct HardwareManifest {
    /// Unique hardware serial number
    pub serial: String,
    /// Hardware version
    pub hw_version: Version,
    /// Manufacturing date
    pub mfg_date: NaiveDate,
    /// Component inventory
    pub components: Vec<ComponentInfo>,
    /// Current firmware versions
    pub firmware: HashMap<Component, FirmwareVersion>,
    /// Compatibility constraints
    pub constraints: CompatibilityConstraints,
}

#[derive(Serialize, Deserialize)]
pub struct ComponentInfo {
    pub component: Component,
    pub part_number: String,
    pub revision: String,
    pub serial: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CompatibilityConstraints {
    /// Minimum firmware versions
    pub min_firmware: HashMap<Component, Version>,
    /// Maximum firmware versions (if limited)
    pub max_firmware: HashMap<Component, Option<Version>>,
    /// Required software version range
    pub software_range: VersionRange,
    /// Compatible model versions
    pub model_versions: Vec<VersionRange>,
}
```

### Firmware Metadata

```rust
#[derive(Serialize, Deserialize)]
pub struct FirmwareMetadata {
    pub version: FirmwareVersion,
    pub component: Component,
    pub build_date: DateTime<Utc>,
    pub git_sha: String,

    /// Compatibility
    pub requires_hw: VersionRange,
    pub requires_sw: VersionRange,
    pub breaks_compat_with: Vec<Version>,

    /// Update info
    pub size_bytes: u64,
    pub checksum: [u8; 32],
    pub signature: [u8; 64],

    /// Changelog
    pub changelog: String,
    pub breaking_changes: Vec<String>,
}
```

---

## OTA Update System

### Update Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       OTA Update Flow                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. ┌──────────────┐                                                │
│     │ Check for    │  Edge queries cloud for updates                │
│     │ Updates      │                                                │
│     └──────┬───────┘                                                │
│            ▼                                                         │
│  2. ┌──────────────┐                                                │
│     │ Compatibility│  Verify against hardware manifest              │
│     │ Check        │                                                │
│     └──────┬───────┘                                                │
│            ▼                                                         │
│  3. ┌──────────────┐                                                │
│     │ Download &   │  Download update, verify signature             │
│     │ Verify       │                                                │
│     └──────┬───────┘                                                │
│            ▼                                                         │
│  4. ┌──────────────┐                                                │
│     │ Backup       │  Backup current firmware (A/B slots)           │
│     │ Current      │                                                │
│     └──────┬───────┘                                                │
│            ▼                                                         │
│  5. ┌──────────────┐                                                │
│     │ Apply        │  Install to inactive slot                       │
│     │ Update       │                                                │
│     └──────┬───────┘                                                │
│            ▼                                                         │
│  6. ┌──────────────┐                                                │
│     │ Verify &     │  Boot new version, run self-test               │
│     │ Test         │                                                │
│     └──────┬───────┘                                                │
│            ▼                                                         │
│  7. ┌──────────────┐                                                │
│     │ Commit or    │  Mark successful or rollback                   │
│     │ Rollback     │                                                │
│     └──────────────┘                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### A/B Slot Management

```rust
pub struct SlotManager {
    slot_a: FirmwareSlot,
    slot_b: FirmwareSlot,
    active: SlotId,
    pending_commit: bool,
}

impl SlotManager {
    pub async fn apply_update(&mut self, update: &FirmwarePackage) -> Result<(), UpdateError> {
        // Get inactive slot
        let target_slot = self.inactive_slot();

        // Write update to inactive slot
        target_slot.write(update).await?;

        // Verify checksum
        if target_slot.checksum() != update.metadata.checksum {
            return Err(UpdateError::ChecksumMismatch);
        }

        // Set pending boot
        self.set_next_boot(target_slot.id);
        self.pending_commit = true;

        Ok(())
    }

    pub async fn commit_or_rollback(&mut self) -> Result<UpdateResult, UpdateError> {
        if !self.pending_commit {
            return Ok(UpdateResult::NoUpdate);
        }

        // Run self-test
        if self.self_test().await.is_ok() {
            // Commit: mark new slot as default
            self.commit_current();
            Ok(UpdateResult::Success)
        } else {
            // Rollback: revert to previous slot
            self.rollback();
            Err(UpdateError::SelfTestFailed)
        }
    }
}
```

---

## Version Compatibility Checks

### Pre-Update Validation

```rust
pub struct CompatibilityChecker {
    hardware_manifest: HardwareManifest,
}

impl CompatibilityChecker {
    pub fn check_firmware_update(
        &self,
        update: &FirmwareMetadata,
    ) -> Result<(), CompatibilityError> {
        // Check hardware compatibility
        if !update.requires_hw.contains(&self.hardware_manifest.hw_version) {
            return Err(CompatibilityError::HardwareIncompatible {
                required: update.requires_hw.clone(),
                actual: self.hardware_manifest.hw_version.clone(),
            });
        }

        // Check current software compatibility
        let current_sw = self.get_current_sw_version();
        if !update.requires_sw.contains(&current_sw) {
            return Err(CompatibilityError::SoftwareIncompatible {
                required: update.requires_sw.clone(),
                actual: current_sw,
            });
        }

        // Check for breaking changes
        let current_fw = self.hardware_manifest.firmware.get(&update.component);
        if let Some(current) = current_fw {
            if update.breaks_compat_with.contains(current) {
                return Err(CompatibilityError::BreakingChange {
                    from: current.clone(),
                    to: update.version.clone(),
                });
            }
        }

        Ok(())
    }
}
```

---

## Fleet Management

### Version Distribution

```rust
pub struct FleetVersionManager {
    devices: HashMap<DeviceId, DeviceState>,
}

pub struct DeviceState {
    pub device_id: DeviceId,
    pub hardware_version: Version,
    pub firmware_versions: HashMap<Component, FirmwareVersion>,
    pub software_version: Version,
    pub last_update: DateTime<Utc>,
    pub update_status: UpdateStatus,
}

impl FleetVersionManager {
    /// Get fleet version distribution
    pub fn version_distribution(&self) -> VersionReport {
        let mut hw_dist: HashMap<Version, u32> = HashMap::new();
        let mut fw_dist: HashMap<(Component, FirmwareVersion), u32> = HashMap::new();

        for device in self.devices.values() {
            *hw_dist.entry(device.hardware_version.clone()).or_default() += 1;

            for (comp, ver) in &device.firmware_versions {
                *fw_dist.entry((comp.clone(), ver.clone())).or_default() += 1;
            }
        }

        VersionReport { hw_dist, fw_dist }
    }

    /// Plan phased rollout
    pub fn plan_rollout(
        &self,
        update: &FirmwareMetadata,
        phases: u32,
    ) -> Vec<RolloutPhase> {
        let compatible: Vec<_> = self.devices.values()
            .filter(|d| self.is_compatible(d, update))
            .collect();

        let per_phase = (compatible.len() as f32 / phases as f32).ceil() as usize;

        compatible.chunks(per_phase)
            .enumerate()
            .map(|(i, devices)| RolloutPhase {
                phase: i as u32 + 1,
                devices: devices.iter().map(|d| d.device_id.clone()).collect(),
                target_version: update.version.clone(),
            })
            .collect()
    }
}
```

---

## Consequences

### Positive

- **Reliability**: Compatibility checks prevent field failures
- **Rollback**: A/B slots enable quick recovery
- **Visibility**: Fleet version tracking
- **Safety**: Breaking changes detected before deployment

### Negative

- **Storage**: Dual firmware slots require more flash
- **Complexity**: Version matrix management
- **Delays**: Compatibility checks add deployment time

---

## Related ADRs

- [ADR 0030: Net Launcher Architecture](./adr-0030-net-launcher-architecture)
- [ADR 0035: CI/CD Pipeline Strategy](./adr-0035-cicd-pipeline-strategy)
- [ADR 0061: Hardware-in-Loop Testing](./adr-0061-hardware-in-loop-testing)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
