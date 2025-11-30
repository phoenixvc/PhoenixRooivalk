/**
 * Mock factories for game testing
 */

import type { Threat } from "../../components/utils/threatTypes";
import type { GameState } from "../../types/game";
import type { PhysicsObject } from "../../components/utils/collisionSystem";
import type { ResourceState } from "../../components/utils/resourceManager";
import type { Drone, Formation } from "../../components/utils/mothershipTypes";

/**
 * Create a mock threat for testing
 */
export function createMockThreat(overrides: Partial<Threat> = {}): Threat {
  return {
    id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    x: 100,
    y: 100,
    vx: 1,
    vy: 1,
    type: "drone",
    speed: 0.5,
    health: 100,
    maxHealth: 100,
    trail: [{ x: 100, y: 100, timestamp: Date.now() }],
    createdAt: Date.now(),
    lastUpdate: Date.now(),
    isMoving: true,
    status: "active",
    allegiance: "hostile",
    ...overrides,
  };
}

/**
 * Create multiple mock threats
 */
export function createMockThreats(
  count: number,
  overrides: Partial<Threat> = {},
): Threat[] {
  return Array.from({ length: count }, (_, i) =>
    createMockThreat({
      id: `threat-${i}`,
      x: 100 + i * 50,
      y: 100 + i * 30,
      ...overrides,
    }),
  );
}

/**
 * Create a mock physics object for collision testing
 */
export function createMockPhysicsObject(
  overrides: Partial<PhysicsObject> = {},
): PhysicsObject {
  return {
    id: `obj-${Date.now()}`,
    x: 0,
    y: 0,
    velocity: { x: 0, y: 0 },
    mass: 1,
    type: "circle",
    radius: 10,
    restitution: 0.3,
    friction: 0.8,
    ...overrides,
  };
}

/**
 * Create a mock resource state for testing
 */
export function createMockResourceState(
  overrides: Partial<ResourceState> = {},
): ResourceState {
  return {
    tokens: 100,
    researchPoints: 0,
    activeResearch: null,
    unlockedEffectors: ["kinetic"],
    unlockedDrones: ["effector"],
    availableEffectors: ["kinetic"],
    availableDrones: ["effector"],
    ...overrides,
  };
}

/**
 * Create a mock drone for testing
 */
export function createMockDrone(overrides: Partial<Drone> = {}): Drone {
  return {
    id: `drone-${Date.now()}`,
    type: "effector",
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    health: 100,
    maxHealth: 100,
    energy: 80,
    maxEnergy: 80,
    speed: 5,
    range: 100,
    damage: 10,
    cooldown: 1000,
    lastAction: 0,
    status: "idle",
    isActive: false,
    isReturning: false,
    mothershipId: "sentinel-1",
    deploymentTime: Date.now(),
    mission: "patrol",
    ...overrides,
  };
}

/**
 * Create mock drones
 */
export function createMockDrones(
  count: number,
  overrides: Partial<Drone> = {},
): Drone[] {
  return Array.from({ length: count }, (_, i) =>
    createMockDrone({
      id: `drone-${i}`,
      ...overrides,
    }),
  );
}

/**
 * Create a mock formation for testing
 */
export function createMockFormation(
  overrides: Partial<Formation> = {},
): Formation {
  return {
    id: `formation-${Date.now()}`,
    name: "Test Formation",
    droneIds: ["drone-0", "drone-1"],
    centerX: 200,
    centerY: 200,
    pattern: "circle",
    spacing: 50,
    isActive: true,
    type: "patrol",
    position: { x: 200, y: 200 },
    ...overrides,
  };
}

/**
 * Create a mock game state for testing
 */
export function createMockGameState(
  overrides: Partial<GameState> = {},
): GameState {
  return {
    score: 0,
    threats: [],
    neutralized: 0,
    level: 1,
    isRunning: true,
    selectedWeapon: "kinetic",
    weapons: {
      kinetic: {
        id: "kinetic",
        name: "Kinetic",
        damage: 25,
        range: 200,
        cooldown: 500,
        lastFired: 0,
        ammo: 100,
        maxAmmo: 100,
        isReady: true,
        effectiveness: {
          drone: 1.0,
          swarm: 0.8,
          stealth: 0.5,
          kamikaze: 1.0,
          decoy: 1.0,
          shielded: 0.2,
          boss: 0.5,
        },
        visualEffect: {
          color: "#ef4444",
          size: 3,
          trail: true,
        },
      },
    },
    activePowerUps: [],
    gameTime: 0,
    spawnRate: 2000,
    lastSpawnTime: 0,
    comboMultiplier: 1,
    lastNeutralizationTime: 0,
    frameRate: 60,
    targetFrameRate: 60,
    achievements: [],
    leaderboard: [],
    energy: 100,
    maxEnergy: 100,
    energyRegenRate: 1,
    cooling: 100,
    maxCooling: 100,
    coolingRate: 2,
    selectedThreats: [],
    selectionBox: null,
    priorityThreats: {},
    mothership: {
      id: "sentinel-1",
      x: 400,
      y: 300,
      energy: 1000,
      maxEnergy: 1000,
      energyRegenRate: 10,
      fuel: 500,
      maxFuel: 500,
      fuelConsumptionRate: 2,
      isDeploying: false,
      deploymentCooldown: 3000,
      lastDeployment: 0,
      droneCapacity: 12,
      deployedDrones: [],
    },
    drones: [],
    deploymentBays: [],
    formations: [],
    selectedDroneType: null,
    weatherMode: "none",
    missionType: "airport",
    automationMode: "manual",
    showDeploymentZones: false,
    ...overrides,
  };
}

/**
 * Create mock weapon data
 */
export function createMockWeapon(overrides = {}) {
  return {
    id: "kinetic",
    name: "Kinetic",
    type: "kinetic",
    damage: 25,
    range: 200,
    cooldown: 500,
    energyCost: 10,
    ammo: 100,
    maxAmmo: 100,
    isReady: true,
    effectiveness: {
      drone: 1.0,
      swarm: 0.8,
      stealth: 0.5,
      kamikaze: 1.0,
      decoy: 1.0,
      shielded: 0.2,
      boss: 0.5,
    },
    ...overrides,
  };
}
