/**
 * Tests for Formation Utilities
 */

import { describe, it, expect } from "vitest";
import {
  calculateFormationPositions,
  createFormation,
  FORMATION_DESCRIPTIONS,
  SEMICIRCLE_PRESETS,
} from "../components/utils/formationUtils";
import { createMockDrones, createMockFormation } from "./__mocks__/gameMocks";

describe("calculateFormationPositions", () => {
  describe("circle formation", () => {
    it("should calculate circle positions for drones", () => {
      const drones = createMockDrones(4, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "circle",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 50,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(4);
      // Check positions are evenly distributed around center
      positions.forEach((pos) => {
        const distFromCenter = Math.sqrt(
          (pos.x - 200) ** 2 + (pos.y - 200) ** 2,
        );
        expect(distFromCenter).toBeCloseTo(50, 0);
      });
    });

    it("should return empty array for no drones", () => {
      const formation = createMockFormation({
        pattern: "circle",
        droneIds: [],
      });

      const positions = calculateFormationPositions(formation, []);

      expect(positions).toHaveLength(0);
    });

    it("should handle single drone in circle", () => {
      const drones = createMockDrones(1);
      const formation = createMockFormation({
        pattern: "circle",
        droneIds: [drones[0].id],
        centerX: 100,
        centerY: 100,
        spacing: 50,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(1);
      expect(positions[0].x).toBeCloseTo(150, 0); // center + spacing * cos(0)
    });
  });

  describe("line formation", () => {
    it("should calculate line positions for drones", () => {
      const drones = createMockDrones(3, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "line",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 40,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(3);
      // All drones should be on the same Y axis
      positions.forEach((pos) => {
        expect(pos.y).toBe(200);
      });
      // Drones should be evenly spaced
      expect(positions[1].x - positions[0].x).toBe(40);
      expect(positions[2].x - positions[1].x).toBe(40);
    });

    it("should center the line on formation center", () => {
      const drones = createMockDrones(3, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "line",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 50,
      });

      const positions = calculateFormationPositions(formation, drones);

      // Middle drone should be at center X
      expect(positions[1].x).toBe(200);
    });
  });

  describe("diamond formation", () => {
    it("should calculate diamond positions for 4 drones", () => {
      const drones = createMockDrones(4, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "diamond",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 50,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(4);
      // Check diamond points
      expect(positions[0]).toEqual({ x: 200, y: 150, droneId: "drone-0" }); // Top
      expect(positions[1]).toEqual({ x: 250, y: 200, droneId: "drone-1" }); // Right
      expect(positions[2]).toEqual({ x: 200, y: 250, droneId: "drone-2" }); // Bottom
      expect(positions[3]).toEqual({ x: 150, y: 200, droneId: "drone-3" }); // Left
    });

    it("should place single drone at center", () => {
      const drones = createMockDrones(1);
      const formation = createMockFormation({
        pattern: "diamond",
        droneIds: [drones[0].id],
        centerX: 200,
        centerY: 200,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(1);
      expect(positions[0].x).toBe(200);
      expect(positions[0].y).toBe(200);
    });

    it("should handle more than 4 drones", () => {
      const drones = createMockDrones(6, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "diamond",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 50,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(6);
      // First 4 should be in diamond, rest should be near center
    });
  });

  describe("wedge formation", () => {
    it("should calculate wedge positions for drones", () => {
      const drones = createMockDrones(5, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "wedge",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 50,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(5);
      // Leader should be at front (lower Y)
      expect(positions[0].x).toBe(200);
      expect(positions[0].y).toBe(150);
    });

    it("should place single drone at center", () => {
      const drones = createMockDrones(1);
      const formation = createMockFormation({
        pattern: "wedge",
        droneIds: [drones[0].id],
        centerX: 200,
        centerY: 200,
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(1);
      expect(positions[0].x).toBe(200);
      expect(positions[0].y).toBe(200);
    });
  });

  describe("semicircle formation", () => {
    it("should calculate semicircle positions for drones", () => {
      const drones = createMockDrones(5, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const formation = createMockFormation({
        pattern: "semicircle",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        spacing: 50,
        semicircleDegrees: 180,
        semicircleRadius: 100,
        semicircleDirection: "north",
      });

      const positions = calculateFormationPositions(formation, drones);

      expect(positions).toHaveLength(5);
      // All positions should be at the specified radius
      positions.forEach((pos) => {
        const distFromCenter = Math.sqrt(
          (pos.x - 200) ** 2 + (pos.y - 200) ** 2,
        );
        expect(distFromCenter).toBeCloseTo(100, 0);
      });
    });

    it("should handle different directions", () => {
      const drones = createMockDrones(5, {});
      drones.forEach((d, i) => (d.id = `drone-${i}`));

      const northFormation = createMockFormation({
        pattern: "semicircle",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        semicircleDegrees: 180,
        semicircleRadius: 100,
        semicircleDirection: "north",
      });

      const southFormation = createMockFormation({
        pattern: "semicircle",
        droneIds: drones.map((d) => d.id),
        centerX: 200,
        centerY: 200,
        semicircleDegrees: 180,
        semicircleRadius: 100,
        semicircleDirection: "south",
      });

      const northPositions = calculateFormationPositions(
        northFormation,
        drones,
      );
      const southPositions = calculateFormationPositions(
        southFormation,
        drones,
      );

      // At least some positions should be different for different directions
      const hasDifferentPositions = northPositions.some((np, i) => {
        const sp = southPositions[i];
        return Math.abs(np.x - sp.x) > 1 || Math.abs(np.y - sp.y) > 1;
      });
      expect(hasDifferentPositions).toBe(true);
    });

    it("should return empty for no drones", () => {
      const formation = createMockFormation({
        pattern: "semicircle",
        droneIds: [],
      });

      const positions = calculateFormationPositions(formation, []);

      expect(positions).toHaveLength(0);
    });
  });

  it("should return empty array for unknown pattern", () => {
    const drones = createMockDrones(3);
    const formation = createMockFormation({
      pattern: "unknown" as "circle",
      droneIds: drones.map((d) => d.id),
    });

    const positions = calculateFormationPositions(formation, drones);

    expect(positions).toHaveLength(0);
  });

  it("should filter drones not in formation", () => {
    const drones = createMockDrones(5);
    drones.forEach((d, i) => (d.id = `drone-${i}`));

    const formation = createMockFormation({
      pattern: "circle",
      droneIds: ["drone-0", "drone-2", "drone-4"],
      centerX: 200,
      centerY: 200,
    });

    const positions = calculateFormationPositions(formation, drones);

    expect(positions).toHaveLength(3);
  });
});

describe("createFormation", () => {
  it("should create a formation with specified parameters", () => {
    const formation = createFormation(
      "Test Formation",
      "circle",
      200,
      200,
      ["drone-1", "drone-2"],
      60,
    );

    expect(formation.name).toBe("Test Formation");
    expect(formation.pattern).toBe("circle");
    expect(formation.centerX).toBe(200);
    expect(formation.centerY).toBe(200);
    expect(formation.droneIds).toEqual(["drone-1", "drone-2"]);
    expect(formation.spacing).toBe(60);
    expect(formation.isActive).toBe(true);
  });

  it("should use default spacing", () => {
    const formation = createFormation("Test", "line", 100, 100, ["drone-1"]);

    expect(formation.spacing).toBe(50);
  });

  it("should generate unique ID", () => {
    const formation1 = createFormation("Test1", "circle", 100, 100, []);
    const formation2 = createFormation("Test2", "circle", 100, 100, []);

    expect(formation1.id).not.toBe(formation2.id);
  });

  it("should include semicircle parameters when provided", () => {
    const formation = createFormation(
      "Semicircle Test",
      "semicircle",
      200,
      200,
      ["drone-1"],
      50,
      180,
      100,
      "north",
    );

    expect(formation.semicircleDegrees).toBe(180);
    expect(formation.semicircleRadius).toBe(100);
    expect(formation.semicircleDirection).toBe("north");
  });
});

describe("FORMATION_DESCRIPTIONS", () => {
  it("should have descriptions for all formations", () => {
    expect(FORMATION_DESCRIPTIONS.circle).toBeDefined();
    expect(FORMATION_DESCRIPTIONS.line).toBeDefined();
    expect(FORMATION_DESCRIPTIONS.diamond).toBeDefined();
    expect(FORMATION_DESCRIPTIONS.wedge).toBeDefined();
    expect(FORMATION_DESCRIPTIONS.semicircle).toBeDefined();
  });

  it("should have meaningful descriptions", () => {
    expect(FORMATION_DESCRIPTIONS.circle.length).toBeGreaterThan(10);
    expect(FORMATION_DESCRIPTIONS.line.length).toBeGreaterThan(10);
  });
});

describe("SEMICIRCLE_PRESETS", () => {
  it("should have all preset configurations", () => {
    expect(SEMICIRCLE_PRESETS["half-circle"]).toBeDefined();
    expect(SEMICIRCLE_PRESETS["quarter-circle"]).toBeDefined();
    expect(SEMICIRCLE_PRESETS["three-quarter"]).toBeDefined();
    expect(SEMICIRCLE_PRESETS["defensive-arc"]).toBeDefined();
    expect(SEMICIRCLE_PRESETS["attack-wedge"]).toBeDefined();
  });

  it("should have valid degrees values", () => {
    expect(SEMICIRCLE_PRESETS["half-circle"].degrees).toBe(180);
    expect(SEMICIRCLE_PRESETS["quarter-circle"].degrees).toBe(90);
    expect(SEMICIRCLE_PRESETS["three-quarter"].degrees).toBe(270);
  });

  it("should have valid direction values", () => {
    const validDirections = ["north", "south", "east", "west"];
    Object.values(SEMICIRCLE_PRESETS).forEach((preset) => {
      expect(validDirections).toContain(preset.direction);
    });
  });
});
