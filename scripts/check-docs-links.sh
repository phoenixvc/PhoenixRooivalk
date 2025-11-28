#!/usr/bin/env bash
# Script to check for broken links in documentation before committing
# Usage: ./scripts/check-docs-links.sh
#
# This script runs the Docusaurus build and checks for broken link warnings.
# It's designed to be run locally before committing documentation changes.

set -e

# Ensure we're running in Bash (required for PIPESTATUS)
if [ -z "$BASH_VERSION" ]; then
    echo "Error: This script requires Bash. Please run with: bash $0"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔗 Checking documentation for broken links...${NC}"
echo ""

# Navigate to docs directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_DIR="$SCRIPT_DIR/../apps/docs"

if [ ! -d "$DOCS_DIR" ]; then
    echo -e "${RED}Error: Documentation directory not found at $DOCS_DIR${NC}"
    exit 1
fi

cd "$DOCS_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pnpm install --frozen-lockfile || pnpm install
fi

# Run build and capture output
BUILD_LOG=$(mktemp)
echo -e "${BLUE}Running documentation build...${NC}"
echo ""

set +e  # Don't exit on error
pnpm run build 2>&1 | tee "$BUILD_LOG"
BUILD_EXIT_CODE=${PIPESTATUS[0]}
set -e

echo ""

# Check for broken links
if grep -q "Docusaurus found broken links" "$BUILD_LOG"; then
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ BROKEN LINKS DETECTED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Extract and display broken links
    grep -A 100 "Exhaustive list of all broken links found" "$BUILD_LOG" | head -60
    
    echo ""
    echo -e "${YELLOW}How to fix broken links:${NC}"
    echo -e "  1. Check that the target file exists"
    echo -e "  2. Use relative paths (./filename or ../folder/filename)"
    echo -e "  3. Don't include .md extension in links"
    echo -e "  4. Ensure document IDs match frontmatter 'id' fields"
    echo -e "  5. Check for typos in file paths"
    echo ""
    
    rm "$BUILD_LOG"
    exit 1
else
    rm "$BUILD_LOG"
    
    if [ $BUILD_EXIT_CODE -ne 0 ]; then
        echo -e "${RED}Build failed for other reasons (exit code: $BUILD_EXIT_CODE)${NC}"
        exit $BUILD_EXIT_CODE
    fi
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ NO BROKEN LINKS FOUND${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "All documentation links are valid. Safe to commit!"
fi
