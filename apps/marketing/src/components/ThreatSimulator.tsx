"use client";
import * as React from "react";
import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { DetailedStats } from "./stats/DetailedStats";
import HUDBar from "./simulator/HUDBar";
import HelpOverlay from "./HelpOverlay";
import { ParticleEffects } from "./simulator/ParticleEffects";
import RadarCanvas from "./simulator/RadarCanvas";
import { ResearchPanel } from "./weapon/ResearchPanel";
import { ThreatSimulatorComponents } from "./simulator/ThreatSimulatorComponents";
import ThreatSimulatorGame from "./simulator/ThreatSimulatorGame";
import { ThreatSimulatorOverlays } from "./simulator/ThreatSimulatorOverlays";
import { TokenStore } from "./weapon/TokenStore";
import { WeaponStatus } from "./weapon/WeaponStatus";
import { useEventFeed } from "./hooks/useEventFeed";
import { useFullscreen } from "./hooks/useFullscreen";
import { useGameState } from "./hooks/useGameState";
import { useThreatSimulatorEvents } from "./hooks/useThreatSimulatorEvents";
import { useThreatSimulatorGame } from "./hooks/useThreatSimulatorGame";
import type { PowerUp as GamePowerUp } from "../types/game";
import { getThreatAppearance as mapThreatAppearance } from "./utils/threatUtils";

interface ThreatSimulatorProps {
  isTeaser?: boolean;
  autoFullscreen?: boolean;
  demoMode?: boolean; // Show component showcase instead of game
}

export const ThreatSimulator: React.FC<ThreatSimulatorProps> = ({
  isTeaser = false,
  autoFullscreen = false,
  demoMode = false,
}): JSX.Element => {
  const gameRef = useRef<HTMLElement>(null);
  const [isResetting, _setIsResetting] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [showSimulationWarning, setShowSimulationWarning] = useState(true);
  const [showResearch, setShowResearch] = useState(false);
  const [showTokenStore, setShowTokenStore] = useState(false);

  // Demo mode state
  const [demoViewMode, setDemoViewMode] = useState<
    "full" | "components" | "systems"
  >("full");
  const [isClient, setIsClient] = useState(false);

  // Client-only rendering flag for Next.js hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard Next.js hydration pattern
    setIsClient(true);
  }, []);

  const {
    gameState,
    updateScore,
    addThreat,
    removeThreat,
    updateThreats,
    toggleRunningState,
    updateGameTime,
    setFrameRate,
    switchWeapon,
    fireWeapon,
    updateWeaponCooldowns,
    activatePowerUp,
    updatePowerUps,
    checkAchievements,
    updateResources,
    consumeEnergy,
    consumeCooling,
    selectThreat,
    clearSelection,
    setSelectionBox,
    setThreatPriority,
    deployDrone,
    selectDroneType,
    updateMothershipResources,
    returnDroneToBase,
    updateDronePositions,
    resetGameState,
    processFadeOut,
    setLevel: _setLevel,
    setWeatherMode: _setWeatherMode,
    setMissionType: _setMissionType,
    setAutomationMode: _setAutomationMode,
  } = useGameState();

  const { resourceManager } = useThreatSimulatorGame({
    gameRef,
    gameState,
    updateThreats,
    addThreat,
    removeThreat,
    updateScore,
    neutralizeThreat: (_threatId: string) => {
      // Implementation for neutralizing threats
    },
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
    setFrameRate,
    addTimeout: (_callback: () => void, _delay: number) => {
      // Implementation for adding timeout
    },
    clearTimeouts: () => {
      // Implementation for clearing timeouts
    },
    processFadeOut,
  });

  // Pass correct props structure to useFullscreen hook
  const {
    isFullscreen,
    showFullscreenPrompt,
    setShowFullscreenPrompt,
    enterFullscreen,
    exitFullscreen,
  } = useFullscreen({
    gameRef,
    autoFullscreen,
    isTeaser,
  });

  const { addFeed } = useEventFeed();

  const {
    isDragging: _isDragging,
    dragMode: _dragMode,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleContextMenu,
    handleWheel,
    handleGameAreaClick,
    handleThreatClick,
    handleKeyDown,
  } = useThreatSimulatorEvents({
    gameRef,
    gameState,
    updateScore,
    addThreat,
    removeThreat,
    updateThreats,
    toggleRunningState,
    setFrameRate,
    switchWeapon,
    activatePowerUp,
    consumeEnergy,
    consumeCooling,
    selectThreat,
    clearSelection,
    setSelectionBox,
    setThreatPriority,
    deployDrone,
    selectDroneType,
    returnDroneToBase,
    resetGameState,
    // Add the missing properties
    neutralizeThreat: (threatId: string) => {
      // Implementation for neutralizing threats
      removeThreat(threatId);
      updateScore(100); // Add score for neutralizing threat
    },
    spawnNewThreat: (threatType = "drone") => {
      // Implementation for spawning a new threat
      const newThreat = {
        id: `threat-${Date.now()}`,
        type: threatType as "drone" | "swarm" | "stealth",
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 4 - 2,
        health: 100,
        maxHealth: 100,
        speed: 2,
        trail: [],
        createdAt: Date.now(),
        lastUpdate: Date.now(),
        isMoving: true,
        status: "active" as const,
        allegiance: "hostile" as const,
      };
      addThreat(newThreat);
    },
    moveAllThreats: () => {
      // Implementation for moving all threats
      const updatedThreats = gameState.threats.map((threat) => ({
        ...threat,
        x: threat.x + (Math.random() * 10 - 5),
        y: threat.y + (Math.random() * 10 - 5),
      }));
      updateThreats(updatedThreats);
    },
    generateSwarm: () => {
      // Implementation for generating a swarm
      for (let i = 0; i < 5; i++) {
        const newThreat = {
          id: `swarm-${Date.now()}-${i}`,
          type: "swarm" as const,
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 - 2,
          health: 50,
          maxHealth: 50,
          speed: 3,
          trail: [],
          createdAt: Date.now(),
          lastUpdate: Date.now(),
          isMoving: true,
          status: "active" as const,
          allegiance: "hostile" as const,
        };
        addThreat(newThreat);
      }
    },
    spawnMultipleDrones: (count: number) => {
      // Implementation for spawning multiple drones
      for (let i = 0; i < count; i++) {
        const newThreat = {
          id: `drone-${Date.now()}-${i}`,
          type: "drone" as const,
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 - 2,
          health: 100,
          maxHealth: 100,
          speed: 2,
          trail: [],
          createdAt: Date.now(),
          lastUpdate: Date.now(),
          isMoving: true,
          status: "active" as const,
          allegiance: "hostile" as const,
        };
        addThreat(newThreat);
      }
    },
    clearTimeouts: () => {
      // Implementation for clearing timeouts
      // This would typically clear any active timeouts in the game
    },
    particleSystem: {
      createExplosion: (x: number, y: number, intensity: number) => {
        // Implementation for creating explosions
        // This would typically trigger visual effects
        console.log(`Explosion at (${x},${y}) with intensity ${intensity}`);
      },
    },
  });

  // Handle threat hover events
  const handleThreatHover = (threatId: string | null) => {
    // Implementation for threat hover
    console.log("Threat hover:", threatId);
  };

  // Define the handler functions separately since they're not returned from the hook
  const _handleDroneClick = (e: React.MouseEvent, droneId: string) => {
    // Implementation for handling drone clicks
    console.log("Drone clicked:", droneId);
  };

  const handleWeaponActivate = (weaponId: string | null) => {
    // Implementation for handling weapon activation
    if (weaponId) {
      switchWeapon(weaponId);
    }
  };

  // Use shared getThreatAppearance mapping for consistency
  const getThreatAppearance = mapThreatAppearance;

  // These functions are marked as unused with underscore prefix
  const _handlePowerUpClick = (powerUpType: GamePowerUp["type"]) => {
    // Implementation for handling power-up clicks
    activatePowerUp(powerUpType);
  };

  const _handleResearchClick = (_researchId: string) => {
    // Implementation for handling research clicks
    setShowResearch(true);
  };

  const _handleTokenStoreClick = () => {
    // Implementation for handling token store clicks
    setShowTokenStore(true);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Demo mode - show component showcase
  if (demoMode) {
    return (
      <div className="threat-simulator-demo">
        <div className="demo-controls">
          <h1>Phoenix Rooivalk - Threat Simulator Demo</h1>
          <div className="demo-mode-selector">
            <button
              className={demoViewMode === "full" ? "active" : ""}
              onClick={() => setDemoViewMode("full")}
            >
              Full Simulator
            </button>
            <button
              className={demoViewMode === "components" ? "active" : ""}
              onClick={() => setDemoViewMode("components")}
            >
              Component Showcase
            </button>
            <button
              className={demoViewMode === "systems" ? "active" : ""}
              onClick={() => setDemoViewMode("systems")}
            >
              System Architecture
            </button>
          </div>
        </div>

        <div className="demo-content">
          {!isClient ? (
            <div className="loading">Loading demo...</div>
          ) : (
            <>
              {demoViewMode === "full" && (
                <div className="demo-simulator">
                  <ThreatSimulatorGame />
                </div>
              )}
              {demoViewMode === "components" && (
                <div className="component-showcase">
                  <div className="showcase-header">
                    <h1>Enhanced Threat Simulator Components</h1>
                    <p>
                      Explore the individual components that make up the Phoenix
                      Rooivalk threat simulation system.
                    </p>
                  </div>
                  <div className="component-grid">
                    <div className="component-card">
                      <h3>Radar System</h3>
                      <p>
                        Advanced threat detection and tracking with real-time
                        visualization.
                      </p>
                    </div>
                    <div className="component-card">
                      <h3>Drone Deployment</h3>
                      <p>
                        Intelligent drone deployment system with energy
                        management.
                      </p>
                    </div>
                    <div className="component-card">
                      <h3>Weapon Systems</h3>
                      <p>
                        Multi-spectrum weapon systems for threat neutralization.
                      </p>
                    </div>
                    <div className="component-card">
                      <h3>Research Panel</h3>
                      <p>Technology research and development interface.</p>
                    </div>
                  </div>
                </div>
              )}
              {demoViewMode === "systems" && (
                <div className="system-architecture">
                  <div className="architecture-header">
                    <h1>System Architecture</h1>
                    <p>
                      Comprehensive overview of the Phoenix Rooivalk system
                      architecture.
                    </p>
                  </div>
                  <div className="architecture-diagram">
                    <div className="system-layer">
                      <h3>Presentation Layer</h3>
                      <p>React components, UI/UX, visualization</p>
                    </div>
                    <div className="system-layer">
                      <h3>Application Layer</h3>
                      <p>Game logic, state management, event handling</p>
                    </div>
                    <div className="system-layer">
                      <h3>Data Layer</h3>
                      <p>Game state, persistence, configuration</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section
      ref={gameRef}
      className="threatsim card flex flex-col h-full"
      aria-labelledby="sim-title"
      style={{ minHeight: "800px" }} // Ensure the container has a height
    >
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      {showDetailedStats && (
        <DetailedStats
          gameState={gameState}
          onClose={() => setShowDetailedStats(false)}
        />
      )}

      <HUDBar
        score={gameState.score}
        threats={gameState.threats.length}
        neutralized={gameState.neutralized}
        level={gameState.level}
        onToggleResearch={() => setShowResearch(true)}
      />

      <div className="flex flex-row flex-grow overflow-hidden">
        <WeaponStatus
          weapons={gameState.weapons}
          selectedWeapon={gameState.selectedWeapon}
          onSwitchWeapon={switchWeapon}
        />
        {/* Game Area Container */}
        <div
          className="relative flex-grow"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleContextMenu}
          onWheel={handleWheel}
          onClick={handleGameAreaClick}
          tabIndex={0}
        >
          {/* Visual Layers (absolutely positioned inside) */}
          <RadarCanvas
            threats={gameState.threats}
            isResetting={isResetting}
            onThreatClick={handleThreatClick}
          />
          <ParticleEffects
            activePowerUps={gameState.activePowerUps}
            gameArea={{ width: 800, height: 600 }}
          />
          {/* Match the ThreatSimulatorComponentsProps interface exactly */}
          <ThreatSimulatorComponents
            gameState={gameState}
            onThreatClick={handleThreatClick}
            onThreatHover={handleThreatHover}
            onActivateWeapon={handleWeaponActivate}
            getThreatAppearance={getThreatAppearance}
          />
        </div>
      </div>

      {showResearch && (
        <ResearchPanel
          resourceManager={resourceManager}
          onClose={() => setShowResearch(false)}
        />
      )}

      {showTokenStore && (
        <TokenStore
          resourceManager={resourceManager}
          onClose={() => setShowTokenStore(false)}
          onPurchaseDrone={(type: string) => {
            // Dispatch the existing "drone-purchase" event
            const purchaseEvent = new CustomEvent("drone-purchase", {
              detail: { type, timestamp: Date.now() },
            });
            window.dispatchEvent(purchaseEvent);

            // Close the token store modal after successful purchase
            setShowTokenStore(false);

            // Add success feedback to the game feed
            addFeed(`Drone ${type} purchased successfully!`);
          }}
        />
      )}
      <ThreatSimulatorOverlays
        showSimulationWarning={showSimulationWarning}
        setShowSimulationWarning={setShowSimulationWarning}
        showFullscreenPrompt={showFullscreenPrompt}
        setShowFullscreenPrompt={setShowFullscreenPrompt}
        isTeaser={isTeaser}
        isFullscreen={isFullscreen}
        enterFullscreen={enterFullscreen}
        exitFullscreen={exitFullscreen}
      />
    </section>
  );
};

export default ThreatSimulator;
