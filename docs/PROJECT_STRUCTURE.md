# Project Structure

This document describes the organization of the PhoenixRooivalk repository.

## Directory Structure

```
PhoenixRooivalk/
├── .ai/                    # AI IDE assistant configurations
│   ├── README.md
│   ├── continuerules
│   ├── cursorrules
│   └── windsurfrules
├── .github/                # GitHub workflows and actions
├── apps/                   # Application packages
│   ├── api/               # Rust API server
│   ├── docs/              # Docusaurus documentation site
│   ├── evidence-cli/      # Evidence management CLI
│   ├── keeper/            # Blockchain keeper service
│   ├── marketing/         # Next.js marketing website
│   └── threat-simulator-desktop/  # Tauri desktop simulator
├── config/                 # Tooling configurations
│   ├── README.md
│   ├── audit.toml         # Rust dependency audit
│   ├── clippy.toml        # Rust Clippy linter
│   ├── cspell.json        # Spell checker
│   ├── editorconfig       # Editor settings
│   ├── eslintrc.js        # JavaScript/TypeScript linter
│   ├── hintrc             # Web hints
│   ├── markdownlint.json  # Markdown linter
│   ├── prettierignore     # Prettier ignore patterns
│   └── prettierrc         # Code formatter
├── crates/                 # Shared Rust libraries
│   ├── address-validation/
│   ├── anchor-etherlink/
│   ├── anchor-solana/
│   ├── evidence/
│   └── phoenix-common/
├── docs/                   # Project documentation
│   ├── ENVIRONMENT_VALIDATION.md
│   ├── GAME_IMPROVEMENTS_TODO.md
│   ├── IMPLEMENTATION_COMPLETE.md
│   ├── PROJECT_STRUCTURE.md (this file)
│   ├── REFACTORING_SUMMARY.md
│   ├── UI_IMPROVEMENTS_SUMMARY.md
│   ├── VISUAL_IMPROVEMENTS_GUIDE.md
│   ├── WASM_EMBEDDING_SUMMARY.md
│   └── dev-setup.md
├── icons/                  # Application icons
├── packages/               # Shared JavaScript/TypeScript packages
│   ├── types/
│   ├── ui/
│   └── utils/
├── scripts/                # Build and deployment scripts
├── tests/                  # Integration tests
├── ACCESS.md              # Partner access information
├── CONTRIBUTING.md        # Contribution guidelines
├── Cargo.lock             # Rust dependency lock
├── Cargo.toml             # Rust workspace configuration
├── DEPLOYMENT.md          # Deployment documentation
├── LICENSE                # License information
├── README.md              # Main project documentation
├── RESPONSIBLE_USE.md     # Responsible use policy
├── SECURITY.md            # Security policy
├── package.json           # npm workspace configuration
├── pnpm-lock.yaml         # pnpm dependency lock
├── pnpm-workspace.yaml    # pnpm workspace configuration
├── tsconfig.base.json     # Shared TypeScript configuration
└── turbo.json             # Turborepo configuration
```

## Configuration Files

All tooling configuration files are stored in the `config/` directory and symlinked to the root for tool compatibility:

- **ESLint** uses `.eslintrc.js` (symlinked from `config/eslintrc.js`)
- **Prettier** uses `.prettierrc` (symlinked from `config/prettierrc`)
- **Clippy** uses `clippy.toml` (symlinked from `config/clippy.toml`)
- **CSpell** uses `cspell.json` (symlinked from `config/cspell.json`)
- **EditorConfig** uses `.editorconfig` (symlinked from `config/editorconfig`)
- **Markdownlint** uses `.markdownlint.json` (symlinked from `config/markdownlint.json`)

### Why Symlinks?

Tools expect configuration files in specific locations (usually the repository root). Using symlinks:
- Organizes configuration files in a dedicated directory
- Maintains tool compatibility
- Reduces root directory clutter
- Keeps related files together

## Gitignored Files

The following file types are excluded from version control but may exist locally:

### Database Files
- `*.db` - SQLite databases
- `*.sqlite3` - SQLite databases
- `*.sqlite` - SQLite databases

Example local files:
- `ai_linting_interactions.db` - AI linting interactions
- `blockchain_outbox.sqlite3` - Blockchain evidence outbox
- `issue_queue.db` - Issue tracking queue

### Binary Files
- `*.exe` - Windows executables
- `*.msi` - Windows installers
- `*.dmg` - macOS disk images
- `*.pkg` - macOS packages

### Large Documentation
- `*.pdf` - PDF documents (prefer markdown)

Example local files:
- `rustup-init.exe` - Rust toolchain installer
- `dev-setup.pdf` - Development setup guide

## AI IDE Assistant Configurations

AI IDE assistant rules are stored in `.ai/` directory:
- **Continue**: `.ai/continuerules`
- **Cursor**: `.ai/cursorrules`
- **Windsurf**: `.ai/windsurfrules`

These files provide project-specific context and coding standards to AI assistants.

## Documentation Organization

Project documentation is organized in the `docs/` directory:

### Development Guides
- `dev-setup.md` - Development environment setup
- `ENVIRONMENT_VALIDATION.md` - Environment variable validation

### Technical Documentation
- `REFACTORING_SUMMARY.md` - Architecture refactoring notes
- `WASM_EMBEDDING_SUMMARY.md` - WebAssembly integration
- `IMPLEMENTATION_COMPLETE.md` - Implementation milestones

### Improvement Guides
- `GAME_IMPROVEMENTS_TODO.md` - Feature roadmap
- `UI_IMPROVEMENTS_SUMMARY.md` - UI/UX improvements
- `VISUAL_IMPROVEMENTS_GUIDE.md` - Visual design system

### Meta Documentation
- `PROJECT_STRUCTURE.md` - This file

## Monorepo Structure

PhoenixRooivalk uses:
- **Turborepo** for JavaScript/TypeScript build orchestration
- **pnpm** for JavaScript/TypeScript package management
- **Cargo** for Rust workspace management

### JavaScript/TypeScript Packages
Located in `apps/` and `packages/`:
- Apps are deployable applications
- Packages are shared libraries

### Rust Crates
Located in `apps/` and `crates/`:
- Apps contain binary crates
- Crates contain library crates

## Root Directory Cleanup

Prior to reorganization, the root directory contained 40+ files. After cleanup:
- **20 files** - Essential configuration and documentation
- **8 directories** - Organized content
- **7 symlinks** - Tool compatibility

### Files Moved
- Config files → `config/`
- AI rules → `.ai/`
- Documentation → `docs/`
- Database files → gitignored (kept locally)
- Binary files → gitignored (kept locally)

## Best Practices

### Adding New Configuration
1. Create the file in `config/` directory
2. Create a symlink in root if needed: `ln -s config/filename filename`
3. Add symlink to git: `git add filename`
4. Document the configuration purpose

### Adding New Documentation
1. Create markdown file in `docs/` directory
2. Update relevant documentation index
3. Link from main README.md if necessary

### Managing Database Files
- Never commit database files to git
- Document database schema separately
- Use migrations for schema changes
- Keep local databases for development only

## Maintenance

### Updating Configuration
1. Edit files in `config/` directory
2. Changes automatically reflect via symlinks
3. Test changes with relevant tools
4. Commit from `config/` directory

### Verifying Structure
```bash
# List root files
ls -1

# List configuration files
ls -1 config/

# Verify symlinks
ls -la | grep "^l"

# Check gitignored files
git status --ignored
```

## References

- Main README: `README.md`
- Contributing guide: `CONTRIBUTING.md`
- Deployment guide: `DEPLOYMENT.md`
- Security policy: `SECURITY.md`
