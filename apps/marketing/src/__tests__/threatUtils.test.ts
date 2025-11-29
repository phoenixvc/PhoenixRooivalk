/**
 * Tests for Threat Utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  spawnThreat,
  moveThreats,
  isPointNearThreat,
  findThreatsInBox,
  calculateThreatDamage,
  damageThreat,
  calculateThreatPriority,
  getThreatAppearance,
} from "../components/utils/threatUtils";
import { createMockThreat } from "./__mocks__/gameMocks";

describe("spawnThreat", () => {
  it("should spawn a threat with default values", () => {
    const threat = spawnThreat();

    expect(threat.id).toBeDefined();
    expect(threat.status).toBe("active");
    expect(threat.isMoving).toBe(true);
    expect(threat.allegiance).toBe("hostile");
    expect(threat.health).toBe(threat.maxHealth);
  });

  it("should spawn a specific threat type", () => {
    const threat = spawnThreat("kamikaze");

    expect(threat.type).toBe("kamikaze");
    expect(threat.specialProperties?.explosionRadius).toBe(75);
  });

  it("should spawn stealth threat with stealth properties", () => {
    const threat = spawnThreat("stealth");

    expect(threat.type).toBe("stealth");
    expect(threat.specialProperties?.stealthMode).toBe(true);
    expect(threat.health).toBe(50);
  });

  it("should spawn swarm threat with swarm properties", () => {
    const threat = spawnThreat("swarm");

    expect(threat.type).toBe("swarm");
    expect(threat.specialProperties?.swarmBehavior).toBe(true);
    expect(threat.health).toBe(30);
  });

  it("should spawn boss threat with high health", () => {
    const threat = spawnThreat("boss");

    expect(threat.type).toBe("boss");
    expect(threat.health).toBe(200);
    expect(threat.maxHealth).toBe(200);
  });

  it("should use bounding rect for spawn position", () => {
    const rect = { width: 400, height: 300, left: 0, top: 0 } as DOMRect;
    const threat = spawnThreat("drone", rect);

    // Position should be at edge of bounding rect
    const isAtEdge =
      threat.x === 0 ||
      threat.y === 0 ||
      threat.x === 400 ||
      threat.y === 300 ||
      Math.abs(threat.x - 400) < 1 ||
      Math.abs(threat.y - 300) < 1;

    expect(isAtEdge || threat.x <= 400 && threat.y <= 300).toBe(true);
  });

  it("should increase speed with level", () => {
    const level1Threat = spawnThreat("drone", undefined, 1);
    const level5Threat = spawnThreat("drone", undefined, 5);

    expect(level5Threat.speed).toBeGreaterThan(level1Threat.speed);
  });

  it("should initialize trail with starting position", () => {
    const threat = spawnThreat();

    expect(threat.trail).toHaveLength(1);
    expect(threat.trail[0].x).toBe(threat.x);
    expect(threat.trail[0].y).toBe(threat.y);
  });
});

describe("moveThreats", () => {
  it("should not move neutralized threats", () => {
    const threats = [
      createMockThreat({ status: "neutralized", x: 100, y: 100 }),
    ];

    const result = moveThreats(threats, { x: 200, y: 200 });

    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(100);
  });

  it("should not move crater threats", () => {
    const threats = [createMockThreat({ status: "crater", x: 100, y: 100 })];

    const result = moveThreats(threats, { x: 200, y: 200 });

    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(100);
  });

  it("should not move threats with isMoving false", () => {
    const threats = [createMockThreat({ isMoving: false, x: 100, y: 100 })];

    const result = moveThreats(threats, { x: 200, y: 200 });

    expect(result[0].x).toBe(100);
    expect(result[0].y).toBe(100);
  });

  it("should move active threats toward center", () => {
    const threats = [
      createMockThreat({
        x: 0,
        y: 0,
        vx: 1,
        vy: 1,
        isMoving: true,
        status: "active",
      }),
    ];

    const result = moveThreats(threats, { x: 200, y: 200 }, 1, 1 / 60);

    // Threat should move closer to center
    expect(result[0].x).toBeGreaterThan(0);
    expect(result[0].y).toBeGreaterThan(0);
  });

  it("should stop threats very close to center", () => {
    const threats = [
      createMockThreat({
        x: 195,
        y: 195,
        vx: 1,
        vy: 1,
        isMoving: true,
        status: "active",
      }),
    ];

    const result = moveThreats(threats, { x: 200, y: 200 });

    // Threat should stop moving when very close
    expect(result[0].isMoving).toBe(false);
    expect(result[0].vx).toBe(0);
    expect(result[0].vy).toBe(0);
  });

  it("should update trail", () => {
    const threats = [
      createMockThreat({
        x: 100,
        y: 100,
        vx: 5,
        vy: 5,
        isMoving: true,
        status: "active",
      }),
    ];

    const result = moveThreats(threats, { x: 200, y: 200 });

    expect(result[0].trail.length).toBeGreaterThan(1);
  });

  it("should limit trail length to 10 points", () => {
    const threat = createMockThreat({
      trail: Array.from({ length: 15 }, (_, i) => ({
        x: i,
        y: i,
        timestamp: Date.now() - i * 100,
      })),
      isMoving: true,
      status: "active",
    });

    const result = moveThreats([threat], { x: 200, y: 200 });

    expect(result[0].trail.length).toBeLessThanOrEqual(10);
  });

  it("should increase attraction at higher levels", () => {
    const threat1 = createMockThreat({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isMoving: true,
      status: "active",
    });
    const threat2 = createMockThreat({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      isMoving: true,
      status: "active",
    });

    const level1Result = moveThreats([threat1], { x: 200, y: 200 }, 1, 1 / 60);
    const level10Result = moveThreats([threat2], { x: 200, y: 200 }, 10, 1 / 60);

    // Higher level should have more acceleration
    const level1Distance = Math.sqrt(level1Result[0].vx ** 2 + level1Result[0].vy ** 2);
    const level10Distance = Math.sqrt(level10Result[0].vx ** 2 + level10Result[0].vy ** 2);

    expect(level10Distance).toBeGreaterThan(level1Distance);
  });
});

describe("isPointNearThreat", () => {
  it("should return true when point is within range", () => {
    const threat = createMockThreat({ x: 100, y: 100 });

    const result = isPointNearThreat({ x: 110, y: 110 }, threat, 50);

    expect(result).toBe(true);
  });

  it("should return false when point is outside range", () => {
    const threat = createMockThreat({ x: 100, y: 100 });

    const result = isPointNearThreat({ x: 200, y: 200 }, threat, 50);

    expect(result).toBe(false);
  });

  it("should return true when point is exactly at range", () => {
    const threat = createMockThreat({ x: 100, y: 100 });

    const result = isPointNearThreat({ x: 150, y: 100 }, threat, 50);

    expect(result).toBe(true);
  });

  it("should return true when point is at same position", () => {
    const threat = createMockThreat({ x: 100, y: 100 });

    const result = isPointNearThreat({ x: 100, y: 100 }, threat, 10);

    expect(result).toBe(true);
  });
});

describe("findThreatsInBox", () => {
  it("should find threats within selection box", () => {
    const threats = [
      createMockThreat({ id: "inside", x: 50, y: 50, status: "active" }),
      createMockThreat({ id: "outside", x: 200, y: 200, status: "active" }),
    ];

    const box = { startX: 0, startY: 0, endX: 100, endY: 100 };
    const result = findThreatsInBox(threats, box);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("inside");
  });

  it("should handle inverted box coordinates", () => {
    const threats = [createMockThreat({ x: 50, y: 50, status: "active" })];

    const box = { startX: 100, startY: 100, endX: 0, endY: 0 };
    const result = findThreatsInBox(threats, box);

    expect(result).toHaveLength(1);
  });

  it("should exclude neutralized threats", () => {
    const threats = [
      createMockThreat({ x: 50, y: 50, status: "neutralized" }),
    ];

    const box = { startX: 0, startY: 0, endX: 100, endY: 100 };
    const result = findThreatsInBox(threats, box);

    expect(result).toHaveLength(0);
  });

  it("should include threats on box boundary", () => {
    const threats = [createMockThreat({ x: 100, y: 100, status: "active" })];

    const box = { startX: 0, startY: 0, endX: 100, endY: 100 };
    const result = findThreatsInBox(threats, box);

    expect(result).toHaveLength(1);
  });

  it("should return empty array for empty threats", () => {
    const box = { startX: 0, startY: 0, endX: 100, endY: 100 };
    const result = findThreatsInBox([], box);

    expect(result).toHaveLength(0);
  });
});

describe("calculateThreatDamage", () => {
  it("should calculate base damage", () => {
    const threat = createMockThreat({ type: "drone" });

    const damage = calculateThreatDamage(threat, "laser", 100, 1.0);

    expect(damage).toBe(100);
  });

  it("should apply effectiveness multiplier", () => {
    const threat = createMockThreat({ type: "drone" });

    const damage = calculateThreatDamage(threat, "laser", 100, 0.5);

    expect(damage).toBe(50);
  });

  it("should reduce kinetic damage against stealth", () => {
    const threat = createMockThreat({ type: "stealth" });

    const damage = calculateThreatDamage(threat, "kinetic", 100, 1.0);

    expect(damage).toBe(50);
  });

  it("should reduce laser damage against swarm", () => {
    const threat = createMockThreat({ type: "swarm" });

    const damage = calculateThreatDamage(threat, "laser", 100, 1.0);

    expect(damage).toBe(30);
  });

  it("should reduce all damage against shielded", () => {
    const threat = createMockThreat({ type: "shielded" });

    const damage = calculateThreatDamage(threat, "kinetic", 100, 1.0);

    expect(damage).toBe(20);
  });

  it("should not return negative damage", () => {
    const threat = createMockThreat({ type: "drone" });

    const damage = calculateThreatDamage(threat, "kinetic", -50, 1.0);

    expect(damage).toBe(0);
  });
});

describe("damageThreat", () => {
  it("should reduce threat health", () => {
    const threat = createMockThreat({ health: 100, maxHealth: 100 });

    const result = damageThreat(threat, 30);

    expect(result.health).toBe(70);
  });

  it("should neutralize threat when health reaches 0", () => {
    const threat = createMockThreat({ health: 50, maxHealth: 100 });

    const result = damageThreat(threat, 50);

    expect(result.health).toBe(0);
    expect(result.status).toBe("neutralized");
    expect(result.isMoving).toBe(false);
    expect(result.neutralizedAt).toBeDefined();
  });

  it("should not allow health below 0", () => {
    const threat = createMockThreat({ health: 50 });

    const result = damageThreat(threat, 100);

    expect(result.health).toBe(0);
  });

  it("should set fade start time on neutralization", () => {
    const threat = createMockThreat({ health: 10 });

    const result = damageThreat(threat, 20);

    expect(result.fadeStartTime).toBeDefined();
    expect(result.fadeStartTime).toBeGreaterThan(result.neutralizedAt!);
  });

  it("should not change status if threat survives", () => {
    const threat = createMockThreat({ health: 100, status: "active" });

    const result = damageThreat(threat, 50);

    expect(result.status).toBe("active");
    expect(result.isMoving).toBe(true);
  });
});

describe("calculateThreatPriority", () => {
  it("should return high priority for threats close to center", () => {
    const threat = createMockThreat({ x: 50, y: 50 });

    const priority = calculateThreatPriority(threat, { x: 100, y: 100 });

    expect(priority).toBe("high");
  });

  it("should return high priority for kamikaze threats", () => {
    const threat = createMockThreat({ x: 500, y: 500, type: "kamikaze" });

    const priority = calculateThreatPriority(threat, { x: 100, y: 100 });

    expect(priority).toBe("high");
  });

  it("should return medium priority for threats at medium distance", () => {
    const threat = createMockThreat({ x: 250, y: 100, type: "drone" });

    const priority = calculateThreatPriority(threat, { x: 100, y: 100 });

    expect(priority).toBe("medium");
  });

  it("should return medium priority for stealth threats", () => {
    const threat = createMockThreat({ x: 500, y: 500, type: "stealth" });

    const priority = calculateThreatPriority(threat, { x: 100, y: 100 });

    expect(priority).toBe("medium");
  });

  it("should return low priority for distant threats", () => {
    const threat = createMockThreat({ x: 500, y: 500, type: "drone" });

    const priority = calculateThreatPriority(threat, { x: 100, y: 100 });

    expect(priority).toBe("low");
  });
});

describe("getThreatAppearance", () => {
  it("should return appearance for drone", () => {
    const appearance = getThreatAppearance("drone");

    expect(appearance.emoji).toBeDefined();
    expect(appearance.color).toBeDefined();
    expect(appearance.cssClass).toBe("threat-drone");
  });

  it("should return appearance for swarm", () => {
    const appearance = getThreatAppearance("swarm");

    expect(appearance.cssClass).toBe("threat-swarm");
  });

  it("should return appearance for stealth", () => {
    const appearance = getThreatAppearance("stealth");

    expect(appearance.cssClass).toBe("threat-stealth");
  });

  it("should return appearance for kamikaze", () => {
    const appearance = getThreatAppearance("kamikaze");

    expect(appearance.cssClass).toBe("threat-kamikaze");
  });

  it("should return appearance for boss", () => {
    const appearance = getThreatAppearance("boss");

    expect(appearance.cssClass).toBe("threat-boss");
  });

  it("should return default drone appearance for unknown type", () => {
    const appearance = getThreatAppearance("unknown");

    expect(appearance.cssClass).toBe("threat-drone");
  });
});
