# Git Branching Strategy

## Branch Hierarchy

```text
main (production-ready)
 └── dev (integration/staging)
      ├── feature/add-radar-overlay
      ├── fix/header-alignment
      ├── chore/update-deps
      └── ...
```

## Branch Roles

| Branch       | Purpose                        | Protected | Merge Target |
| ------------ | ------------------------------ | --------- | ------------ |
| `main`       | Production-ready code          | Yes       | (release)    |
| `dev`        | Integration and staging branch | Yes       | `main`       |
| `feature/*`  | New features                   | No        | `dev`        |
| `fix/*`      | Bug fixes                      | No        | `dev`        |
| `chore/*`    | Maintenance, deps, CI          | No        | `dev`        |
| `docs/*`     | Documentation changes          | No        | `dev`        |
| `test/*`     | Test additions/changes         | No        | `dev`        |
| `refactor/*` | Code refactoring               | No        | `dev`        |

## Workflow

### 1. Creating a Feature Branch

Always branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-new-feature
```

### 2. Making Changes

Work on your branch, commit using conventional commits:

```bash
git add .
git commit -m "feat: add tactical grid overlay"
```

### 3. Creating a Pull Request to dev

Push your branch and create a PR targeting `dev`:

```bash
git push -u origin feature/my-new-feature
# Create PR: feature/my-new-feature -> dev
```

PR requirements for merging into `dev`:

- At least 1 approving review
- All CI status checks must pass
- Branch must be up to date with `dev`

### 4. Promoting dev to main

When `dev` is stable and ready for release:

```bash
# Create PR: dev -> main
```

PR requirements for merging into `main`:

- At least 1 approving review
- Stale reviews are dismissed when new commits are pushed
- All CI status checks must pass
- Branch must be up to date with `main`
- Only repository administrators can bypass

### 5. Hotfixes

For critical production fixes that can't wait for the normal flow:

```bash
git checkout main
git pull origin main
git checkout -b fix/critical-security-patch
# Make fix, then PR directly to main (requires admin bypass or expedited review)
# After merging to main, also merge main back into dev:
git checkout dev
git merge main
git push origin dev
```

## Branch Protection Rules

### main Branch

- Require pull request reviews (minimum 1 reviewer)
- Dismiss stale PR approvals on new commits
- Require branches to be up to date before merging
- Require status checks to pass
- Only administrators can push directly

### dev Branch

- Require pull request reviews (minimum 1 reviewer)
- Dismiss stale PR approvals on new commits
- Require status checks to pass

## Naming Conventions

Branch names should follow this pattern:

```text
<type>/<short-description>
```

Types match conventional commit prefixes:

- `feature/` - New functionality
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation
- `test/` - Test changes
- `refactor/` - Code refactoring
- `perf/` - Performance improvements

Examples:

- `feature/add-radar-overlay`
- `fix/header-gap-spacing`
- `chore/update-rust-deps`
- `docs/api-endpoint-guide`

## Automated Dependency Updates

Renovate bot creates PRs targeting `main`. After this migration, configure
Renovate to target `dev` instead by updating `renovate.json`:

```json
{
  "baseBranches": ["dev"]
}
```

## CI/CD Integration

CI workflows should run on:

- Pull requests to `dev` and `main`
- Pushes to `dev` and `main`

Deployment:

- Merges to `dev` can trigger staging deployments
- Merges to `main` trigger production deployments
