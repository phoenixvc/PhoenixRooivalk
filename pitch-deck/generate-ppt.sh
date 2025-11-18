#!/bin/bash
# Pitch Deck PowerPoint Generation Script
# Version: 1.0
# Usage: ./generate-ppt.sh [version]

set -e

VERSION="${1:-v2.0}"
SOURCE_FILE="PITCH_DECK_${VERSION}.md"
OUTPUT_BASE="PhoenixRooivalk_Pitch_Deck_${VERSION}"

echo "🚀 PhoenixRooivalk Pitch Deck Generator"
echo "======================================"
echo "Version: ${VERSION}"
echo "Source: ${SOURCE_FILE}"
echo ""

# Check if source file exists
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Error: Source file ${SOURCE_FILE} not found!"
    exit 1
fi

# Check for required tools
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "⚠️  Warning: $1 not found. Install with: $2"
        return 1
    fi
    echo "✅ $1 found"
    return 0
}

echo "Checking for required tools..."
MARP_AVAILABLE=false
PANDOC_AVAILABLE=false

if check_tool "marp" "npm install -g @marp-team/marp-cli"; then
    MARP_AVAILABLE=true
fi

if check_tool "pandoc" "brew install pandoc (macOS) or apt-get install pandoc (Linux)"; then
    PANDOC_AVAILABLE=true
fi

echo ""

# Generate with Marp (best for presentations)
if [ "$MARP_AVAILABLE" = true ]; then
    echo "📊 Generating PowerPoint with Marp..."
    marp "${SOURCE_FILE}" \
        --output "${OUTPUT_BASE}_marp.pptx" \
        --theme default \
        --allow-local-files
    echo "✅ Created: ${OUTPUT_BASE}_marp.pptx"
    
    echo "📄 Generating PDF with Marp..."
    marp "${SOURCE_FILE}" \
        --output "${OUTPUT_BASE}.pdf" \
        --pdf \
        --allow-local-files
    echo "✅ Created: ${OUTPUT_BASE}.pdf"
fi

# Generate with Pandoc (alternative)
if [ "$PANDOC_AVAILABLE" = true ]; then
    echo "📊 Generating PowerPoint with Pandoc..."
    pandoc "${SOURCE_FILE}" \
        -o "${OUTPUT_BASE}_pandoc.pptx" \
        --slide-level=2
    echo "✅ Created: ${OUTPUT_BASE}_pandoc.pptx"
fi

# Generate HTML version (always available)
echo "🌐 Generating HTML presentation..."
cat > "${OUTPUT_BASE}.html" << 'HTMLEND'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PhoenixRooivalk Pitch Deck</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #0F172A;
            color: #CBD5E1;
        }
        h1 { color: #F97316; border-bottom: 3px solid #F97316; padding-bottom: 10px; }
        h2 { color: #FBBF24; margin-top: 40px; }
        h3 { color: #CBD5E1; }
        code { background: #1E293B; padding: 2px 6px; border-radius: 3px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border: 1px solid #334155; }
        th { background: #1E293B; color: #FBBF24; }
        a { color: #60A5FA; text-decoration: none; }
        a:hover { text-decoration: underline; }
        .slide { page-break-after: always; min-height: 100vh; padding: 40px; }
        .slide:last-child { page-break-after: auto; }
        @media print {
            .slide { page-break-after: always; }
        }
    </style>
</head>
<body>
HTMLEND

# Convert markdown to HTML (basic conversion)
if [ "$PANDOC_AVAILABLE" = true ]; then
    pandoc "${SOURCE_FILE}" -f markdown -t html >> "${OUTPUT_BASE}.html"
else
    echo "<pre>$(cat ${SOURCE_FILE})</pre>" >> "${OUTPUT_BASE}.html"
fi

cat >> "${OUTPUT_BASE}.html" << 'HTMLEND'
</body>
</html>
HTMLEND

echo "✅ Created: ${OUTPUT_BASE}.html"

echo ""
echo "📦 Generation complete!"
echo "======================================"
echo "Files created:"
ls -lh PhoenixRooivalk_Pitch_Deck_${VERSION}* 2>/dev/null || echo "Check above for generated files"

echo ""
echo "💡 Tips:"
echo "  - For best results, use Marp: npm install -g @marp-team/marp-cli"
echo "  - Open HTML file in browser for quick preview"
echo "  - Use PPTX files for presentations"
echo ""
