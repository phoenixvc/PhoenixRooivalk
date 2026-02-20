# PR Review

Review a GitHub pull request.

Arguments: $ARGUMENTS

If an argument is provided, use it as the PR number or URL. If no argument is
provided, detect the current branch's open PR using
`gh pr view --json number,title,baseRefName,headRefName,url`.

## Steps

1. **Fetch PR metadata:**
   `gh pr view <PR> --json number,title,body,baseRefName,headRefName,files,additions,deletions,url`

2. **Get the full diff:** `gh pr diff <PR>`

3. **List PR comments and review comments:**
   `gh pr view <PR> --json comments,reviews`

4. **Check CI status:** `gh pr checks <PR>`

## Review Checklist

Review every changed file in the diff. Work through each category in
`.claude/commands/review-checklist.md`. For every finding, cite the file path
and line number.

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
3. **CI status** — pass/fail summary from `gh pr checks`
4. **Verdict** — APPROVE, REQUEST_CHANGES, or COMMENT with rationale
