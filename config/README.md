# Configuration Files

This directory contains all tooling configuration files for the PhoenixRooivalk project.

## Files

### Linting & Formatting
- **eslintrc.js** — ESLint configuration for JavaScript/TypeScript linting
- **prettierrc** — Prettier configuration for code formatting
- **prettierignore** — Files/patterns to exclude from Prettier formatting

### Code Quality
- **clippy.toml** — Rust Clippy linter configuration
- **audit.toml** — Rust dependency audit configuration
- **editorconfig** — Editor configuration for consistent coding styles

### Documentation & Spell Checking
- **cspell.json** — CSpell configuration for spell checking in code and docs
- **markdownlint.json** — Markdown linting rules

### Web Hints
- **hintrc** — Webhint configuration for web best practices

## Symlinks

Configuration files are symlinked to the repository root for tool compatibility:
- Tools expect config files in specific locations
- Symlinks maintain compatibility while organizing files
- Root symlinks: `.eslintrc.js`, `.prettierrc`, `.prettierignore`, `.editorconfig`, `.markdownlint.json`, `clippy.toml`, `cspell.json`

## Usage

These configuration files are automatically used by their respective tools:
```bash
# ESLint uses .eslintrc.js (symlinked from config/eslintrc.js)
pnpm lint

# Prettier uses .prettierrc (symlinked from config/prettierrc)
pnpm format

# Clippy uses clippy.toml (symlinked from config/clippy.toml)
cargo clippy
```

## Editing Configuration

1. Edit files in the `config/` directory
2. Changes are automatically reflected via symlinks
3. Commit changes from the `config/` directory
4. Do not commit the symlinks themselves (they're tracked in git)
