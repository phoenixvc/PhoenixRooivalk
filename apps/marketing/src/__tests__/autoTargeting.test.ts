/**
 * Tests for Auto-Targeting System
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { AutoTargetingSystem } from "../components/utils/autoTargeting";
import {
  createMockThreat,
  createMockThreats,
  createMockGameState,
} from "./__mocks__/gameMocks";

describe("AutoTargetingSystem", () => {
  let system: AutoTargetingSystem;

  beforeEach(() => {
    system = new AutoTargetingSystem();
  });

  describe("findBestTarget", () => {
    it("should return null when no threats are in range", () => {
      const threats = createMockThreats(3);
      threats.forEach((t) => {
        t.x = 500;
        t.y = 500;
      });

      const target = system.findBestTarget(
        threats,
        { x: 0, y: 0 },
        100, // range
      );

      expect(target).toBeNull();
    });

    it("should return null when threats are not active", () => {
      const threats = createMockThreats(3);
      threats.forEach((t) => {
        t.status = "neutralized";
      });

      const target = system.findBestTarget(
        threats,
        { x: 100, y: 100 },
        200,
      );

      expect(target).toBeNull();
    });

    it("should return null when threats are not moving", () => {
      const threats = createMockThreats(3);
      threats.forEach((t) => {
        t.isMoving = false;
      });

      const target = system.findBestTarget(
        threats,
        { x: 100, y: 100 },
        200,
      );

      expect(target).toBeNull();
    });

    it("should find threat within range", () => {
      const threats = [
        createMockThreat({ id: "close", x: 50, y: 50, status: "active", isMoving: true }),
        createMockThreat({ id: "far", x: 500, y: 500, status: "active", isMoving: true }),
      ];

      const target = system.findBestTarget(
        threats,
        { x: 0, y: 0 },
        100,
      );

      expect(target).not.toBeNull();
      expect(target?.id).toBe("close");
    });

    it("should prioritize high-priority threats", () => {
      // Kamikaze far from center to test priority over distance
      const threats = [
        createMockThreat({
          id: "drone",
          x: 150,
          y: 150,
          type: "drone",
          status: "active",
          isMoving: true,
        }),
        createMockThreat({
          id: "kamikaze",
          x: 50,
          y: 50,
          type: "kamikaze",
          status: "active",
          isMoving: true,
        }),
      ];

      const target = system.findBestTarget(
        threats,
        { x: 0, y: 0 },
        200,
      );

      // Kamikaze should be higher priority (both close, kamikaze type wins)
      expect(target?.id).toBe("kamikaze");
    });

    it("should prioritize closer threats when priority is equal", () => {
      const threats = [
        createMockThreat({
          id: "far",
          x: 80,
          y: 80,
          type: "drone",
          status: "active",
          isMoving: true,
        }),
        createMockThreat({
          id: "close",
          x: 30,
          y: 30,
          type: "drone",
          status: "active",
          isMoving: true,
        }),
      ];

      const target = system.findBestTarget(
        threats,
        { x: 0, y: 0 },
        200,
      );

      expect(target?.id).toBe("close");
    });
  });

  describe("canEngageTarget", () => {
    it("should allow engagement for new target", () => {
      const canEngage = system.canEngageTarget("threat-1", Date.now());

      expect(canEngage).toBe(true);
    });

    it("should block engagement during cooldown", () => {
      const now = Date.now();
      system.recordEngagement("threat-1", now);

      const canEngage = system.canEngageTarget("threat-1", now + 100);

      expect(canEngage).toBe(false);
    });

    it("should allow engagement after cooldown", () => {
      const now = Date.now();
      system.recordEngagement("threat-1", now);

      const canEngage = system.canEngageTarget("threat-1", now + 600);

      expect(canEngage).toBe(true);
    });
  });

  describe("recordEngagement", () => {
    it("should record engagement time", () => {
      const now = Date.now();
      system.recordEngagement("threat-1", now);

      expect(system.canEngageTarget("threat-1", now + 100)).toBe(false);
    });
  });

  describe("processAutoTargeting", () => {
    it("should not fire in manual mode", () => {
      const onFireWeapon = vi.fn();
      const gameState = createMockGameState({
        automationMode: "manual",
        threats: [createMockThreat({ status: "active", isMoving: true })],
      });

      system.processAutoTargeting(gameState, Date.now(), onFireWeapon);

      expect(onFireWeapon).not.toHaveBeenCalled();
    });

    it("should fire in automated mode", () => {
      const onFireWeapon = vi.fn();
      const gameState = createMockGameState({
        automationMode: "automated",
        threats: [
          createMockThreat({
            id: "target",
            x: 400,
            y: 300,
            status: "active",
            isMoving: true,
          }),
        ],
        mothership: { x: 400, y: 300, health: 100, maxHealth: 100, shield: 50, maxShield: 50 },
        energy: 100,
      });

      system.processAutoTargeting(gameState, Date.now(), onFireWeapon);

      expect(onFireWeapon).toHaveBeenCalled();
    });

    it("should fire in hybrid mode", () => {
      const onFireWeapon = vi.fn();
      const gameState = createMockGameState({
        automationMode: "hybrid",
        threats: [
          createMockThreat({
            id: "target",
            x: 400,
            y: 300,
            status: "active",
            isMoving: true,
          }),
        ],
        mothership: { x: 400, y: 300, health: 100, maxHealth: 100, shield: 50, maxShield: 50 },
        energy: 100,
      });

      system.processAutoTargeting(gameState, Date.now(), onFireWeapon);

      expect(onFireWeapon).toHaveBeenCalled();
    });

    it("should not fire when weapon is not ready", () => {
      const onFireWeapon = vi.fn();
      const gameState = createMockGameState({
        automationMode: "automated",
        threats: [createMockThreat({ status: "active", isMoving: true })],
        weapons: {
          kinetic: {
            id: "kinetic",
            name: "Kinetic",
            type: "kinetic",
            damage: 25,
            range: 200,
            cooldown: 500,
            energyCost: 10,
            ammo: 100,
            maxAmmo: 100,
            isReady: false,
            effectiveness: {},
          },
        },
      });

      system.processAutoTargeting(gameState, Date.now(), onFireWeapon);

      expect(onFireWeapon).not.toHaveBeenCalled();
    });

    it("should not fire when no ammo", () => {
      const onFireWeapon = vi.fn();
      const gameState = createMockGameState({
        automationMode: "automated",
        threats: [createMockThreat({ status: "active", isMoving: true })],
        weapons: {
          kinetic: {
            id: "kinetic",
            name: "Kinetic",
            type: "kinetic",
            damage: 25,
            range: 200,
            cooldown: 500,
            energyCost: 10,
            ammo: 0,
            maxAmmo: 100,
            isReady: true,
            effectiveness: {},
          },
        },
      });

      system.processAutoTargeting(gameState, Date.now(), onFireWeapon);

      expect(onFireWeapon).not.toHaveBeenCalled();
    });

    it("should not fire when energy is too low", () => {
      const onFireWeapon = vi.fn();
      const gameState = createMockGameState({
        automationMode: "automated",
        threats: [createMockThreat({ status: "active", isMoving: true })],
        energy: 5,
      });

      system.processAutoTargeting(gameState, Date.now(), onFireWeapon);

      expect(onFireWeapon).not.toHaveBeenCalled();
    });
  });

  describe("processAreaEngagement", () => {
    it("should hit threats within radius", () => {
      const onNeutralize = vi.fn();
      const threats = [
        createMockThreat({ id: "in-range", x: 50, y: 50, status: "active" }),
        createMockThreat({ id: "out-of-range", x: 500, y: 500, status: "active" }),
      ];

      const hits = system.processAreaEngagement(
        threats,
        { x: 0, y: 0 },
        100,
        onNeutralize,
      );

      expect(hits).toBe(1);
      expect(onNeutralize).toHaveBeenCalledWith("in-range");
    });

    it("should not hit neutralized threats", () => {
      const onNeutralize = vi.fn();
      const threats = [
        createMockThreat({ id: "neutralized", x: 50, y: 50, status: "neutralized" }),
      ];

      const hits = system.processAreaEngagement(
        threats,
        { x: 0, y: 0 },
        100,
        onNeutralize,
      );

      expect(hits).toBe(0);
      expect(onNeutralize).not.toHaveBeenCalled();
    });

    it("should count multiple hits", () => {
      const onNeutralize = vi.fn();
      const threats = [
        createMockThreat({ id: "t1", x: 10, y: 10, status: "active" }),
        createMockThreat({ id: "t2", x: 20, y: 20, status: "active" }),
        createMockThreat({ id: "t3", x: 30, y: 30, status: "active" }),
      ];

      const hits = system.processAreaEngagement(
        threats,
        { x: 0, y: 0 },
        100,
        onNeutralize,
      );

      expect(hits).toBe(3);
      expect(onNeutralize).toHaveBeenCalledTimes(3);
    });
  });

  describe("cleanup", () => {
    it("should remove old engagement records", () => {
      const oldTime = Date.now() - 15000;
      system.recordEngagement("old-threat", oldTime);
      system.recordEngagement("new-threat", Date.now());

      system.cleanup(Date.now());

      // Old threat should be cleaned up, allowing engagement
      expect(system.canEngageTarget("old-threat", Date.now())).toBe(true);
    });

    it("should keep recent engagement records", () => {
      const now = Date.now();
      system.recordEngagement("recent-threat", now);

      system.cleanup(now);

      // Recent threat should still be in cooldown when checked immediately
      expect(system.canEngageTarget("recent-threat", now + 100)).toBe(false);
    });
  });
});
