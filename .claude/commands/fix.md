Auto-fix all formatting and linting issues in the project.

Run these steps sequentially:
1. `pnpm format` — Apply Prettier formatting to all files
2. `pnpm lint --fix` — Auto-fix ESLint issues (note: turbo may not pass --fix, so run `pnpm --filter marketing lint -- --fix` etc. for each app if needed)
3. `cargo fmt --all` — Format all Rust code

Report what was changed and if any issues remain that need manual intervention.
