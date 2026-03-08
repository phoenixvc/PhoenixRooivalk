# `src/data/products` — Product Catalog Data

This folder contains all product-related TypeScript data modules used throughout
the Phoenix Rooivalk documentation site. Data here drives product pages, pricing
tables, the pre-order configurator, and any MDX docs that import product
figures.

## Files

| File                                         | Description                                                                                                                                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`types.ts`](./types.ts)                     | TypeScript interfaces for all product data structures (`Product`, `BOMItem`, `ProductSpecs`, tier configs, etc.). Import types from here to keep other modules type-safe.                                                                                   |
| [`catalog.ts`](./catalog.ts)                 | Individual product definitions for every SKU across all six product lines (SkyWatch, NetSentry, SkySnare, NetSnare, AeroNet, RKV). Also exports helper functions (`getProductBySku`, `getProductsByLine`, etc.) and summary data (`productCatalogSummary`). |
| [`platforms.ts`](./platforms.ts)             | Compute platform specs (`raspberryPiPlatforms`, `jetsonPlatforms`), AI accelerator specs (`aiAccelerators`), and detection FPS benchmarks (`fpsBenchmarks`). Used in hardware comparison tables and the configurator.                                       |
| [`storage-options.ts`](./storage-options.ts) | Local and network storage option definitions (`localStorageOptions`, `networkStorageOptions`) with use-case recommendations (`storageRecommendations`).                                                                                                     |
| [`tiers.ts`](./tiers.ts)                     | Tier definitions and per-product tier configurations for compute, camera, connectivity, and storage. Includes helper functions (`getAvailableTiers`, `getTierPriceDelta`, `generateProductConfiguration`) used by the pre-order configurator UI.            |
| [`index.ts`](./index.ts)                     | Barrel file — re-exports everything from the modules above so consumers can import from `@site/src/data/products` without knowing the internal split.                                                                                                       |

## Product Lines

| Line          | Category       | SKU Prefix | Summary                                                          |
| ------------- | -------------- | ---------- | ---------------------------------------------------------------- |
| **SkyWatch**  | Detection      | `SW-`      | 10 detection-only units from entry-level Nano to Enterprise mesh |
| **NetSentry** | Detection      | `NS-`      | 3 lightweight detection platforms                                |
| **SkySnare**  | Countermeasure | `SKS-`     | Net-launcher countermeasure for consumer/sports market           |
| **NetSnare**  | Countermeasure | `NSN-`     | Net-launcher line (Lite / Standard / Pro)                        |
| **AeroNet**   | Countermeasure | `AN-`      | Enterprise AI-enabled countermeasure systems                     |
| **RKV**       | Mixed          | `RKV-`     | Mothership, Interceptor, and Ground Station                      |

## Usage

```ts
// Import individual products
import { skyWatchStandard, netSentryPro } from "@site/src/data/products";

// Import collections
import { allProducts, skyWatchProducts } from "@site/src/data/products";

// Import helpers
import { getProductBySku, getProductsByLine } from "@site/src/data/products";

// Import types
import type { Product, ComputeTier } from "@site/src/data/products";

// Import tier helpers for the configurator
import { generateProductConfiguration } from "@site/src/data/products";
```

## Related Data Modules

- [`../market.ts`](../market.ts) — Market size and segment data
- [`../pricing.ts`](../pricing.ts) — Pricing constants used outside the catalog
- [`../hardware.ts`](../hardware.ts) — Top-level hardware reference data
- [`../values.ts`](../values.ts) — Flat key/value exports for MDX use
- [`../index.ts`](../index.ts) — Top-level data barrel that re-exports this
  module
