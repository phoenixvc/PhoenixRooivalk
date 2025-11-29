/**
 * Tests for Math Utilities
 */

import { describe, it, expect } from "vitest";
import {
  distance,
  distanceSquared,
  clamp,
  lerp,
  degToRad,
  radToDeg,
} from "../components/utils/mathUtils";

describe("distance", () => {
  it("should calculate distance between two points", () => {
    const result = distance(0, 0, 3, 4);
    expect(result).toBe(5);
  });

  it("should return 0 for same point", () => {
    const result = distance(5, 5, 5, 5);
    expect(result).toBe(0);
  });

  it("should handle negative coordinates", () => {
    const result = distance(-3, -4, 0, 0);
    expect(result).toBe(5);
  });

  it("should be symmetric", () => {
    const d1 = distance(0, 0, 10, 20);
    const d2 = distance(10, 20, 0, 0);
    expect(d1).toBe(d2);
  });

  it("should handle horizontal distance", () => {
    const result = distance(0, 0, 10, 0);
    expect(result).toBe(10);
  });

  it("should handle vertical distance", () => {
    const result = distance(0, 0, 0, 10);
    expect(result).toBe(10);
  });

  it("should handle floating point coordinates", () => {
    const result = distance(0, 0, 1.5, 2);
    expect(result).toBeCloseTo(2.5, 5);
  });
});

describe("distanceSquared", () => {
  it("should calculate squared distance", () => {
    const result = distanceSquared(0, 0, 3, 4);
    expect(result).toBe(25);
  });

  it("should return 0 for same point", () => {
    const result = distanceSquared(5, 5, 5, 5);
    expect(result).toBe(0);
  });

  it("should be faster for comparisons (no sqrt)", () => {
    // This test verifies the function is useful for comparisons
    const d1 = distanceSquared(0, 0, 3, 4);
    const d2 = distanceSquared(0, 0, 5, 0);

    // 25 vs 25 - both equal
    expect(d1).toBe(d2);
  });

  it("should handle negative coordinates", () => {
    const result = distanceSquared(-3, -4, 0, 0);
    expect(result).toBe(25);
  });
});

describe("clamp", () => {
  it("should return value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("should return min when value is below", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it("should return max when value is above", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("should handle equal min and max", () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });

  it("should handle negative ranges", () => {
    expect(clamp(-5, -10, -2)).toBe(-5);
  });

  it("should return min when value equals min", () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it("should return max when value equals max", () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("should handle floating point values", () => {
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(1.5, 0, 1)).toBe(1);
    expect(clamp(-0.5, 0, 1)).toBe(0);
  });
});

describe("lerp", () => {
  it("should return start value at t=0", () => {
    expect(lerp(0, 100, 0)).toBe(0);
  });

  it("should return end value at t=1", () => {
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it("should return midpoint at t=0.5", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });

  it("should handle negative values", () => {
    expect(lerp(-100, 100, 0.5)).toBe(0);
  });

  it("should handle t outside 0-1 range", () => {
    expect(lerp(0, 100, 2)).toBe(200);
    expect(lerp(0, 100, -1)).toBe(-100);
  });

  it("should interpolate floating point values", () => {
    expect(lerp(0.5, 1.5, 0.5)).toBe(1);
  });

  it("should work when a equals b", () => {
    expect(lerp(50, 50, 0.5)).toBe(50);
  });

  it("should work with decreasing values", () => {
    expect(lerp(100, 0, 0.25)).toBe(75);
  });
});

describe("degToRad", () => {
  it("should convert 0 degrees to 0 radians", () => {
    expect(degToRad(0)).toBe(0);
  });

  it("should convert 180 degrees to PI radians", () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 10);
  });

  it("should convert 90 degrees to PI/2 radians", () => {
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2, 10);
  });

  it("should convert 360 degrees to 2*PI radians", () => {
    expect(degToRad(360)).toBeCloseTo(2 * Math.PI, 10);
  });

  it("should handle negative degrees", () => {
    expect(degToRad(-90)).toBeCloseTo(-Math.PI / 2, 10);
  });

  it("should handle fractional degrees", () => {
    expect(degToRad(45)).toBeCloseTo(Math.PI / 4, 10);
  });
});

describe("radToDeg", () => {
  it("should convert 0 radians to 0 degrees", () => {
    expect(radToDeg(0)).toBe(0);
  });

  it("should convert PI radians to 180 degrees", () => {
    expect(radToDeg(Math.PI)).toBeCloseTo(180, 10);
  });

  it("should convert PI/2 radians to 90 degrees", () => {
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 10);
  });

  it("should convert 2*PI radians to 360 degrees", () => {
    expect(radToDeg(2 * Math.PI)).toBeCloseTo(360, 10);
  });

  it("should handle negative radians", () => {
    expect(radToDeg(-Math.PI / 2)).toBeCloseTo(-90, 10);
  });

  it("should be inverse of degToRad", () => {
    const degrees = 123.456;
    expect(radToDeg(degToRad(degrees))).toBeCloseTo(degrees, 10);
  });
});

describe("conversion round-trips", () => {
  it("should convert degrees to radians and back", () => {
    const testValues = [0, 30, 45, 60, 90, 120, 180, 270, 360, -45, -90];

    testValues.forEach((deg) => {
      const rad = degToRad(deg);
      const backToDeg = radToDeg(rad);
      expect(backToDeg).toBeCloseTo(deg, 10);
    });
  });

  it("should convert radians to degrees and back", () => {
    const testValues = [
      0,
      Math.PI / 6,
      Math.PI / 4,
      Math.PI / 2,
      Math.PI,
      2 * Math.PI,
    ];

    testValues.forEach((rad) => {
      const deg = radToDeg(rad);
      const backToRad = degToRad(deg);
      expect(backToRad).toBeCloseTo(rad, 10);
    });
  });
});
