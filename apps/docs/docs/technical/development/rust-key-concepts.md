---
id: rust-key-concepts
title: Rust Key Concepts
sidebar_label: Key Concepts
difficulty: intermediate
estimated_reading_time: 25
points: 50
tags:
  - rust
  - development
  - programming
  - systems
---

## Overview

Rust is a systems programming language focused on safety, concurrency, and
performance. This document covers the fundamental concepts that make Rust unique
and powerful for building reliable, high-performance software systems.

---

## Ownership

Ownership is Rust's most distinctive feature and enables memory safety without a
garbage collector.

### The Three Rules of Ownership

1. **Each value has an owner**: Every value in Rust has a variable that's called
   its owner.
2. **One owner at a time**: There can only be one owner at a time.
3. **Value is dropped when owner goes out of scope**: When the owner goes out of
   scope, the value is dropped.

### Example

```rust
fn main() {
    let s1 = String::from("hello");  // s1 owns the String
    let s2 = s1;                      // ownership moves to s2
    // println!("{}", s1);            // Error: s1 no longer valid
    println!("{}", s2);               // Works: s2 owns the String
}
```

### Move Semantics

When you assign a value to another variable, Rust moves ownership rather than
copying by default. This prevents double-free errors and data races.

```rust
fn take_ownership(s: String) {
    println!("{}", s);
} // s is dropped here

fn main() {
    let s = String::from("hello");
    take_ownership(s);
    // s is no longer valid here
}
```

---

## Borrowing and References

Borrowing allows you to use a value without taking ownership.

### Immutable References

You can have multiple immutable references to a value:

```rust
fn main() {
    let s = String::from("hello");
    let r1 = &s;  // immutable borrow
    let r2 = &s;  // another immutable borrow
    println!("{} and {}", r1, r2);  // Both valid
}
```

### Mutable References

You can have only one mutable reference at a time:

```rust
fn main() {
    let mut s = String::from("hello");
    let r = &mut s;  // mutable borrow
    r.push_str(" world");
    println!("{}", r);
}
```

### Borrowing Rules

1. You can have either one mutable reference OR any number of immutable
   references
2. References must always be valid (no dangling references)

---

## Lifetimes

Lifetimes ensure references are valid for as long as they're used.

### Lifetime Annotations

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}
```

### Lifetime Elision

Rust can often infer lifetimes. These rules apply:

1. Each input reference gets its own lifetime parameter
2. If there's exactly one input lifetime, it's assigned to all outputs
3. For methods, the self lifetime is assigned to all output lifetimes

### Static Lifetime

The `'static` lifetime indicates the reference lives for the entire program:

```rust
let s: &'static str = "I live forever!";
```

---

## Traits

Traits define shared behavior across types.

### Defining Traits

```rust
pub trait Summary {
    fn summarize(&self) -> String;

    // Default implementation
    fn summarize_author(&self) -> String {
        String::from("(Read more...)")
    }
}
```

### Implementing Traits

```rust
struct Article {
    headline: String,
    content: String,
}

impl Summary for Article {
    fn summarize(&self) -> String {
        format!("{}: {}", self.headline, &self.content[..50])
    }
}
```

### Trait Bounds

```rust
fn notify<T: Summary>(item: &T) {
    println!("Breaking news! {}", item.summarize());
}

// Or with where clause
fn notify<T>(item: &T)
where
    T: Summary + Display,
{
    println!("Breaking news! {}", item.summarize());
}
```

### Common Standard Library Traits

| Trait               | Purpose                      |
| ------------------- | ---------------------------- |
| `Clone`             | Explicit copy via `.clone()` |
| `Copy`              | Implicit bitwise copy        |
| `Debug`             | Debug formatting `{:?}`      |
| `Display`           | User-facing formatting `{}`  |
| `Default`           | Default value creation       |
| `PartialEq`, `Eq`   | Equality comparison          |
| `PartialOrd`, `Ord` | Ordering comparison          |
| `Hash`              | Hashing for collections      |
| `Iterator`          | Sequential iteration         |
| `From`, `Into`      | Type conversion              |
| `Send`, `Sync`      | Thread safety markers        |

---

## Generics

Generics enable code reuse across types.

### Generic Functions

```rust
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}
```

### Generic Structs

```rust
struct Point<T> {
    x: T,
    y: T,
}

impl<T> Point<T> {
    fn x(&self) -> &T {
        &self.x
    }
}

// Specialized implementation
impl Point<f32> {
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}
```

### Generic Enums

```rust
enum Option<T> {
    Some(T),
    None,
}

enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

---

## Error Handling

Rust distinguishes between recoverable and unrecoverable errors.

### The Result Type

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_file(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;
    Ok(contents)
}
```

### The Option Type

```rust
fn find_user(id: u32) -> Option<User> {
    // Returns Some(user) if found, None otherwise
}

fn main() {
    match find_user(42) {
        Some(user) => println!("Found: {}", user.name),
        None => println!("User not found"),
    }
}
```

### The ? Operator

The `?` operator propagates errors automatically:

```rust
fn process_data() -> Result<Data, Error> {
    let raw = fetch_data()?;      // Returns early if Err
    let parsed = parse(raw)?;      // Returns early if Err
    let validated = validate(parsed)?;
    Ok(validated)
}
```

### Panic and Unrecoverable Errors

```rust
// Use panic! for unrecoverable errors
panic!("Critical failure!");

// Or unwrap/expect for quick prototyping
let file = File::open("config.txt").expect("Config file required");
```

---

## Pattern Matching

Pattern matching enables powerful control flow.

### Match Expressions

```rust
enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(i32, i32, i32),
}

fn process(msg: Message) {
    match msg {
        Message::Quit => println!("Quit"),
        Message::Move { x, y } => println!("Move to {}, {}", x, y),
        Message::Write(text) => println!("Text: {}", text),
        Message::ChangeColor(r, g, b) => println!("Color: {},{},{}", r, g, b),
    }
}
```

### If Let

```rust
let some_value = Some(5);
if let Some(x) = some_value {
    println!("Got value: {}", x);
}
```

### While Let

```rust
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {
    println!("{}", top);
}
```

### Destructuring

```rust
let point = (3, 5);
let (x, y) = point;

struct User { name: String, age: u32 }
let user = User { name: "Alice".into(), age: 30 };
let User { name, age } = user;
```

---

## Closures

Closures are anonymous functions that capture their environment.

### Basic Syntax

```rust
let add = |a, b| a + b;
let result = add(5, 3);

// With type annotations
let add: fn(i32, i32) -> i32 = |a, b| a + b;
```

### Capturing Environment

```rust
let multiplier = 3;
let multiply = |x| x * multiplier;  // Captures multiplier

fn main() {
    let numbers = vec![1, 2, 3];
    let doubled: Vec<_> = numbers.iter().map(|x| x * 2).collect();
}
```

### Closure Traits

| Trait    | Capture Method    | Use Case                     |
| -------- | ----------------- | ---------------------------- |
| `Fn`     | Borrows immutably | Multiple calls, no mutation  |
| `FnMut`  | Borrows mutably   | Multiple calls with mutation |
| `FnOnce` | Takes ownership   | Single call, consumes values |

---

## Iterators

Iterators provide a lazy way to process sequences.

### Iterator Trait

```rust
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

### Common Iterator Methods

```rust
let numbers = vec![1, 2, 3, 4, 5];

// Transform
let doubled: Vec<_> = numbers.iter().map(|x| x * 2).collect();

// Filter
let evens: Vec<_> = numbers.iter().filter(|x| *x % 2 == 0).collect();

// Fold/Reduce
let sum: i32 = numbers.iter().sum();
let product: i32 = numbers.iter().fold(1, |acc, x| acc * x);

// Chaining
let result: Vec<_> = numbers.iter()
    .filter(|x| *x % 2 == 0)
    .map(|x| x * 2)
    .collect();
```

### Creating Iterators

```rust
// From ranges
for i in 0..10 { }

// From collections
for item in vec.iter() { }
for item in vec.iter_mut() { }
for item in vec.into_iter() { }
```

---

## Smart Pointers

Smart pointers provide additional metadata and capabilities beyond references.

### Box<T>

Heap allocation for single values:

```rust
let b = Box::new(5);
println!("b = {}", b);

// Useful for recursive types
enum List {
    Cons(i32, Box<List>),
    Nil,
}
```

### Rc<T>

Reference counting for shared ownership:

```rust
use std::rc::Rc;

let a = Rc::new(5);
let b = Rc::clone(&a);  // Increases reference count
println!("Count: {}", Rc::strong_count(&a));  // 2
```

### Arc<T>

Atomic reference counting for thread-safe shared ownership:

```rust
use std::sync::Arc;
use std::thread;

let data = Arc::new(vec![1, 2, 3]);
let handles: Vec<_> = (0..3).map(|_| {
    let data = Arc::clone(&data);
    thread::spawn(move || {
        println!("{:?}", data);
    })
}).collect();
```

### RefCell<T>

Interior mutability pattern:

```rust
use std::cell::RefCell;

let data = RefCell::new(5);
*data.borrow_mut() += 1;
println!("{}", data.borrow());  // 6
```

---

## Concurrency

Rust's ownership system prevents data races at compile time.

### Threads

```rust
use std::thread;

let handle = thread::spawn(|| {
    println!("Hello from thread!");
});

handle.join().unwrap();
```

### Message Passing

```rust
use std::sync::mpsc;
use std::thread;

let (tx, rx) = mpsc::channel();

thread::spawn(move || {
    tx.send(String::from("hello")).unwrap();
});

let received = rx.recv().unwrap();
```

### Shared State with Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

let counter = Arc::new(Mutex::new(0));
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter);
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap();
        *num += 1;
    });
    handles.push(handle);
}

for handle in handles {
    handle.join().unwrap();
}
```

### Send and Sync

- `Send`: Type can be transferred between threads
- `Sync`: Type can be referenced from multiple threads

Most types implement these traits automatically.

---

## Async/Await

Rust supports asynchronous programming with futures.

### Basic Async

```rust
async fn fetch_data() -> Result<Data, Error> {
    let response = make_request().await?;
    let data = parse_response(response).await?;
    Ok(data)
}
```

### Async Runtime

Async code requires a runtime (e.g., Tokio):

```rust
use tokio;

#[tokio::main]
async fn main() {
    let result = fetch_data().await;
    println!("{:?}", result);
}
```

### Concurrent Futures

```rust
use futures::future::join_all;

async fn fetch_all(urls: Vec<String>) -> Vec<Data> {
    let futures: Vec<_> = urls.iter()
        .map(|url| fetch_url(url))
        .collect();

    join_all(futures).await
}
```

---

## Modules and Crates

Rust organizes code into modules and crates.

### Module System

```rust
mod network {
    pub mod server {
        pub fn start() { }
    }

    mod client {
        fn connect() { }
    }
}

// Usage
use network::server;
server::start();
```

### Visibility

- `pub`: Public to parent module
- `pub(crate)`: Public within crate
- `pub(super)`: Public to parent module
- `pub(in path)`: Public within specified path

### Crate Types

- **Binary crates**: Executables with a `main` function
- **Library crates**: Reusable code without `main`

---

## Macros

Macros enable metaprogramming in Rust.

### Declarative Macros

```rust
macro_rules! vec {
    ( $( $x:expr ),* ) => {
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);
            )*
            temp_vec
        }
    };
}
```

### Procedural Macros

- **Derive macros**: `#[derive(Debug, Clone)]`
- **Attribute macros**: `#[route(GET, "/")]`
- **Function-like macros**: `sql!(SELECT * FROM users)`

---

## Conclusion

These key concepts form the foundation of Rust programming:

- **Ownership** ensures memory safety without garbage collection
- **Borrowing** allows safe references to data
- **Lifetimes** guarantee reference validity
- **Traits** provide polymorphism and shared behavior
- **Generics** enable type-safe code reuse
- **Error handling** with Result and Option is explicit and safe
- **Pattern matching** provides powerful control flow
- **Concurrency** is safe by design

Mastering these concepts enables you to write safe, performant, and maintainable
systems code.

---

_This document is part of the Phoenix Rooivalk development documentation. © 2025
Phoenix Rooivalk. All rights reserved._
