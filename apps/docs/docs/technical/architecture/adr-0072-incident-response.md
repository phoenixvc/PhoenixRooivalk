---
id: adr-0072-incident-response
title: "ADR 0072: Incident Response Procedures"
sidebar_label: "ADR 0072: Incident Response"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - operations
  - incident
  - runbook
  - sre
prerequisites:
  - architecture-decision-records
  - adr-0054-audit-trail-requirements
---

# ADR 0072: Incident Response Procedures

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: System failures, security incidents, and operational issues
   require standardized response procedures to minimize impact and ensure
   consistent handling
2. **Decision**: Implement structured incident response framework with severity
   classification, escalation paths, and automated runbooks
3. **Trade-off**: Process overhead vs. response consistency and speed

---

## Context

### Incident Types

| Category    | Examples                                |
| ----------- | --------------------------------------- |
| System      | Service outage, performance degradation |
| Security    | Breach attempt, data exposure           |
| Operational | Engagement failure, sensor malfunction  |
| Data        | Corruption, sync failure, evidence loss |

### Requirements

| Requirement   | Specification                        |
| ------------- | ------------------------------------ |
| Detection     | <5 minutes for critical issues       |
| Response      | <15 minutes for SEV1                 |
| Communication | Stakeholder updates every 30 minutes |
| Resolution    | Documented RCA within 48 hours       |

---

## Decision

Implement **structured incident response** with automated detection and
runbooks:

### Incident Framework

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Incident Response Framework                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  DETECTION                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Alerts     │  │   User       │  │   External   │          ││
│  │  │   (Monitor)  │  │   Reports    │  │   Reports    │          ││
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          ││
│  └─────────┼─────────────────┼─────────────────┼───────────────────┘│
│            └─────────────────┼─────────────────┘                     │
│                              ▼                                       │
│  TRIAGE                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Classify   │──│   Assign     │──│   Escalate   │          ││
│  │  │   Severity   │  │   Owner      │  │   (if needed)│          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  RESPONSE                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │  Investigate │──│   Mitigate   │──│   Resolve    │          ││
│  │  │              │  │              │  │              │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  POST-INCIDENT                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   RCA        │──│   Remediation│──│   Follow-up  │          ││
│  │  │   Analysis   │  │   Actions    │  │   Review     │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Severity Classification

### Severity Levels

| Level | Name     | Criteria                                    | Response Time |
| ----- | -------- | ------------------------------------------- | ------------- |
| SEV1  | Critical | Complete outage, data loss, security breach | <15 min       |
| SEV2  | Major    | Significant degradation, partial outage     | <1 hour       |
| SEV3  | Minor    | Limited impact, workaround available        | <4 hours      |
| SEV4  | Low      | Minimal impact, cosmetic issues             | <24 hours     |

### Classification Matrix

```rust
pub fn classify_incident(incident: &IncidentReport) -> Severity {
    // Security incidents are always high severity
    if incident.category == IncidentCategory::Security {
        return match incident.impact {
            Impact::DataBreach | Impact::SystemCompromise => Severity::SEV1,
            Impact::AttemptedBreach => Severity::SEV2,
            _ => Severity::SEV3,
        };
    }

    // System incidents based on impact scope
    if incident.category == IncidentCategory::System {
        return match (incident.users_affected_percent, incident.has_workaround) {
            (p, _) if p > 50 => Severity::SEV1,
            (p, false) if p > 10 => Severity::SEV2,
            (p, true) if p > 10 => Severity::SEV3,
            _ => Severity::SEV4,
        };
    }

    // Operational incidents
    if incident.category == IncidentCategory::Operational {
        return match incident.impact {
            Impact::EngagementFailure => Severity::SEV1,
            Impact::SensorMalfunction => Severity::SEV2,
            _ => Severity::SEV3,
        };
    }

    Severity::SEV4
}
```

---

## Incident Lifecycle

### Incident Record

```rust
pub struct Incident {
    pub id: IncidentId,
    pub title: String,
    pub description: String,
    pub severity: Severity,
    pub category: IncidentCategory,
    pub status: IncidentStatus,

    // Timeline
    pub detected_at: DateTime<Utc>,
    pub acknowledged_at: Option<DateTime<Utc>>,
    pub mitigated_at: Option<DateTime<Utc>>,
    pub resolved_at: Option<DateTime<Utc>>,

    // Assignment
    pub owner: Option<UserId>,
    pub responders: Vec<UserId>,

    // Impact
    pub affected_systems: Vec<String>,
    pub affected_tenants: Vec<TenantId>,
    pub user_impact: String,

    // Communication
    pub status_updates: Vec<StatusUpdate>,
    pub stakeholders_notified: Vec<String>,

    // Resolution
    pub root_cause: Option<String>,
    pub resolution_summary: Option<String>,
    pub follow_up_actions: Vec<Action>,
}

pub enum IncidentStatus {
    Detected,
    Acknowledged,
    Investigating,
    Mitigating,
    Resolved,
    PostMortem,
    Closed,
}
```

---

## Escalation Paths

### Escalation Matrix

| Severity | Primary           | Escalate After | Secondary                     |
| -------- | ----------------- | -------------- | ----------------------------- |
| SEV1     | On-call engineer  | 15 min         | Engineering lead + Management |
| SEV2     | On-call engineer  | 1 hour         | Engineering lead              |
| SEV3     | Assigned engineer | 4 hours        | Team lead                     |
| SEV4     | Assigned engineer | 24 hours       | Team lead                     |

### Automated Escalation

```rust
pub struct EscalationPolicy {
    severity: Severity,
    escalation_rules: Vec<EscalationRule>,
}

pub struct EscalationRule {
    pub trigger_after: Duration,
    pub notify: Vec<NotificationTarget>,
    pub action: EscalationAction,
}

impl IncidentManager {
    pub async fn check_escalations(&self) {
        for incident in self.get_open_incidents().await {
            let policy = self.get_policy(&incident.severity);

            for rule in &policy.escalation_rules {
                let time_since_detected = Utc::now() - incident.detected_at;

                if time_since_detected > rule.trigger_after
                    && !incident.was_escalated(&rule)
                {
                    self.escalate(&incident, rule).await;
                }
            }
        }
    }

    async fn escalate(&self, incident: &Incident, rule: &EscalationRule) {
        // Send notifications
        for target in &rule.notify {
            self.notify(target, &incident).await;
        }

        // Record escalation
        self.record_escalation(&incident.id, rule).await;

        // Execute action
        match &rule.action {
            EscalationAction::PageOnCall => self.page_on_call().await,
            EscalationAction::CreateWarRoom => self.create_war_room(&incident).await,
            EscalationAction::NotifyManagement => self.notify_management(&incident).await,
        }
    }
}
```

---

## Runbooks

### Automated Runbook Example

```yaml
# runbooks/service-outage.yaml
name: Service Outage Response
trigger:
  alert: service_unavailable
  severity: [SEV1, SEV2]

steps:
  - name: Verify outage
    type: check
    action: health_check
    target: "{{ alert.service }}"
    timeout: 30s

  - name: Check recent deployments
    type: query
    action: get_recent_deployments
    params:
      service: "{{ alert.service }}"
      hours: 2

  - name: Rollback if recent deployment
    type: conditional
    condition: "{{ steps.check_recent_deployments.count > 0 }}"
    action: rollback_deployment
    params:
      deployment_id: "{{ steps.check_recent_deployments.latest.id }}"
    requires_approval: true
    approval_timeout: 5m

  - name: Scale up if load issue
    type: conditional
    condition: "{{ metrics.cpu_percent > 80 }}"
    action: scale_service
    params:
      service: "{{ alert.service }}"
      replicas: "{{ current_replicas * 2 }}"

  - name: Restart service
    type: action
    action: restart_service
    params:
      service: "{{ alert.service }}"
    fallback:
      - name: Notify on-call
        action: page_on_call
        params:
          message: "Automated recovery failed for {{ alert.service }}"

  - name: Verify recovery
    type: check
    action: health_check
    target: "{{ alert.service }}"
    timeout: 60s
    retry: 3
```

### Runbook Execution

```rust
pub struct RunbookExecutor {
    runbooks: HashMap<String, Runbook>,
    action_registry: ActionRegistry,
}

impl RunbookExecutor {
    pub async fn execute(
        &self,
        runbook_name: &str,
        context: RunbookContext,
    ) -> Result<RunbookResult, Error> {
        let runbook = self.runbooks.get(runbook_name)
            .ok_or(Error::RunbookNotFound)?;

        let mut execution = RunbookExecution::new(runbook, context);

        for step in &runbook.steps {
            // Check condition if present
            if let Some(condition) = &step.condition {
                if !self.evaluate_condition(condition, &execution.context)? {
                    execution.skip_step(&step.name);
                    continue;
                }
            }

            // Request approval if required
            if step.requires_approval {
                let approved = self.request_approval(&step, &execution).await?;
                if !approved {
                    execution.abort("Approval denied");
                    break;
                }
            }

            // Execute action
            let result = self.execute_step(&step, &mut execution).await;

            match result {
                Ok(output) => {
                    execution.record_success(&step.name, output);
                }
                Err(e) => {
                    execution.record_failure(&step.name, &e);

                    // Try fallback if defined
                    if let Some(fallback) = &step.fallback {
                        for fallback_step in fallback {
                            self.execute_step(fallback_step, &mut execution).await?;
                        }
                    } else {
                        break;
                    }
                }
            }
        }

        Ok(execution.result())
    }
}
```

---

## Communication Templates

### Status Update Template

```markdown
## Incident Update - {{ incident.id }}

**Status**: {{ incident.status }} **Severity**: {{ incident.severity }}
**Duration**: {{ duration_since(incident.detected_at) }}

### Current Situation

{{ current_situation }}

### Impact

- Affected systems: {{ incident.affected_systems | join(", ") }}
- User impact: {{ incident.user_impact }}

### Actions Taken

{{ actions_taken }}

### Next Steps

{{ next_steps }}

### Next Update

Expected in {{ next_update_minutes }} minutes or when status changes.

---

_Incident Commander: {{ incident.owner }}_
```

---

## Post-Incident

### Root Cause Analysis Template

```rust
pub struct RootCauseAnalysis {
    pub incident_id: IncidentId,
    pub summary: String,
    pub timeline: Vec<TimelineEvent>,
    pub root_causes: Vec<RootCause>,
    pub contributing_factors: Vec<String>,
    pub impact_assessment: ImpactAssessment,
    pub action_items: Vec<ActionItem>,
    pub lessons_learned: Vec<String>,
}

pub struct ActionItem {
    pub description: String,
    pub owner: UserId,
    pub due_date: NaiveDate,
    pub priority: Priority,
    pub status: ActionStatus,
}
```

---

## Consequences

### Positive

- **Consistency**: Standard response regardless of who's on-call
- **Speed**: Automated runbooks reduce MTTR
- **Learning**: RCA process prevents recurrence
- **Communication**: Stakeholders stay informed

### Negative

- **Process overhead**: Documentation and procedures take time
- **Rigidity**: May slow response in novel situations
- **Maintenance**: Runbooks need updates as system evolves

---

## Related ADRs

- [ADR 0054: Audit Trail Requirements](./adr-0054-audit-trail-requirements)
- [ADR 0073: Disaster Recovery](./adr-0073-disaster-recovery)
- [ADR 0029: Secrets Management](./adr-0029-secrets-management)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
