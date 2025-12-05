/**
 * Hardware Specifications
 *
 * Single source of truth for all hardware-related specifications.
 */

import type { DataPoint, RangeValue } from "./types";

/** NVIDIA Jetson AGX Orin Specifications */
export const jetsonOrin = {
  model: "NVIDIA Jetson AGX Orin",
  variant: "64GB", // Note: There's also a 32GB variant

  compute: {
    tops: {
      value: 275,
      unit: "TOPS",
      confidence: "verified",
      notes: "AI performance (INT8)",
    } as DataPoint,

    gpu: {
      cores: 2048,
      architecture: "Ampere",
      tensorCores: 64,
    },

    cpu: {
      cores: 12,
      architecture: "Arm Cortex-A78AE",
      frequency: "2.2 GHz",
    },
  },

  memory: {
    // Canonical: We use the 64GB variant
    size: {
      value: 64,
      unit: "GB",
      confidence: "verified",
      notes: "LPDDR5 unified memory. 32GB variant also available.",
    } as DataPoint,
    bandwidth: "204.8 GB/s",
    type: "LPDDR5",
  },

  interfaces: {
    csi: "MIPI CSI-2 (16 lanes)",
    pcie: "PCIe Gen4 (8 lanes)",
    ethernet: "10GbE",
    usb: "USB 3.2 Gen2",
    gpio: "40-pin header",
  },

  power: {
    min: 15,
    max: 60,
    unit: "W",
    confidence: "verified",
    notes: "Configurable power modes",
  } as RangeValue,

  ruggedization: {
    standard: "MIL-STD-810H",
    ingress: "IP67",
    shock: "40G",
    vibration: "10-500Hz",
  },
};

/** Sensor Suite */
export const sensorSuite = {
  /** Multi-sensor fusion capabilities */
  sensors: [
    {
      type: "RF",
      description: "Radio Frequency detection",
      range: "2-5 km",
      capability: "Drone communication interception",
    },
    {
      type: "Radar",
      description: "Active radar detection",
      range: "3-5 km",
      capability: "All-weather tracking",
    },
    {
      type: "EO/IR",
      description: "Electro-Optical/Infrared",
      range: "1-2 km",
      capability: "Visual identification and thermal",
    },
    {
      type: "Acoustic",
      description: "Sound-based detection",
      range: "500m-1 km",
      capability: "Propeller signature detection",
    },
    {
      type: "LiDAR",
      description: "Light Detection and Ranging",
      range: "300-500m",
      capability: "3D mapping and precision tracking",
    },
  ],

  fusion: {
    capability: "Multi-sensor data fusion",
    benefit: "Reduces false positives to <0.3%",
  },

  integration: {
    mipi: "MIPI CSI-2 camera interface",
    pcie: "PCIe Gen4 for high-bandwidth sensors",
    ethernet: "10GbE for networked sensors",
  },
};

/** Net Launcher System */
export const netLauncher = {
  status: "Design complete, ready for prototyping",
  lastUpdate: "Week 48 (Nov 2025)",

  net: {
    material: "Kevlar fiber",
    manufacturing: "In-house",
    costReduction: "60%",
    benefits: [
      "Reduced per-unit cost",
      "Immediate availability for testing",
      "Rapid design iteration",
      "IP protection",
    ],
    weavePattern: "Optimized for drone prop entanglement",
    sizes: "Multiple sizes for different target classes",
  },

  launcher: {
    groundBased: {
      type: "Larger canister launcher",
      capacity: "Multi-shot capable",
      integration: "Future Grover UGV integration",
    },
    airborne: {
      type: "Compact single-shot",
      optimization: "Weight and aerodynamics",
      status: "Development priority",
    },
  },

  deployment: {
    method: "Pneumatic/pyrotechnic (under evaluation)",
    range: "50-200m effective range",
    accuracy: "Target tracking assisted",
  },
};

/** Grover UGV Platform */
export const groverUgv = {
  type: "Unmanned Ground Vehicle",
  purpose: "Mobile ground-based defense platform",

  capabilities: [
    "Net launcher mounting",
    "Autonomous patrol",
    "Sensor platform",
    "Communications relay",
  ],

  integration: {
    launcher: "Ground-based multi-shot launcher",
    sensors: "Full sensor suite integration",
    communications: "Mesh networking capable",
  },

  status: "Future integration planned",
};

/** System Components Summary */
export const systemComponents = {
  "RKV-M (Mothership)":
    "Aerial VTOL mothership for picket, relay, and mini launch operations",
  "RKV-I (Interceptor)":
    "Expendable/recoverable interceptor drones with net/other payloads",
  "Grover (UGV)": "Ground vehicle for logistics, launch, and comms relay",
  "Command Node": "Fixed or mobile command and control center",
  "Sensor Nodes": "Distributed detection network",
};

/** Deployment Models */
export const deploymentModels = [
  {
    name: "Mobile Picket",
    description: "Portable UGV-based for temporary security perimeters",
    useCase: "Events, temporary installations",
  },
  {
    name: "Site-Fixed",
    description: "Permanent installation",
    useCase: "Airports, prisons, power plants",
  },
  {
    name: "Fiber Engage",
    description: "High-density urban with fiber backbone",
    useCase: "Urban environments, coordinated response",
  },
  {
    name: "Swarm Defense",
    description: "Multi-unit coordination",
    useCase: "Large area coverage, military applications",
  },
];
