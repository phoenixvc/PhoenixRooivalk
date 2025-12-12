---
id: adr-0073-disaster-recovery
title: "ADR 0073: Disaster Recovery Strategy"
sidebar_label: "ADR 0073: Disaster Recovery"
difficulty: expert
estimated_reading_time: 12
points: 50
tags:
  - technical
  - architecture
  - operations
  - disaster-recovery
  - backup
  - resilience
prerequisites:
  - architecture-decision-records
  - adr-0072-incident-response
  - adr-0052-data-retention-policies
---

# ADR 0073: Disaster Recovery Strategy

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: System must recover from catastrophic failures (region outage, data corruption, ransomware) with minimal data loss and downtime
2. **Decision**: Implement tiered DR strategy with geo-redundant backups, automated failover for critical systems, and tested recovery procedures
3. **Trade-off**: DR infrastructure cost vs. recovery time and data loss tolerance

---

## Context

### Disaster Scenarios

| Scenario | Likelihood | Impact |
|----------|------------|--------|
| Region outage | Low | Critical |
| Database corruption | Medium | High |
| Ransomware attack | Medium | Critical |
| Accidental deletion | High | Medium |
| Hardware failure (edge) | High | Medium |

### Recovery Objectives

| System | RPO (Data Loss) | RTO (Downtime) |
|--------|-----------------|----------------|
| Evidence store | 0 (no loss) | <1 hour |
| Operational data | <15 minutes | <30 minutes |
| Configuration | <1 hour | <15 minutes |
| Documentation | <24 hours | <4 hours |

---

## Decision

Implement **tiered disaster recovery** strategy:

### DR Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Disaster Recovery Architecture                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PRIMARY REGION (East US 2)                                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Cosmos DB  │  │   Blob       │  │   Functions  │          ││
│  │  │   (Primary)  │  │   Storage    │  │   (Active)   │          ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────────────┘          ││
│  └─────────┼─────────────────┼─────────────────────────────────────┘│
│            │                 │                                       │
│            │ Continuous      │ GRS                                  │
│            │ Replication     │ Replication                          │
│            ▼                 ▼                                       │
│  DR REGION (West US 2)                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Cosmos DB  │  │   Blob       │  │   Functions  │          ││
│  │  │   (Replica)  │  │   Storage    │  │   (Standby)  │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  COLD BACKUP (Separate Subscription)                                │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐                             ││
│  │  │   Archive    │  │   Config     │                             ││
│  │  │   Storage    │  │   Backup     │                             ││
│  │  │   (Glacier)  │  │              │                             ││
│  │  └──────────────┘  └──────────────┘                             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Backup Strategy

### Backup Types

| Data Type | Backup Method | Frequency | Retention |
|-----------|---------------|-----------|-----------|
| Evidence | Continuous replication + daily snapshot | Real-time | 7 years |
| Operational | Continuous replication | Real-time | 90 days |
| Config | Git + daily export | Daily | 1 year |
| Audit logs | Continuous + weekly archive | Real-time | 5 years |

### Cosmos DB Backup

```bicep
resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: '${baseName}-cosmos-${locationShort}'
  location: location
  properties: {
    // Multi-region writes for HA
    locations: [
      {
        locationName: 'East US 2'
        failoverPriority: 0
      }
      {
        locationName: 'West US 2'
        failoverPriority: 1
      }
    ]

    // Continuous backup for point-in-time restore
    backupPolicy: {
      type: 'Continuous'
      continuousModeProperties: {
        tier: 'Continuous7Days'
      }
    }

    // Automatic failover
    enableAutomaticFailover: true
  }
}
```

### Blob Storage Backup

```bicep
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: '${org}${envStandard}${project}st${locationShort}'
  location: location
  sku: {
    // Geo-redundant storage with read access
    name: 'Standard_RAGRS'
  }
  properties: {
    // Enable soft delete for accidental deletion recovery
    deleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    containerDeleteRetentionPolicy: {
      enabled: true
      days: 30
    }
    // Enable versioning for corruption recovery
    isVersioningEnabled: true

    // Point-in-time restore
    restorePolicy: {
      enabled: true
      days: 7
    }
  }
}
```

---

## Failover Procedures

### Automatic Failover

```rust
pub struct FailoverManager {
    health_checker: HealthChecker,
    dns_manager: DnsManager,
    notification_service: NotificationService,
}

impl FailoverManager {
    pub async fn monitor_and_failover(&self) {
        loop {
            let primary_health = self.health_checker.check_region("eastus2").await;

            if !primary_health.is_healthy() {
                // Confirm sustained outage
                tokio::time::sleep(Duration::from_secs(60)).await;
                let recheck = self.health_checker.check_region("eastus2").await;

                if !recheck.is_healthy() {
                    self.initiate_failover().await;
                }
            }

            tokio::time::sleep(Duration::from_secs(30)).await;
        }
    }

    async fn initiate_failover(&self) {
        // 1. Notify team
        self.notification_service.send_critical(
            "Initiating automatic failover to DR region"
        ).await;

        // 2. Update DNS to point to DR region
        self.dns_manager.update_cname(
            "api.rooivalk.dev",
            "api-westus2.rooivalk.dev"
        ).await;

        // 3. Activate DR functions
        self.activate_dr_functions().await;

        // 4. Verify DR region is serving traffic
        let dr_health = self.health_checker.check_region("westus2").await;

        if dr_health.is_healthy() {
            self.notification_service.send_info(
                "Failover complete. DR region active."
            ).await;
        } else {
            self.notification_service.send_critical(
                "Failover failed! Manual intervention required."
            ).await;
        }
    }
}
```

### Manual Failover Runbook

```yaml
# runbooks/manual-failover.yaml
name: Manual Region Failover
description: Failover from primary to DR region

prerequisites:
  - Confirm primary region is unavailable
  - Verify DR region is healthy
  - Notify stakeholders of planned failover

steps:
  - name: Stop writes to primary
    action: manual
    instructions: |
      1. Disable API endpoints in primary region
      2. Confirm no new writes are occurring

  - name: Verify data replication
    action: script
    script: |
      # Check Cosmos DB replication lag
      az cosmosdb show --name $COSMOS_DB --query "readLocations[1].failoverPriority"

  - name: Failover Cosmos DB
    action: command
    command: |
      az cosmosdb failover-priority-change \
        --name {{ cosmos_db_name }} \
        --resource-group {{ resource_group }} \
        --failover-policies "West US 2=0" "East US 2=1"

  - name: Update DNS
    action: command
    command: |
      az network dns record-set cname set-record \
        --zone-name rooivalk.dev \
        --resource-group dns-rg \
        --record-set-name api \
        --cname api-westus2.azurewebsites.net

  - name: Activate DR functions
    action: command
    command: |
      az functionapp start --name {{ dr_function_app }}

  - name: Verify services
    action: script
    script: |
      curl -f https://api.rooivalk.dev/health || exit 1

  - name: Notify stakeholders
    action: notification
    message: "Failover to DR region complete"

rollback:
  - name: Failback to primary
    instructions: |
      Execute manual-failback.yaml when primary region is restored
```

---

## Recovery Procedures

### Point-in-Time Recovery (Data Corruption)

```rust
pub async fn recover_to_point_in_time(
    cosmos: &CosmosClient,
    timestamp: DateTime<Utc>,
) -> Result<RecoveryResult, RecoveryError> {
    // 1. Create recovery account
    let recovery_account = cosmos.create_recovery_account(
        "phoenix-recovery",
        timestamp,
    ).await?;

    // 2. Restore containers
    for container in ["tracks", "evidence", "config"] {
        cosmos.restore_container(
            &recovery_account,
            container,
            timestamp,
        ).await?;
    }

    // 3. Validate data integrity
    let validation = validate_recovered_data(&recovery_account).await?;

    if !validation.is_valid {
        return Err(RecoveryError::ValidationFailed(validation.errors));
    }

    // 4. Swap to recovered account
    swap_cosmos_connection(&recovery_account).await?;

    Ok(RecoveryResult {
        recovered_to: timestamp,
        records_recovered: validation.record_count,
    })
}
```

### Ransomware Recovery

```yaml
# runbooks/ransomware-recovery.yaml
name: Ransomware Recovery
description: Recover from ransomware attack

immediate_actions:
  - Isolate affected systems
  - Preserve evidence for forensics
  - Notify security team and management

recovery_steps:
  - name: Identify clean backup
    action: manual
    instructions: |
      1. Check backup integrity from multiple points in time
      2. Identify last known good backup before infection
      3. Verify backup is not compromised

  - name: Provision clean infrastructure
    action: script
    script: |
      # Deploy to new subscription to ensure clean environment
      az deployment sub create \
        --location eastus2 \
        --template-file infra/azure/main.bicep \
        --parameters environment=recovery

  - name: Restore from backup
    action: script
    script: |
      # Restore Cosmos DB from continuous backup
      az cosmosdb sql database restore \
        --account-name {{ recovery_account }} \
        --database-name phoenix \
        --restore-timestamp {{ clean_backup_timestamp }}

  - name: Restore blob storage
    action: script
    script: |
      # Use versioning to restore pre-infection versions
      azcopy copy \
        "https://{{ backup_storage }}.blob.core.windows.net/evidence/*?{{ sas_token }}" \
        "https://{{ recovery_storage }}.blob.core.windows.net/evidence/"

  - name: Reset all credentials
    action: manual
    instructions: |
      1. Rotate all API keys
      2. Rotate all service principal secrets
      3. Reset all user passwords
      4. Revoke all active sessions
```

---

## Testing

### DR Test Schedule

| Test Type | Frequency | Duration | Scope |
|-----------|-----------|----------|-------|
| Backup validation | Weekly | Automated | Data integrity |
| Failover drill | Quarterly | 4 hours | Full failover |
| Tabletop exercise | Annually | 1 day | All scenarios |

### Automated DR Test

```rust
#[tokio::test]
async fn test_dr_failover() {
    let dr_tester = DrTester::new();

    // 1. Verify DR region is ready
    let dr_health = dr_tester.check_dr_region().await;
    assert!(dr_health.is_healthy(), "DR region not healthy");

    // 2. Simulate primary failure
    dr_tester.simulate_primary_failure().await;

    // 3. Execute failover
    let failover_result = dr_tester.execute_failover().await;
    assert!(failover_result.is_ok(), "Failover failed");

    // 4. Verify DR is serving traffic
    let response = dr_tester.test_api_endpoint().await;
    assert_eq!(response.status(), 200);

    // 5. Verify data integrity
    let data_check = dr_tester.verify_data_integrity().await;
    assert!(data_check.is_valid, "Data integrity check failed");

    // 6. Failback
    dr_tester.restore_primary().await;
    dr_tester.execute_failback().await;
}
```

---

## Cost Analysis

### DR Infrastructure Cost

| Component | Primary | DR | Monthly Cost |
|-----------|---------|-----|--------------|
| Cosmos DB | Multi-region write | Read replica | +50% |
| Blob Storage | RA-GRS | Included | +100% |
| Functions | Active | Standby (consumption) | ~$0 |
| Total | - | - | ~$200/month |

### Cost vs. Risk Analysis

| RPO/RTO | Architecture | Monthly Cost | Suitable For |
|---------|--------------|--------------|--------------|
| 24h / 24h | Daily backup, manual restore | $50 | Dev/test |
| 1h / 4h | GRS storage, periodic snapshot | $100 | Non-critical |
| 15m / 30m | Multi-region, auto-failover | $200 | Production |
| 0 / 5m | Active-active multi-region | $500+ | Mission-critical |

---

## Consequences

### Positive

- **Resilience**: Survive region-level failures
- **Data safety**: Multiple backup layers
- **Confidence**: Tested recovery procedures
- **Compliance**: Meet regulatory requirements

### Negative

- **Cost**: DR infrastructure adds ~$200/month
- **Complexity**: Multi-region management
- **Testing overhead**: Regular DR drills required

---

## Related ADRs

- [ADR 0072: Incident Response](./adr-0072-incident-response)
- [ADR 0052: Data Retention Policies](./adr-0052-data-retention-policies)
- [ADR 0040: Edge-Cloud Communication](./adr-0040-edge-cloud-communication)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
