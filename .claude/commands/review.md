# Code Review

Perform a comprehensive code review of the specified files or area.

Arguments: $ARGUMENTS

If an argument is provided, scope the review to that path, app, or feature area.
If no argument is provided, review the most recently changed files (use `git diff --name-only HEAD~1`).

## Review Checklist

Work through each category below. For every finding, cite the file path and line number.

### 1. Bugs and Correctness

- Logic errors, off-by-one, wrong operator, inverted conditions
- Null/undefined access, unhandled error paths, missing awaits
- Race conditions, stale closures, memory leaks
- Incorrect types or unsafe casts

### 2. Mistakes and Oversights

- Copy-paste errors, dead code, unreachable branches
- Mismatched function signatures vs callers
- Wrong variable names shadowing outer scope
- Hardcoded values that should be configurable
- Missing input validation at system boundaries

### 3. Incomplete Features

- TODO/FIXME/HACK comments left in code
- Stub implementations or placeholder returns
- Missing error handling (bare unwrap, empty catch)
- Partial implementations (e.g., only handles happy path)
- Missing tests for new or changed logic

### 4. SOLID and DRY Improvements

- **S** — Functions/components doing too many things
- **O** — Code that should be extensible but requires modification
- **L** — Subtypes that violate parent contracts
- **I** — Interfaces that force unused implementations
- **D** — High-level modules depending on concrete implementations
- **DRY** — Duplicated logic that should be extracted

### 5. Security

- Unsanitized user input (XSS, injection, path traversal)
- Secrets or credentials in code
- Missing auth/authz checks on endpoints
- Unsafe deserialization or eval-like patterns
- OWASP Top 10 violations

### 6. Performance

- N+1 queries or unnecessary database calls
- Missing indexes for frequent query patterns
- Expensive operations inside loops or render cycles
- Large bundles, missing code splitting, unoptimized assets
- Unnecessary re-renders (React) or clones (Rust)

### 7. Related Features and Enhancements

Identify opportunities that naturally extend the reviewed code:

- Missing edge cases the feature should handle
- Related functionality users would expect
- Integration points with other parts of the system
- Accessibility, i18n, or observability gaps

## Output Format

For each finding, use this format:

```text
[SEVERITY] Category — file_path:line_number
Description of the issue.
Suggested fix (if applicable).
```

Severities: CRITICAL (must fix), WARNING (should fix), INFO (consider).

At the end, provide:

1. **Summary table** — counts by severity and category
2. **Priority list** — top 5 items to fix first, ordered by impact
3. **Architecture notes** — any structural concerns or refactoring suggestions
