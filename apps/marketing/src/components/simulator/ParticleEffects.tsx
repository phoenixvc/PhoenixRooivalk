import * as React from "react";
import type { PowerUp } from "../../types/game";

interface ParticleEffectsProps {
  activePowerUps: PowerUp[];
  gameArea: { width: number; height: number };
}

const POWER_UP_VISUALS = {
  "rapid-fire": { color: "bg-blue-500", count: 7 },
  "damage-boost": { color: "bg-red-500", count: 6 },
  "area-effect": { color: "bg-purple-500", count: 10 },
  "range-boost": { color: "bg-green-500", count: 5 },
};

export const ParticleEffects: React.FC<ParticleEffectsProps> = ({
  activePowerUps,
  gameArea,
}) => {
  if (activePowerUps.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {activePowerUps.map((powerUp) => {
        const visual =
          POWER_UP_VISUALS[powerUp.type as keyof typeof POWER_UP_VISUALS];
        if (!visual) return null;

        return Array.from({ length: visual.count }).map((_, i) => (
          <div
            key={`${powerUp.id}-${i}`}
            className={`particle ${visual.color}`}
            style={{
              left: `${Math.random() * gameArea.width}px`,
              top: `${Math.random() * gameArea.height}px`,
              animationDuration: `${1 + Math.random() * 2}s`,
              animationDelay: `${Math.random() * 1}s`,
            }}
          />
        ));
      })}
    </div>
  );
};
