#!/bin/sh
# SessionStart hook: Install gh CLI if not available
# Downloads a portable gh CLI binary so GitHub API operations work in
# Claude Code remote sessions (where apt is unavailable).

set -e

if command -v gh >/dev/null 2>&1; then
  exit 0
fi

echo "Installing gh CLI..."

GH_VERSION="2.67.0"
GH_ARCHIVE="gh_${GH_VERSION}_linux_amd64.tar.gz"
GH_URL="https://github.com/cli/cli/releases/download/v${GH_VERSION}/${GH_ARCHIVE}"
INSTALL_DIR="/usr/local/bin"

# Download and extract
tmpdir=$(mktemp -d)
trap 'rm -rf "$tmpdir"' EXIT

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$GH_URL" -o "$tmpdir/$GH_ARCHIVE"
elif command -v wget >/dev/null 2>&1; then
  wget -q "$GH_URL" -O "$tmpdir/$GH_ARCHIVE"
else
  echo "Warning: Neither curl nor wget available, skipping gh install"
  exit 0
fi

tar -xzf "$tmpdir/$GH_ARCHIVE" -C "$tmpdir"
cp "$tmpdir/gh_${GH_VERSION}_linux_amd64/bin/gh" "$INSTALL_DIR/gh"
chmod +x "$INSTALL_DIR/gh"

echo "gh CLI v${GH_VERSION} installed to $INSTALL_DIR/gh"
