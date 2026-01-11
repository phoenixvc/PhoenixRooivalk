/**
 * Compute Platforms, AI Accelerators, and FPS Benchmarks
 */

import type { ComputePlatform, AIAccelerator, FPSBenchmark } from "./types";

// =============================================================================
// RASPBERRY PI PLATFORMS
// =============================================================================

/** Raspberry Pi compute platforms */
export const raspberryPiPlatforms: ComputePlatform[] = [
  {
    name: "Raspberry Pi Zero 2 W",
    price: 15,
    ram: "512MB",
    cpu: "Quad Cortex-A53 @ 1GHz",
    power: "2-4W",
    formFactor: "65×30mm",
    notes: "Entry-level, WiFi only",
  },
  {
    name: "Raspberry Pi 4 Model B",
    variant: "2GB",
    price: 45,
    ram: "2GB",
    cpu: "Quad Cortex-A72 @ 1.8GHz",
    power: "4-8W",
    formFactor: "85×56mm",
    notes: "Standard detection, PoE HAT compatible",
  },
  {
    name: "Raspberry Pi 4 Model B",
    variant: "4GB",
    price: 55,
    ram: "4GB",
    cpu: "Quad Cortex-A72 @ 1.8GHz",
    power: "4-8W",
    formFactor: "85×56mm",
    notes: "Multi-sensor fusion capable",
  },
  {
    name: "Raspberry Pi 4 Model B",
    variant: "8GB",
    price: 75,
    ram: "8GB",
    cpu: "Quad Cortex-A72 @ 1.8GHz",
    power: "5-10W",
    formFactor: "85×56mm",
    notes: "Heavy workloads, video recording",
  },
  {
    name: "Raspberry Pi 5",
    variant: "4GB",
    price: 60,
    ram: "4GB",
    cpu: "Quad Cortex-A76 @ 2.4GHz",
    power: "5-12W",
    formFactor: "85×56mm",
    notes: "PCIe support, M.2 HAT compatible",
  },
  {
    name: "Raspberry Pi 5",
    variant: "8GB",
    price: 80,
    ram: "8GB",
    cpu: "Quad Cortex-A76 @ 2.4GHz",
    power: "5-15W",
    formFactor: "85×56mm",
    notes: "Pro/Enterprise tier, NVMe support",
  },
];

// =============================================================================
// NVIDIA JETSON PLATFORMS
// =============================================================================

/** NVIDIA Jetson platforms */
export const jetsonPlatforms: ComputePlatform[] = [
  {
    name: "Jetson Orin Nano",
    variant: "4GB",
    price: 199,
    ram: "4GB",
    cpu: "6-core Cortex-A78AE @ 1.5GHz",
    power: "7-15W",
    formFactor: "69.6×45mm (module)",
    notes: "20 TOPS, entry Jetson tier",
  },
  {
    name: "Jetson Orin Nano",
    variant: "8GB",
    price: 249,
    ram: "8GB",
    cpu: "6-core Cortex-A78AE @ 1.5GHz",
    power: "7-15W",
    formFactor: "69.6×45mm (module)",
    notes: "40 TOPS, dev kit ~$499",
  },
  {
    name: "Jetson Orin NX",
    variant: "8GB",
    price: 399,
    ram: "8GB",
    cpu: "6-core Cortex-A78AE @ 2.0GHz",
    power: "10-25W",
    formFactor: "69.6×45mm (module)",
    notes: "70 TOPS, professional tier",
  },
  {
    name: "Jetson Orin NX",
    variant: "16GB",
    price: 599,
    ram: "16GB",
    cpu: "8-core Cortex-A78AE @ 2.0GHz",
    power: "10-25W",
    formFactor: "69.6×45mm (module)",
    notes: "100 TOPS, multi-stream capable",
  },
  {
    name: "Jetson AGX Orin",
    variant: "32GB",
    price: 999,
    ram: "32GB",
    cpu: "12-core Cortex-A78AE @ 2.2GHz",
    power: "15-40W",
    formFactor: "100×87mm (module)",
    notes: "200 TOPS, enterprise/military",
  },
  {
    name: "Jetson AGX Orin",
    variant: "64GB",
    price: 1999,
    ram: "64GB",
    cpu: "12-core Cortex-A78AE @ 2.2GHz",
    power: "15-60W",
    formFactor: "100×87mm (module)",
    notes: "275 TOPS, maximum performance, dev kit ~$2499",
  },
];

// =============================================================================
// AI ACCELERATORS
// =============================================================================

/** Available AI accelerators */
export const aiAccelerators: AIAccelerator[] = [
  // Google Coral
  {
    name: "Coral USB Accelerator",
    price: 59.99,
    tops: 4,
    interface: "USB 3.0",
    power: "2W",
    compatibility: ["Pi Zero 2W", "Pi 4", "Pi 5", "Jetson", "x86"],
    notes: "Most versatile, plug-and-play",
  },
  {
    name: "Coral M.2 Accelerator (A+E key)",
    price: 25,
    tops: 4,
    interface: "M.2 A+E",
    power: "2W",
    compatibility: ["Pi 5 (with HAT)", "Jetson", "x86"],
    notes: "Compact, requires M.2 slot",
  },
  {
    name: "Coral M.2 Accelerator (Dual TPU)",
    price: 35,
    tops: 8,
    interface: "M.2 B+M",
    power: "4W",
    compatibility: ["Pi 5 (with HAT)", "Jetson", "x86"],
    notes: "Dual Edge TPU, double throughput",
  },
  {
    name: "Coral Dev Board Mini",
    price: 99.99,
    tops: 4,
    interface: "Standalone",
    power: "3W",
    compatibility: ["Standalone"],
    notes: "Integrated Cortex-A35 + TPU",
  },
  // Hailo
  {
    name: "Hailo-8L M.2",
    price: 70,
    tops: 13,
    interface: "M.2 M-key",
    power: "2.5W",
    compatibility: ["Pi 5 (with AI Kit)", "Jetson", "x86"],
    notes: "Budget Hailo, excellent power efficiency",
  },
  {
    name: "Hailo-8 M.2",
    price: 149,
    tops: 26,
    interface: "M.2 M-key",
    power: "5W",
    compatibility: ["Pi 5 (with AI Kit)", "Jetson", "x86"],
    notes: "Full Hailo performance, best-in-class edge AI",
  },
  {
    name: "Raspberry Pi AI Kit (Hailo-8L)",
    price: 70,
    tops: 13,
    interface: "Pi 5 HAT",
    power: "2.5W",
    compatibility: ["Pi 5 only"],
    notes: "Official Pi HAT with Hailo-8L, recommended for Pi 5",
  },
  // Intel
  {
    name: "Intel Neural Compute Stick 2",
    price: 69,
    tops: 1,
    interface: "USB 3.0",
    power: "1.5W",
    compatibility: ["Pi 4", "Pi 5", "Jetson", "x86"],
    notes: "Discontinued but available, OpenVINO only",
  },
];

// =============================================================================
// FPS BENCHMARKS
// =============================================================================

/** YOLOv9 detection benchmarks (drone detection model) */
export const fpsBenchmarks: FPSBenchmark[] = [
  // Pi Zero 2W (no accelerator - CPU only)
  {
    platform: "Pi Zero 2W",
    accelerator: "None (CPU)",
    modelSize: "nano",
    resolution: "320×320",
    fps: 2,
    latency: "500ms",
    notes: "Minimal, alerts only",
  },
  // Pi 4 + Coral USB
  {
    platform: "Pi 4 (2GB)",
    accelerator: "Coral USB",
    modelSize: "small",
    resolution: "640×480",
    fps: 25,
    latency: "40ms",
    notes: "Standard tier baseline",
  },
  {
    platform: "Pi 4 (4GB)",
    accelerator: "Coral USB",
    modelSize: "medium",
    resolution: "1280×720",
    fps: 18,
    latency: "55ms",
    notes: "Higher resolution detection",
  },
  // Pi 5 + Coral M.2 Dual
  {
    platform: "Pi 5 (4GB)",
    accelerator: "Coral M.2 Dual",
    modelSize: "medium",
    resolution: "1280×720",
    fps: 35,
    latency: "28ms",
    notes: "Pro tier baseline",
  },
  {
    platform: "Pi 5 (8GB)",
    accelerator: "Coral M.2 Dual",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 22,
    latency: "45ms",
    notes: "Full HD detection",
  },
  // Pi 5 + Hailo-8L (AI Kit)
  {
    platform: "Pi 5 (4GB)",
    accelerator: "Hailo-8L (AI Kit)",
    modelSize: "medium",
    resolution: "1280×720",
    fps: 45,
    latency: "22ms",
    notes: "Recommended Pi 5 config",
  },
  {
    platform: "Pi 5 (8GB)",
    accelerator: "Hailo-8L (AI Kit)",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 30,
    latency: "33ms",
    notes: "Full HD with Hailo",
  },
  // Pi 5 + Hailo-8 (full)
  {
    platform: "Pi 5 (8GB)",
    accelerator: "Hailo-8",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 55,
    latency: "18ms",
    notes: "Maximum Pi performance",
  },
  {
    platform: "Pi 5 (8GB)",
    accelerator: "Hailo-8",
    modelSize: "large",
    resolution: "3840×2160",
    fps: 15,
    latency: "65ms",
    notes: "4K detection capable",
  },
  // Jetson Orin Nano
  {
    platform: "Jetson Orin Nano (4GB)",
    accelerator: "Integrated GPU (20 TOPS)",
    modelSize: "medium",
    resolution: "1280×720",
    fps: 50,
    latency: "20ms",
    notes: "Entry Jetson tier",
  },
  {
    platform: "Jetson Orin Nano (8GB)",
    accelerator: "Integrated GPU (40 TOPS)",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 60,
    latency: "17ms",
    notes: "Cost-effective pro option",
  },
  // Jetson Orin NX
  {
    platform: "Jetson Orin NX (8GB)",
    accelerator: "Integrated GPU (70 TOPS)",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 90,
    latency: "11ms",
    notes: "Multi-stream capable",
  },
  {
    platform: "Jetson Orin NX (16GB)",
    accelerator: "Integrated GPU (100 TOPS)",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 120,
    latency: "8ms",
    notes: "2-3 streams @ 40fps each",
  },
  // Jetson AGX Orin
  {
    platform: "Jetson AGX Orin (32GB)",
    accelerator: "Integrated GPU (200 TOPS)",
    modelSize: "large",
    resolution: "1920×1080",
    fps: 180,
    latency: "5.5ms",
    notes: "4-6 streams @ 30fps each",
  },
  {
    platform: "Jetson AGX Orin (64GB)",
    accelerator: "Integrated GPU (275 TOPS)",
    modelSize: "large",
    resolution: "3840×2160",
    fps: 60,
    latency: "16ms",
    notes: "4K multi-stream, enterprise/military",
  },
];

// =============================================================================
// PLATFORM RECOMMENDATIONS
// =============================================================================

/** Platform recommendation by use case */
export const platformRecommendations = {
  hobbyist: {
    platform: "Pi Zero 2W",
    accelerator: "None",
    price: "$15",
    fps: "2-5 FPS",
    notes: "Alerts only, no real-time tracking",
  },
  residential: {
    platform: "Pi 4 (2GB) + Coral USB",
    accelerator: "Coral USB",
    price: "$105",
    fps: "20-25 FPS",
    notes: "Best value for home use",
  },
  commercial: {
    platform: "Pi 5 (4GB) + Hailo-8L AI Kit",
    accelerator: "Hailo-8L",
    price: "$130",
    fps: "40-45 FPS",
    notes: "Recommended for most commercial",
  },
  professional: {
    platform: "Pi 5 (8GB) + Hailo-8",
    accelerator: "Hailo-8",
    price: "$229",
    fps: "50-55 FPS",
    notes: "Maximum Pi performance",
  },
  multiStream: {
    platform: "Jetson Orin Nano (8GB)",
    accelerator: "Integrated",
    price: "$499 (dev kit)",
    fps: "60 FPS / 2×30 FPS",
    notes: "Multiple cameras, compact",
  },
  enterprise: {
    platform: "Jetson Orin NX (16GB)",
    accelerator: "Integrated",
    price: "$599 (module)",
    fps: "120 FPS / 3×40 FPS",
    notes: "Enterprise multi-sensor",
  },
  military: {
    platform: "Jetson AGX Orin (64GB)",
    accelerator: "Integrated",
    price: "$1999 (module)",
    fps: "275 TOPS, 6+ streams",
    notes: "Maximum performance, ruggedized",
  },
};
