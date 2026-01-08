/**
 * Tests for Resource Manager
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ResourceManager,
  createResourceManager,
  DEFAULT_RESOURCE_STATE,
  EFFECTOR_UNLOCK_DATA,
  DRONE_UNLOCK_DATA,
  type ResourceState,
} from "../components/utils/resourceManager";
import { createMockResourceState } from "./__mocks__/gameMocks";

describe("ResourceManager", () => {
  let manager: ResourceManager;
  let onStateChange: ReturnType<typeof vi.fn<(state: ResourceState) => void>>;

  beforeEach(() => {
    onStateChange = vi.fn<(state: ResourceState) => void>();
    manager = new ResourceManager(undefined, onStateChange);
  });

  describe("initialization", () => {
    it("should initialize with default state", () => {
      const state = manager.getState();

      expect(state.tokens).toBe(DEFAULT_RESOURCE_STATE.tokens);
      expect(state.researchPoints).toBe(DEFAULT_RESOURCE_STATE.researchPoints);
      expect(state.unlockedEffectors).toContain("kinetic");
      expect(state.unlockedDrones).toContain("effector");
    });

    it("should initialize with custom state", () => {
      const customState = createMockResourceState({
        tokens: 500,
        researchPoints: 100,
      });

      const customManager = new ResourceManager(customState);
      const state = customManager.getState();

      expect(state.tokens).toBe(500);
      expect(state.researchPoints).toBe(100);
    });

    it("should deep clone initial state to prevent mutations", () => {
      const customState = createMockResourceState({
        unlockedEffectors: ["kinetic"],
      });

      const customManager = new ResourceManager(customState);
      customState.unlockedEffectors.push("emp");

      const state = customManager.getState();
      expect(state.unlockedEffectors).not.toContain("emp");
    });
  });

  describe("token management", () => {
    it("should add tokens", () => {
      manager.addTokens(50);

      const state = manager.getState();
      expect(state.tokens).toBe(150);
      expect(onStateChange).toHaveBeenCalled();
    });

    it("should spend tokens when sufficient", () => {
      const result = manager.spendTokens(50);

      expect(result).toBe(true);
      expect(manager.getState().tokens).toBe(50);
    });

    it("should not spend tokens when insufficient", () => {
      const result = manager.spendTokens(200);

      expect(result).toBe(false);
      expect(manager.getState().tokens).toBe(100);
    });
  });

  describe("research points", () => {
    it("should add research points", () => {
      manager.addResearchPoints(25);

      expect(manager.getState().researchPoints).toBe(25);
    });
  });

  describe("research system", () => {
    it("should not start research when already researching", () => {
      manager.addResearchPoints(100);
      manager.startResearch("emp", "effector");

      const result = manager.startResearch("laser", "effector");

      expect(result).toBe(false);
    });

    it("should not start research for already unlocked item", () => {
      manager.addResearchPoints(100);

      const result = manager.startResearch("kinetic", "effector");

      expect(result).toBe(false);
    });

    it("should not start research with insufficient points", () => {
      const result = manager.startResearch("emp", "effector");

      expect(result).toBe(false);
    });

    it("should start research when conditions are met", () => {
      const empData = EFFECTOR_UNLOCK_DATA["emp"];
      manager.addResearchPoints(empData.researchCost);

      const result = manager.startResearch("emp", "effector");

      expect(result).toBe(true);
      const state = manager.getState();
      expect(state.activeResearch).not.toBeNull();
      expect(state.activeResearch?.type).toBe("emp");
    });

    it("should complete research and unlock item", () => {
      const empData = EFFECTOR_UNLOCK_DATA["emp"];
      manager.addResearchPoints(empData.researchCost);
      manager.startResearch("emp", "effector");

      manager.addResearchProgress(empData.researchCost);

      const state = manager.getState();
      expect(state.activeResearch).toBeNull();
      expect(state.unlockedEffectors).toContain("emp");
      expect(state.availableEffectors).toContain("emp");
    });

    it("should get research progress info", () => {
      const empData = EFFECTOR_UNLOCK_DATA["emp"];
      manager.addResearchPoints(empData.researchCost);
      manager.startResearch("emp", "effector");
      manager.addResearchProgress(25);

      const progress = manager.getResearchProgress();

      expect(progress).not.toBeNull();
      expect(progress?.type).toBe("emp");
      expect(progress?.progress).toBe(25);
      expect(progress?.category).toBe("effector");
    });
  });

  describe("direct unlock", () => {
    it("should unlock effector with tokens", () => {
      const empData = EFFECTOR_UNLOCK_DATA["emp"];
      manager.addTokens(empData.unlockCost);

      const result = manager.unlockEffector("emp");

      expect(result).toBe(true);
      expect(manager.isEffectorUnlocked("emp")).toBe(true);
    });

    it("should not unlock effector with insufficient tokens", () => {
      const result = manager.unlockEffector("emp");

      expect(result).toBe(false);
      expect(manager.isEffectorUnlocked("emp")).toBe(false);
    });

    it("should not unlock already unlocked effector", () => {
      const result = manager.unlockEffector("kinetic");

      expect(result).toBe(false);
    });

    it("should unlock drone with tokens", () => {
      const jammerData = DRONE_UNLOCK_DATA["jammer"];
      manager.addTokens(jammerData.unlockCost);

      const result = manager.unlockDrone("jammer");

      expect(result).toBe(true);
      expect(manager.isDroneUnlocked("jammer")).toBe(true);
    });
  });

  describe("drone purchase", () => {
    it("should purchase drone when unlocked and has tokens", () => {
      const effectorData = DRONE_UNLOCK_DATA["effector"];
      manager.addTokens(effectorData.tokenCost);

      const result = manager.purchaseDrone("effector");

      expect(result).toBe(true);
    });

    it("should not purchase locked drone", () => {
      manager.addTokens(1000);

      const result = manager.purchaseDrone("jammer");

      expect(result).toBe(false);
    });

    it("should not purchase with insufficient tokens", () => {
      // Spend all tokens first to ensure insufficient balance
      manager.spendTokens(100);
      const result = manager.purchaseDrone("effector");

      expect(result).toBe(false);
    });
  });

  describe("available research options", () => {
    it("should return all locked items as research options", () => {
      const options = manager.getAvailableResearch();

      expect(options.length).toBeGreaterThan(0);
      expect(options.every((opt) => !opt.isUnlocked)).toBe(true);
    });

    it("should not include unlocked items", () => {
      const options = manager.getAvailableResearch();

      expect(options.find((opt) => opt.type === "kinetic")).toBeUndefined();
    });
  });

  describe("data retrieval", () => {
    it("should get effector data", () => {
      const data = manager.getEffectorData("kinetic");

      expect(data).not.toBeNull();
      expect(data?.name).toBe("Kinetic Weapon");
    });

    it("should return null for unknown effector", () => {
      const data = manager.getEffectorData("unknown");

      expect(data).toBeNull();
    });

    it("should get drone data", () => {
      const data = manager.getDroneData("effector");

      expect(data).not.toBeNull();
      expect(data?.name).toBe("Effector Drone");
    });

    it("should get unlocked effectors", () => {
      const unlocked = manager.getUnlockedEffectors();

      expect(unlocked).toContain("kinetic");
      expect(Array.isArray(unlocked)).toBe(true);
    });

    it("should get unlocked drones", () => {
      const unlocked = manager.getUnlockedDrones();

      expect(unlocked).toContain("effector");
    });
  });

  describe("performance rewards", () => {
    it("should award tokens based on score", () => {
      manager.awardPerformanceRewards(1000, 0, false);

      expect(manager.getState().tokens).toBe(110); // 100 + 1000/100
    });

    it("should award tokens for neutralized threats", () => {
      manager.awardPerformanceRewards(0, 10, false);

      expect(manager.getState().tokens).toBe(150); // 100 + 10*5
    });

    it("should award bonus for wave completion", () => {
      manager.awardPerformanceRewards(0, 0, true);

      expect(manager.getState().tokens).toBe(125); // 100 + 25
    });

    it("should award research points", () => {
      manager.awardPerformanceRewards(500, 10, true);

      expect(manager.getState().researchPoints).toBeGreaterThan(0);
    });
  });

  describe("reset", () => {
    it("should reset to default state", () => {
      manager.addTokens(500);
      manager.addResearchPoints(100);

      manager.reset();

      const state = manager.getState();
      expect(state.tokens).toBe(DEFAULT_RESOURCE_STATE.tokens);
      expect(state.researchPoints).toBe(0);
    });
  });
});

describe("createResourceManager", () => {
  it("should create a new resource manager", () => {
    const manager = createResourceManager();

    expect(manager).toBeInstanceOf(ResourceManager);
    expect(manager.getState().tokens).toBe(DEFAULT_RESOURCE_STATE.tokens);
  });

  it("should accept custom initial state", () => {
    const manager = createResourceManager({
      ...DEFAULT_RESOURCE_STATE,
      tokens: 500,
    });

    expect(manager.getState().tokens).toBe(500);
  });

  it("should accept state change callback", () => {
    const callback = vi.fn();
    const manager = createResourceManager(undefined, callback);

    manager.addTokens(50);

    expect(callback).toHaveBeenCalled();
  });
});
