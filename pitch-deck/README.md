# PhoenixRooivalk Pitch Deck

## Quick Start

### Generate PowerPoint Presentation
```bash
./generate-ppt.sh v2.0
```

This creates:
- PowerPoint (.pptx)
- PDF (.pdf)  
- HTML (.html)

### Current Version
**v2.0** - Dual-brand strategy (SkySnare™ + AeroNet™)

### Files
- `PITCH_DECK_v2.0.md` - Main presentation (10 slides)
- `generate-ppt.sh` - Automation script
- `VERSION_CONTROL.md` - Version history and update guidelines

## Installation

### Prerequisites
```bash
# Option 1: Marp (recommended for best output)
npm install -g @marp-team/marp-cli

# Option 2: Pandoc (alternative)
brew install pandoc  # macOS
apt-get install pandoc  # Linux
```

### First Time Setup
```bash
cd pitch-deck
chmod +x generate-ppt.sh
./generate-ppt.sh v2.0
```

## Usage

### For Investor Meetings
1. Open `PhoenixRooivalk_Pitch_Deck_v2.0.pptx`
2. Review speaker notes (if included)
3. Customize for specific audience if needed
4. Present in full-screen mode

### For Email Distribution
1. Use PDF version: `PhoenixRooivalk_Pitch_Deck_v2.0.pdf`
2. Include NDA if required
3. Track recipients in CRM

### For Quick Preview
1. Open HTML version in browser
2. Ctrl+P to print/save as PDF
3. Navigate with scroll or arrow keys

## Updating Content

### Quick Updates (same version)
```bash
# Edit the markdown file
nano PITCH_DECK_v2.0.md

# Regenerate presentations
./generate-ppt.sh v2.0
```

### New Version (major changes)
```bash
# Create new version
cp PITCH_DECK_v2.0.md PITCH_DECK_v2.1.md

# Edit content
nano PITCH_DECK_v2.1.md

# Generate new version
./generate-ppt.sh v2.1

# Update VERSION_CONTROL.md with changes
```

## Customization

### For Different Audiences

**Technical Investors:**
- Emphasize Slide 4 (Product Demo)
- Add appendix with architecture diagrams

**Strategic Investors:**
- Focus on Slides 5-6 (Financials & Market)
- Add case studies

**Government/Defense:**
- Highlight AeroNet™ compliance features
- Add regulatory certifications section

### Branding
Edit these in markdown or post-process in PowerPoint:
- Colors: Orange (#F97316), Amber (#FBBF24)
- Fonts: Sans-serif for readability
- Logo: Add to Slide 1 after generation

## Troubleshooting

### "marp: command not found"
```bash
npm install -g @marp-team/marp-cli
```

### "pandoc: command not found"
```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# Windows
choco install pandoc
```

### PowerPoint formatting issues
- Use Marp instead of Pandoc for better formatting
- Manually adjust in PowerPoint after generation
- Check VERSION_CONTROL.md for design guidelines

### File too large
- Compress images in source markdown
- Remove unused slides
- Export to PDF for smaller file size

## Best Practices

### Before Presenting
- [ ] Update metrics to latest data
- [ ] Check all hyperlinks work
- [ ] Test on presentation computer
- [ ] Bring USB backup
- [ ] Print handouts if needed

### After Updates
- [ ] Bump version number in markdown header
- [ ] Update VERSION_CONTROL.md
- [ ] Regenerate all formats
- [ ] Test generated files
- [ ] Commit to git with meaningful message

### Version Control
- Commit after significant changes
- Use meaningful commit messages
- Tag releases (e.g., `git tag v2.0`)
- Keep old versions in archive

## Support

### Documentation
- `VERSION_CONTROL.md` - Version history
- `../PITCH_DECK_README.md` - Detailed guide (v1.0)

### Contact
- **Jurie Smit** - jurie@phoenixvc.tech
- **Martyn Redelinghuys** - martyn@phoenixvc.tech

### Tools Documentation
- Marp: https://marp.app/
- Pandoc: https://pandoc.org/
- Markdown Guide: https://www.markdownguide.org/

---

**Last Updated:** November 18, 2025  
**Current Version:** 2.0  
**License:** Proprietary - PhoenixRooivalk Only
