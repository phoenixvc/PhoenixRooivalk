---
patterns:
  - crates/**
  - apps/api/**
  - apps/keeper/**
  - apps/evidence-cli/**
---

# Rust Development Instructions

This covers Rust libraries (crates) and Rust services (api, keeper, evidence-cli).

## Technology Stack

- **Language**: Rust (latest stable)
- **Build System**: Cargo
- **Testing**: Built-in test framework
- **Linting**: Clippy
- **Formatting**: rustfmt

## Crate Structure

```
crates/
├── evidence/              # Core evidence logging
├── anchor-solana/         # Solana blockchain anchoring
├── anchor-etherlink/      # EtherLink blockchain anchoring
└── address-validation/    # Blockchain address validation
```

## Service Structure

```
apps/
├── api/                   # Axum-based API server
├── keeper/                # Blockchain keeper service
└── evidence-cli/          # CLI for evidence management
```

## Development Commands

```bash
# Check all Rust code
cargo check --workspace

# Run Clippy linter
cargo clippy --workspace --all-targets --all-features

# Format code
cargo fmt --all

# Run tests
cargo test --workspace

# Run specific service
cargo run --manifest-path apps/api/Cargo.toml
cargo run --manifest-path apps/keeper/Cargo.toml
cargo run --manifest-path apps/evidence-cli/Cargo.toml

# Build release
cargo build --release --workspace
```

## Coding Standards

### Naming Conventions

1. **snake_case** for functions, variables, modules
2. **PascalCase** for types, structs, enums, traits
3. **SCREAMING_SNAKE_CASE** for constants
4. **Descriptive names** - avoid abbreviations unless standard

```rust
// ✅ GOOD
const MAX_RETRY_ATTEMPTS: u32 = 3;

pub struct DeploymentConfig {
    weapon_type: WeaponType,
    energy_available: f64,
}

pub fn validate_deployment(
    config: &DeploymentConfig,
) -> Result<(), DeploymentError> {
    // Implementation
}

// ❌ BAD
const MAX: u32 = 3;
struct cfg { wt: i32, e: f64 }
fn val_dep(c: &cfg) -> bool { true }
```

### Error Handling

1. **Always use Result<T, E>** - Never panic in library code
2. **Use `?` operator** - Propagate errors cleanly
3. **Custom Error Types** - Define domain-specific errors
4. **Context with anyhow** - Add context to errors

```rust
use anyhow::{Context, Result};

pub enum DeploymentError {
    InsufficientEnergy { required: f64, available: f64 },
    InvalidWeaponType,
    SystemOffline,
}

impl std::fmt::Display for DeploymentError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InsufficientEnergy { required, available } => {
                write!(f, "Insufficient energy: need {}, have {}", required, available)
            }
            Self::InvalidWeaponType => write!(f, "Invalid weapon type"),
            Self::SystemOffline => write!(f, "System is offline"),
        }
    }
}

impl std::error::Error for DeploymentError {}

// Usage
pub fn deploy_weapon(config: DeploymentConfig) -> Result<()> {
    validate_energy(&config)
        .context("Energy validation failed")?;
    
    execute_deployment(&config)
        .context("Deployment execution failed")?;
    
    Ok(())
}
```

### Documentation

Every public item MUST have documentation:

```rust
/// Validates a weapon deployment against system constraints.
///
/// This function checks energy availability, weapon type compatibility,
/// and system status before allowing deployment.
///
/// # Arguments
///
/// * `weapon_type` - The type of weapon to deploy
/// * `energy_available` - Current energy in joules
///
/// # Returns
///
/// * `Ok(())` if deployment is valid
/// * `Err(DeploymentError)` if constraints are violated
///
/// # Examples
///
/// ```
/// use crate::{validate_deployment, WeaponType};
///
/// let result = validate_deployment(WeaponType::Kinetic, 1000.0);
/// assert!(result.is_ok());
/// ```
///
/// # Errors
///
/// Returns `DeploymentError::InsufficientEnergy` if energy is too low.
/// Returns `DeploymentError::InvalidWeaponType` if weapon type is unsupported.
pub fn validate_deployment(
    weapon_type: WeaponType,
    energy_available: f64,
) -> Result<(), DeploymentError> {
    if energy_available < weapon_type.energy_cost() {
        return Err(DeploymentError::InsufficientEnergy {
            required: weapon_type.energy_cost(),
            available: energy_available,
        });
    }
    Ok(())
}
```

### Testing

Every public function should have tests:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_deployment_success() {
        let weapon = WeaponType::Kinetic;
        let result = validate_deployment(weapon, 1000.0);
        assert!(result.is_ok());
    }

    #[test]
    fn test_validate_deployment_insufficient_energy() {
        let weapon = WeaponType::Kinetic;
        let result = validate_deployment(weapon, 10.0);
        assert!(matches!(
            result,
            Err(DeploymentError::InsufficientEnergy { .. })
        ));
    }

    #[test]
    fn test_deployment_config_serialization() {
        let config = DeploymentConfig {
            weapon_type: WeaponType::Kinetic,
            energy_available: 1000.0,
        };
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: DeploymentConfig = 
            serde_json::from_str(&json).unwrap();
        assert_eq!(config.weapon_type, deserialized.weapon_type);
    }
}
```

## Async Programming

For services and I/O operations, use Tokio:

```rust
use tokio;

#[tokio::main]
async fn main() -> Result<()> {
    // Async main
    run_service().await
}

async fn fetch_data() -> Result<Vec<u8>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://api.example.com/data")
        .send()
        .await
        .context("Failed to fetch data")?;
    
    let bytes = response
        .bytes()
        .await
        .context("Failed to read response body")?;
    
    Ok(bytes.to_vec())
}
```

## Blockchain Integration

### Evidence Management

```rust
use crate::evidence::{Evidence, EvidenceRecord};

// Create evidence record
let evidence = Evidence {
    mission_id: "M-123".to_string(),
    timestamp: Utc::now(),
    event_type: EventType::Engagement,
    data: serde_json::json!({
        "target": "drone-001",
        "result": "neutralized"
    }),
};

// Submit for anchoring
let record = evidence_service
    .record(evidence)
    .await
    .context("Failed to record evidence")?;
```

### Chain-Specific Anchoring

```rust
// Solana anchoring
use anchor_solana::SolanaAnchor;

let anchor = SolanaAnchor::new(rpc_url, keypair)?;
let tx_signature = anchor
    .anchor_evidence(&evidence_hash)
    .await
    .context("Solana anchoring failed")?;

// EtherLink anchoring
use anchor_etherlink::EtherLinkAnchor;

let anchor = EtherLinkAnchor::new(rpc_url, private_key)?;
let tx_hash = anchor
    .anchor_evidence(&evidence_hash)
    .await
    .context("EtherLink anchoring failed")?;
```

## Clippy Configuration

We use strict Clippy settings. Fix all warnings:

```rust
// Allow specific lints only when truly necessary
#![allow(clippy::too_many_arguments)] // Only if refactoring is impractical

// Common patterns to follow
#![deny(clippy::unwrap_used)]         // Never use unwrap()
#![deny(clippy::expect_used)]         // Avoid expect(), prefer proper error handling
#![warn(clippy::all)]
#![warn(clippy::pedantic)]
```

## Performance Guidelines

1. **Avoid Unnecessary Clones** - Use references when possible
2. **Use Capacity Hints** - `Vec::with_capacity()` for known sizes
3. **Lazy Evaluation** - Use iterators instead of intermediate collections
4. **Profile Before Optimizing** - Use `cargo flamegraph` or similar

```rust
// ✅ GOOD: Efficient iteration
fn process_items(items: &[Item]) -> Vec<Result> {
    items
        .iter()
        .filter(|item| item.is_valid())
        .map(|item| process(item))
        .collect()
}

// ❌ BAD: Unnecessary clones and intermediate collections
fn process_items_bad(items: &[Item]) -> Vec<Result> {
    let valid: Vec<Item> = items
        .iter()
        .filter(|item| item.is_valid())
        .cloned()  // Unnecessary clone
        .collect();
    
    valid
        .iter()
        .map(|item| process(item))
        .collect()
}
```

## Security Best Practices

1. **Input Validation** - Always validate external inputs
2. **No Secrets in Code** - Use environment variables or config files
3. **Secure Dependencies** - Regularly audit with `cargo audit`
4. **Safe Arithmetic** - Use checked operations for critical calculations

```rust
// ✅ GOOD: Checked arithmetic
let result = value
    .checked_mul(factor)
    .and_then(|v| v.checked_add(offset))
    .ok_or(ArithmeticError::Overflow)?;

// ❌ BAD: Unchecked arithmetic (can panic or overflow)
let result = value * factor + offset;
```

## Common Issues

1. **Lifetime Errors** - Simplify borrows, consider cloning if necessary
2. **Trait Bounds** - Add `Debug`, `Clone`, `Send`, `Sync` as needed
3. **Async Context** - Use `async` traits carefully (consider `async-trait`)
4. **Circular Dependencies** - Restructure modules to break cycles

## Service-Specific Guidelines

### API Server (Axum)
- RESTful endpoints with proper HTTP status codes
- Request validation with middleware
- Structured logging with `tracing`
- Error responses in JSON format

### Keeper Service
- Batch processing for efficiency
- Graceful shutdown handling
- Retry logic with exponential backoff
- Metrics and health checks

### Evidence CLI
- Clear command structure with `clap`
- Progress indicators for long operations
- Colored output for better UX
- Proper exit codes

## Dependencies

When adding dependencies:
1. Check security advisories first
2. Prefer well-maintained crates
3. Review license compatibility
4. Keep dependencies minimal
5. Pin versions in `Cargo.toml`

```toml
[dependencies]
tokio = { version = "1.35", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
anyhow = "1.0"
```
