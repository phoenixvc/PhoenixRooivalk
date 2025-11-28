---
id: rust-best-practices
title: Rust Best Practices
sidebar_label: Best Practices
difficulty: intermediate
estimated_reading_time: 30
points: 60
tags:
  - rust
  - development
  - best-practices
  - code-quality
---

## Overview

This guide covers best practices for writing clean, efficient, and maintainable
Rust code. Following these guidelines helps ensure code quality, performance,
and long-term maintainability.

---

## Code Organization

### Project Structure

Follow the standard Cargo project layout:

```
my_project/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── lib.rs          # Library root
│   ├── main.rs         # Binary entry point
│   ├── bin/            # Additional binaries
│   │   └── tool.rs
│   └── modules/
│       ├── mod.rs
│       └── submodule.rs
├── tests/              # Integration tests
│   └── integration_test.rs
├── benches/            # Benchmarks
│   └── benchmark.rs
├── examples/           # Example code
│   └── example.rs
└── build.rs            # Build script (if needed)
```

### Module Organization

Keep modules focused and cohesive:

```rust
// Good: Clear module boundaries
mod database {
    mod connection;
    mod queries;
    mod models;
}

mod api {
    mod handlers;
    mod middleware;
    mod routes;
}

// Bad: Kitchen sink module
mod utils {
    // Contains unrelated functionality
}
```

### Re-exports

Use `pub use` to create a clean public API:

```rust
// lib.rs
mod internal;
mod helpers;

// Re-export public API
pub use internal::PublicStruct;
pub use helpers::useful_function;

// Users import from crate root
use my_crate::PublicStruct;
```

---

## Naming Conventions

### Standard Conventions

| Item            | Convention           | Example               |
| --------------- | -------------------- | --------------------- |
| Crates          | snake_case           | `my_crate`            |
| Modules         | snake_case           | `my_module`           |
| Types           | PascalCase           | `MyStruct`, `MyEnum`  |
| Traits          | PascalCase           | `Iterator`, `Display` |
| Functions       | snake_case           | `do_something`        |
| Methods         | snake_case           | `get_value`           |
| Variables       | snake_case           | `my_variable`         |
| Constants       | SCREAMING_SNAKE_CASE | `MAX_SIZE`            |
| Statics         | SCREAMING_SNAKE_CASE | `GLOBAL_CONFIG`       |
| Type parameters | PascalCase (short)   | `T`, `E`, `K`, `V`    |
| Lifetimes       | lowercase (short)    | `'a`, `'b`, `'static` |

### Meaningful Names

```rust
// Good: Descriptive names
fn calculate_total_price(items: &[Item], tax_rate: f64) -> f64

// Bad: Cryptic names
fn calc(i: &[Item], t: f64) -> f64

// Good: Boolean names that read naturally
let is_valid = true;
let has_permission = false;
let can_edit = user.role == Role::Admin;

// Bad: Ambiguous boolean names
let valid = true;
let permission = false;
```

### Method Naming Patterns

```rust
impl MyType {
    // Constructors
    fn new() -> Self { }
    fn with_capacity(cap: usize) -> Self { }
    fn from_parts(a: A, b: B) -> Self { }

    // Getters (no get_ prefix)
    fn name(&self) -> &str { }
    fn len(&self) -> usize { }

    // Predicates (is_, has_, can_)
    fn is_empty(&self) -> bool { }
    fn has_children(&self) -> bool { }
    fn can_write(&self) -> bool { }

    // Conversions
    fn as_str(&self) -> &str { }        // Cheap, borrowed
    fn to_string(&self) -> String { }   // Expensive, owned
    fn into_inner(self) -> Inner { }    // Consumes self

    // Mutators
    fn set_name(&mut self, name: String) { }
    fn push(&mut self, item: Item) { }
    fn clear(&mut self) { }
}
```

---

## Error Handling

### Use Result for Recoverable Errors

```rust
// Good: Returns Result for operations that can fail
fn read_config(path: &Path) -> Result<Config, ConfigError> {
    let contents = fs::read_to_string(path)?;
    let config: Config = toml::from_str(&contents)?;
    Ok(config)
}

// Bad: Panics on error
fn read_config(path: &Path) -> Config {
    let contents = fs::read_to_string(path).unwrap();
    toml::from_str(&contents).unwrap()
}
```

### Create Custom Error Types

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ServiceError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Configuration error: {0}")]
    Config(#[from] ConfigError),

    #[error("Resource not found: {resource}")]
    NotFound { resource: String },

    #[error("Invalid input: {message}")]
    InvalidInput { message: String },
}
```

### Use ? Operator for Propagation

```rust
// Good: Clean error propagation
fn process_data(input: &str) -> Result<Output, Error> {
    let parsed = parse(input)?;
    let validated = validate(parsed)?;
    let processed = transform(validated)?;
    Ok(processed)
}

// Avoid: Verbose match chains
fn process_data(input: &str) -> Result<Output, Error> {
    let parsed = match parse(input) {
        Ok(p) => p,
        Err(e) => return Err(e.into()),
    };
    // ... more matches
}
```

### Provide Context with anyhow

```rust
use anyhow::{Context, Result};

fn load_user(id: UserId) -> Result<User> {
    let path = get_user_path(id);
    let data = fs::read_to_string(&path)
        .with_context(|| format!("Failed to read user file: {}", path.display()))?;
    let user: User = serde_json::from_str(&data)
        .with_context(|| format!("Failed to parse user data for id: {}", id))?;
    Ok(user)
}
```

### Reserve panic! for Programming Errors

```rust
// Appropriate: Indicates a bug in the program
fn get_item(&self, index: usize) -> &Item {
    assert!(index < self.len(), "Index out of bounds");
    &self.items[index]
}

// Inappropriate: Should return Result
fn load_file(path: &str) -> Data {
    fs::read(path).expect("File not found")  // User error, not bug
}
```

---

## Memory and Performance

### Prefer Stack Allocation

```rust
// Good: Stack allocated
let point = Point { x: 1.0, y: 2.0 };
let buffer: [u8; 1024] = [0; 1024];

// Use heap only when needed
let large_data = Box::new(LargeStruct::new());
let dynamic_vec = Vec::with_capacity(1000);
```

### Avoid Unnecessary Cloning

```rust
// Bad: Clones unnecessarily
fn process(data: &Vec<String>) {
    for item in data.clone() {
        println!("{}", item);
    }
}

// Good: Borrows instead
fn process(data: &[String]) {
    for item in data {
        println!("{}", item);
    }
}
```

### Use Iterators Over Index Loops

```rust
// Good: Iterator-based (faster, safer)
let sum: i32 = numbers.iter().sum();
let doubled: Vec<_> = numbers.iter().map(|x| x * 2).collect();

// Avoid: Index-based loops
let mut sum = 0;
for i in 0..numbers.len() {
    sum += numbers[i];
}
```

### Pre-allocate Collections

```rust
// Good: Pre-allocate when size is known
let mut results = Vec::with_capacity(items.len());
for item in items {
    results.push(process(item));
}

// Better: Use collect with size hint
let results: Vec<_> = items.iter().map(process).collect();

// Avoid: Growing vector repeatedly
let mut results = Vec::new();  // Starts empty
for item in items {
    results.push(process(item));  // May reallocate multiple times
}
```

### Use Cow for Flexible Ownership

```rust
use std::borrow::Cow;

fn process_text(input: &str) -> Cow<str> {
    if input.contains("old") {
        Cow::Owned(input.replace("old", "new"))
    } else {
        Cow::Borrowed(input)  // No allocation needed
    }
}
```

---

## API Design

### Accept Borrowed Types in Parameters

```rust
// Good: Accepts anything that can be borrowed as str
fn greet(name: &str) {
    println!("Hello, {}!", name);
}

greet("world");                    // Works with &str
greet(&String::from("world"));     // Works with &String

// Bad: Forces callers to have a String
fn greet(name: String) {
    println!("Hello, {}!", name);
}
```

### Use AsRef and Into for Flexibility

```rust
// Accepts &str, &String, &Path, etc.
fn read_file(path: impl AsRef<Path>) -> Result<String> {
    fs::read_to_string(path.as_ref())
}

// Accepts String, &str, etc.
fn set_name(&mut self, name: impl Into<String>) {
    self.name = name.into();
}
```

### Return Owned Types from Constructors

```rust
impl User {
    // Good: Returns owned type
    pub fn new(name: String) -> Self {
        Self { name }
    }

    // Also good: Builder pattern
    pub fn builder() -> UserBuilder {
        UserBuilder::default()
    }
}
```

### Use Option for Optional Values

```rust
// Good: Explicit optionality
fn find_user(id: UserId) -> Option<User> {
    users.get(&id).cloned()
}

// Bad: Using sentinel values
fn find_user(id: UserId) -> User {
    users.get(&id).cloned().unwrap_or(User::default())
}
```

### Implement Standard Traits

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct UserId(u64);

#[derive(Debug, Clone, Default)]
pub struct Config {
    pub timeout: Duration,
    pub retries: u32,
}

impl Display for UserId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "User#{}", self.0)
    }
}
```

---

## Concurrency

### Prefer Message Passing

```rust
use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    tx.send(compute_result()).unwrap();
});

let result = rx.recv().unwrap();
```

### Use Arc<Mutex<T>> Sparingly

```rust
// When you need shared mutable state
use std::sync::{Arc, Mutex};

let data = Arc::new(Mutex::new(HashMap::new()));

let data_clone = Arc::clone(&data);
thread::spawn(move || {
    let mut map = data_clone.lock().unwrap();
    map.insert("key", "value");
});

// Consider alternatives:
// - Message passing with channels
// - RwLock for read-heavy workloads
// - Atomic types for simple values
// - Lock-free data structures
```

### Use Scoped Threads When Possible

```rust
use std::thread;

let data = vec![1, 2, 3, 4];

thread::scope(|s| {
    s.spawn(|| {
        println!("{:?}", &data[0..2]);
    });
    s.spawn(|| {
        println!("{:?}", &data[2..4]);
    });
});
// data is still accessible here
```

### Async Best Practices

```rust
// Don't block in async context
async fn bad_example() {
    std::thread::sleep(Duration::from_secs(1));  // Blocks executor!
}

async fn good_example() {
    tokio::time::sleep(Duration::from_secs(1)).await;  // Yields to executor
}

// Use spawn_blocking for CPU-intensive work
async fn process_data(data: Vec<u8>) -> Result<Output> {
    tokio::task::spawn_blocking(move || {
        expensive_computation(&data)
    }).await?
}
```

---

## Testing

### Write Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_addition() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_edge_cases() {
        assert_eq!(add(0, 0), 0);
        assert_eq!(add(-1, 1), 0);
        assert_eq!(add(i32::MAX, 0), i32::MAX);
    }

    #[test]
    #[should_panic(expected = "overflow")]
    fn test_overflow_panics() {
        add(i32::MAX, 1);
    }
}
```

### Use Test Fixtures

```rust
#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_user() -> User {
        User {
            id: UserId(1),
            name: "Test User".into(),
            email: "test@example.com".into(),
        }
    }

    #[test]
    fn test_user_display() {
        let user = create_test_user();
        assert_eq!(user.to_string(), "Test User <test@example.com>");
    }
}
```

### Test Error Cases

```rust
#[test]
fn test_invalid_input_returns_error() {
    let result = parse_config("");
    assert!(result.is_err());

    let err = result.unwrap_err();
    assert!(matches!(err, ConfigError::EmptyInput));
}

#[test]
fn test_file_not_found() {
    let result = load_config("/nonexistent/path");
    assert!(matches!(result, Err(ConfigError::IoError(_))));
}
```

### Integration Tests

```rust
// tests/integration_test.rs
use my_crate::{Server, Client};

#[test]
fn test_client_server_communication() {
    let server = Server::start();
    let client = Client::connect(server.address());

    let response = client.send_request("hello");
    assert_eq!(response, "world");

    server.shutdown();
}
```

---

## Documentation

### Document Public APIs

````rust
/// A user account in the system.
///
/// # Examples
///
/// ```
/// use my_crate::User;
///
/// let user = User::new("Alice");
/// assert_eq!(user.name(), "Alice");
/// ```
#[derive(Debug, Clone)]
pub struct User {
    name: String,
}

impl User {
    /// Creates a new user with the given name.
    ///
    /// # Arguments
    ///
    /// * `name` - The display name for the user
    ///
    /// # Panics
    ///
    /// Panics if `name` is empty.
    ///
    /// # Examples
    ///
    /// ```
    /// let user = User::new("Bob");
    /// ```
    pub fn new(name: impl Into<String>) -> Self {
        let name = name.into();
        assert!(!name.is_empty(), "Name cannot be empty");
        Self { name }
    }
}
````

### Use Doc Tests

````rust
/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// use my_crate::add;
/// assert_eq!(add(2, 3), 5);
/// ```
///
/// Negative numbers work too:
///
/// ```
/// use my_crate::add;
/// assert_eq!(add(-1, 1), 0);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
````

### Document Modules

````rust
//! # My Module
//!
//! This module provides utilities for working with user data.
//!
//! ## Overview
//!
//! The main types are:
//! - [`User`] - Represents a user account
//! - [`UserBuilder`] - Builder for creating users
//!
//! ## Examples
//!
//! ```
//! use my_module::{User, UserBuilder};
//!
//! let user = UserBuilder::new()
//!     .name("Alice")
//!     .email("alice@example.com")
//!     .build();
//! ```
````

---

## Security

### Validate Input

```rust
pub fn create_user(name: &str, age: u32) -> Result<User, ValidationError> {
    // Validate length
    if name.is_empty() || name.len() > 100 {
        return Err(ValidationError::InvalidName);
    }

    // Validate content
    if !name.chars().all(|c| c.is_alphanumeric() || c == ' ') {
        return Err(ValidationError::InvalidCharacters);
    }

    // Validate range
    if age > 150 {
        return Err(ValidationError::InvalidAge);
    }

    Ok(User { name: name.into(), age })
}
```

### Use Type-Safe Wrappers

```rust
// Prevents mixing up user IDs with other IDs
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct OrderId(u64);

// Compiler prevents: get_user(order_id)
fn get_user(id: UserId) -> Option<User> { }
fn get_order(id: OrderId) -> Option<Order> { }
```

### Handle Sensitive Data Carefully

```rust
use secrecy::{ExposeSecret, Secret};
use zeroize::Zeroize;

pub struct Credentials {
    username: String,
    password: Secret<String>,
}

impl Credentials {
    pub fn authenticate(&self) -> bool {
        // Only expose password when needed
        verify_password(self.password.expose_secret())
    }
}

// Password is zeroized when dropped
```

---

## Clippy and Formatting

### Use Clippy

```bash
cargo clippy -- -W clippy::all -W clippy::pedantic
```

Common helpful lints:

```rust
#![warn(clippy::all)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

// Address clippy warnings
fn example() {
    // clippy::needless_return
    return x;  // Just use: x

    // clippy::redundant_clone
    let s = string.clone().clone();  // Remove extra clone

    // clippy::map_unwrap_or
    opt.map(|x| x).unwrap_or(default);  // Use map_or
}
```

### Use rustfmt

Configure in `rustfmt.toml`:

```toml
edition = "2021"
max_width = 100
tab_spaces = 4
use_small_heuristics = "Default"
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
```

Run formatting:

```bash
cargo fmt
cargo fmt -- --check  # CI check
```

---

## Conclusion

Following these best practices leads to:

- **Safer code**: Fewer bugs through Rust's type system and idioms
- **Better performance**: Efficient memory usage and zero-cost abstractions
- **Maintainable code**: Clear structure and consistent style
- **Easier collaboration**: Standard conventions and documentation

Key principles:

1. Leverage the type system for correctness
2. Handle errors explicitly with Result
3. Prefer borrowing over cloning
4. Use iterators and functional patterns
5. Document public APIs thoroughly
6. Test comprehensively
7. Run clippy and rustfmt regularly

---

_This document is part of the Phoenix Rooivalk development documentation. ©
2025 Phoenix Rooivalk. All rights reserved._
