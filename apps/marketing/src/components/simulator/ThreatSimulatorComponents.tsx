import * as React from "react";
import type { GameState } from "../../types/game";
import styles from "./ThreatSimulatorComponents.module.css";

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
    <div className={styles.container}>
      {/* Enhanced Central Radar */}
      <div className={styles.radarContainer}>
        {/* Outer detection ring */}
        <div className={styles.radarOuterRing} />
        {/* Middle detection ring */}
        <div className={styles.radarMiddleRing} />
        {/* Inner detection ring */}
        <div className={styles.radarInnerRing} />
        {/* Range markers */}
        <div className={styles.rangeMarkers}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <div
              key={angle}
              className={styles.rangeMarker}
              style={{
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-40px)`,
              }}
            />
          ))}
        </div>
        {/* Sweep line */}
        <div className={styles.sweepLine} />
        {/* Center dot */}
        <div className={styles.centerDot} />
        {/* Range labels */}
        <div className={`${styles.rangeLabel} ${styles.rangeLabelTop}`}>
          RANGE
        </div>
        <div className={`${styles.rangeLabel} ${styles.rangeLabelBottom}`}>
          {Math.round(gameState.mothership.x)}m
        </div>
      </div>
      {/* Enhanced Mothership */}
      <div
        className={styles.mothershipContainer}
        style={{
          left: `${gameState.mothership.x}px`,
          top: `${gameState.mothership.y}px`,
        }}
      >
        {/* Mothership body */}
        <div className={styles.mothershipBody}>
          🚁
          {/* Energy shield indicator */}
          {gameState.energy > gameState.maxEnergy * 0.7 && (
            <div className={styles.energyShield} />
          )}
          {/* Low energy warning */}
          {gameState.energy < gameState.maxEnergy * 0.2 && (
            <div className={styles.lowEnergyWarning}>
              LOW ENERGY
            </div>
          )}
        </div>
        {/* Mothership label */}
        <div className={styles.mothershipLabel}>
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

        const threatClasses = [
          styles.threatContainer,
          isSelected && styles.threatSelected,
          isHovered && !isSelected && styles.threatHovered,
          isNeutralized && styles.threatNeutralized,
        ].filter(Boolean).join(" ");

        const iconClasses = [
          styles.threatIcon,
          isCrater && styles.threatIconCrater,
          !isCrater && isNeutralized && styles.threatIconNeutralized,
          isSelected && styles.threatIconSelected,
          isHovered && !isSelected && styles.threatIconHovered,
        ].filter(Boolean).join(" ");

        return (
          <div
            key={threat.id}
            className={threatClasses}
            style={{
              left: `${threat.x}px`,
              top: `${threat.y}px`,
              opacity: isNeutralized ? fadeOpacity : 1,
              backgroundColor: !isCrater && !isNeutralized ? appearance.color : undefined,
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
              className={iconClasses}
              style={{
                backgroundColor: !isCrater && !isNeutralized ? appearance.color : undefined,
              }}
            >
              {isCrater ? "🕳️" : isNeutralized ? "💥" : appearance.emoji}
            </div>
            {/* Threat Trail SVG */}
            {!isNeutralized &&
              !isCrater &&
              threat.trail &&
              threat.trail.length > 1 && (
                <svg
                  className={styles.threatTrail}
                  style={{
                    transform: `translate(-${threat.x}px, -${threat.y}px)`,
                    width: "800px",
                    height: "600px",
                  }}
                >
                  <polyline
                    points={threat.trail.map((p) => `${p.x},${p.y}`).join(" ")}
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
                className={`${styles.priorityIndicator} ${
                  priority === "high"
                    ? styles.priorityHigh
                    : priority === "medium"
                      ? styles.priorityMedium
                      : styles.priorityLow
                }`}
              />
            )}
            {/* Threat label */}
            {(isSelected || isHovered || priority !== "low") && (
              <div className={styles.threatLabel}>
                {threat.type.toUpperCase()}
                {priority !== "low" && (
                  <span className={styles.priorityEmoji}>
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
              <div className={styles.healthBar}>
                <div
                  className={styles.healthBarFill}
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
          className={styles.droneContainer}
          style={{
            left: `${drone.x}px`,
            top: `${drone.y}px`,
          }}
        >
          <div className={styles.droneBody}>
            🚁
            {/* Drone status indicator */}
            <div className={styles.droneStatus} />
          </div>
          {/* Drone trail */}
          <div className={styles.droneTrail} />
        </div>
      ))}
      {/* Selection Box */}
      {gameState.selectionBox && gameState.selectionBox.isActive && (
        <div
          className={styles.selectionBox}
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
            className={styles.deploymentBayContainer}
            style={{
              left: `${bay.x}px`,
              top: `${bay.y}px`,
            }}
          >
            <div
              className={`${styles.deploymentBay} ${
                bay.currentDrones > 0
                  ? styles.deploymentBayActive
                  : styles.deploymentBayEmpty
              }`}
            >
              {bay.currentDrones > 0 ? "✅" : "⭕"}
            </div>
            <div className={styles.deploymentBayLabel}>
              {bay.currentDrones}/{bay.capacity}
            </div>
          </div>
        ))}
    </div>
  );
};
