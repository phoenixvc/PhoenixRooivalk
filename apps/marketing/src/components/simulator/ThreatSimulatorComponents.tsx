import * as React from "react";
import type { GameState } from "../../types/game";

interface ThreatSimulatorComponentsProps {
  gameState: GameState;
  onThreatClick: (e: React.MouseEvent, threatId: string) => void;
  onThreatHover: (threatId: string | null) => void;
  onActivateWeapon: (threatId: string | null) => void;
  getThreatAppearance: (type: string) => {
    emoji: string;
    color: string;
    cssClass: string;
  };
}

export const ThreatSimulatorComponents: React.FC<
  ThreatSimulatorComponentsProps
> = ({
  gameState,
  onThreatClick,
  onActivateWeapon: _onActivateWeapon,
  onThreatHover,
  getThreatAppearance,
}) => {
  const [hoveredThreat, setHoveredThreat] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(() => Date.now());

  // Update current time for fade animations
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 100); // Update every 100ms for smooth fade
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Enhanced Central Radar */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80">
        {/* Outer detection ring */}
        <div className="absolute inset-0 border-2 border-blue-400/15 rounded-full animate-pulse" />
        {/* Middle detection ring */}
        <div className="absolute inset-8 border border-blue-300/25 rounded-full" />
        {/* Inner detection ring */}
        <div className="absolute inset-16 border border-blue-400/35 rounded-full" />
        {/* Range markers */}
        <div className="absolute inset-0">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className="absolute top-1/2 left-1/2 w-0.5 h-8 bg-blue-400/20 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-40px)`,
              }}
            />
          ))}
        </div>
        {/* Sweep line */}
        <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-spin origin-left opacity-70" />
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full animate-ping shadow-lg" />
        {/* Range labels */}
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 font-mono">
          RANGE
        </div>
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 font-mono">
          {Math.round(gameState.mothership.x)}m
        </div>
      </div>
      {/* Enhanced Mothership */}
      <div
        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
        style={{
          left: `${gameState.mothership.x}px`,
          top: `${gameState.mothership.y}px`,
        }}
      >
        {/* Mothership body */}
        <div className="w-16 h-16 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg flex items-center justify-center text-2xl shadow-2xl border-2 border-slate-400 relative">
          🚁
          {/* Energy shield indicator */}
          {gameState.energy > gameState.maxEnergy * 0.7 && (
            <div className="absolute inset-0 rounded-lg border-2 border-blue-400/50 animate-pulse" />
          )}
          {/* Low energy warning */}
          {gameState.energy < gameState.maxEnergy * 0.2 && (
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-red-400 text-xs animate-bounce font-mono">
              LOW ENERGY
            </div>
          )}
        </div>
        {/* Mothership label */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded font-mono">
          MOTHERSHIP
        </div>
      </div>
      {/* Enhanced Threats */}
      {gameState.threats.map((threat) => {
        const appearance = getThreatAppearance(threat.type);
        const isSelected = gameState.selectedThreats.includes(threat.id);
        const isHovered = hoveredThreat === threat.id;
        const priority = gameState.priorityThreats?.[threat.id] || "low";
        const isNeutralized =
          threat.status === "neutralized" || threat.isMoving === false;
        const isCrater = threat.status === "crater";
        // Calculate fade opacity for neutralized threats
        let fadeOpacity = 1;
        if (threat.status === "neutralized" && threat.fadeStartTime) {
          if (currentTime >= threat.fadeStartTime) {
            const fadeDuration = 3000; // 3 seconds to fade out
            const fadeProgress = Math.min(
              (currentTime - threat.fadeStartTime) / fadeDuration,
              1,
            );
            fadeOpacity = 1 - fadeProgress;
          }
        }
        return (
          <div
            key={threat.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              isSelected
                ? "scale-125 z-30"
                : isHovered
                  ? "scale-110 z-20"
                  : "z-20"
            } ${isNeutralized ? "opacity-50" : ""}`}
            style={{
              left: `${threat.x}px`,
              top: `${threat.y}px`,
              opacity: isNeutralized ? fadeOpacity : 1,
              pointerEvents: "auto", // Enable pointer events for this element
            }}
            onClick={(e) =>
              !isNeutralized && !isCrater && onThreatClick(e, threat.id)
            }
            onMouseEnter={() => {
              if (!isNeutralized && !isCrater) {
                setHoveredThreat(threat.id);
                onThreatHover(threat.id);
              }
            }}
            onMouseLeave={() => {
              setHoveredThreat(null);
              onThreatHover(null);
            }}
            onKeyDown={(e) => {
              if (
                !isNeutralized &&
                !isCrater &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                onThreatClick(e as unknown as React.MouseEvent, threat.id);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Threat ${threat.type} at position ${Math.round(
              threat.x,
            )}, ${Math.round(threat.y)}${
              isNeutralized ? " (neutralized)" : isCrater ? " (crater)" : ""
            }`}
          >
            {/* Threat icon with enhanced styling */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-2xl border-2 ${
                isCrater
                  ? "bg-gray-600/30 border-gray-500/50"
                  : isNeutralized
                    ? "bg-red-500/20 border-red-500/50"
                    : appearance.color
              } ${
                isSelected
                  ? "ring-4 ring-blue-400 ring-opacity-75 border-blue-300"
                  : isHovered
                    ? "ring-2 ring-white/50"
                    : isCrater
                      ? "border-gray-500/50"
                      : isNeutralized
                        ? "border-red-500/50"
                        : "border-white/20"
              } relative`}
            >
              {isCrater ? "🕳️" : isNeutralized ? "💥" : appearance.emoji}
            </div>
            {/* Threat Trail SVG */}
            {!isNeutralized &&
              !isCrater &&
              threat.trail &&
              threat.trail.length > 1 && (
                <svg
                  className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  style={{
                    transform: `translate(-${threat.x}px, -${threat.y}px)`,
                    width: "800px" /* Match game area */,
                    height: "600px",
                  }}
                >
                  <polyline
                    points={threat.trail.map((p) => `${p.x},${p.y}`).join(" ")}
                    className="threat-trail"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
              )}
            {/* Priority indicator */}
            {priority !== "low" && (
              <div
                className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white ${
                  priority === "high"
                    ? "bg-red-500"
                    : priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                }`}
              />
            )}
            {/* Threat label */}
            {(isSelected || isHovered || priority !== "low") && (
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded font-mono whitespace-nowrap">
                {threat.type.toUpperCase()}
                {priority !== "low" && (
                  <span className="ml-1 text-xs">
                    {priority === "high"
                      ? "🔴"
                      : priority === "medium"
                        ? "🟡"
                        : "🟢"}
                  </span>
                )}
              </div>
            )}
            {/* Health bar */}
            {threat.health && (
              <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width: `${Math.min((threat.health / 100) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
      {/* Enhanced Drones */}
      {gameState.drones.map((drone) => (
        <div
          key={drone.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
          style={{
            left: `${drone.x}px`,
            top: `${drone.y}px`,
          }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-sm shadow-xl border-2 border-blue-300 relative">
            🚁
            {/* Drone status indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse" />
          </div>
          {/* Drone trail */}
          <div className="absolute inset-0 rounded-full border border-blue-400/30 animate-ping" />
        </div>
      ))}
      {/* Selection Box */}
      {gameState.selectionBox && gameState.selectionBox.isActive && (
        <div
          className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none"
          style={{
            left: `${Math.min(
              gameState.selectionBox.startX,
              gameState.selectionBox.endX,
            )}px`,
            top: `${Math.min(
              gameState.selectionBox.startY,
              gameState.selectionBox.endY,
            )}px`,
            width: `${Math.abs(
              gameState.selectionBox.endX - gameState.selectionBox.startX,
            )}px`,
            height: `${Math.abs(
              gameState.selectionBox.endY - gameState.selectionBox.startY,
            )}px`,
          }}
        />
      )}
      {/* Deployment Bays */}
      {gameState.showDeploymentZones &&
        gameState.deploymentBays.map((bay) => (
          <div
            key={bay.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${bay.x}px`,
              top: `${bay.y}px`,
            }}
          >
            <div
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center text-lg ${
                bay.currentDrones > 0
                  ? "border-green-400 bg-green-400/20"
                  : "border-gray-600 bg-gray-600/20"
              }`}
            >
              {bay.currentDrones > 0 ? "✅" : "⭕"}
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-1 rounded">
              {bay.currentDrones}/{bay.capacity}
            </div>
          </div>
        ))}
    </div>
  );
};
