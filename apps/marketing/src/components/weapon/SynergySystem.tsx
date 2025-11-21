import React, { useEffect, useState } from "react";

export interface SynergyEffect {
  id: string;
  name: string;
  description: string;
  effectors: string[];
  bonus: {
    damage?: number;
    range?: number;
    cooldown?: number;
    accuracy?: number;
  };
  visualEffect: string;
  color: string;
}

export interface SynergySystemProps {
  selectedEffectors: string[];
  onSynergyUpdate: (synergies: SynergyEffect[]) => void;
}

// Define synergy combinations based on real-world counter-drone tactics
const SYNERGY_DEFINITIONS: SynergyEffect[] = [
  {
    id: "spotter_precision",
    name: "Spotter-Assisted Precision",
    description:
      "Spotter UAV improves targeting accuracy for precision weapons",
    effectors: ["spotter", "smart_slug", "laser"],
    bonus: {
      accuracy: 0.25, // +25% hit chance
      damage: 0.15, // +15% damage
    },
    visualEffect: "crosshair enhancement",
    color: "#3b82f6",
  },
  {
    id: "gnss_rf_combo",
    name: "Navigation Disruption",
    description:
      "GNSS Denial and RF Takeover work together to confuse drone navigation",
    effectors: ["gnss_deny", "rf_take"],
    bonus: {
      accuracy: 0.3, // +30% success rate for RF takeover
      range: 0.2, // +20% effective range
    },
    visualEffect: "navigation confusion",
    color: "#8b5cf6",
  },
  {
    id: "decoy_capture",
    name: "Decoy and Capture",
    description: "Decoy Beacon attracts drones to Net Interceptor zones",
    effectors: ["decoy_beacon", "net"],
    bonus: {
      accuracy: 0.4, // +40% capture success
      range: 0.25, // +25% effective range
    },
    visualEffect: "attraction field",
    color: "#70A1FF",
  },
  {
    id: "ew_relay_boost",
    name: "EW Relay Enhancement",
    description:
      "EW Relay UAV extends range and effectiveness of electronic warfare",
    effectors: ["relay_uav", "rf_take", "gnss_deny", "hpm"],
    bonus: {
      range: 0.35, // +35% range boost
      accuracy: 0.2, // +20% effectiveness
    },
    visualEffect: "signal amplification",
    color: "#8b5cf6",
  },
  {
    id: "optical_dazzle_net",
    name: "Blind and Capture",
    description:
      "Optical Dazzler blinds cameras while Net captures the disabled drone",
    effectors: ["optic_dazzle", "net"],
    bonus: {
      accuracy: 0.35, // +35% capture success
      damage: 0.2, // +20% effectiveness
    },
    visualEffect: "blind capture",
    color: "#f97316",
  },
  {
    id: "hpm_swarm_clear",
    name: "HPM Swarm Clear",
    description: "High Power Microwave clears swarms for precision targeting",
    effectors: ["hpm", "smart_slug", "laser"],
    bonus: {
      damage: 0.3, // +30% damage to remaining targets
      accuracy: 0.25, // +25% hit chance
    },
    visualEffect: "swarm disruption",
    color: "#FFA502",
  },
  {
    id: "acoustic_gnss_chaos",
    name: "Acoustic-GNSS Chaos",
    description: "Acoustic Disruptor and GNSS Denial create navigation chaos",
    effectors: ["acoustic", "gnss_deny"],
    bonus: {
      accuracy: 0.25, // +25% disruption effectiveness
      range: 0.15, // +15% area of effect
    },
    visualEffect: "navigation chaos",
    color: "#84cc16",
  },
  {
    id: "ai_deception_swarm",
    name: "AI Swarm Deception",
    description:
      "AI Deception confuses swarm coordination with Micro-Decoy Swarm",
    effectors: ["ai_deception", "lure_swarm"],
    bonus: {
      accuracy: 0.4, // +40% deception effectiveness
      damage: 0.2, // +20% damage to confused targets
    },
    visualEffect: "swarm confusion",
    color: "#8b5cf6",
  },
];

export const SynergySystem: React.FC<SynergySystemProps> = ({
  selectedEffectors,
  onSynergyUpdate,
}) => {
  const [activeSynergies, setActiveSynergies] = useState<SynergyEffect[]>([]);

  useEffect(() => {
    // Calculate active synergies based on selected effectors
    const synergies = SYNERGY_DEFINITIONS.filter((synergy) => {
      // Check if all required effectors are selected
      return synergy.effectors.every((effector) =>
        selectedEffectors.includes(effector),
      );
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Computing derived state from props
    setActiveSynergies(synergies);
    onSynergyUpdate(synergies);
  }, [selectedEffectors, onSynergyUpdate]);

  if (activeSynergies.length === 0) {
    return (
      <div className="synergy-system">
        <h4 className="synergy-title">SYNERGY EFFECTS</h4>
        <div className="synergy-empty">
          <span className="synergy-empty-text">
            No synergies active. Combine compatible effectors for enhanced
            effectiveness.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="synergy-system">
      <h4 className="synergy-title">SYNERGY EFFECTS</h4>
      <div className="synergy-list">
        {activeSynergies.map((synergy) => (
          <div key={synergy.id} className="synergy-item">
            <div className="synergy-header">
              <div className="synergy-name">{synergy.name}</div>
              <div
                className="synergy-indicator"
                style={{ backgroundColor: synergy.color }}
              />
            </div>
            <div className="synergy-description">{synergy.description}</div>
            <div className="synergy-bonuses">
              {Object.entries(synergy.bonus).map(([stat, value]) => (
                <div key={stat} className="synergy-bonus">
                  <span className="bonus-stat">{stat.replace(/_/g, " ")}:</span>
                  <span className="bonus-value">
                    +{Math.round(value * 100)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="synergy-effectors">
              <span className="synergy-label">Effectors:</span>
              <div className="synergy-effector-list">
                {synergy.effectors.map((effector) => (
                  <span key={effector} className="synergy-effector">
                    {effector.replace("_", " ")}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
