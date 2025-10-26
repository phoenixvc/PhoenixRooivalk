// apps/marketing/src/components/hooks/useThreatSimulatorGame.ts
// COMPLETE FIXED VERSION - Replace your entire file with this

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState, Threat } from "../../types/game";
import { AutoTargetingSystem } from "../utils/autoTargeting";
import { CollisionSystem, createPhysicsObject } from "../utils/collisionSystem";
import { DronePathInterpolator } from "../utils/dronePathInterpolation";
import { FormationManager } from "../utils/formationManager";
import { ParticleSystem } from "../utils/particleSystem";
import { createResourceManager } from "../utils/resourceManager";
import { ResponseProtocolEngine } from "../utils/responseProtocols";
import { StrategicDeploymentEngine } from "../utils/strategicDeployment";
import { spawnThreat } from "../utils/threatUtils";
import { WaveManager } from "../utils/waveManager";

interface UseThreatSimulatorGameProps {
  gameRef: React.RefObject<HTMLElement | null>;
  gameState: GameState;
  updateThreats: (threats: Threat[]) => void;
  addThreat: (threat: Threat) => void;
  removeThreat: (threatId: string) => void;
  updateScore: (score: number) => void;
  neutralizeThreat: (threatId: string) => void;
  fireWeapon: (x: number, y: number) => void;
  consumeEnergy: (amount: number) => void;
  consumeCooling: (amount: number) => void;
  checkAchievements: () => void;
  updateGameTime: (deltaTime: number) => void;
  updateWeaponCooldowns: () => void;
  updatePowerUps: () => void;
  updateResources: (deltaTime: number) => void;
  updateMothershipResources: (deltaTime: number) => void;
  updateDronePositions: (deltaTime: number) => void;
  setFrameRate: (rate: number) => void;
  addTimeout: (callback: () => void, delay: number) => void;
  clearTimeouts: () => void;
  processFadeOut: () => void;
}

export const useThreatSimulatorGame = ({
  gameRef,
  gameState,
  updateThreats,
  addThreat,
  removeThreat,
  updateScore,
  neutralizeThreat: _neutralizeThreat,
  fireWeapon,
  consumeEnergy,
  consumeCooling,
  checkAchievements,
  updateGameTime,
  updateWeaponCooldowns,
  updatePowerUps,
  updateResources,
  updateMothershipResources,
  updateDronePositions,
  addTimeout,
  clearTimeouts,
  processFadeOut,
}: UseThreatSimulatorGameProps) => {
  const lastFrameTime = useRef<number>(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastAutoTargetTime = useRef<number>(0);
  const lastCleanupTime = useRef<number>(0);

  // Core systems
  const [particleSystem] = useState(() => new ParticleSystem());
  const [autoTargeting] = useState(() => new AutoTargetingSystem());
  const [strategicEngine] = useState(() => new StrategicDeploymentEngine());
  const [responseEngine] = useState(() => new ResponseProtocolEngine());
  const [formationManager] = useState(() => new FormationManager());

  // New P0 systems
  const [collisionSystem] = useState(() => new CollisionSystem());
  const [pathInterpolators] = useState<Map<string, DronePathInterpolator>>(
    () => new Map(),
  );

  // Wave manager
  const [waveManager] = useState(
    () =>
      new WaveManager(
        (spawnEvent) => {
          const rect = new DOMRect(0, 0, 800, 600);
          const threat = spawnThreat(
            spawnEvent.threatType as
              | "drone"
              | "swarm"
              | "stealth"
              | "kamikaze"
              | "decoy"
              | "shielded"
              | "boss",
            rect,
            gameState.level,
          );
          threat.id = spawnEvent.id;
          addThreat(threat);
        },
        (waveNumber) => {
          console.log(`Wave ${waveNumber} completed!`);
          // Award resources for wave completion
          resourceManager.awardPerformanceRewards(
            gameState.score,
            gameState.neutralized,
            true, // wave completed
          );
        },
        () => {
          console.log("Game completed!");
        },
      ),
  );

  // Resource manager
  const [resourceManager] = useState(() => createResourceManager());

  // Game state
  const [gameDimensions, setGameDimensions] = useState({
    width: 800,
    height: 600,
  });
  const [weatherMode, setWeatherMode] = useState<
    "none" | "rain" | "fog" | "night"
  >("none");
  const [missionType, setMissionType] = useState<
    "airport" | "military-base" | "vip-protection" | "border-patrol"
  >("military-base");
  const [automationMode, setAutomationMode] = useState<
    "manual" | "automated" | "hybrid"
  >("hybrid");
  const [showDeploymentZones, setShowDeploymentZones] = useState(false);

  // Spawn new threat
  const spawnNewThreat = useCallback(
    (threatType?: "drone" | "swarm" | "stealth") => {
      if (!gameRef.current) return;
      const rect = gameRef.current.getBoundingClientRect();
      const newThreat = spawnThreat(threatType, rect, gameState.level);
      addThreat(newThreat);
    },
    [addThreat, gameState.level, gameRef],
  );

  // Track which physics objects have been added to avoid per-frame churn
  const addedPhysicsIdsRef = useRef<Set<string>>(new Set());

  // Fixed movement function - smooth movement without jumping
  const moveAllThreats = useCallback(() => {
    if (!gameRef.current) return;

    const centerPoint = {
      x: gameDimensions.width / 2,
      y: gameDimensions.height / 2,
    };

    const movedThreats = gameState.threats.map((threat) => {
      // Skip non-active threats
      if (threat.status !== "active" || !threat.isMoving) {
        return threat;
      }

      // Calculate direction to center
      const dx = centerPoint.x - threat.x;
      const dy = centerPoint.y - threat.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Stop if reached center
      if (distance < 30) {
        return { ...threat, isMoving: false };
      }

      // Use smooth path interpolation
      let interpolator = pathInterpolators.get(threat.id);
      if (!interpolator) {
        interpolator = new DronePathInterpolator({
          speed: threat.speed || 2,
          maxSpeed: 5,
          acceleration: 0.1,
          smoothing: 0.8,
        });
        pathInterpolators.set(threat.id, interpolator);
        interpolator.setTarget(
          centerPoint.x,
          centerPoint.y,
          threat.x,
          threat.y,
        );
      }

      // Update position using smooth interpolation
      const movementResult = interpolator.updatePosition(threat.x, threat.y);
      let finalX = movementResult.x;
      let finalY = movementResult.y;

      // Add/update physics object in collision system
      if (!addedPhysicsIdsRef.current.has(threat.id)) {
        const physicsObj = createPhysicsObject(threat.id, finalX, finalY, "circle", {
          radius: 8,
          mass: threat.type === "boss" ? 5 : 1,
          restitution: 0.3,
          velocity: movementResult.velocity,
        });
        collisionSystem.addObject(physicsObj);
        addedPhysicsIdsRef.current.add(threat.id);
      } else {
        collisionSystem.updateObject(threat.id, finalX, finalY, movementResult.velocity);
      }

      // Special movement patterns
      if (threat.type === "swarm") {
        const time = Date.now() / 1000;
        const zigzag = Math.sin(time * 5 + threat.createdAt) * 5;
        finalX += zigzag * (-movementResult.velocity.y / 10);
        finalY += zigzag * (movementResult.velocity.x / 10);
      } else if (threat.type === "stealth") {
        const time = Date.now() / 2000;
        threat.specialProperties = {
          ...threat.specialProperties,
          opacity: 0.3 + Math.sin(time + threat.createdAt) * 0.3,
        };
      }

      // Update trail
      const newTrail = [
        ...(threat.trail || []).slice(-9),
        { x: threat.x, y: threat.y, timestamp: Date.now() },
      ];

      return {
        ...threat,
        x: finalX,
        y: finalY,
        trail: newTrail,
        lastUpdate: Date.now(),
      };
    });

    updateThreats(movedThreats);

    // Check for collisions
    const collisions = collisionSystem.checkCollisions();
    collisions.forEach(({ obj1, obj2, result }) => {
      if (result.hasCollision && result.collisionPoint) {
        collisionSystem.createDebris(
          result.collisionPoint.x,
          result.collisionPoint.y,
          result.impactForce || 10,
          Math.floor((result.impactForce || 10) / 5),
        );

        // Remove colliding threats and clean up physics/path state
        removeThreat(obj1.id);
        removeThreat(obj2.id);
        collisionSystem.removeObject(obj1.id);
        collisionSystem.removeObject(obj2.id);
        pathInterpolators.delete(obj1.id);
        pathInterpolators.delete(obj2.id);
        addedPhysicsIdsRef.current.delete(obj1.id);
        addedPhysicsIdsRef.current.delete(obj2.id);

        // Add explosion effect
        particleSystem.createExplosion(
          result.collisionPoint.x,
          result.collisionPoint.y,
          1.0,
        );

        // Award points for collision
        updateScore(25);
      }
    });

    // Update debris
    collisionSystem.updateDebris(16); // 16ms delta time approximation
  }, [
    gameDimensions.width,
    gameDimensions.height,
    gameState.threats,
    updateThreats,
    gameRef,
    collisionSystem,
    removeThreat,
    updateScore,
    particleSystem,
    pathInterpolators,
  ]);

  // Enhanced neutralization with effects
  const neutralizeThreatWithEffects = useCallback(
    (threatId: string) => {
      const threat = gameState.threats.find((t) => t.id === threatId);
      if (!threat || threat.status !== "active") return;

      const weapon = gameState.weapons[gameState.selectedWeapon];
      if (!weapon) return;

      // Get weapon effectiveness against threat type
      const effectiveness = weapon.effectiveness?.[threat.type] ?? 1.0;

      // Check if we can fire
      if (!weapon.isReady || weapon.ammo <= 0 || gameState.energy < 10) {
        return;
      }

      // Fire weapon and consume resources
      fireWeapon(threat.x, threat.y);
      consumeEnergy(10);
      consumeCooling(5);

      // Create visual effects
      particleSystem.createExplosion(threat.x, threat.y, 1);

      if (threat.trail && threat.trail.length > 1) {
        const lastTrail = threat.trail[threat.trail.length - 1];
        particleSystem.createTrail(
          lastTrail.x,
          lastTrail.y,
          threat.x,
          threat.y,
        );
      }

      // Handle special threat types
      if (
        threat.type === "kamikaze" &&
        threat.specialProperties?.explosionRadius
      ) {
        // Area damage
        const explosionRadius = threat.specialProperties.explosionRadius;
        gameState.threats.forEach((nearbyThreat) => {
          if (nearbyThreat.id === threatId || nearbyThreat.status !== "active")
            return;

          const distance = Math.sqrt(
            Math.pow(nearbyThreat.x - threat.x, 2) +
              Math.pow(nearbyThreat.y - threat.y, 2),
          );

          if (distance <= explosionRadius) {
            particleSystem.createExplosion(nearbyThreat.x, nearbyThreat.y, 0.8);
            removeThreat(nearbyThreat.id);
            collisionSystem.removeObject(nearbyThreat.id);
            pathInterpolators.delete(nearbyThreat.id);
            updateScore(50);
          }
        });
      }

      // Neutralize the threat and clean up physics/path state
      removeThreat(threatId);
      collisionSystem.removeObject(threatId);
      pathInterpolators.delete(threatId);
      updateScore(Math.floor(100 * effectiveness));
      checkAchievements();
    },
    [
      gameState.threats,
      gameState.weapons,
      gameState.selectedWeapon,
      gameState.energy,
      particleSystem,
      fireWeapon,
      consumeEnergy,
      consumeCooling,
      removeThreat,
      updateScore,
      checkAchievements,
      collisionSystem,
      pathInterpolators,
    ],
  );

  // Generate swarm of threats
  const generateSwarm = useCallback(() => {
    clearTimeouts();
    for (let i = 0; i < 8; i++) {
      addTimeout(() => spawnNewThreat("swarm"), i * 150);
    }
  }, [spawnNewThreat, addTimeout, clearTimeouts]);

  // Spawn multiple drones
  const spawnMultipleDrones = useCallback(
    (count: number) => {
      if (!gameRef.current) return;
      const rect = gameRef.current.getBoundingClientRect();

      for (let i = 0; i < count; i++) {
        const drone = spawnThreat("drone", rect, gameState.level);
        addThreat(drone);
      }
    },
    [addThreat, gameState.level, gameRef],
  );

  // Main game loop with auto-targeting
  useEffect(() => {
    if (!gameState.isRunning) return;

    const gameLoop = (currentTime: number) => {
      const deltaTime = (currentTime - lastFrameTime.current) / 1000;
      lastFrameTime.current = currentTime;

      // Update core systems
      particleSystem.update(deltaTime);
      updateGameTime(deltaTime);
      updateWeaponCooldowns();
      updatePowerUps();
      updateResources(deltaTime);
      updateMothershipResources(deltaTime);
      updateDronePositions(deltaTime);
      processFadeOut();

      // Update wave manager
      waveManager.update();

      // Update research progress (slow accumulation)
      if (Math.random() < 0.001) {
        // 0.1% chance per frame
        resourceManager.addResearchProgress(1);
      }

      // Move threats smoothly
      moveAllThreats();

      // Auto-targeting system (runs every 100ms)
      if (currentTime - lastAutoTargetTime.current > 100) {
        lastAutoTargetTime.current = currentTime;

        if (gameState.automationMode !== "manual" && gameState.energy > 10) {
          const weapon = gameState.weapons[gameState.selectedWeapon];
          if (weapon && weapon.isReady && weapon.ammo > 0) {
            autoTargeting.processAutoTargeting(
              gameState,
              currentTime,
              (targetId, _x, _y) => {
                const threat = gameState.threats.find((t) => t.id === targetId);
                if (threat && threat.status === "active") {
                  neutralizeThreatWithEffects(targetId);
                }
              },
            );
          }
        }
      }

      // Cleanup old auto-targeting records (every 5 seconds)
      if (currentTime - lastCleanupTime.current > 5000) {
        lastCleanupTime.current = currentTime;
        autoTargeting.cleanup(currentTime);
      }

      // Spawn new threats
      const timeSinceLastSpawn = currentTime - gameState.lastSpawnTime;
      const maxThreats = 5 + gameState.level * 2;
      const activeThreats = gameState.threats.filter(
        (t) => t.status === "active",
      ).length;

      if (
        timeSinceLastSpawn > gameState.spawnRate &&
        activeThreats < maxThreats
      ) {
        if (Math.random() < 0.4 + gameState.level * 0.05) {
          spawnNewThreat();
        }
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    lastFrameTime.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameState,
    moveAllThreats,
    spawnNewThreat,
    neutralizeThreatWithEffects,
    particleSystem,
    autoTargeting,
    updateGameTime,
    updateWeaponCooldowns,
    updatePowerUps,
    updateResources,
    updateMothershipResources,
    updateDronePositions,
    processFadeOut,
    resourceManager,
    waveManager,
  ]);

  // Initialize strategic systems
  useEffect(() => {
    strategicEngine.initializeDeploymentZones(missionType, 800, 600);
    responseEngine.initializeDefaultProtocols();
  }, [strategicEngine, responseEngine, missionType]);

  // Initial threat spawn
  useEffect(() => {
    const timer = setTimeout(() => {
      spawnNewThreat();
      spawnNewThreat();
      spawnNewThreat();
    }, 100);

    return () => clearTimeout(timer);
  }, [spawnNewThreat]);

  // Update game dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (gameRef.current) {
        const rect = gameRef.current.getBoundingClientRect();
        setGameDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [gameRef]);

  // Wave management functions
  const startWave = useCallback(
    (waveNumber?: number) => {
      waveManager.startWave(waveNumber);
    },
    [waveManager],
  );

  const getWaveProgress = useCallback(() => {
    return waveManager.getWaveProgress();
  }, [waveManager]);

  const isWaveRunning = useCallback(() => {
    return waveManager.isWaveRunning();
  }, [waveManager]);

  return {
    particleSystem,
    collisionSystem,
    gameDimensions,
    weatherMode,
    setWeatherMode,
    missionType,
    setMissionType,
    automationMode,
    setAutomationMode,
    showDeploymentZones,
    setShowDeploymentZones,
    strategicEngine,
    responseEngine,
    formationManager,
    spawnNewThreat,
    moveAllThreats,
    neutralizeThreatWithEffects,
    generateSwarm,
    spawnMultipleDrones,
    // Wave management
    waveManager,
    startWave,
    getWaveProgress,
    isWaveRunning,
    // Resource management
    resourceManager,
  };
};
