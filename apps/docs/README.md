# Phoenix Rooivalk Documentation Site

A comprehensive Docusaurus-based documentation site for the Phoenix Rooivalk autonomous counter-UAS defense platform.

## Current Structure

The documentation is organized into the following sections:

- **Getting Started** - Entry point with documentation home, progress tracking, and executive summary
- **Progress Reports** - Weekly development updates and progress tracking
- **Executive** - Leadership materials, investor resources, pitch decks, and strategic documents
- **Technical** - Software architecture, AI/ML systems, hardware specifications, blockchain integration, and development guides
- **Business** - Market analysis, business models, competitive analysis, ROI analysis, and proposal templates
- **Operations** - Deployment guides, maintenance procedures, training materials, and operational modes
- **Legal** - Compliance frameworks and legal documentation
- **Research** - Deep-dive technical research and analysis
- **Resources** - Downloads, guides, troubleshooting, and reference materials
- **Playbooks** - Strategic roadmaps and execution guides

## Features

- **Docusaurus 3.9** with MDX support
- **Azure Static Web Apps** deployment with automatic CI/CD
- **Azure Functions** integration for serverless backend features
- **Azure Entra ID** authentication (formerly Azure AD)
- **AI-powered features** with Azure OpenAI integration
- **Local search** with `@easyops-cn/docusaurus-search-local`
- **Mermaid diagrams** support
- **PWA** capabilities with offline support
- **Analytics** integration with Azure Application Insights
- **Link checking** automation in CI/CD

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

## Development

### Local Development

```bash
# From repository root
pnpm --filter docs start

# Or from apps/docs directory
pnpm start
```

The site will be available at `http://localhost:3000`.

### Building

```bash
# Standard build
pnpm run build

# Strict build (fails on broken links)
pnpm run build:strict
```

### Linting and Formatting

```bash
# Check formatting and markdown linting
pnpm run lint

# Fix markdown linting issues
pnpm run lint:fix

# Format code
pnpm run format
```

### Type Checking

```bash
pnpm run typecheck
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm run test:watch

# With coverage
pnpm run test:coverage
```

## Deployment and Access Control

The documentation site is deployed to **Azure Static Web Apps** via GitHub Actions. See `.github/workflows/deploy-docs-azure.yml` for the deployment workflow.

### Deployment Triggers

- **Production**: Automatic deployment on push to `main` branch when `apps/docs/**` files change
- **Preview**: Automatic preview deployments for pull requests
- **Manual**: Can be triggered via `workflow_dispatch`

### Required Configuration

**GitHub Secrets:**

- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Deployment token for Azure Static Web Apps
- `AZURE_ENTRA_TENANT_ID` - Azure Entra ID (formerly Azure AD) tenant ID for authentication
- `AZURE_ENTRA_CLIENT_ID` - Azure Entra ID client ID for authentication
- `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` - Publish profile XML for Azure Functions deployment
- Additional secrets for AI features - see `TROUBLESHOOTING.md`

**GitHub Variables:**

- `AZURE_FUNCTIONAPP_NAME` - Function app name (e.g., `phoenix-rooivalk-functions`)
- `AZURE_FUNCTIONS_BASE_URL` - Azure Functions base URL (can also be a Secret)
- `AZURE_AI_DEPLOYMENT_NAME` - AI model deployment name (e.g., `gpt-5.1`)
- `CONFIGURE_APP_SETTINGS` - Set to `true` to auto-configure Function App settings

> **Note**: `AZURE_FUNCTIONAPP_NAME` must be a **Variable**, not a Secret. See `.github/AZURE_SETUP.md` for detailed setup instructions.

### Troubleshooting

If you see "⚠️ AI Functions not available" or other configuration issues, see **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** for detailed diagnostic steps.

Common issues:

- `AZURE_FUNCTIONS_BASE_URL` not set or set incorrectly
- Variable scope set to "Runtime" instead of "Builds"
- Azure Functions not deployed or unhealthy
- Azure OpenAI configuration missing

---

## Additional Resources

- **[CONFIGURATION.md](./CONFIGURATION.md)** - Detailed configuration guide for Azure setup, authentication, analytics, and features
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions, especially for Azure Functions and AI features
- **[FRONTMATTER_SCHEMA.md](./FRONTMATTER_SCHEMA.md)** - Documentation frontmatter schema and metadata
- **[.github/AZURE_SETUP.md](../../.github/AZURE_SETUP.md)** - Complete Azure infrastructure setup guide
- **[.github/SECRETS_SETUP.md](../../.github/SECRETS_SETUP.md)** - GitHub secrets and variables configuration
