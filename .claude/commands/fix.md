# Fix

Auto-fix all formatting and linting issues across all languages.

**TypeScript/JavaScript:**

1. `pnpm format` — Apply Prettier formatting
2. `npx eslint --fix .` — Auto-fix ESLint issues

**Rust:**

1. `cargo fmt --all` — Format all Rust code

**Python (apps/detector/):**

1. `cd apps/detector && ruff check --fix src/` — Auto-fix Python lint issues
2. `cd apps/detector && black src/` — Apply Black formatting
3. `cd apps/detector && isort src/` — Sort imports

Report what was changed and if any issues remain that need manual intervention.
