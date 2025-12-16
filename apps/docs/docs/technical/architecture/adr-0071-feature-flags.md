---
id: adr-0071-feature-flags
title: "ADR 0071: Feature Flags Architecture"
sidebar_label: "ADR 0071: Feature Flags"
difficulty: intermediate
estimated_reading_time: 8
points: 35
tags:
  - technical
  - architecture
  - feature-flags
  - deployment
  - configuration
prerequisites:
  - architecture-decision-records
  - adr-0070-multi-tenancy
---

# ADR 0071: Feature Flags Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Need to safely roll out features, enable A/B testing, and
   provide tenant-specific functionality without separate deployments
2. **Decision**: Implement feature flag system with Azure App Configuration,
   supporting percentage rollouts, tenant targeting, and kill switches
3. **Trade-off**: Runtime complexity vs. deployment flexibility

---

## Context

### Use Cases

| Use Case        | Description                                  |
| --------------- | -------------------------------------------- |
| Gradual rollout | Enable feature for 10% → 50% → 100% of users |
| Tenant features | Premium features for Enterprise tier only    |
| Kill switch     | Instantly disable problematic feature        |
| A/B testing     | Compare feature variants                     |
| Beta testing    | Enable for specific users                    |

### Requirements

| Requirement      | Specification                          |
| ---------------- | -------------------------------------- |
| Evaluation speed | <10ms local, <100ms remote             |
| Update latency   | Changes reflect within 30 seconds      |
| Targeting        | User, tenant, percentage, custom rules |
| Audit            | Who changed what, when                 |
| SDK support      | Rust, TypeScript, .NET                 |

---

## Decision

Implement feature flags using **Azure App Configuration** with local caching:

### Feature Flag Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Feature Flag Architecture                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CONFIGURATION SOURCE                                               │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │               Azure App Configuration                            ││
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Feature    │  │   Targeting  │  │   Labels     │          ││
│  │  │   Definitions│  │   Rules      │  │   (env)      │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼ (30s refresh)                        │
│  LOCAL CACHE                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐                             ││
│  │  │    Cached    │  │  Evaluation  │                             ││
│  │  │    Flags     │  │   Engine     │                             ││
│  │  └──────────────┘  └──────────────┘                             ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  APPLICATION                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  if (features.is_enabled("new_targeting_algo", &context)) {     ││
│  │      // Use new algorithm                                        ││
│  │  }                                                               ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Flag Definition

### Flag Schema

```rust
pub struct FeatureFlag {
    pub id: String,
    pub name: String,
    pub description: String,
    pub enabled: bool,

    // Targeting rules (evaluated in order)
    pub targeting: Vec<TargetingRule>,

    // Default value when no rules match
    pub default_value: FlagValue,

    // Metadata
    pub owner: String,
    pub created_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

pub struct TargetingRule {
    pub name: String,
    pub conditions: Vec<Condition>,
    pub value: FlagValue,
    pub allocation: Option<Allocation>,
}

pub enum Condition {
    /// Match specific user IDs
    UserIds(Vec<String>),
    /// Match tenant tier
    TenantTier(Vec<TenantTier>),
    /// Match tenant IDs
    TenantIds(Vec<TenantId>),
    /// Custom attribute match
    Attribute { key: String, operator: Operator, value: String },
    /// Time-based
    TimeRange { start: DateTime<Utc>, end: DateTime<Utc> },
}

pub enum Operator {
    Equals,
    NotEquals,
    Contains,
    StartsWith,
    GreaterThan,
    LessThan,
    In,
}

pub struct Allocation {
    /// Percentage of matching users (0-100)
    pub percentage: u8,
    /// Seed for consistent hashing
    pub seed: String,
}

pub enum FlagValue {
    Boolean(bool),
    String(String),
    Number(f64),
    Json(serde_json::Value),
}
```

### Example Flags

```json
{
  "feature_flags": [
    {
      "id": "new_targeting_algo",
      "name": "New Targeting Algorithm",
      "description": "Use ML-based lead calculation",
      "enabled": true,
      "targeting": [
        {
          "name": "Beta testers",
          "conditions": [
            { "type": "UserIds", "values": ["user-001", "user-002"] }
          ],
          "value": true
        },
        {
          "name": "Enterprise tenants",
          "conditions": [{ "type": "TenantTier", "values": ["Enterprise"] }],
          "value": true,
          "allocation": { "percentage": 50, "seed": "targeting-v2" }
        }
      ],
      "default_value": false
    },
    {
      "id": "max_tracks_display",
      "name": "Maximum Tracks to Display",
      "description": "Limit track count in UI",
      "enabled": true,
      "targeting": [
        {
          "name": "Enterprise",
          "conditions": [{ "type": "TenantTier", "values": ["Enterprise"] }],
          "value": 1000
        }
      ],
      "default_value": 100
    }
  ]
}
```

---

## SDK Implementation

### Rust SDK

```rust
pub struct FeatureManager {
    config: AppConfigurationClient,
    cache: RwLock<HashMap<String, FeatureFlag>>,
    refresh_interval: Duration,
}

impl FeatureManager {
    pub fn new(connection_string: &str) -> Self {
        let manager = Self {
            config: AppConfigurationClient::new(connection_string),
            cache: RwLock::new(HashMap::new()),
            refresh_interval: Duration::from_secs(30),
        };

        // Start background refresh
        manager.start_refresh_loop();
        manager
    }

    /// Check if feature is enabled for context
    pub fn is_enabled(&self, flag_id: &str, context: &EvaluationContext) -> bool {
        match self.evaluate(flag_id, context) {
            FlagValue::Boolean(b) => b,
            _ => false,
        }
    }

    /// Get feature value for context
    pub fn get_value<T: FromFlagValue>(
        &self,
        flag_id: &str,
        context: &EvaluationContext,
    ) -> Option<T> {
        let value = self.evaluate(flag_id, context);
        T::from_flag_value(value)
    }

    fn evaluate(&self, flag_id: &str, context: &EvaluationContext) -> FlagValue {
        let cache = self.cache.read().unwrap();
        let flag = match cache.get(flag_id) {
            Some(f) => f,
            None => return FlagValue::Boolean(false),
        };

        if !flag.enabled {
            return flag.default_value.clone();
        }

        // Evaluate targeting rules
        for rule in &flag.targeting {
            if self.evaluate_conditions(&rule.conditions, context) {
                // Check allocation if present
                if let Some(alloc) = &rule.allocation {
                    if !self.is_in_allocation(context, alloc) {
                        continue;
                    }
                }
                return rule.value.clone();
            }
        }

        flag.default_value.clone()
    }

    fn is_in_allocation(&self, context: &EvaluationContext, alloc: &Allocation) -> bool {
        // Consistent hashing based on user/tenant ID
        let hash_input = format!("{}:{}", alloc.seed, context.user_id);
        let hash = md5::compute(hash_input.as_bytes());
        let bucket = (hash[0] as u32 * 256 + hash[1] as u32) % 100;

        bucket < alloc.percentage as u32
    }
}

pub struct EvaluationContext {
    pub user_id: String,
    pub tenant_id: TenantId,
    pub tenant_tier: TenantTier,
    pub attributes: HashMap<String, String>,
}
```

### TypeScript SDK

```typescript
import { FeatureManager, EvaluationContext } from "@phoenix/features";

const features = new FeatureManager({
  connectionString: process.env.APP_CONFIG_CONNECTION_STRING,
  cacheExpiration: 30_000, // 30 seconds
});

// Boolean check
if (features.isEnabled("new_targeting_algo", context)) {
  useNewAlgorithm();
} else {
  useLegacyAlgorithm();
}

// Value retrieval
const maxTracks = features.getValue<number>("max_tracks_display", context, 100);

// React hook
function useFeature(flagId: string): boolean {
  const context = useContext(FeatureContext);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const check = () => setEnabled(features.isEnabled(flagId, context));
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [flagId, context]);

  return enabled;
}
```

---

## Operations

### Kill Switch

```rust
impl FeatureManager {
    /// Instantly disable a feature (bypasses cache)
    pub async fn kill_switch(&self, flag_id: &str) -> Result<(), Error> {
        // Update in App Configuration
        self.config.set_feature_enabled(flag_id, false).await?;

        // Force cache refresh
        self.refresh_cache().await?;

        // Log for audit
        log::warn!("Kill switch activated for feature: {}", flag_id);

        Ok(())
    }
}
```

### Audit Logging

```rust
pub struct FeatureAuditLog {
    pub timestamp: DateTime<Utc>,
    pub flag_id: String,
    pub action: AuditAction,
    pub actor: String,
    pub old_value: Option<FlagValue>,
    pub new_value: Option<FlagValue>,
}

pub enum AuditAction {
    Created,
    Updated,
    Deleted,
    Enabled,
    Disabled,
    KillSwitchActivated,
}
```

---

## Azure Configuration

### Bicep Setup

```bicep
resource appConfig 'Microsoft.AppConfiguration/configurationStores@2023-03-01' = {
  name: '${baseName}-appconfig-${locationShort}'
  location: location
  sku: {
    name: 'standard'
  }
  properties: {
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
  }
}

// Feature flag example
resource featureFlag 'Microsoft.AppConfiguration/configurationStores/keyValues@2023-03-01' = {
  parent: appConfig
  name: '.appconfig.featureflag~2Fnew_targeting_algo'
  properties: {
    value: '''
    {
      "id": "new_targeting_algo",
      "description": "Use ML-based lead calculation",
      "enabled": true,
      "conditions": {
        "client_filters": [
          {
            "name": "Microsoft.Targeting",
            "parameters": {
              "Audience": {
                "Users": ["user-001", "user-002"],
                "Groups": [
                  { "Name": "Enterprise", "RolloutPercentage": 50 }
                ],
                "DefaultRolloutPercentage": 0
              }
            }
          }
        ]
      }
    }
    '''
    contentType: 'application/vnd.microsoft.appconfig.ff+json;charset=utf-8'
  }
}
```

---

## Consequences

### Positive

- **Safe rollouts**: Gradual feature introduction
- **Quick rollback**: Kill switch for incidents
- **Tenant customization**: Feature differentiation by tier
- **A/B testing**: Data-driven decisions

### Negative

- **Technical debt**: Flags must be cleaned up
- **Complexity**: Conditional code paths
- **Testing burden**: Must test all flag combinations

---

## Related ADRs

- [ADR 0070: Multi-Tenancy](./adr-0070-multi-tenancy)
- [ADR 0035: CI/CD Pipeline Strategy](./adr-0035-cicd-pipeline-strategy)
- [ADR 0028: DB-Driven Configuration](./architecture-decision-records#adr-0028-db-driven-configuration)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
