/**
 * Tests for Wave Manager
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  WaveManager,
  calculateDifficultyScaling,
  generateWaveConfig,
} from "../components/utils/waveManager";

describe("calculateDifficultyScaling", () => {
  it("should return base scaling for wave 1", () => {
    const scaling = calculateDifficultyScaling(1);

    expect(scaling.speedMultiplier).toBeCloseTo(0.67, 1);
    expect(scaling.healthMultiplier).toBeCloseTo(1.33, 1);
    expect(scaling.damageMultiplier).toBe(1);
    expect(scaling.spawnRateMultiplier).toBe(1);
    expect(scaling.specialAbilityChance).toBe(0);
  });

  it("should increase scaling with higher waves", () => {
    const wave1 = calculateDifficultyScaling(1);
    const wave5 = calculateDifficultyScaling(5);

    expect(wave5.speedMultiplier).toBeGreaterThan(wave1.speedMultiplier);
    expect(wave5.healthMultiplier).toBeGreaterThan(wave1.healthMultiplier);
    expect(wave5.damageMultiplier).toBeGreaterThan(wave1.damageMultiplier);
  });

  it("should cap scaling at maximum values", () => {
    const scaling = calculateDifficultyScaling(100);

    expect(scaling.speedMultiplier).toBeLessThanOrEqual(3);
    expect(scaling.healthMultiplier).toBeLessThanOrEqual(5);
    expect(scaling.damageMultiplier).toBeLessThanOrEqual(4);
    expect(scaling.spawnRateMultiplier).toBeLessThanOrEqual(2);
    expect(scaling.specialAbilityChance).toBeLessThanOrEqual(0.5);
  });

  it("should handle wave 0 gracefully", () => {
    const scaling = calculateDifficultyScaling(0);

    expect(scaling.speedMultiplier).toBeGreaterThan(0);
    expect(scaling.healthMultiplier).toBeGreaterThan(0);
  });

  it("should handle negative waves gracefully", () => {
    const scaling = calculateDifficultyScaling(-5);

    expect(scaling.speedMultiplier).toBeGreaterThan(0);
    expect(scaling.healthMultiplier).toBeGreaterThan(0);
  });
});

describe("generateWaveConfig", () => {
  it("should generate config for wave 1", () => {
    const config = generateWaveConfig(1);

    expect(config.waveNumber).toBe(1);
    expect(config.totalThreats).toBeGreaterThan(0);
    expect(config.spawnInterval).toBeGreaterThan(0);
    expect(config.threatTypes.length).toBeGreaterThan(0);
  });

  it("should include drone type from wave 1", () => {
    const config = generateWaveConfig(1);

    const hasDrone = config.threatTypes.some((t) => t.type === "drone");
    expect(hasDrone).toBe(true);
  });

  it("should include swarm type from wave 3", () => {
    const config = generateWaveConfig(3);

    const hasSwarm = config.threatTypes.some((t) => t.type === "swarm");
    expect(hasSwarm).toBe(true);
  });

  it("should include stealth type from wave 5", () => {
    const config = generateWaveConfig(5);

    const hasStealth = config.threatTypes.some((t) => t.type === "stealth");
    expect(hasStealth).toBe(true);
  });

  it("should include kamikaze type from wave 7", () => {
    const config = generateWaveConfig(7);

    const hasKamikaze = config.threatTypes.some((t) => t.type === "kamikaze");
    expect(hasKamikaze).toBe(true);
  });

  it("should include boss type from wave 10", () => {
    const config = generateWaveConfig(10);

    const hasBoss = config.threatTypes.some((t) => t.type === "boss");
    expect(hasBoss).toBe(true);
  });

  it("should respect base difficulty multiplier", () => {
    const easyConfig = generateWaveConfig(1, 1);
    const hardConfig = generateWaveConfig(1, 2);

    expect(hardConfig.totalThreats).toBeGreaterThan(easyConfig.totalThreats);
  });

  it("should apply environment settings", () => {
    const config = generateWaveConfig(1, 1, {
      weather: "rain",
      terrain: "military-base",
    });

    expect(config.environment.weather).toBe("rain");
    expect(config.environment.terrain).toBe("military-base");
  });

  it("should decrease spawn interval at higher waves", () => {
    const wave1Config = generateWaveConfig(1);
    const wave10Config = generateWaveConfig(10);

    expect(wave10Config.spawnInterval).toBeLessThan(wave1Config.spawnInterval);
  });

  it("should cap per-type threat count at reasonable limits", () => {
    const config = generateWaveConfig(50, 10);

    // Each threat type has its own count based on base threat count
    // The total may exceed 20 when multiple types are included
    expect(config.totalThreats).toBeGreaterThan(0);
    // Individual type counts should be reasonable
    config.threatTypes.forEach((type) => {
      expect(type.count).toBeLessThanOrEqual(20);
    });
  });
});

describe("WaveManager", () => {
  let manager: WaveManager;
  let onSpawnThreat: ReturnType<typeof vi.fn>;
  let onWaveComplete: ReturnType<typeof vi.fn>;
  let onGameComplete: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onSpawnThreat = vi.fn();
    onWaveComplete = vi.fn();
    onGameComplete = vi.fn();
    manager = new WaveManager(onSpawnThreat, onWaveComplete, onGameComplete);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initialization", () => {
    it("should initialize with wave 1", () => {
      const progress = manager.getWaveProgress();

      expect(progress.currentWave).toBe(1);
      expect(progress.totalWaves).toBe(15);
    });

    it("should not be running initially", () => {
      expect(manager.isWaveRunning()).toBe(false);
    });
  });

  describe("startWave", () => {
    it("should start wave and activate", () => {
      manager.startWave();

      expect(manager.isWaveRunning()).toBe(true);
    });

    it("should start specific wave number", () => {
      manager.startWave(5);

      expect(manager.getWaveProgress().currentWave).toBe(5);
    });

    it("should generate wave config", () => {
      manager.startWave();

      const config = manager.getCurrentWaveConfig();
      expect(config).not.toBeNull();
      expect(config?.waveNumber).toBe(1);
    });

    it("should call game complete when exceeding max waves", () => {
      manager.setMaxWaves(3);
      manager.startWave(4);

      expect(onGameComplete).toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should spawn threats at scheduled times", () => {
      manager.startWave();

      vi.advanceTimersByTime(5000);
      manager.update();

      expect(onSpawnThreat).toHaveBeenCalled();
    });

    it("should not spawn when wave is not active", () => {
      manager.update();

      expect(onSpawnThreat).not.toHaveBeenCalled();
    });
  });

  describe("defeatThreat", () => {
    it("should track defeated threats", () => {
      manager.startWave();
      const initialProgress = manager.getWaveProgress();

      manager.defeatThreat();

      const newProgress = manager.getWaveProgress();
      expect(newProgress.threatsRemaining).toBeLessThan(
        initialProgress.threatsRemaining,
      );
    });
  });

  describe("getWaveProgress", () => {
    it("should return progress info", () => {
      manager.startWave();

      const progress = manager.getWaveProgress();

      expect(progress.currentWave).toBe(1);
      expect(progress.totalWaves).toBe(15);
      expect(typeof progress.threatsSpawned).toBe("number");
      expect(typeof progress.threatsRemaining).toBe("number");
      expect(typeof progress.waveProgress).toBe("number");
    });

    it("should calculate wave progress correctly", () => {
      manager.startWave();
      const config = manager.getCurrentWaveConfig();
      const totalThreats = config?.totalThreats || 0;

      // Defeat all threats
      for (let i = 0; i < totalThreats; i++) {
        manager.defeatThreat();
      }

      const progress = manager.getWaveProgress();
      expect(progress.waveProgress).toBe(1);
    });
  });

  describe("pauseWave and resumeWave", () => {
    it("should pause wave", () => {
      manager.startWave();
      manager.pauseWave();

      expect(manager.isWaveRunning()).toBe(false);
    });

    it("should resume wave", () => {
      manager.startWave();
      manager.pauseWave();
      manager.resumeWave();

      expect(manager.isWaveRunning()).toBe(true);
    });
  });

  describe("skipWave", () => {
    it("should skip to next wave", () => {
      manager.startWave();
      manager.skipWave();

      expect(onWaveComplete).toHaveBeenCalledWith(1);
    });

    it("should not skip if wave is not active", () => {
      manager.skipWave();

      expect(onWaveComplete).not.toHaveBeenCalled();
    });
  });

  describe("reset", () => {
    it("should reset to wave 1", () => {
      manager.startWave(5);
      manager.reset();

      const progress = manager.getWaveProgress();
      expect(progress.currentWave).toBe(1);
      expect(manager.isWaveRunning()).toBe(false);
    });
  });

  describe("setMaxWaves", () => {
    it("should update max waves", () => {
      manager.setMaxWaves(10);

      const progress = manager.getWaveProgress();
      expect(progress.totalWaves).toBe(10);
    });
  });

  describe("getScenarioWaves", () => {
    it("should return tutorial waves", () => {
      const waves = WaveManager.getScenarioWaves("tutorial");

      expect(waves.length).toBe(3);
    });

    it("should return easy waves", () => {
      const waves = WaveManager.getScenarioWaves("easy");

      expect(waves.length).toBe(5);
    });

    it("should return medium waves", () => {
      const waves = WaveManager.getScenarioWaves("medium");

      expect(waves.length).toBe(5);
    });

    it("should return hard waves", () => {
      const waves = WaveManager.getScenarioWaves("hard");

      expect(waves.length).toBe(5);
    });

    it("should return expert waves", () => {
      const waves = WaveManager.getScenarioWaves("expert");

      expect(waves.length).toBe(5);
    });

    it("should default to medium for unknown scenario", () => {
      const waves = WaveManager.getScenarioWaves("unknown" as "medium");

      expect(waves.length).toBe(5);
    });
  });
});
