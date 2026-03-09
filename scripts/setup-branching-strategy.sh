#!/usr/bin/env bash
# =============================================================================
# PhoenixRooivalk Git Branching Strategy Setup
# =============================================================================
# This script completes Phase 1 (consolidation) and Phase 2 (branch protection)
# of the branching strategy migration.
#
# Prerequisites:
#   - gh CLI installed and authenticated (gh auth login)
#   - Push access to the repository
#   - Admin access for branch protection rules
#
# Usage: ./scripts/setup-branching-strategy.sh
# =============================================================================

set -euo pipefail

REPO="phoenixvc/PhoenixRooivalk"
CONSOLIDATION_BRANCH="claude/consolidation-ZOwoO"

echo "=========================================="
echo "PhoenixRooivalk Branching Strategy Setup"
echo "=========================================="

# ─── Phase 1A: Close open PRs with consolidation comment ─────────────

echo ""
echo "--- Phase 1A: Closing open PRs (consolidated) ---"

PR_NUMBERS=(662 652 651 650 649 648 646 641 625 618)
COMMENT="This PR has been consolidated into a unified consolidation branch (\`${CONSOLIDATION_BRANCH}\`) along with all other open PRs and branches.

The changes from this PR (where compatible) have been merged. Incompatible dependency updates (reqwest_compat 0.13 and rand_core 0.10) were reverted due to conflicts with existing crates.

A single consolidation PR will merge all consolidated work into \`main\`. Closing as consolidated."

for pr in "${PR_NUMBERS[@]}"; do
  echo "  Closing PR #${pr}..."
  gh pr comment "$pr" --repo "$REPO" --body "$COMMENT" 2>/dev/null || true
  gh pr close "$pr" --repo "$REPO" --comment "Closed: consolidated" 2>/dev/null || echo "  (PR #${pr} may already be closed)"
done

echo "  All PRs processed."

# ─── Phase 1B: Delete merged branches ────────────────────────────────

echo ""
echo "--- Phase 1B: Deleting merged branches ---"

BRANCHES_TO_DELETE=(
  "copilot/fix-tier-api-import-example"
  "renovate/actions-checkout-6.x"
  "renovate/actions-rust-lang-setup-rust-toolchain-digest"
  "renovate/actions-setup-node-6.x"
  "renovate/azure-sdk-for-rust-monorepo"
  "renovate/openai-6.x-lockfile"
  "renovate/orhun-git-cliff-action-4.x"
  "renovate/orhun-git-cliff-action-digest"
  "renovate/rand_core-0.x"
  "renovate/reqwest_compat-0.x"
  "renovate/tempfile-3.x-lockfile"
  "test/track-persistence-coverage-5214065983016040710"
)

for branch in "${BRANCHES_TO_DELETE[@]}"; do
  echo "  Deleting branch: ${branch}..."
  git push origin --delete "$branch" 2>/dev/null || echo "  (branch ${branch} may already be deleted)"
done

echo "  All branches processed."

# ─── Phase 1C: Create consolidation PR and merge ─────────────────────

echo ""
echo "--- Phase 1C: Creating consolidation PR ---"

PR_BODY="$(cat <<'PRBODY'
## Summary

Consolidation of all open PRs and branches into a single merge to main.

### Merged PRs:
- #662: chore(deps): update actions-rust-lang/setup-rust-toolchain digest
- #652: chore(deps): update actions/setup-node action to v6
- #651: chore(deps): update actions/checkout action to v6
- #650: fix(deps): update rust crate rand_core to 0.10 (**reverted** - incompatible with ed25519-dalek v2)
- #649: chore(deps): update rust crate tempfile to v3.26.0
- #648: chore(deps): update orhun/git-cliff-action action to v4.7.1
- #646: chore(deps): update dependency openai to v6.25.0
- #641: chore(deps): update orhun/git-cliff-action digest (**conflict resolved** - kept v4.7.1)
- #625: fix(deps): update rust crate reqwest_compat to 0.13 (**reverted** - azure_core requires reqwest 0.12)
- #618: fix(deps): update azure-sdk-for-rust monorepo

### Additional branches merged:
- test/track-persistence-coverage (new test file)
- copilot/fix-tier-api-import-example (already in main)

### Fixes applied:
- Resolved merge conflict in release.yml (kept git-cliff-action v4.7.1)
- Reverted reqwest_compat to 0.12 (azure_core compatibility)
- Reverted rand_core to 0.6 (ed25519-dalek v2 compatibility)
- Fixed Prettier formatting in 7 files

### Verification:
- [x] Rust check passes (workspace, excluding Tauri desktop - needs system GTK libs)
- [x] Cargo clippy passes with -D warnings
- [x] Cargo fmt check passes
- [x] ESLint passes (warnings only, no errors)
- [x] Prettier check passes
- [x] TypeScript typecheck passes
- [x] Marketing tests pass (452 tests)
- [x] Rust tests pass

## Test plan
- [ ] Verify CI passes on the PR
- [ ] Review dependency changes
- [ ] Merge to main
PRBODY
)"

gh pr create \
  --repo "$REPO" \
  --base main \
  --head "$CONSOLIDATION_BRANCH" \
  --title "chore: consolidate all open PRs and branches into main" \
  --body "$PR_BODY"

echo ""
echo "  PR created. Review and merge it, then continue with Phase 1D."
echo "  Press Enter to continue after merging the PR..."
read -r

# ─── Phase 1D: Clean up consolidation branch ─────────────────────────

echo ""
echo "--- Phase 1D: Cleaning up consolidation branch ---"

git push origin --delete "$CONSOLIDATION_BRANCH" 2>/dev/null || true
# Also clean up the other claude/ branch if it exists
git push origin --delete "claude/git-branching-strategy-ZOwoO" 2>/dev/null || true

echo "  Consolidation branch deleted."

# ─── Phase 2A: Create dev branch from main ───────────────────────────

echo ""
echo "--- Phase 2A: Creating dev branch from main ---"

git fetch origin main
git checkout main
git pull origin main
git checkout -b dev
git push -u origin dev

echo "  dev branch created from main."

# ─── Phase 2B: Set up branch protection for main ─────────────────────

echo ""
echo "--- Phase 2B: Setting up branch protection for main ---"

# Create a repository ruleset for main branch protection
# Using GitHub API via gh for maximum control
gh api repos/$REPO/rulesets \
  --method POST \
  --input - << 'RULESET'
{
  "name": "Protect main branch",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": []
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ]
}
RULESET

echo "  Branch protection ruleset created for main."

# ─── Phase 2C: Set up branch protection for dev ──────────────────────

echo ""
echo "--- Phase 2C: Setting up branch protection for dev ---"

gh api repos/$REPO/rulesets \
  --method POST \
  --input - << 'RULESET'
{
  "name": "Protect dev branch",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/dev"],
      "exclude": []
    }
  },
  "rules": [
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ]
}
RULESET

echo "  Branch protection ruleset created for dev."

echo ""
echo "=========================================="
echo "Setup complete!"
echo ""
echo "Workflow going forward:"
echo "  feature/* --> PR --> dev --> PR --> main"
echo ""
echo "See docs/branching-strategy.md"
echo "=========================================="
