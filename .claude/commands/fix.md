Auto-fix all formatting and linting issues across all languages.

**TypeScript/JavaScript:**
1. `pnpm format` — Apply Prettier formatting
2. Run ESLint with fix for each app that has lint configured

**Rust:**
3. `cargo fmt --all` — Format all Rust code

**Python (apps/detector/):**
4. `cd apps/detector && ruff check --fix src/` — Auto-fix Python lint issues
5. `cd apps/detector && black src/` — Apply Black formatting
6. `cd apps/detector && isort src/` — Sort imports

Report what was changed and if any issues remain that need manual intervention.
