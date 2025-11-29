/**
 * Tests for ROI Calculator
 */

import { describe, it, expect } from "vitest";
import { calculateROI } from "../components/sections/utils/roiCalculator";
import type { ROIInputs, SensitivityLevel } from "../components/sections/utils/roiCalculator";

describe("calculateROI", () => {
  const defaultInputs: ROIInputs = {
    threatFrequency: 10,
    averageResponseTime: 120,
    deploymentCost: 100000,
    personnelCost: 50000,
  };

  describe("basic calculations", () => {
    it("should return valid phoenix results", () => {
      const result = calculateROI(defaultInputs, "median");

      expect(result.phoenix).toBeDefined();
      expect(result.phoenix.prevented).toBeGreaterThan(0);
      expect(result.phoenix.savings).toBeGreaterThan(0);
      expect(typeof result.phoenix.roi).toBe("number");
      expect(result.phoenix.successRate).toBeGreaterThan(0);
      expect(result.phoenix.successRate).toBeLessThanOrEqual(1);
    });

    it("should return valid traditional results", () => {
      const result = calculateROI(defaultInputs, "median");

      expect(result.traditional).toBeDefined();
      expect(result.traditional.prevented).toBeGreaterThan(0);
      expect(result.traditional.savings).toBeGreaterThan(0);
      expect(typeof result.traditional.roi).toBe("number");
      expect(result.traditional.successRate).toBeGreaterThan(0);
      expect(result.traditional.successRate).toBeLessThanOrEqual(1);
    });

    it("should calculate annual threats correctly", () => {
      const inputs: ROIInputs = {
        threatFrequency: 5, // 5 per month
        averageResponseTime: 120,
        deploymentCost: 100000,
        personnelCost: 50000,
      };

      const result = calculateROI(inputs, "median");

      // Annual threats = 5 * 12 = 60
      // With median phoenix success rate ~0.8, prevented should be around 48
      expect(result.phoenix.prevented).toBeGreaterThan(40);
      expect(result.phoenix.prevented).toBeLessThan(60);
    });
  });

  describe("sensitivity levels", () => {
    it("should apply conservative sensitivity", () => {
      const result = calculateROI(defaultInputs, "conservative");

      // Conservative has lower phoenix multiplier, higher traditional
      expect(result.phoenix.successRate).toBeLessThan(0.8);
      expect(result.traditional.successRate).toBeGreaterThan(0.5);
    });

    it("should apply median sensitivity", () => {
      const result = calculateROI(defaultInputs, "median");

      expect(result.phoenix.successRate).toBeGreaterThan(0.7);
    });

    it("should apply aggressive sensitivity", () => {
      const result = calculateROI(defaultInputs, "aggressive");

      // Aggressive has higher phoenix multiplier, lower traditional
      expect(result.phoenix.successRate).toBeGreaterThan(0.8);
    });

    it("should default to conservative for unknown sensitivity", () => {
      const result = calculateROI(defaultInputs, "unknown" as SensitivityLevel);

      const conservativeResult = calculateROI(defaultInputs, "conservative");
      expect(result.phoenix.successRate).toBe(conservativeResult.phoenix.successRate);
    });

    it("should increase phoenix ROI with aggressive settings", () => {
      const conservative = calculateROI(defaultInputs, "conservative");
      const aggressive = calculateROI(defaultInputs, "aggressive");

      expect(aggressive.phoenix.roi).toBeGreaterThan(conservative.phoenix.roi);
    });
  });

  describe("response time impact", () => {
    it("should have higher phoenix success rate with fast response", () => {
      const fastResponse: ROIInputs = {
        ...defaultInputs,
        averageResponseTime: 60, // Fast response
      };
      const slowResponse: ROIInputs = {
        ...defaultInputs,
        averageResponseTime: 180, // Slow response
      };

      const fastResult = calculateROI(fastResponse, "median");
      const slowResult = calculateROI(slowResponse, "median");

      expect(fastResult.phoenix.successRate).toBeGreaterThan(
        slowResult.phoenix.successRate,
      );
    });

    it("should have higher traditional success rate with fast response", () => {
      const fastResponse: ROIInputs = {
        ...defaultInputs,
        averageResponseTime: 1000, // Relatively fast for traditional
      };
      const slowResponse: ROIInputs = {
        ...defaultInputs,
        averageResponseTime: 5000, // Slow for traditional
      };

      const fastResult = calculateROI(fastResponse, "median");
      const slowResult = calculateROI(slowResponse, "median");

      expect(fastResult.traditional.successRate).toBeGreaterThan(
        slowResult.traditional.successRate,
      );
    });
  });

  describe("cost calculations", () => {
    it("should calculate phoenix savings based on prevented incidents", () => {
      const result = calculateROI(defaultInputs, "median");

      // Median incident cost is 500000
      // Savings = prevented * incidentCost
      const expectedSavings = result.phoenix.prevented * 500000;
      expect(result.phoenix.savings).toBeCloseTo(expectedSavings, 0);
    });

    it("should calculate traditional savings based on prevented incidents", () => {
      const result = calculateROI(defaultInputs, "median");

      const expectedSavings = result.traditional.prevented * 500000;
      expect(result.traditional.savings).toBeCloseTo(expectedSavings, 0);
    });

    it("should calculate ROI as percentage", () => {
      const result = calculateROI(defaultInputs, "median");

      // ROI = (savings - costs) / costs * 100
      const phoenixCosts = defaultInputs.deploymentCost + defaultInputs.personnelCost;
      const expectedROI =
        ((result.phoenix.savings - phoenixCosts) / phoenixCosts) * 100;

      expect(result.phoenix.roi).toBeCloseTo(expectedROI, 0);
    });

    it("should double deployment cost for traditional ROI", () => {
      const result = calculateROI(defaultInputs, "median");

      // Traditional costs = deploymentCost * 2 + personnelCost
      const traditionalCosts =
        defaultInputs.deploymentCost * 2 + defaultInputs.personnelCost;
      const expectedROI =
        ((result.traditional.savings - traditionalCosts) / traditionalCosts) * 100;

      expect(result.traditional.roi).toBeCloseTo(expectedROI, 0);
    });
  });

  describe("edge cases", () => {
    it("should handle zero threat frequency", () => {
      const inputs: ROIInputs = {
        ...defaultInputs,
        threatFrequency: 0,
      };

      const result = calculateROI(inputs, "median");

      expect(result.phoenix.prevented).toBe(0);
      expect(result.traditional.prevented).toBe(0);
    });

    it("should handle very high threat frequency", () => {
      const inputs: ROIInputs = {
        ...defaultInputs,
        threatFrequency: 1000,
      };

      const result = calculateROI(inputs, "median");

      // 1000 threats/month * 12 months * ~0.8 success = ~9600
      expect(result.phoenix.prevented).toBeGreaterThan(9000);
      expect(result.phoenix.savings).toBeGreaterThan(0);
    });

    it("should handle zero costs", () => {
      const inputs: ROIInputs = {
        ...defaultInputs,
        deploymentCost: 0,
        personnelCost: 0,
      };

      const result = calculateROI(inputs, "median");

      // ROI should be infinite or very high
      expect(result.phoenix.roi).toBe(Infinity);
    });

    it("should handle high costs", () => {
      const inputs: ROIInputs = {
        ...defaultInputs,
        deploymentCost: 10000000,
        personnelCost: 5000000,
      };

      const result = calculateROI(inputs, "median");

      // ROI might be negative with high costs
      expect(typeof result.phoenix.roi).toBe("number");
      expect(typeof result.traditional.roi).toBe("number");
    });
  });

  describe("comparison between systems", () => {
    it("should show phoenix has higher success rate than traditional", () => {
      const result = calculateROI(defaultInputs, "median");

      expect(result.phoenix.successRate).toBeGreaterThan(
        result.traditional.successRate,
      );
    });

    it("should show phoenix prevents more threats", () => {
      const result = calculateROI(defaultInputs, "median");

      expect(result.phoenix.prevented).toBeGreaterThan(
        result.traditional.prevented,
      );
    });

    it("should generally show phoenix has better ROI", () => {
      const result = calculateROI(defaultInputs, "median");

      // Phoenix should have better ROI due to higher success rate
      // and same cost structure
      expect(result.phoenix.roi).toBeGreaterThan(result.traditional.roi);
    });
  });

  describe("incident cost by sensitivity", () => {
    it("should use conservative incident cost", () => {
      const result = calculateROI(defaultInputs, "conservative");
      const prevented = result.phoenix.prevented;

      // Conservative incident cost = 300000
      expect(result.phoenix.savings).toBeCloseTo(prevented * 300000, 0);
    });

    it("should use median incident cost", () => {
      const result = calculateROI(defaultInputs, "median");
      const prevented = result.phoenix.prevented;

      // Median incident cost = 500000
      expect(result.phoenix.savings).toBeCloseTo(prevented * 500000, 0);
    });

    it("should use aggressive incident cost", () => {
      const result = calculateROI(defaultInputs, "aggressive");
      const prevented = result.phoenix.prevented;

      // Aggressive incident cost = 750000
      expect(result.phoenix.savings).toBeCloseTo(prevented * 750000, 0);
    });
  });
});
