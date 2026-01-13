import React from "react";

export type ROERiskLevel = "low" | "medium" | "high";

// CSS custom property values for risk levels
// These map to the design system colors defined in globals.css
const RISK_COLORS = {
  low: "rgb(var(--color-teal-deep, 16, 185, 129))", // Green/teal
  medium: "rgb(var(--sensor-amber, 245, 158, 11))", // Amber
  high: "rgb(var(--color-red, 239, 68, 68))", // Red
  default: "rgb(var(--color-gray-500, 100, 116, 139))", // Gray
} as const;

const getRiskColor = (level: ROERiskLevel): string => {
  switch (level) {
    case "low":
      return RISK_COLORS.low;
    case "medium":
      return RISK_COLORS.medium;
    case "high":
      return RISK_COLORS.high;
    default:
      return RISK_COLORS.default;
  }
};

export interface ROERiskDetails {
  level: ROERiskLevel;
  description: string;
  considerations: string[];
  mitigation: string[];
  legalFlags: string[];
}

export interface ROEIndicatorProps {
  riskLevel: ROERiskLevel;
  riskDetails?: ROERiskDetails;
  showDetails?: boolean;
  size?: "small" | "medium" | "large";
  className?: string;
}

// ROE risk definitions based on real-world counter-drone operations
const ROE_RISK_DEFINITIONS: Record<ROERiskLevel, ROERiskDetails> = {
  low: {
    level: "low",
    description: "Minimal risk of collateral damage or legal issues",
    considerations: [
      "Non-lethal effects only",
      "Controlled environment",
      "Clear threat identification",
      "Minimal civilian presence",
    ],
    mitigation: [
      "Use non-kinetic effectors",
      "Implement safety protocols",
      "Maintain situational awareness",
      "Follow established ROE procedures",
    ],
    legalFlags: ["operational_approval", "environmental_clearance"],
  },
  medium: {
    level: "medium",
    description: "Moderate risk requiring careful consideration",
    considerations: [
      "Potential for minor collateral damage",
      "Mixed civilian/military environment",
      "Limited threat verification",
      "Weather/environmental factors",
    ],
    mitigation: [
      "Verify target identification",
      "Minimize engagement range",
      "Use precision targeting",
      "Coordinate with local authorities",
    ],
    legalFlags: ["command_approval", "legal_review", "civilian_notification"],
  },
  high: {
    level: "high",
    description: "Significant risk requiring explicit authorization",
    considerations: [
      "High probability of collateral damage",
      "Dense civilian population",
      "Unclear threat status",
      "Limited engagement options",
    ],
    mitigation: [
      "Require explicit authorization",
      "Implement additional safety measures",
      "Consider alternative engagement methods",
      "Document all decisions and rationale",
    ],
    legalFlags: [
      "command_approval",
      "legal_review",
      "civilian_notification",
      "risk_assessment",
    ],
  },
};

export const ROEIndicator: React.FC<ROEIndicatorProps> = ({
  riskLevel,
  riskDetails,
  showDetails = false,
  size = "medium",
  className = "",
}) => {
  const details = riskDetails || ROE_RISK_DEFINITIONS[riskLevel];
  const sizeClasses = {
    small: "roe-indicator-small",
    medium: "roe-indicator-medium",
    large: "roe-indicator-large",
  };

  const getRiskIcon = (level: ROERiskLevel): string => {
    switch (level) {
      case "low":
        return "✓";
      case "medium":
        return "⚠";
      case "high":
        return "⚠";
      default:
        return "?";
    }
  };

  return (
    <div className={`enhanced-roe-indicator ${sizeClasses[size]} ${className}`}>
      <div
        className="roe-indicator-main"
        style={{
          backgroundColor: getRiskColor(riskLevel),
          borderColor: getRiskColor(riskLevel),
        }}
      >
        <div className="roe-icon">{getRiskIcon(riskLevel)}</div>
        <div className="roe-level">{riskLevel.toUpperCase()}</div>
      </div>

      {showDetails && (
        <div className="roe-details">
          <div className="roe-description">{details.description}</div>

          <div className="roe-section">
            <div className="roe-section-title">Key Considerations:</div>
            <ul className="roe-considerations">
              {details.considerations.map((consideration, index) => (
                <li key={index} className="roe-consideration">
                  {consideration}
                </li>
              ))}
            </ul>
          </div>

          <div className="roe-section">
            <div className="roe-section-title">Mitigation Strategies:</div>
            <ul className="roe-mitigations">
              {details.mitigation.map((mitigation, index) => (
                <li key={index} className="roe-mitigation">
                  {mitigation}
                </li>
              ))}
            </ul>
          </div>

          {details.legalFlags.length > 0 && (
            <div className="roe-section">
              <div className="roe-section-title">Required Approvals:</div>
              <div className="roe-legal-flags">
                {details.legalFlags.map((flag, index) => (
                  <span key={index} className="roe-legal-flag">
                    {flag.replace("_", " ").toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Compact ROE indicator for use in weapon panels
export interface CompactROEIndicatorProps {
  riskLevel: ROERiskLevel;
  className?: string;
}

export const CompactROEIndicator: React.FC<CompactROEIndicatorProps> = ({
  riskLevel,
  className = "",
}) => {
  return (
    <div
      className={`compact-roe-indicator ${className}`}
      style={{
        backgroundColor: getRiskColor(riskLevel),
        borderColor: getRiskColor(riskLevel),
      }}
      title={`ROE Risk: ${riskLevel.toUpperCase()}`}
    >
      <span className="roe-level-text">
        {riskLevel.charAt(0).toUpperCase()}
      </span>
    </div>
  );
};
