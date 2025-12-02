# New Requirements - Future Implementation

This document outlines new requirements identified after completing the career
application authentication system.

## 1. Docs Site AI Assistant - Offline Mode Issue

**Problem**: AI assistant shows "no functions available in offline mode" even
when user is online.

**Investigation Needed**:

- Check `apps/docs/azure-functions/src/functions/ai.ts`
- Review offline detection logic
- Verify network connectivity checks
- Test function availability in online mode

**Files to Review**:

- `apps/docs/azure-functions/src/functions/ai.ts`
- `apps/docs/azure-functions/src/services/ai.service.ts`
- `apps/docs/src/services/auth.ts`
- `apps/docs/functions/src/ai/index.ts`

## 2. Google OAuth Profile Confirmation Flow

**Requirement**: After Google OAuth login, redirect user to profile confirmation
page where they can verify/edit:

- First name
- Last name
- Email (read-only from Google)
- Optional: Profile picture

**Implementation Steps**:

1. Create `/profile/confirm` page in marketing app
2. Add route to redirect after successful Google OAuth
3. Store profile confirmation state
4. Allow users to skip or complete profile
5. Update user record with confirmed data

**Files to Create/Modify**:

- `apps/marketing/src/app/profile/confirm/page.tsx`
- `apps/marketing/src/app/profile/confirm/confirm.module.css`
- Update `apps/marketing/src/app/login/page.tsx` for OAuth flow
- Update `apps/api/src/handlers.rs` to support profile updates

## 3. Skip Tour Button (Configurable)

**Requirement**: Add a "Skip Tour" button that can be toggled on/off via
configuration.

**Implementation Steps**:

1. Add `ENABLE_TOUR_SKIP` to environment variables
2. Create tour configuration file
3. Add skip button to tour component
4. Store user's tour completion/skip preference
5. Respect skip preference on subsequent visits

**Configuration**:

```typescript
// apps/marketing/src/config/tour.ts
export const TOUR_CONFIG = {
  enableSkip: process.env.NEXT_PUBLIC_ENABLE_TOUR_SKIP === 'true',
  steps: [...],
};
```

**Files to Create/Modify**:

- `apps/marketing/src/config/tour.ts`
- `apps/marketing/.env.example` (add NEXT_PUBLIC_ENABLE_TOUR_SKIP)
- Tour component (TBD - need to locate existing tour implementation)

## 4. Azure Cosmos DB Migration

**Requirement**: Migrate from SQLite to Azure Cosmos DB with Entra
authentication.

**Major Changes Required**:

### 4.1 Database Layer

- Replace SQLite with Azure Cosmos DB client
- Implement Cosmos DB connection management
- Update all queries to use Cosmos DB API

### 4.2 Authentication

- Integrate Microsoft Entra (formerly Azure AD)
- Replace email-based auth with Entra OAuth
- Update token management and session handling

### 4.3 Migration Strategy

1. Create abstraction layer (see section 5)
2. Implement Cosmos DB repository layer
3. Create data migration scripts
4. Update deployment configuration
5. Update environment variables and secrets

**New Dependencies**:

```toml
# Cargo.toml
azure_data_cosmos = "0.20"
azure_identity = "0.20"
azure_core = "0.20"
```

**Configuration Required**:

- Azure Cosmos DB connection string
- Entra tenant ID
- Entra client ID and secret
- Cosmos DB database and container names

## 5. ORM/Abstraction Layer with Migrations

**Requirement**: Add proper abstraction layer with migration support for
database operations.

### 5.1 Design

```rust
// apps/api/src/repository/mod.rs
pub trait Repository<T> {
    async fn create(&self, entity: &T) -> Result<String, RepositoryError>;
    async fn get(&self, id: &str) -> Result<Option<T>, RepositoryError>;
    async fn update(&self, id: &str, entity: &T) -> Result<(), RepositoryError>;
    async fn delete(&self, id: &str) -> Result<(), RepositoryError>;
    async fn list(&self, filter: &Filter) -> Result<Vec<T>, RepositoryError>;
}

pub trait Migrator {
    async fn current_version(&self) -> Result<u32, MigrationError>;
    async fn migrate_to(&self, version: u32) -> Result<(), MigrationError>;
    async fn migrate_latest(&self) -> Result<(), MigrationError>;
    async fn rollback(&self, version: u32) -> Result<(), MigrationError>;
}
```

### 5.2 Implementation Layers

1. **Entity Layer**: Define domain models
2. **Repository Layer**: Abstract database operations
3. **Migration Layer**: Version-controlled schema changes
4. **Provider Layer**: SQLite, Cosmos DB implementations

### 5.3 Migration System

```rust
// apps/api/src/migrations/mod.rs
pub struct Migration {
    pub version: u32,
    pub name: &'static str,
    pub up: Box<dyn Fn(&dyn DatabaseProvider) -> BoxFuture<'static, Result<(), MigrationError>>>,
    pub down: Box<dyn Fn(&dyn DatabaseProvider) -> BoxFuture<'static, Result<(), MigrationError>>>,
}
```

### 5.4 File Structure

```
apps/api/src/
├── repository/
│   ├── mod.rs              # Repository traits
│   ├── user.rs             # User repository
│   ├── session.rs          # Session repository
│   └── application.rs      # Application repository
├── providers/
│   ├── mod.rs              # Provider trait
│   ├── sqlite.rs           # SQLite implementation
│   └── cosmos.rs           # Cosmos DB implementation
├── migrations/
│   ├── mod.rs              # Migration framework
│   ├── sqlite/             # SQLite migrations
│   └── cosmos/             # Cosmos DB migrations
└── entities/
    ├── mod.rs
    ├── user.rs
    ├── session.rs
    └── application.rs
```

## Implementation Priority

1. **High Priority**:
   - Azure Cosmos DB migration (blocking for production)
   - Entra authentication integration
   - ORM/Abstraction layer

2. **Medium Priority**:
   - Google OAuth profile confirmation flow
   - Docs site AI assistant fix

3. **Low Priority**:
   - Skip tour button (nice-to-have feature)

## Estimated Effort

- Azure Cosmos DB + Entra Migration: 3-5 days
- ORM/Abstraction Layer: 2-3 days
- Profile Confirmation Flow: 1 day
- AI Assistant Fix: 0.5-1 day
- Skip Tour Button: 0.5 day

**Total**: ~7-10 days of development work

## Testing Strategy

1. **Unit Tests**: Test each repository implementation
2. **Integration Tests**: Test migration paths
3. **E2E Tests**: Test complete authentication flow
4. **Load Tests**: Verify Cosmos DB performance
5. **Security Tests**: Verify Entra token validation

## Documentation Updates Required

1. Update deployment documentation
2. Document Azure resource requirements
3. Update environment configuration guide
4. Add Cosmos DB schema documentation
5. Document migration procedures
