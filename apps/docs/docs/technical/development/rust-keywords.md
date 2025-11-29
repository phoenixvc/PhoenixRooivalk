---
id: rust-keywords
title: Rust Keywords Reference
sidebar_label: Keywords
difficulty: beginner
estimated_reading_time: 20
points: 30
tags:
  - rust
  - development
  - reference
  - syntax
---

## Overview

Rust has a set of reserved keywords that have special meaning in the language.
This reference covers all Rust keywords, their purposes, and usage examples.

---

## Reserved Keywords (Currently in Use)

### Control Flow Keywords

#### `if`, `else`

Conditional branching:

```rust
let number = 5;

if number > 0 {
    println!("Positive");
} else if number < 0 {
    println!("Negative");
} else {
    println!("Zero");
}

// if as expression
let result = if number > 0 { "positive" } else { "non-positive" };
```

#### `match`

Pattern matching:

```rust
let value = Some(5);

match value {
    Some(x) if x > 0 => println!("Positive: {}", x),
    Some(0) => println!("Zero"),
    Some(_) => println!("Negative"),
    None => println!("No value"),
}
```

#### `loop`

Infinite loop:

```rust
let mut counter = 0;

let result = loop {
    counter += 1;
    if counter == 10 {
        break counter * 2;  // Returns value from loop
    }
};
```

#### `while`

Conditional loop:

```rust
let mut n = 0;

while n < 5 {
    println!("{}", n);
    n += 1;
}

// while let
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

#### `for`

Iterator loop:

```rust
for i in 0..5 {
    println!("{}", i);
}

for item in collection.iter() {
    println!("{}", item);
}

// With enumerate
for (index, value) in collection.iter().enumerate() {
    println!("{}: {}", index, value);
}
```

#### `break`

Exit from loop:

```rust
'outer: loop {
    loop {
        break 'outer;  // Breaks from outer loop
    }
}
```

#### `continue`

Skip to next iteration:

```rust
for i in 0..10 {
    if i % 2 == 0 {
        continue;  // Skip even numbers
    }
    println!("{}", i);
}
```

#### `return`

Return from function:

```rust
fn calculate(x: i32) -> i32 {
    if x < 0 {
        return 0;  // Early return
    }
    x * 2  // Implicit return (no semicolon)
}
```

---

### Declaration Keywords

#### `let`

Variable binding:

```rust
let x = 5;              // Immutable
let mut y = 10;         // Mutable
let z: i32 = 15;        // With type annotation

// Destructuring
let (a, b) = (1, 2);
let Point { x, y } = point;
```

#### `const`

Compile-time constant:

```rust
const MAX_POINTS: u32 = 100_000;
const PI: f64 = 3.14159265359;

// Must have type annotation
// Value must be computable at compile time
```

#### `static`

Static variable with fixed memory address:

```rust
static HELLO: &str = "Hello, world!";
static mut COUNTER: u32 = 0;  // Requires unsafe to access

// Lives for entire program duration
// Has a fixed memory address
```

#### `fn`

Function definition:

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b
}

// Generic function
fn identity<T>(x: T) -> T {
    x
}

// Async function
async fn fetch_data() -> Result<Data, Error> {
    // ...
}
```

#### `struct`

Structure definition:

```rust
// Named fields
struct User {
    name: String,
    age: u32,
    active: bool,
}

// Tuple struct
struct Point(i32, i32, i32);

// Unit struct
struct Marker;
```

#### `enum`

Enumeration definition:

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

// With generics
enum Option<T> {
    Some(T),
    None,
}
```

#### `type`

Type alias:

```rust
type Kilometers = i32;
type Result<T> = std::result::Result<T, MyError>;
type Thunk = Box<dyn Fn() + Send + 'static>;
```

#### `trait`

Trait definition:

```rust
trait Summary {
    fn summarize(&self) -> String;

    // Default implementation
    fn preview(&self) -> String {
        format!("Read more: {}", self.summarize())
    }
}
```

#### `impl`

Implementation block:

```rust
impl User {
    // Associated function (constructor)
    fn new(name: String) -> Self {
        Self { name, age: 0, active: true }
    }

    // Method
    fn greet(&self) {
        println!("Hello, {}!", self.name);
    }
}

// Trait implementation
impl Summary for User {
    fn summarize(&self) -> String {
        format!("{}, {} years old", self.name, self.age)
    }
}
```

---

### Module Keywords

#### `mod`

Module definition:

```rust
mod math {
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    mod internal {
        // Private module
    }
}

// Declare module from file
mod utils;  // Loads utils.rs or utils/mod.rs
```

#### `use`

Import items into scope:

```rust
use std::collections::HashMap;
use std::io::{self, Read, Write};

// Rename on import
use std::fmt::Result as FmtResult;

// Re-export
pub use crate::utils::helper;

// Glob import (use sparingly)
use std::collections::*;
```

#### `pub`

Public visibility:

```rust
pub struct User {
    pub name: String,      // Public field
    age: u32,              // Private field
}

pub fn public_function() {}

pub(crate) fn crate_visible() {}
pub(super) fn parent_visible() {}
pub(in crate::module) fn path_visible() {}
```

#### `crate`

Crate root reference:

```rust
use crate::utils::helper;

pub(crate) fn internal_function() {}
```

#### `super`

Parent module reference:

```rust
mod parent {
    pub fn parent_fn() {}

    mod child {
        use super::parent_fn;

        pub(super) fn child_fn() {}
    }
}
```

#### `self`

Current module or instance:

```rust
use std::io::{self, Read};  // Imports io and io::Read

impl User {
    fn method(&self) {       // Instance reference
        self.name.clone()
    }

    fn consume(self) {       // Takes ownership
        // self is moved
    }
}
```

#### `extern`

External linkage:

```rust
// FFI
extern "C" {
    fn abs(input: i32) -> i32;
}

// External crate (older syntax)
extern crate serde;
```

#### `as`

Type casting and renaming:

```rust
let x = 5i32 as f64;

use std::io::Result as IoResult;

// In patterns
match value {
    x @ 1..=5 => println!("Got {} in range", x),
    _ => {}
}
```

---

### Reference and Pointer Keywords

#### `ref`

Reference pattern:

```rust
let value = Some(String::from("hello"));

match value {
    Some(ref s) => println!("{}", s),  // Borrows instead of moves
    None => {}
}

// value is still valid here
```

#### `mut`

Mutable binding or reference:

```rust
let mut x = 5;
x = 6;

fn modify(data: &mut Vec<i32>) {
    data.push(42);
}
```

#### `move`

Force closure to take ownership:

```rust
let data = vec![1, 2, 3];

let handle = thread::spawn(move || {
    println!("{:?}", data);  // data is moved into closure
});
```

#### `unsafe`

Unsafe code block:

```rust
unsafe {
    // Can dereference raw pointers
    // Can call unsafe functions
    // Can access mutable statics
    // Can implement unsafe traits
}

unsafe fn dangerous() {
    // Entire function is unsafe
}

unsafe trait UnsafeTrait {
    // Implementing this requires unsafe
}
```

---

### Type Keywords

#### `where`

Trait bound clause:

```rust
fn process<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + Debug,
{
    // ...
}
```

#### `dyn`

Dynamic dispatch trait object:

```rust
fn print_it(item: &dyn Display) {
    println!("{}", item);
}

let items: Vec<Box<dyn Display>> = vec![
    Box::new(42),
    Box::new("hello"),
];
```

#### `Self`

Current type alias:

```rust
impl User {
    fn new() -> Self {
        Self {
            name: String::new(),
            age: 0,
        }
    }
}

trait Clonable {
    fn clone(&self) -> Self;
}
```

---

### Async Keywords

#### `async`

Asynchronous function or block:

```rust
async fn fetch_data() -> Result<Data, Error> {
    let response = client.get(url).await?;
    Ok(response.json().await?)
}

let future = async {
    do_something().await;
    do_something_else().await;
};
```

#### `await`

Wait for future completion:

```rust
async fn process() {
    let data = fetch_data().await;
    let result = compute(data).await;
    save(result).await;
}
```

---

### Boolean and Value Keywords

#### `true`, `false`

Boolean literals:

```rust
let is_active: bool = true;
let is_done = false;
```

---

### Special Keywords

#### `in`

Part of for loop syntax:

```rust
for item in collection {
    // ...
}
```

#### `if` (in patterns)

Pattern guard:

```rust
match value {
    Some(x) if x > 0 => println!("Positive"),
    Some(x) if x < 0 => println!("Negative"),
    Some(_) => println!("Zero"),
    None => println!("None"),
}
```

---

## Reserved Keywords (Future Use)

These keywords are reserved for potential future use:

| Keyword    | Potential Use          |
| ---------- | ---------------------- |
| `abstract` | Abstract types/methods |
| `become`   | Tail call optimization |
| `box`      | Box patterns/placement |
| `do`       | Do notation            |
| `final`    | Sealed types/methods   |
| `macro`    | Macro definitions      |
| `override` | Method overriding      |
| `priv`     | Private visibility     |
| `try`      | Try blocks             |
| `typeof`   | Type introspection     |
| `unsized`  | Unsized types          |
| `virtual`  | Virtual methods        |
| `yield`    | Generator yield        |

---

## Raw Identifiers

Use `r#` prefix to use keywords as identifiers:

```rust
let r#type = "keyword";
let r#match = 42;

fn r#fn() {
    println!("Function named fn");
}
```

Useful when interfacing with other languages that use Rust keywords.

---

## Weak Keywords

These have special meaning only in certain contexts:

### `union`

C-style union (only in item position):

```rust
union MyUnion {
    f: f32,
    i: i32,
}
```

### `'static`

Static lifetime:

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str
where
    'a: 'static,
{
    // ...
}

static GLOBAL: &'static str = "hello";
```

---

## Keyword Categories Summary

| Category     | Keywords                                                                     |
| ------------ | ---------------------------------------------------------------------------- |
| Control Flow | `if`, `else`, `match`, `loop`, `while`, `for`, `break`, `continue`, `return` |
| Declaration  | `let`, `const`, `static`, `fn`, `struct`, `enum`, `type`, `trait`, `impl`    |
| Module       | `mod`, `use`, `pub`, `crate`, `super`, `self`, `extern`, `as`                |
| Reference    | `ref`, `mut`, `move`, `unsafe`                                               |
| Type         | `where`, `dyn`, `Self`                                                       |
| Async        | `async`, `await`                                                             |
| Boolean      | `true`, `false`                                                              |

---

## Conclusion

Understanding Rust's keywords is essential for writing idiomatic Rust code. Key
points to remember:

- Keywords cannot be used as identifiers (except with `r#` prefix)
- Some keywords are reserved for future language features
- Weak keywords only have special meaning in specific contexts
- The keyword set is intentionally small to keep the language learnable

---

_This document is part of the Phoenix Rooivalk development documentation. © 2025
Phoenix Rooivalk. All rights reserved._
