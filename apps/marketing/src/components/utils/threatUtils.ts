// apps/marketing/src/components/utils/threatUtils.ts
import { Threat } from "./threatTypes";

/**
 * Spawns a new threat at the edge of the game area
 */
export function spawnThreat(
  type?:
    | "drone"
    | "swarm"
    | "stealth"
    | "kamikaze"
    | "decoy"
    | "shielded"
    | "boss",
  boundingRect?: DOMRect,
  level: number = 1,
): Threat {
  const rect = boundingRect || { width: 800, height: 600, left: 0, top: 0 };
  const threatType =
    type ||
    (["drone", "swarm", "stealth", "kamikaze"] as const)[
      Math.floor(Math.random() * 4)
    ];

  // Spawn from edges
  const edge = Math.floor(Math.random() * 4);
  let x = 0;
  let y = 0;

  switch (edge) {
    case 0: // Top
      x = Math.random() * rect.width;
      y = 0;
      break;
    case 1: // Right
      x = rect.width;
      y = Math.random() * rect.height;
      break;
    case 2: // Bottom
      x = Math.random() * rect.width;
      y = rect.height;
      break;
    case 3: // Left
      x = 0;
      y = Math.random() * rect.height;
      break;
  }

  // Calculate initial velocity towards center with some randomness
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const angleToCenter = Math.atan2(centerY - y, centerX - x);
  const angleVariation = ((Math.random() - 0.5) * Math.PI) / 4; // ±22.5 degrees
  const finalAngle = angleToCenter + angleVariation;

  const baseSpeed =
    threatType === "stealth"
      ? 0.3
      : threatType === "swarm"
        ? 0.8
        : threatType === "kamikaze"
          ? 0.9
          : 0.5;
  const speedMultiplier = 1 + (level - 1) * 0.1; // Speed increases with level
  const speed = baseSpeed * speedMultiplier;

  const threat: Threat = {
    id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    x,
    y,
    type: threatType,
    speed,
    vx: Math.cos(finalAngle) * speed,
    vy: Math.sin(finalAngle) * speed,
    health:
      threatType === "stealth"
        ? 50
        : threatType === "swarm"
          ? 30
          : threatType === "kamikaze"
            ? 40
            : threatType === "boss"
              ? 200
              : 100,
    maxHealth:
      threatType === "stealth"
        ? 50
        : threatType === "swarm"
          ? 30
          : threatType === "kamikaze"
            ? 40
            : threatType === "boss"
              ? 200
              : 100,
    trail: [{ x, y, timestamp: Date.now() }],
    createdAt: Date.now(),
    lastUpdate: Date.now(),
    isMoving: true,
    status: "active",
    allegiance: "hostile", // Default to hostile for enemy threats
    specialProperties: {
      stealthMode: threatType === "stealth",
      swarmBehavior: threatType === "swarm",
      explosionRadius: threatType === "kamikaze" ? 75 : undefined,
    },
  };

  return threat;
}

/**
 * Updates threat positions with proper boundary checking and status handling
 */
export function moveThreats(
  threats: Threat[],
  centerPoint: { x: number; y: number },
  level: number = 1,
  deltaTime: number = 1 / 60, // Default to 60 FPS
): Threat[] {
  return threats.map((threat) => {
    // Don't move neutralized or crater threats
    if (
      threat.status === "neutralized" ||
      threat.status === "crater" ||
      !threat.isMoving
    ) {
      return threat;
    }

    // Calculate attraction to center
    const dx = centerPoint.x - threat.x;
    const dy = centerPoint.y - threat.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Stop moving if very close to center
    if (distance < 20) {
      return {
        ...threat,
        vx: 0,
        vy: 0,
        isMoving: false,
      };
    }

    // Apply acceleration towards center (gravity-like effect)
    const attraction = 0.02 * (1 + level * 0.01); // Stronger pull at higher levels
    const ax = (dx / distance) * attraction;
    const ay = (dy / distance) * attraction;

    // Update velocity
    let newVx = threat.vx + ax;
    let newVy = threat.vy + ay;

    // Apply drag to prevent infinite acceleration
    const drag = 0.99;
    newVx *= drag;
    newVy *= drag;

    // Limit maximum speed
    const maxSpeed = threat.speed * 2; // Allow some acceleration but cap it
    const currentSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
    if (currentSpeed > maxSpeed) {
      const scale = maxSpeed / currentSpeed;
      newVx *= scale;
      newVy *= scale;
    }

    // Update position
    const newX = threat.x + newVx * deltaTime * 60; // Scale by 60 for consistent movement
    const newY = threat.y + newVy * deltaTime * 60;

    // Update trail (keep last 10 points)
    const newTrail = [
      ...threat.trail.slice(-9),
      { x: newX, y: newY, timestamp: Date.now() },
    ];

    // Special behaviors
    let specialX = newX;
    let specialY = newY;

    if (threat.type === "swarm") {
      // Swarm threats zigzag
      const time = Date.now() / 1000;
      const zigzag = Math.sin(time * 5) * 10;
      specialX += zigzag * (-newVy / currentSpeed); // Perpendicular to direction
      specialY += zigzag * (newVx / currentSpeed);
    } else if (threat.type === "stealth") {
      // Stealth threats phase in and out
      const time = Date.now() / 2000;
      threat.specialProperties = {
        ...threat.specialProperties,
        opacity: 0.3 + Math.sin(time) * 0.3,
      };
    }

    return {
      ...threat,
      x: specialX,
      y: specialY,
      vx: newVx,
      vy: newVy,
      trail: newTrail,
      lastUpdate: Date.now(),
    };
  });
}

/**
 * Checks if a point is within range of a threat
 */
export function isPointNearThreat(
  point: { x: number; y: number },
  threat: Threat,
  range: number,
): boolean {
  const dx = point.x - threat.x;
  const dy = point.y - threat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= range;
}

/**
 * Finds threats within a selection box
 */
export function findThreatsInBox(
  threats: Threat[],
  box: { startX: number; startY: number; endX: number; endY: number },
): Threat[] {
  const minX = Math.min(box.startX, box.endX);
  const maxX = Math.max(box.startX, box.endX);
  const minY = Math.min(box.startY, box.endY);
  const maxY = Math.max(box.startY, box.endY);

  return threats.filter((threat) => {
    return (
      threat.x >= minX &&
      threat.x <= maxX &&
      threat.y >= minY &&
      threat.y <= maxY &&
      threat.status === "active"
    );
  });
}

/**
 * Calculates damage to a threat based on weapon effectiveness
 */
export function calculateThreatDamage(
  threat: Threat,
  weaponType: string,
  weaponDamage: number,
  effectiveness: number,
): number {
  let damage = weaponDamage * effectiveness;

  // Apply threat-specific resistances
  if (threat.type === "stealth" && weaponType === "kinetic") {
    damage *= 0.5; // Stealth resists kinetic
  } else if (threat.type === "swarm" && weaponType === "laser") {
    damage *= 0.3; // Swarms spread out, lasers less effective
  } else if (threat.type === "shielded") {
    damage *= 0.2; // Shields reduce all damage
  }

  return Math.max(0, damage);
}

/**
 * Applies damage to a threat and returns updated threat
 */
export function damageThreat(threat: Threat, damage: number): Threat {
  const newHealth = Math.max(0, threat.health - damage);

  if (newHealth <= 0) {
    return {
      ...threat,
      health: 0,
      status: "neutralized",
      isMoving: false,
      neutralizedAt: Date.now(),
      fadeStartTime: Date.now() + 2000, // Start fade after 2 seconds
    };
  }

  return {
    ...threat,
    health: newHealth,
  };
}

/**
 * Gets threat priority based on distance to center and type
 */
export function calculateThreatPriority(
  threat: Threat,
  centerPoint: { x: number; y: number },
): "high" | "medium" | "low" {
  const dx = centerPoint.x - threat.x;
  const dy = centerPoint.y - threat.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // High priority threats
  if (distance < 100 || threat.type === "kamikaze") {
    return "high";
  }

  // Medium priority threats
  if (distance < 200 || threat.type === "stealth") {
    return "medium";
  }

  return "low";
}

/**
 * Map threat type to appearance for consistent UI rendering
 */
export function getThreatAppearance(type: string): {
  emoji: string;
  color: string;
  cssClass: string;
} {
  const map: Record<
    string,
    { emoji: string; color: string; cssClass: string }
  > = {
    drone: { emoji: "🚁", color: "bg-red-500", cssClass: "threat-drone" },
    swarm: { emoji: "👾", color: "bg-yellow-500", cssClass: "threat-swarm" },
    stealth: { emoji: "🥷", color: "bg-gray-700", cssClass: "threat-stealth" },
    missile: { emoji: "🚀", color: "bg-red-600", cssClass: "threat-missile" },
    kamikaze: { emoji: "💥", color: "bg-red-600", cssClass: "threat-kamikaze" },
    decoy: { emoji: "🎭", color: "bg-violet-600", cssClass: "threat-decoy" },
    shielded: {
      emoji: "🛡️",
      color: "bg-green-600",
      cssClass: "threat-shielded",
    },
    boss: { emoji: "👹", color: "bg-red-700", cssClass: "threat-boss" },
  };
  return map[type] || map.drone;
}
