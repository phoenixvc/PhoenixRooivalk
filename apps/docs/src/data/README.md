# `src/data` — Centralised Documentation Data

This folder is the **single source of truth** for all key figures, metrics, and
structured data used across the Phoenix Rooivalk documentation site. Edit values
here once and every doc or MDX page that imports them will reflect the change
automatically.

## Folder Contents

| File / Folder                        | Description                                                                                                                                                                |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`types.ts`](./types.ts)             | Shared TypeScript interfaces (`DataPoint`, `DataSource`, `Confidence`, `RangeValue`, `CurrencyValue`, `TimelinePoint`, …) used across all data modules.                    |
| [`values.ts`](./values.ts)           | Flat key/value exports (`MARKET`, `PERFORMANCE`, `PRICING`, …) intended for direct use in MDX files without importing full data structures.                                |
| [`market.ts`](./market.ts)           | Counter-UAS market statistics: current size, growth rate, TAM by segment, and market event milestones. Sources cited inline.                                               |
| [`performance.ts`](./performance.ts) | Canonical system performance specifications: response time, detection range, autonomy level, and environmental specs. **If docs conflict with this file, this file wins.** |
| [`pricing.ts`](./pricing.ts)         | Segment-level and deployment-package pricing, financial projections, and funding round data. _Per-SKU prices live in [`products/catalog.ts`](./products/catalog.ts)._      |
| [`hardware.ts`](./hardware.ts)       | Top-level hardware reference data: Jetson AGX Orin specs, sensor suite parameters, and net-launcher specifications.                                                        |
| [`blockchain.ts`](./blockchain.ts)   | Blockchain integration details: Solana-first strategy, x402 payment protocol parameters, and multi-chain extensibility notes.                                              |
| [`team.ts`](./team.ts)               | Team member information, co-founder profiles, and company structure.                                                                                                       |
| [`roadmap.ts`](./roadmap.ts)         | Milestone timeline, quarterly roadmap, and current development phase/status.                                                                                               |
| [`competitors.ts`](./competitors.ts) | Competitive landscape data: competitor profiles, Phoenix advantage points, and comparison tables.                                                                          |
| [`tariffs.ts`](./tariffs.ts)         | Assembly, labor, and manufacturing tariff rates (hourly rates, category markups, and production time estimates).                                                           |
| [`validation.ts`](./validation.ts)   | Runtime validation helpers that cross-check data consistency. Run these checks when updating data to catch discrepancies early.                                            |
| [`index.ts`](./index.ts)             | Barrel file — re-exports everything from the modules above plus the `products` sub-module.                                                                                 |
| [`products/`](./products/README.md)  | Sub-module with full product catalog, compute/camera/storage tier configurations, and platform benchmarks. See the [products README](./products/README.md) for details.    |

## Quick-Start

### MDX Pages (simple values)

```mdx
import { MARKET, PERFORMANCE, PRICING } from "@site/src/data/values";

Current market size: **{MARKET.CURRENT}**  
Response time: **{PERFORMANCE.RESPONSE_TIME}**
```

### TypeScript / TSX Components (full data with metadata)

```ts
import { market, performance, pricing } from "@site/src/data";

// Access structured data with confidence metadata
const size = market.current.size.value; // e.g. 6.64
const confidence = market.current.size.confidence; // "verified"
```

### Product Catalog

```ts
import { allProducts, getProductBySku } from "@site/src/data/products";

const product = getProductBySku("SW-NANO-001");
```

## Data Governance

- **Add a new figure?** Create or update the relevant module, then export the
  value through `index.ts` (and `values.ts` if MDX access is needed).
- **Changing an existing figure?** Update it here — do **not** hardcode it in a
  docs page.
- **Conflicting values?** This folder is canonical. Update the docs to import
  from here rather than duplicating numbers.
- **Confidence levels** — Every `DataPoint` carries a `confidence` field
  (`"verified"` | `"estimated"` | `"projected"` | `"target"`). Keep these
  accurate so readers know which numbers are validated.

## Related

- [`src/components/`](../components/README.md) — React components that render
  this data
- [`src/hooks/`](../hooks/README.md) — Custom React hooks
- [`docs/`](../../docs/) — MDX documentation pages that import from this folder
