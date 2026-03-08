import React, { useEffect, useRef, useState } from "react";

export type ThreatType = "hostile" | "unknown" | "friendly";
export type DroneRole =
  | "guard"
  | "recon"
  | "ecm"
  | "support"
  | "deception"
  | "capture"
  | "sensor"
  | "logistics"
  | "directed";

export interface RadarTarget {
  id: string;
  type: ThreatType;
  position: { x: number; y: number };
  distance: number; // in meters
  bearing: number; // in degrees
  speed: number; // in m/s
  altitude: number; // in meters
  confidence: number; // 0-1
  lastUpdate: number; // timestamp
}

export interface FriendlyDeployment {
  id: string;
  role: DroneRole;
  position: { x: number; y: number };
  status: "active" | "idle" | "returning" | "disabled";
  energy: number;
  maxEnergy: number;
}

export interface RadarSystemProps {
  targets: RadarTarget[];
  friendlyDeployments: FriendlyDeployment[];
  range: number; // radar range in meters
  centerPosition: { x: number; y: number };
  className?: string;
}

export const RadarSystem: React.FC<RadarSystemProps> = ({
  targets,
  friendlyDeployments,
  range,
  centerPosition,
  className = "",
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // Animation state for sweep line
  const [sweepAngle, setSweepAngle] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);

  const getThreatColor = (type: ThreatType): string => {
    switch (type) {
      case "hostile":
        return "rgb(var(--sim-hostile, 255, 93, 93))"; // Red
      case "unknown":
        return "rgb(var(--sim-warning, 255, 209, 102))"; // Amber
      case "friendly":
        return "rgb(var(--sim-friendly, 74, 222, 128))"; // Green
      default:
        return "rgb(var(--color-gray-500, 100, 116, 139))"; // Gray
    }
  };

  const getThreatShape = (type: ThreatType): string => {
    switch (type) {
      case "hostile":
        return "●"; // Filled circle
      case "unknown":
        return "○"; // Ring
      case "friendly":
        return "▲"; // Triangle
      default:
        return "?";
    }
  };

  const getRoleIcon = (role: DroneRole): string => {
    const roleIcons = {
      guard: "🛡",
      recon: "👁",
      ecm: "📡",
      support: "🔧",
      deception: "🎭",
      capture: "🕸",
      sensor: "📊",
      logistics: "📦",
      directed: "⚡",
    };
    return roleIcons[role] || "?";
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "rgb(var(--sim-friendly, 74, 222, 128))";
      case "idle":
        return "rgb(var(--color-gray-500, 100, 116, 139))";
      case "returning":
        return "rgb(var(--sim-warning, 255, 209, 102))";
      case "disabled":
        return "rgb(var(--sim-hostile, 255, 93, 93))";
      default:
        return "rgb(var(--color-gray-500, 100, 116, 139))";
    }
  };

  const scalePosition = (
    position: { x: number; y: number },
    radarSize: number,
  ) => {
    const scale = radarSize / (range * 2); // Convert meters to pixels
    return {
      x: centerPosition.x + position.x * scale,
      y: centerPosition.y - position.y * scale, // Flip Y axis for radar display
    };
  };

  const radarSize = 400; // Fixed radar display size

  // Animation loop for sweep line
  useEffect(() => {
    const animate = () => {
      setSweepAngle((prevAngle) => prevAngle + 0.02); // Increment angle for smooth rotation
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className={`enhanced-radar-system ${className}`}>
      {/* Radar Display */}
      <div className="radar-container">
        <svg
          width={radarSize}
          height={radarSize}
          className="radar-display"
          viewBox={`0 0 ${radarSize} ${radarSize}`}
        >
          {/* Radar Grid */}
          <defs>
            <pattern
              id="radarGrid"
              patternUnits="userSpaceOnUse"
              width="40"
              height="40"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--sim-border)"
                strokeWidth="0.5"
                opacity="0.3"
              />
            </pattern>
          </defs>

          {/* Radar Background */}
          <circle
            cx={centerPosition.x}
            cy={centerPosition.y}
            r={radarSize / 2 - 20}
            fill="url(#radarGrid)"
            stroke="var(--sim-border)"
            strokeWidth="2"
            className="radar-background"
          />

          {/* Range Rings */}
          {[0.25, 0.5, 0.75, 1.0].map((ring) => (
            <circle
              key={ring}
              cx={centerPosition.x}
              cy={centerPosition.y}
              r={(radarSize / 2 - 20) * ring}
              fill="none"
              stroke="var(--sim-border)"
              strokeWidth="1"
              opacity="0.4"
              className="range-ring"
            />
          ))}

          {/* Center Crosshairs */}
          <line
            x1={centerPosition.x - 10}
            y1={centerPosition.y}
            x2={centerPosition.x + 10}
            y2={centerPosition.y}
            stroke="var(--sim-accent)"
            strokeWidth="2"
          />
          <line
            x1={centerPosition.x}
            y1={centerPosition.y - 10}
            x2={centerPosition.x}
            y2={centerPosition.y + 10}
            stroke="var(--sim-accent)"
            strokeWidth="2"
          />

          {/* Sentinel Core (Center) */}
          <circle
            cx={centerPosition.x}
            cy={centerPosition.y}
            r="8"
            fill="var(--sim-accent)"
            stroke="white"
            strokeWidth="2"
            className="sentinel-core"
          />
          <text
            x={centerPosition.x}
            y={centerPosition.y + 3}
            textAnchor="middle"
            fontSize="8"
            fill="white"
            fontWeight="600"
            className="sentinel-label"
          >
            CORE
          </text>

          {/* Threat Targets */}
          {targets.map((target) => {
            const scaledPos = scalePosition(target.position, radarSize);
            const isSelected = selectedTarget === target.id;

            return (
              <g
                key={target.id}
                className="radar-target focusable-target"
                tabIndex={0}
                role="button"
                aria-label={`Target ${target.id} ${target.type}`}
                aria-pressed={isSelected}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedTarget(target.id);
                  }
                }}
              >
                <circle
                  cx={scaledPos.x}
                  cy={scaledPos.y}
                  r="6"
                  fill={getThreatColor(target.type)}
                  stroke="white"
                  strokeWidth="1"
                  className={`target-marker ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedTarget(target.id)}
                />
                <text
                  x={scaledPos.x}
                  y={scaledPos.y + 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill="white"
                  fontWeight="600"
                  className="target-shape"
                >
                  {getThreatShape(target.type)}
                </text>

                {/* Target Info */}
                {isSelected && (
                  <g className="target-info">
                    <rect
                      x={scaledPos.x + 10}
                      y={scaledPos.y - 20}
                      width="80"
                      height="40"
                      fill="var(--sim-elev)"
                      stroke="var(--sim-border)"
                      strokeWidth="1"
                      rx="4"
                    />
                    <text
                      x={scaledPos.x + 15}
                      y={scaledPos.y - 8}
                      fontSize="8"
                      fill="var(--sim-text)"
                    >
                      ID: {target.id}
                    </text>
                    <text
                      x={scaledPos.x + 15}
                      y={scaledPos.y + 2}
                      fontSize="8"
                      fill="var(--sim-text)"
                    >
                      Range: {Math.round(target.distance)}m
                    </text>
                    <text
                      x={scaledPos.x + 15}
                      y={scaledPos.y + 12}
                      fontSize="8"
                      fill="var(--sim-text)"
                    >
                      Speed: {Math.round(target.speed)}m/s
                    </text>
                    <text
                      x={scaledPos.x + 15}
                      y={scaledPos.y + 22}
                      fontSize="8"
                      fill="var(--sim-text)"
                    >
                      Alt: {Math.round(target.altitude)}m
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Friendly Deployments */}
          {friendlyDeployments.map((deployment) => {
            const scaledPos = scalePosition(deployment.position, radarSize);

            return (
              <g key={deployment.id} className="friendly-deployment">
                <polygon
                  points={`${scaledPos.x},${scaledPos.y - 8} ${scaledPos.x - 6},${scaledPos.y + 4} ${scaledPos.x + 6},${scaledPos.y + 4}`}
                  fill={getStatusColor(deployment.status)}
                  stroke="white"
                  strokeWidth="1"
                  className="friendly-marker"
                />
                <text
                  x={scaledPos.x}
                  y={scaledPos.y + 1}
                  textAnchor="middle"
                  fontSize="6"
                  fill="white"
                  fontWeight="600"
                  className="role-icon"
                >
                  {getRoleIcon(deployment.role)}
                </text>

                {/* Energy Status Ring */}
                <circle
                  cx={scaledPos.x}
                  cy={scaledPos.y}
                  r="12"
                  fill="none"
                  stroke={getStatusColor(deployment.status)}
                  strokeWidth="1"
                  strokeDasharray={`${(deployment.energy / deployment.maxEnergy) * 75.4} 75.4`}
                  opacity="0.6"
                  className="energy-ring"
                />
              </g>
            );
          })}

          {/* Scan Sweep Animation */}
          <g className="scan-sweep">
            <line
              x1={centerPosition.x}
              y1={centerPosition.y}
              x2={
                centerPosition.x + Math.cos(sweepAngle) * (radarSize / 2 - 20)
              }
              y2={
                centerPosition.y + Math.sin(sweepAngle) * (radarSize / 2 - 20)
              }
              stroke="var(--sim-accent)"
              strokeWidth="2"
              opacity="0.8"
              className="sweep-line"
            />
          </g>
        </svg>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="radar-legend">
          <div className="legend-title">RADAR LEGEND</div>

          <div className="legend-section">
            <div className="legend-subtitle">Threat Types</div>
            <div className="legend-item">
              <span className="legend-symbol hostile">●</span>
              <span className="legend-label">Hostile</span>
            </div>
            <div className="legend-item">
              <span className="legend-symbol unknown">○</span>
              <span className="legend-label">Unknown</span>
            </div>
            <div className="legend-item">
              <span className="legend-symbol friendly">▲</span>
              <span className="legend-label">Friendly</span>
            </div>
          </div>

          <div className="legend-section">
            <div className="legend-subtitle">Deployment Status</div>
            <div className="legend-item">
              <span className="legend-symbol active">▲</span>
              <span className="legend-label">Active</span>
            </div>
            <div className="legend-item">
              <span className="legend-symbol idle">▲</span>
              <span className="legend-label">Idle</span>
            </div>
            <div className="legend-item">
              <span className="legend-symbol returning">▲</span>
              <span className="legend-label">Returning</span>
            </div>
          </div>

          <div className="legend-section">
            <div className="legend-subtitle">Range Rings</div>
            <div className="legend-item">
              <span className="legend-range">
                0-{Math.round(range * 0.25)}m
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-range">0-{Math.round(range * 0.5)}m</span>
            </div>
            <div className="legend-item">
              <span className="legend-range">
                0-{Math.round(range * 0.75)}m
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-range">0-{range}m</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="radar-controls">
        <button
          className="radar-control-btn"
          onClick={() => setShowLegend(!showLegend)}
        >
          {showLegend ? "Hide" : "Show"} Legend
        </button>
      </div>
    </div>
  );
};
