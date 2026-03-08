# Code Review

Perform a comprehensive code review of the specified files or area.

Arguments: $ARGUMENTS

If an argument is provided, scope the review to that path, app, or feature area.
If no argument is provided, review recently changed files. Collect targets from:

1. `git diff --name-only` — unstaged changes
2. `git diff --cached --name-only` — staged changes
3. `git diff --name-only HEAD~1` — last commit (fallback if 1+2 are empty)

## Review Checklist

Work through each category in `.claude/commands/review-checklist.md`. For every
finding, cite the file path and line number.

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
