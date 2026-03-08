/**
 * Storage Options and Recommendations
 */

import type { StorageOption } from "./types";

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
    useCase: "Nano/Standard tier",
    notes: "Minimum viable, limited write endurance",
  },
  {
    type: "microSD A2 (High Endurance)",
    capacity: "64-128GB",
    interface: "SD",
    speed: "160MB/s read",
    price: "$15-25",
    useCase: "Standard/Pro tier",
    notes: "Recommended for continuous recording",
  },
  {
    type: "NVMe SSD (M.2)",
    capacity: "128-512GB",
    interface: "PCIe 3.0",
    speed: "2000MB/s read",
    price: "$25-60",
    useCase: "Pro/Enterprise tier",
    notes: "Pi 5 with M.2 HAT, Jetson native",
  },
  {
    type: "NVMe SSD (M.2)",
    capacity: "1-2TB",
    interface: "PCIe 3.0/4.0",
    speed: "3500MB/s read",
    price: "$80-150",
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
    useCase: "Small mesh systems",
    notes: "Synology DS223j, QNAP TS-233",
  },
  {
    type: "NAS (4-bay)",
    capacity: "16-32TB",
    interface: "2.5GbE",
    speed: "280MB/s",
    price: "$400-600 + drives",
    useCase: "Commercial installations",
    notes: "RAID5/6, Synology DS923+",
  },
  {
    type: "NAS (Enterprise)",
    capacity: "48-96TB",
    interface: "10GbE",
    speed: "1000MB/s",
    price: "$2000-5000 + drives",
    useCase: "Enterprise, multi-site",
    notes: "QNAP/Synology rack mount",
  },
  {
    type: "SAN (iSCSI)",
    capacity: "50-200TB",
    interface: "10-25GbE",
    speed: "2000-5000MB/s",
    price: "$10,000-50,000",
    useCase: "Large enterprise, critical infrastructure",
    notes: "Block storage, requires dedicated network, Dell/NetApp",
  },
  {
    type: "Cloud Storage (S3-compatible)",
    capacity: "Unlimited",
    interface: "Internet",
    speed: "Variable",
    price: "$0.02-0.05/GB/month",
    useCase: "Offsite backup, compliance",
    notes: "AWS S3, Backblaze B2, Wasabi",
  },
];

// =============================================================================
// STORAGE RECOMMENDATIONS
// =============================================================================

/** Storage recommendations by tier */
export const storageRecommendations = {
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
