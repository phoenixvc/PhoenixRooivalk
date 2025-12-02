/**
 * Performance Specifications - Technical Metrics
 *
 * Single source of truth for all performance-related figures.
 * IMPORTANT: When specs conflict, this file defines the canonical values.
 */

import type { RangeValue, DataPoint } from "./types";

/** System Performance Specifications */
export const performance = {
  /** Response time - end-to-end latency */
  responseTime: {
    // Canonical value: 120-195ms
    // Note: Some older docs may show 50-195ms - that was aspirational
    range: {
      min: 120,
      max: 195,
      unit: "ms",
      confidence: "verified",
      notes:
        "End-to-end response time from detection to action. 50ms is detection-only latency.",
    } as RangeValue,
    formatted: "120-195ms",
    vsCompetitors: "10-150x faster",
    competitorRange: "5,000-30,000ms",
  },

  /** Detection latency only (before decision) */
  detectionLatency: {
    value: 50,
    unit: "ms",
    confidence: "verified",
    notes: "Detection-only latency, not including decision and action",
  } as DataPoint,

  /** Authentication latency */
  authLatency: {
    value: 2,
    unit: "ms",
    confidence: "verified",
    notes: "Edge-based authentication",
  } as DataPoint,

  /** Detection accuracy */
  accuracy: {
    // System-level detection accuracy
    detection: {
      value: 99.5,
      unit: "%",
      confidence: "verified",
      notes: "System-level threat detection accuracy",
    } as DataPoint,

    // YOLOv9 specific metrics
    yolov9: {
      mAP: {
        value: 99.7,
        unit: "%",
        confidence: "verified",
        notes: "Mean Average Precision on optimized model",
      } as DataPoint,
      precision: {
        value: 99.5,
        unit: "%",
        confidence: "verified",
      } as DataPoint,
      recall: {
        value: 99.2,
        unit: "%",
        confidence: "verified",
      } as DataPoint,
      // Baseline performance on constrained hardware
      baselineMaP: {
        value: 65.2,
        unit: "%",
        confidence: "verified",
        notes: "Baseline YOLOv9 on Jetson Nano at 30+ FPS - not our production target",
      } as DataPoint,
    },

    // False positive rate
    falsePositive: {
      value: 0.3,
      max: 2,
      unit: "%",
      confidence: "target",
      notes: "Target <2%, achieving <0.3% with multi-sensor fusion",
    },
  },

  /** Detection range */
  detectionRange: {
    // Standard configuration
    standard: {
      min: 0.5,
      max: 2,
      unit: "km",
      confidence: "verified",
      notes: "Sensor-dependent, standard configuration",
    } as RangeValue,
    formatted: "0.5-2 km",

    // Extended range with enhanced sensors
    extended: {
      min: 2,
      max: 5,
      unit: "km",
      confidence: "projected",
      notes: "With radar and enhanced sensor suite",
    } as RangeValue,

    // Note about older docs
    _legacy: "Some older docs show 3-5km - that was extended config, not standard",
  },

  /** Concurrent target handling */
  concurrentTargets: {
    value: 10,
    unit: "+",
    confidence: "verified",
    notes: "Simultaneous drone targets",
  } as DataPoint,

  /** Swarm coordination */
  swarmCapacity: {
    // Clarification: 5-10 is per-unit coordination, 100+ is system-wide
    perUnit: {
      min: 5,
      max: 10,
      unit: "drones",
      confidence: "verified",
      notes: "Per-unit autonomous coordination",
    } as RangeValue,
    systemWide: {
      value: 100,
      unit: "+",
      confidence: "target",
      notes: "System-wide with mesh networking",
    } as DataPoint,
  },

  /** System availability */
  availability: {
    value: 99.9,
    unit: "%",
    confidence: "target",
    notes: "System uptime target",
  } as DataPoint,

  /** Offline capability */
  offlineCapable: {
    value: true,
    description: "Fully operational in RF-denied, GPS-denied environments",
    confidence: "verified",
  },
};

/** SAE Autonomy Level */
export const autonomyLevel = {
  level: 4,
  description: "High Automation - System performs all driving tasks under certain conditions",
  standard: "SAE J3016",
  capabilities: [
    "Autonomous threat detection",
    "Autonomous target tracking",
    "Autonomous engagement decisions",
    "Human oversight for edge cases",
  ],
};

/** Environmental specifications */
export const environmentalSpecs = {
  temperature: {
    min: -40,
    max: 70,
    unit: "°C",
    confidence: "verified",
    notes: "Operating temperature range",
  } as RangeValue,

  humidity: {
    max: 95,
    unit: "%",
    confidence: "verified",
    notes: "Non-condensing",
  },

  altitude: {
    max: 4500,
    unit: "m",
    confidence: "verified",
    notes: "Operating altitude",
  },

  weatherResistance: "IP67",
  milSpec: "MIL-STD-810H",
};

/** Power specifications */
export const powerSpecs = {
  average: {
    min: 150,
    max: 250,
    unit: "W",
    confidence: "verified",
    notes: "Average power consumption",
  } as RangeValue,

  peak: {
    value: 400,
    unit: "W",
    confidence: "verified",
    notes: "Peak power during engagement",
  } as DataPoint,
};

/** Helper to get performance summary */
export function getPerformanceSummary(): string {
  return `${performance.responseTime.formatted} response, ${performance.accuracy.detection.value}% accuracy, ${performance.detectionRange.formatted} range`;
}

/** Comparison table data */
export const performanceComparison = {
  headers: ["Metric", "Phoenix Rooivalk", "Typical Competitor"],
  rows: [
    ["Response Time", performance.responseTime.formatted, "5-30 seconds"],
    ["Detection Accuracy", `${performance.accuracy.detection.value}%`, "85-95%"],
    ["Offline Capable", "Yes", "No/Limited"],
    ["Blockchain Evidence", "Yes", "No"],
    ["Detection Range", performance.detectionRange.formatted, "1-3 km"],
  ],
};
