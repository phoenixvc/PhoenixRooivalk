# Docs site migration plan (Docusaurus-ready)

- **Goal**

  - Prepare to migrate from Jekyll to Docusaurus (MDX) without breaking current
    pages.

- **Proposed structure**

  - docs/overview.md (from repository index-level overview)
  - docs/architecture/ (C2, comms, autonomy, safety)
  - docs/operations/ (modes, deployment, observability)
  - docs/legal/ (responsible use, access, export control)

- **Steps**

  1. Initialize Docusaurus in `docs-site/` (separate from current Jekyll root).
  2. Migrate `index.md` high‑level content to `docs/overview.md` with restricted
     banner.
  3. Move selected `docs/*.md` into topical folders; keep partner-only content
     out of the public build.
  4. Configure navbar/sidebar, add markdownlint/prettier hooks.
  5. Add deployment to GitHub Pages or Netlify (private or public per policy).

- **Notes**
  - Do not publish restricted content. Public docs remain weapon‑agnostic.

---

## Documentation Link Checking

The documentation includes automated link checking to catch broken links before
they reach production.

### Local Link Checking

Before committing documentation changes, run the link checker locally:

```bash
# From repository root
pnpm -C apps/docs run check-links

# Or from the apps/docs directory
pnpm run check-links
```

This will:

1. Build the documentation site
2. Check for broken internal links
3. Report any broken links with details on how to fix them

### Strict Build Mode

For CI/CD or strict local testing, you can use the strict build mode that fails
on any broken link:

```bash
pnpm run build:strict
```

### Common Link Issues

- **Wrong relative path depth**: Use `../../folder/file` to go up two levels
- **Missing .md extension**: Don't include `.md` in internal links
- **Case sensitivity**: File paths are case-sensitive
- **Anchor IDs**: Docusaurus generates anchors from full heading text (lowercase,
  spaces become dashes)

### CI Integration

The `docs-link-checker.yml` workflow runs automatically on:

- Pull requests that modify `apps/docs/**`
- Pushes to `main` branch
- Weekly scheduled runs
- Manual workflow dispatch

---

## Deployment and access control (Netlify)

1. Create a Netlify site for `docs-site/` and get the Site ID.
2. Add GitHub repository secrets (see `USER_TODO.md`):
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`
3. CI/CD is pre-configured in `.github/workflows/deploy-docs-site.yml`:
   - Push to `main` deploys to production.
   - Pull requests create Deploy Previews.
4. Basic access control (fastest):
   - Netlify > Site settings > Visitor access > Password protect.
5. Stronger control (optional):
   - Netlify SSO/Access Controls or Cloudflare Access (Zero Trust).
6. SEO/Indexing: `static/robots.txt` is set to `Disallow: /`.
