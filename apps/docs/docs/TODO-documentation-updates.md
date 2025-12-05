---
id: todo-documentation-updates
title: Documentation Updates TODO
sidebar_label: TODO
---

# Documentation Updates - Remaining Tasks

## Completed ✅

### MDX Conversions & Centralized Data

- [x] Convert phoenix-rooivalk-technical-whitepaper.md → .mdx
- [x] Convert early-spec-qa.md → .mdx
- [x] Convert strategic-recommendations.md → .mdx
- [x] Update investor-executive-summary.mdx with CAPITAL constants
- [x] Update 12-month-business-plan.mdx with MARKET CAGRs
- [x] Update manufacturing-strategy.mdx with facility investments
- [x] Update business-model.mdx with ASIA_PACIFIC_CAGR

### Blockchain Consolidation (8 → 4 files)

- [x] blockchain-architecture.mdx (merged architecture + detailed)
- [x] blockchain-implementation.mdx (merged guide + phases + roadmap)
- [x] blockchain-analysis.mdx (merged benefits + protocols-analysis)
- [x] blockchain-security-compliance.md (kept separate, added phase frontmatter)

### Constants Added to values.ts

- [x] Market CAGRs: OUTDOOR_TOY_CAGR, COUNTER_DRONE_CAGR
- [x] Market segments: MILITARY_MARKET, INFRASTRUCTURE_MARKET, COMMERCIAL_MARKET
- [x] Revenue potential: MILITARY_REVENUE_POTENTIAL, etc.
- [x] Capital amounts: INVESTMENT_TO_DATE, PO_FACILITY, LIABILITY_POLICY
- [x] Manufacturing: CAPE_TOWN_INVESTMENT, JOHANNESBURG_INVESTMENT
- [x] Blockchain: BLOCKCHAIN_IMPLEMENTATION, BLOCKCHAIN_EXPECTED_ROI

---

## Remaining Tasks

### Low Priority - Phase Frontmatter

Add phase arrays to remaining .md files without them (~100 files):

- [ ] ADR documents (may not need phase filtering)
- [ ] Research documents (specialized technical docs)
- [ ] Template documents

### Optional - Additional MDX Conversions

Files that could benefit from centralized data but are lower priority:

- [ ] business/use-cases.md
- [ ] business/competitive-differentiation-guide.mdx (already MDX, check for
      hardcoded values)
- [ ] technical/system-overview.mdx (already MDX, check for hardcoded values)

### Optional - Data Consistency Audit

Review these for remaining hardcoded values:

- [ ] roi-analysis.mdx - Revenue projections
- [ ] traction-metrics.mdx - Performance metrics
- [ ] competitive-analysis.mdx - Competitor data

### Future Considerations

- Consider creating a data validation script to catch hardcoded values
- Consider adding TypeScript types for values.ts exports
- Consider documenting the phase filtering system

---

## Notes

### Phase System

Documents use funding-round-based phases:

- `seed` - SkySnare Launch (Nov 2025 - Oct 2026)
- `series-a` - AeroNet & DoD (Nov 2026 - 2027)
- `series-b` - Ground Systems (2028)
- `series-c` - Aerial Platform (2029)
- `scale` - Global Deployment (2030+)

### Centralized Data Pattern

```mdx
import { MARKET, PERFORMANCE } from "@site/src/data/values";

Market size: {MARKET.CURRENT} Response time: {PERFORMANCE.RESPONSE_TIME}
```

---

_Last updated: 2025-12-02_
