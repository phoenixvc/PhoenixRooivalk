# Documentation Staging Area

This folder is a **temporary staging area** for refining PhoenixRooivalk documentation. The live site continues to use `docs/`; nothing here is built or published until content is promoted.

## Purpose

- **Refine** new catalog structure and content without touching existing docs
- **Draft** index files, new domains, and referenced docs (runbooks, playbooks, EDR, etc.)
- **Promote** when ready: copy or move content from `docs-staging/` into `docs/`, then remove or archive this folder

## Structure

Staging mirrors the [Documentation Catalog](index.mdx) layout:

- `business/` — portfolio, PRDs
- `technical/` — architecture (diagrams, interfaces, subsystems, products), ML, hardware, control
- `engineering/` — playbooks
- `operations/` — runbooks (preferred over root-level ops docs)
- `legal/` — compliance, policies
- `internal/` — catalog governance, EDR

Each folder has an `index.mdx` as the entry point; add or edit docs under the appropriate subfolder.

## Conventions (same as catalog)

- Kebab-case filenames
- EDR: `YYYY-MM-DD-short-title.mdx` in `internal/edr/`
- One `index.mdx` per folder listing that folder’s docs

## Previewing staging (optional)

The Docusaurus app currently reads from `docs/`. To preview this staging content you can:

1. Temporarily point the preset in `docusaurus.config.ts` at `docs-staging` instead of `docs`, or
2. Use a script that copies `docs-staging/*` to a temp dir and runs build from there.

Do not commit a permanent switch to staging; keep production on `docs/`.
