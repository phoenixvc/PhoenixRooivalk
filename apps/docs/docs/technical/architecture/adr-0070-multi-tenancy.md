---
id: adr-0070-multi-tenancy
title: "ADR 0070: Multi-Tenancy Architecture"
sidebar_label: "ADR 0070: Multi-Tenancy"
difficulty: intermediate
estimated_reading_time: 10
points: 40
tags:
  - technical
  - architecture
  - multi-tenancy
  - saas
  - isolation
prerequisites:
  - architecture-decision-records
  - adr-0007-security-architecture
---

# ADR 0070: Multi-Tenancy Architecture

**Date**: 2025-12-12 **Status**: Proposed

---

## Executive Summary

1. **Problem**: Phoenix Rooivalk must support multiple organizations (customers)
   with data isolation, per-tenant configuration, and usage-based billing
2. **Decision**: Implement logical multi-tenancy with shared infrastructure,
   tenant-scoped data, and feature flag-based customization
3. **Trade-off**: Resource efficiency vs. isolation guarantees

---

## Context

### Multi-Tenancy Requirements

| Requirement    | Specification                       |
| -------------- | ----------------------------------- |
| Data isolation | Tenant A cannot see Tenant B's data |
| Configuration  | Per-tenant feature toggles          |
| Usage tracking | Per-tenant metrics for billing      |
| Performance    | No tenant can starve others         |
| Compliance     | Tenant-specific retention policies  |

### Tenant Types

| Type       | Description                           | Isolation Level |
| ---------- | ------------------------------------- | --------------- |
| Enterprise | Large organization, dedicated support | High            |
| Standard   | Medium business, shared resources     | Medium          |
| Trial      | Evaluation period                     | Low             |

---

## Decision

Implement **logical multi-tenancy** with shared infrastructure:

### Tenancy Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Multi-Tenancy Architecture                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  TENANT LAYER                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  Tenant A        Tenant B        Tenant C                       ││
│  │  ┌──────────┐   ┌──────────┐   ┌──────────┐                    ││
│  │  │ Users    │   │ Users    │   │ Users    │                    ││
│  │  │ Config   │   │ Config   │   │ Config   │                    ││
│  │  │ Data     │   │ Data     │   │ Data     │                    ││
│  │  └──────────┘   └──────────┘   └──────────┘                    ││
│  └─────────────────────────────────────────────────────────────────┘│
│              │               │               │                       │
│              └───────────────┼───────────────┘                       │
│                              ▼                                       │
│  ISOLATION LAYER                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Tenant     │  │    Data      │  │   Resource   │          ││
│  │  │   Context    │──│   Scoping    │──│   Quotas     │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                              │                                       │
│                              ▼                                       │
│  SHARED INFRASTRUCTURE                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          ││
│  │  │   Cosmos DB  │  │   Functions  │  │   Storage    │          ││
│  │  │   (shared)   │  │   (shared)   │  │   (shared)   │          ││
│  │  └──────────────┘  └──────────────┘  └──────────────┘          ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tenant Model

### Tenant Schema

```rust
pub struct Tenant {
    pub id: TenantId,
    pub name: String,
    pub tier: TenantTier,
    pub status: TenantStatus,

    // Configuration
    pub config: TenantConfig,
    pub features: FeatureFlags,

    // Limits
    pub quotas: TenantQuotas,

    // Metadata
    pub created_at: DateTime<Utc>,
    pub billing_contact: String,
    pub data_region: Region,
}

pub enum TenantTier {
    Trial { expires_at: DateTime<Utc> },
    Standard,
    Enterprise { support_tier: SupportTier },
}

pub struct TenantQuotas {
    pub max_users: u32,
    pub max_nodes: u32,
    pub max_tracks_per_day: u64,
    pub storage_gb: u32,
    pub api_requests_per_minute: u32,
}

pub struct TenantConfig {
    pub retention_days: u32,
    pub mfa_required: bool,
    pub allowed_ip_ranges: Vec<IpNetwork>,
    pub custom_branding: Option<Branding>,
    pub sso_config: Option<SsoConfig>,
}
```

### Tenant Context

```rust
pub struct TenantContext {
    pub tenant_id: TenantId,
    pub user_id: UserId,
    pub roles: Vec<Role>,
    pub permissions: PermissionSet,
}

impl TenantContext {
    /// Extract tenant context from request
    pub fn from_request(req: &Request) -> Result<Self, AuthError> {
        let claims = req.jwt_claims()?;

        Ok(TenantContext {
            tenant_id: claims.tenant_id.parse()?,
            user_id: claims.sub.parse()?,
            roles: claims.roles.clone(),
            permissions: PermissionSet::from_roles(&claims.roles),
        })
    }

    /// Check if operation is allowed
    pub fn can(&self, permission: Permission) -> bool {
        self.permissions.contains(permission)
    }
}
```

---

## Data Isolation

### Database Scoping

```rust
// All queries automatically scoped to tenant
pub struct TenantScopedRepo<T> {
    db: Database,
    tenant_id: TenantId,
    _marker: PhantomData<T>,
}

impl<T: TenantOwned> TenantScopedRepo<T> {
    pub async fn find(&self, id: &str) -> Result<Option<T>, DbError> {
        self.db.query(
            "SELECT * FROM c WHERE c.tenant_id = @tenant AND c.id = @id",
            &[
                ("@tenant", &self.tenant_id.to_string()),
                ("@id", id),
            ],
        ).await
    }

    pub async fn list(&self, filter: &Filter) -> Result<Vec<T>, DbError> {
        let mut query = format!(
            "SELECT * FROM c WHERE c.tenant_id = @tenant"
        );

        // Additional filters appended
        if let Some(f) = filter.to_cosmos_filter() {
            query.push_str(&format!(" AND {}", f));
        }

        self.db.query(&query, &[("@tenant", &self.tenant_id.to_string())]).await
    }

    pub async fn insert(&self, item: &mut T) -> Result<(), DbError> {
        // Ensure tenant_id is set
        item.set_tenant_id(self.tenant_id.clone());
        self.db.insert(item).await
    }
}

// Trait for tenant-owned entities
pub trait TenantOwned {
    fn tenant_id(&self) -> &TenantId;
    fn set_tenant_id(&mut self, id: TenantId);
}
```

### Cosmos DB Partitioning

```bicep
resource cosmosDb 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  // ...
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosDb
  name: 'phoenix'
  properties: {
    resource: {
      id: 'phoenix'
    }
  }
}

resource tracksContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: database
  name: 'tracks'
  properties: {
    resource: {
      id: 'tracks'
      // Partition by tenant for isolation and query efficiency
      partitionKey: {
        paths: ['/tenant_id']
        kind: 'Hash'
      }
      indexingPolicy: {
        includedPaths: [
          { path: '/timestamp/*' }
          { path: '/classification/*' }
        ]
      }
    }
  }
}
```

---

## Resource Quotas

### Quota Enforcement

```rust
pub struct QuotaEnforcer {
    cache: Cache,
    tenant_repo: TenantRepository,
}

impl QuotaEnforcer {
    pub async fn check_quota(
        &self,
        tenant_id: &TenantId,
        resource: QuotaResource,
    ) -> Result<(), QuotaError> {
        let tenant = self.tenant_repo.get(tenant_id).await?;
        let usage = self.get_current_usage(tenant_id, &resource).await?;

        let limit = match resource {
            QuotaResource::Users => tenant.quotas.max_users as u64,
            QuotaResource::Nodes => tenant.quotas.max_nodes as u64,
            QuotaResource::TracksPerDay => tenant.quotas.max_tracks_per_day,
            QuotaResource::StorageGb => tenant.quotas.storage_gb as u64,
            QuotaResource::ApiRequests => tenant.quotas.api_requests_per_minute as u64,
        };

        if usage >= limit {
            return Err(QuotaError::Exceeded {
                resource,
                usage,
                limit,
            });
        }

        Ok(())
    }

    pub async fn track_usage(
        &self,
        tenant_id: &TenantId,
        resource: QuotaResource,
        delta: i64,
    ) -> Result<(), QuotaError> {
        let key = format!("quota:{}:{}", tenant_id, resource);

        // Atomic increment with TTL for time-based quotas
        let ttl = match resource {
            QuotaResource::ApiRequests => Some(Duration::from_secs(60)),
            QuotaResource::TracksPerDay => Some(Duration::from_secs(86400)),
            _ => None,
        };

        self.cache.incr(&key, delta, ttl).await?;

        Ok(())
    }
}
```

### Rate Limiting

```rust
pub struct TenantRateLimiter {
    cache: Cache,
}

impl TenantRateLimiter {
    pub async fn check_rate_limit(
        &self,
        tenant_id: &TenantId,
        endpoint: &str,
    ) -> Result<RateLimitResult, RateLimitError> {
        let key = format!("ratelimit:{}:{}", tenant_id, endpoint);
        let window = Duration::from_secs(60);

        let current = self.cache.incr(&key, 1, Some(window)).await?;
        let limit = self.get_limit(tenant_id, endpoint).await?;

        if current > limit {
            return Ok(RateLimitResult::Exceeded {
                retry_after: self.cache.ttl(&key).await?,
            });
        }

        Ok(RateLimitResult::Allowed {
            remaining: limit - current,
            reset_at: Utc::now() + window,
        })
    }
}
```

---

## Tenant Provisioning

### Provisioning Flow

```rust
pub struct TenantProvisioner {
    db: Database,
    keyvault: KeyVault,
    billing: BillingService,
}

impl TenantProvisioner {
    pub async fn provision_tenant(
        &self,
        request: ProvisionRequest,
    ) -> Result<Tenant, ProvisionError> {
        // Generate tenant ID
        let tenant_id = TenantId::new();

        // Create tenant record
        let tenant = Tenant {
            id: tenant_id.clone(),
            name: request.organization_name,
            tier: request.tier,
            status: TenantStatus::Provisioning,
            quotas: TenantQuotas::for_tier(&request.tier),
            ..Default::default()
        };

        self.db.insert(&tenant).await?;

        // Generate tenant API key
        let api_key = self.keyvault.generate_api_key(&tenant_id).await?;

        // Setup billing
        self.billing.create_customer(&tenant).await?;

        // Create default admin user
        self.create_admin_user(&tenant, &request.admin_email).await?;

        // Mark as active
        self.db.update(&tenant_id, |t| t.status = TenantStatus::Active).await?;

        Ok(tenant)
    }
}
```

---

## Billing Integration

### Usage Tracking

```rust
pub struct UsageTracker {
    metrics: MetricsService,
    billing: BillingService,
}

impl UsageTracker {
    pub async fn record_usage(
        &self,
        tenant_id: &TenantId,
        usage: UsageEvent,
    ) -> Result<(), UsageError> {
        // Record for billing
        self.billing.record_usage(tenant_id, &usage).await?;

        // Record metrics
        self.metrics.emit(Metric {
            name: "tenant_usage",
            tags: vec![
                ("tenant_id", tenant_id.to_string()),
                ("usage_type", usage.usage_type.to_string()),
            ],
            value: usage.quantity as f64,
        });

        Ok(())
    }
}

pub struct UsageEvent {
    pub usage_type: UsageType,
    pub quantity: u64,
    pub timestamp: DateTime<Utc>,
}

pub enum UsageType {
    TrackProcessed,
    EngagementExecuted,
    StorageGb,
    ApiCall,
    NodeHour,
}
```

---

## Consequences

### Positive

- **Cost efficiency**: Shared infrastructure reduces costs
- **Scalability**: Add tenants without new infrastructure
- **Maintainability**: Single codebase for all tenants
- **Fast onboarding**: Automated provisioning

### Negative

- **Noisy neighbor risk**: One tenant could impact others
- **Complexity**: Tenant scoping in all queries
- **Compliance**: Some industries require physical isolation

---

## Related ADRs

- [ADR 0007: Security Architecture](./architecture-decision-records#adr-0007-security-architecture)
- [ADR 0071: Feature Flags](./adr-0071-feature-flags)
- [ADR 0052: Data Retention Policies](./adr-0052-data-retention-policies)

---

_© 2025 Phoenix Rooivalk. Architecture Decision Record._
