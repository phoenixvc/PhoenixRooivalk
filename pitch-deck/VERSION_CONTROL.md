# Pitch Deck Version Control

## Versioning Scheme
- **Major.Minor** format (e.g., 2.0, 2.1, 3.0)
- **Major** changes: Strategic pivots, complete restructures
- **Minor** changes: Content updates, metric refreshes, new data

## Version History

### v2.0 (November 18, 2025) - CURRENT
**Major Changes:**
- Complete strategic pivot to dual-brand model (SkySnare™ + AeroNet™)
- Updated from counter-UAS only to consumer + enterprise
- New financial projections: $1.8M → $50M (FY26-FY30)
- Added 5 team members with LinkedIn profiles
- Clarified market sizing: $5.9B commercial + $15-20B defense
- 10-slide format optimized for investor presentations

**Key Metrics:**
- Series A: $1.5M (was $120M R)
- FY26 Revenue: $1.8M (was $25M R)
- FY30 Revenue: $50M (was $500M R)
- TAM: $5.9B commercial + $15-20B defense
- EBITDA: 30% by FY30

**Files:**
- PITCH_DECK_v2.0.md (main deck)
- PITCH_DECK_v2.0_SPEAKER_NOTES.md (presenter script)
- PhoenixRooivalk_Pitch_Deck_v2.0.pptx (generated)

---

### v1.0 (November 18, 2025)
**Initial Version:**
- 18-slide comprehensive investor deck
- Counter-UAS focus only (no dual-brand)
- Original financial model: R25M → R500M
- Investment ask: R120M Series A
- Team: Jurie + Martyn only

**Files:**
- ../PITCH_DECK.md
- ../PITCH_DECK_ONE_PAGER.md
- ../PITCH_DECK_README.md

---

## Update Checklist

When creating a new version, update these sections:

### Financial Data (Quarterly Review)
- [ ] Revenue projections (check against actuals)
- [ ] Unit economics (CAC, LTV)
- [ ] Market size estimates
- [ ] EBITDA margins
- [ ] Valuation and funding amounts

### Market Data (Quarterly Review)
- [ ] TAM/SAM/SOM figures
- [ ] Competitor landscape
- [ ] Recent contract awards
- [ ] Regulatory changes
- [ ] Industry CAGR updates

### Company Milestones (Monthly Review)
- [ ] Product development status
- [ ] Customer deployments
- [ ] Team additions
- [ ] Partnership announcements
- [ ] Certification achievements

### Technology Updates (As Needed)
- [ ] Performance metrics
- [ ] New capabilities
- [ ] Patent filings
- [ ] R&D breakthroughs

### Design Elements (Annual Review)
- [ ] Branding updates
- [ ] Color schemes
- [ ] Logo versions
- [ ] Visual aids

---

## File Naming Convention

```
PITCH_DECK_v[MAJOR].[MINOR].md           # Main markdown source
PITCH_DECK_v[MAJOR].[MINOR]_SPEAKER_NOTES.md  # Presenter script
PhoenixRooivalk_Pitch_Deck_v[MAJOR].[MINOR].pptx  # PowerPoint export
PhoenixRooivalk_Pitch_Deck_v[MAJOR].[MINOR].pdf   # PDF export
```

---

## Generation Commands

### Create New Version
```bash
# Copy current version
cp PITCH_DECK_v2.0.md PITCH_DECK_v2.1.md

# Edit content
nano PITCH_DECK_v2.1.md

# Update version number in file header
# Generate PowerPoint
./generate-ppt.sh v2.1

# Commit to git
git add .
git commit -m "Pitch deck v2.1: [description of changes]"
```

### Generate All Formats
```bash
./generate-ppt.sh v2.0
```

---

## Distribution Guidelines

### Internal Review
- Version: Any (draft versions allowed)
- Recipients: Team members only
- Tracking: Not required

### Investor Presentations
- Version: Latest stable (X.0 releases only)
- Recipients: NDA-signed investors
- Tracking: Log in CRM with version number

### Partner Discussions
- Version: Customize per audience
- Recipients: Strategic partners (technical vs business versions)
- Tracking: Version + recipient in data room log

### Public Materials
- Version: Approved marketing versions only
- Recipients: General inquiries, conferences
- Tracking: Public version (no confidential financials)

---

## Maintenance Schedule

### Weekly
- [ ] Update traction metrics if changed
- [ ] Review for factual accuracy
- [ ] Check broken links

### Monthly
- [ ] Update customer count
- [ ] Review team section
- [ ] Check competitor landscape
- [ ] Update testimonials

### Quarterly
- [ ] Major financial update
- [ ] Market data refresh
- [ ] Milestone progress review
- [ ] Bump minor version (e.g., 2.0 → 2.1)

### Annually
- [ ] Strategic review
- [ ] Complete redesign consideration
- [ ] Bump major version (e.g., 2.1 → 3.0)
- [ ] Archive old versions

---

## Archive Policy

- Keep all versions in `pitch-deck/archive/` directory
- Active version: Current directory
- Archive after 6 months or 2 major versions
- Never delete (git history preservation)

---

**Last Updated:** November 18, 2025  
**Maintained By:** Jurie Smit (CTO)  
**Review Cycle:** Quarterly
