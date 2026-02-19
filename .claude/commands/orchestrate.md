# Orchestrate

Master coordinator for autonomous multi-team development.

Arguments: $ARGUMENTS

Supported arguments:
- `--phase N` — Run only phase N (1-4)
- `--team NAME` — Run only the named team (backend, frontend, python, devops,
  product, design, marketing, finance, docs, quality)
- `--discover` — Run discovery scan only
- `--assess-only` — Scan and grade without making changes
- `--status` — Show current state and next action
- `--reset` — Reset state to template defaults
- `--auto-commit` — Commit after each team completes

## Orchestration Loop

Execute these steps sequentially:

### Step 1: Load State

Read `.claude/state/orchestrator.json`. If it doesn't exist, copy from
`.claude/state/orchestrator.json.template` and initialize.

### Step 2: Discovery Scan

Run `/project:discover` to collect current metrics:

1. Build status: `pnpm build`, `cargo check`
2. Test status: Run all test suites, collect pass/fail/skip counts
3. TODO/FIXME count: `grep -rn "TODO\|FIXME\|HACK\|STUB" apps/ crates/`
4. Lint status: `pnpm format:check`, `cargo fmt --check`, `cargo clippy`
5. Backlog counts: Parse `AGENT_BACKLOG.md` for P0/P1/P2/P3 totals

Update `current_metrics` in state.

### Step 3: Assess Team Health

Grade each team A-F based on:
- **A**: No stubs, no TODOs, tests pass, lint clean
- **B**: Minor TODOs, tests pass, lint clean
- **C**: Some stubs or failing tests
- **D**: Multiple stubs, test failures, lint errors
- **F**: Build failures or critical blockers

Use grades to determine which phase to run. Don't follow a fixed sequence —
prioritize the lowest-graded teams.

### Step 4: Healthcheck

Run `/project:healthcheck` to verify prerequisites:
- Build must pass before any changes
- No merge conflicts
- Branch is clean or changes are committed

If healthcheck fails, fix blockers before proceeding.

### Step 5: Dispatch Teams

Based on the current phase, dispatch teams in parallel where possible.
Reference `AGENT_TEAMS.md` for team scopes and outstanding work.

**Phase 1** (Foundation): Teams 1 (Backend), 3 (Python), 4 (DevOps)
**Phase 2** (Frontend): Teams 2 (Frontend), 5 (Product), 8 (Finance)
**Phase 3** (Quality): Teams 6 (Design), 7 (Marketing), 9 (Docs), 10 (Quality)
**Phase 4** (Sweep): Teams 4 (DevOps), 9 (Docs), 10 (Quality)

For each team:
1. Read the team's scope from `AGENT_TEAMS.md`
2. Read outstanding items from `AGENT_BACKLOG.md`
3. Execute the highest-priority items for that team
4. Mark completed items in the backlog

### Step 6: Collect Results

After team execution:
1. Re-run discovery scan
2. Compare before/after metrics
3. Record delta in `phase_history`

### Step 7: Sync Backlog

Update `AGENT_BACKLOG.md`:
- Mark completed items (change ID to ~~strikethrough~~)
- Add newly discovered items
- Update file:line references if code shifted
- Never delete items without evidence of completion

### Step 8: Persist State

Write updated metrics, grades, and history to
`.claude/state/orchestrator.json`.

### Step 9: Report

Output a summary:

```text
## Orchestrator Report

Phase: N | Teams dispatched: X
Duration: ~Nm

### Before/After Metrics
| Metric | Before | After | Delta |
|--------|--------|-------|-------|

### Team Grades
| Team | Grade | Change |
|------|-------|--------|

### Backlog Movement
- Completed: N items
- Added: N items
- Remaining: P0=N, P1=N, P2=N, P3=N

### Next Action
[What to do next, or defer to next session]
```

If the context window is getting large (>50% used), save state and defer
remaining work to the next session.
