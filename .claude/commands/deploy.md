# Deploy

Deploy an app or infrastructure component.

Arguments: $ARGUMENTS

If no argument is provided, show available deployment targets.

If an argument is provided, deploy the specified target:

- `marketing` → Azure Static Web Apps (`.github/workflows/deploy-marketing-azure.yml`)
- `docs` → Azure Static Web Apps (`.github/workflows/deploy-docs-azure.yml`)
- `functions` → Azure Functions (`.github/workflows/deploy-azure-functions.yml`)
- `infra` → Azure Bicep infrastructure (`.github/workflows/deploy-infrastructure.yml`)
- `desktop` → Tauri desktop release (`.github/workflows/release-desktop.yml`)
- `ml` → ML training pipeline (`.github/workflows/ml-training.yml`)

For each deployment:

1. Check prerequisites (clean git state, correct branch, env vars)
2. Show the deployment workflow and what it will do
3. Confirm with the user before triggering
4. Monitor deployment status via `gh run list` and `gh run view`

Never trigger a deployment without explicit user confirmation. Show the
target environment (dev/stg/prd) and any risks before proceeding.
