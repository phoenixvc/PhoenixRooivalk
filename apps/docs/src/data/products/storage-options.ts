/**
 * Storage Options and Recommendations
 */

import type { StorageOption, StorageTierId, UseCaseTierId } from "./types";

// =============================================================================
// LOCAL STORAGE OPTIONS
// =============================================================================

/** Local storage options */
export const localStorageOptions: StorageOption[] = [
  {
    type: "microSD Class 10",
    capacity: "32GB",
    interface: "SD",
    speed: "100MB/s read",
    price: "$8",
    priceMin: 8,
    priceMax: 8,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Nano/Standard tier",
    notes: "Minimum viable, limited write endurance",
  },
  {
    type: "microSD A2 (High Endurance)",
    capacity: "64-128GB",
    interface: "SD",
    speed: "160MB/s read",
    price: "$15-25",
    priceMin: 15,
    priceMax: 25,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Standard/Pro tier",
    notes: "Recommended for continuous recording",
  },
  {
    type: "NVMe SSD (M.2)",
    capacity: "128-512GB",
    interface: "PCIe 3.0",
    speed: "2000MB/s read",
    price: "$25-60",
    priceMin: 25,
    priceMax: 60,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Pro/Enterprise tier",
    notes: "Pi 5 with M.2 HAT, Jetson native",
  },
  {
    type: "NVMe SSD (M.2)",
    capacity: "1-2TB",
    interface: "PCIe 3.0/4.0",
    speed: "3500MB/s read",
    price: "$80-150",
    priceMin: 80,
    priceMax: 150,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Enterprise, multi-day buffer",
    notes: "Local evidence cache before NAS sync",
  },
];

// =============================================================================
// NETWORK STORAGE OPTIONS
// =============================================================================

/** Network storage options */
export const networkStorageOptions: StorageOption[] = [
  {
    type: "NAS (2-bay)",
    capacity: "4-8TB",
    interface: "1GbE",
    speed: "110MB/s",
    price: "$200-350 + drives",
    priceMin: 200,
    priceMax: 350,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Small mesh systems",
    notes: "Synology DS223j, QNAP TS-233",
  },
  {
    type: "NAS (4-bay)",
    capacity: "16-32TB",
    interface: "2.5GbE",
    speed: "280MB/s",
    price: "$400-600 + drives",
    priceMin: 400,
    priceMax: 600,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Commercial installations",
    notes: "RAID5/6, Synology DS923+",
  },
  {
    type: "NAS (Enterprise)",
    capacity: "48-96TB",
    interface: "10GbE",
    speed: "1000MB/s",
    price: "$2000-5000 + drives",
    priceMin: 2000,
    priceMax: 5000,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Enterprise, multi-site",
    notes: "QNAP/Synology rack mount",
  },
  {
    type: "SAN (iSCSI)",
    capacity: "50-200TB",
    interface: "10-25GbE",
    speed: "2000-5000MB/s",
    price: "$10,000-50,000",
    priceMin: 10000,
    priceMax: 50000,
    priceUnit: "one_time",
    currency: "USD",
    useCase: "Large enterprise, critical infrastructure",
    notes: "Block storage, requires dedicated network, Dell/NetApp",
  },
  {
    type: "Cloud Storage (S3-compatible)",
    capacity: "Unlimited",
    interface: "Internet",
    speed: "Variable",
    price: "$0.02-0.05/GB/month",
    priceMin: 0.02,
    priceMax: 0.05,
    priceUnit: "per_month_gb",
    currency: "USD",
    useCase: "Offsite backup, compliance",
    notes: "AWS S3, Backblaze B2, Wasabi",
  },
];

// =============================================================================
// STORAGE TIER SUMMARY (aligned with StorageTierId from tiers)
// =============================================================================

/** Optional structured summary by storage tier ID for catalog/UI alignment */
export const storageTierSummary: Partial<Record<StorageTierId, { label: string; typicalPrice?: string }>> = {
  sd_32: { label: "32GB microSD", typicalPrice: "$8" },
  sd_64_he: { label: "64GB High Endurance microSD", typicalPrice: "$15" },
  sd_128_he: { label: "128GB High Endurance microSD", typicalPrice: "$25" },
  nvme_128: { label: "128GB NVMe SSD", typicalPrice: "$25" },
  nvme_256: { label: "256GB NVMe SSD", typicalPrice: "$40" },
  nvme_512: { label: "512GB NVMe SSD", typicalPrice: "$60" },
  nvme_1tb: { label: "1TB NVMe SSD", typicalPrice: "$100" },
  none: { label: "None" },
  fixed: { label: "Fixed (per product)" },
  enterprise: { label: "Enterprise (per-site)" },
  cloud: { label: "Cloud" },
};

// =============================================================================
// STORAGE RECOMMENDATIONS
// =============================================================================

/** Storage recommendations by use-case tier (nano, standard, pro, mesh, enterprise) */
export const storageRecommendations: Record<
  UseCaseTierId,
  { local: string; network: string; retention: string; notes: string }
> = {
  nano: {
    local: "32GB microSD",
    network: "None (WiFi upload to phone/cloud)",
    retention: "24-48 hours rolling",
    notes: "Alerts only, no continuous recording",
  },
  standard: {
    local: "64GB microSD (High Endurance)",
    network: "Optional NAS sync",
    retention: "3-7 days local",
    notes: "Event-triggered recording",
  },
  pro: {
    local: "128GB NVMe SSD",
    network: "NAS 2-bay recommended",
    retention: "7-14 days local, 30+ days NAS",
    notes: "Continuous recording supported",
  },
  mesh: {
    local: "64GB per node, 256GB central",
    network: "NAS 4-bay required",
    retention: "7 days per node, 60 days central",
    notes: "Centralized storage architecture",
  },
  enterprise: {
    local: "1TB NVMe per node",
    network: "NAS/SAN required (48TB+)",
    retention: "30 days local buffer, 1 year archive",
    notes: "Compliance/legal evidence requirements",
  },
};
