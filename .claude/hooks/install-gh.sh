#!/bin/sh
# SessionStart hook: Install gh CLI if not available
# Downloads a portable gh CLI binary so GitHub API operations work in
# Claude Code remote sessions (where apt is unavailable).
#
# To update the pinned version, either:
#   1. Set GH_VERSION env var before running (e.g. GH_VERSION=2.70.0)
#   2. Edit the default below
#   3. Check latest at: https://github.com/cli/cli/releases/latest

set -e

if command -v gh >/dev/null 2>&1; then
  exit 0
fi

echo "Installing gh CLI..."

# Allow override via environment variable or script argument
GH_VERSION="${GH_VERSION:-2.67.0}"
GH_ARCHIVE="gh_${GH_VERSION}_linux_amd64.tar.gz"
GH_URL="https://github.com/cli/cli/releases/download/v${GH_VERSION}/${GH_ARCHIVE}"
INSTALL_DIR="/usr/local/bin"

# Fall back to user-local bin if /usr/local/bin is not writable
if [ ! -w "$INSTALL_DIR" ]; then
  if command -v sudo >/dev/null 2>&1; then
    USE_SUDO=1
  else
    INSTALL_DIR="${HOME}/.local/bin"
    mkdir -p "$INSTALL_DIR"
    # Ensure ~/.local/bin is on PATH for the current session
    case ":$PATH:" in
      *":$INSTALL_DIR:"*) ;;
      *) export PATH="$INSTALL_DIR:$PATH" ;;
    esac
  fi
fi

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

if [ "${USE_SUDO:-}" = "1" ]; then
  sudo cp "$tmpdir/gh_${GH_VERSION}_linux_amd64/bin/gh" "$INSTALL_DIR/gh"
  sudo chmod +x "$INSTALL_DIR/gh"
else
  cp "$tmpdir/gh_${GH_VERSION}_linux_amd64/bin/gh" "$INSTALL_DIR/gh" || {
    echo "Error: Failed to copy gh to $INSTALL_DIR. Check permissions or set GH_VERSION and retry."
    exit 1
  }
  chmod +x "$INSTALL_DIR/gh"
fi

echo "gh CLI v${GH_VERSION} installed to $INSTALL_DIR/gh"
