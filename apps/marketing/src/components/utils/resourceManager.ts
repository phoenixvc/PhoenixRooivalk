/**
 * Resource Management System
 * Handles tokens, research points, and effector/drone unlocks
 */

import type { ResearchOption } from "../../types/research";

export interface ResourceState {
  tokens: number;
  researchPoints: number;
  activeResearch: {
    type: string;
    progress: number;
    target: number;
  } | null;
  unlockedEffectors: string[];
  unlockedDrones: string[];
  availableEffectors: string[];
  availableDrones: string[];
}

export interface EffectorData {
  id: string;
  name: string;
  class: string;
  description: string;
  typical_range_m: number;
  power_kw_nominal: number;
  latency_ms: number;
  collateral_risk: string;
  legal_flags: string[];
  swarm_effectiveness: string;
  brands: string[];
  sources: string[];
  unlockCost: number;
  researchCost: number;
}

export interface DroneData {
  id: string;
  name: string;
  role: string;
  notes: string;
  description: string;
  brands: string[];
  sources: string[];
  unlockCost: number;
  researchCost: number;
  tokenCost: number;
}

export interface ResearchProgress {
  type: string;
  progress: number;
  target: number;
  category: "effector" | "drone";
  name: string;
  description: string;
}

/**
 * Deep clone ResourceState to avoid shared references
 */
function deepCloneResourceState(state: ResourceState): ResourceState {
  return {
    ...state,
    unlockedEffectors: [...state.unlockedEffectors],
    unlockedDrones: [...state.unlockedDrones],
    availableEffectors: [...state.availableEffectors],
    availableDrones: [...state.availableDrones],
    activeResearch: state.activeResearch ? { ...state.activeResearch } : null,
  };
}

/**
 * Default starting resources and unlocks
 */
export const DEFAULT_RESOURCE_STATE: ResourceState = {
  tokens: 100, // Starting tokens
  researchPoints: 0,
  activeResearch: null,
  unlockedEffectors: ["kinetic"], // Start with only kinetic weapon
  unlockedDrones: ["effector"], // Start with only effector drone
  availableEffectors: ["kinetic"], // Only kinetic available initially
  availableDrones: ["effector"], // Only effector available initially
};

/**
 * Effector unlock costs and research requirements
 */
export const EFFECTOR_UNLOCK_DATA: Record<string, EffectorData> = {
  kinetic: {
    id: "kinetic",
    name: "Kinetic Weapon",
    class: "hard_kill",
    description: "Standard kinetic rounds for direct engagement.",
    typical_range_m: 1000,
    power_kw_nominal: 5,
    latency_ms: 100,
    collateral_risk: "medium",
    legal_flags: [],
    swarm_effectiveness: "medium",
    brands: ["Standard Issue"],
    sources: [],
    unlockCost: 0, // Already unlocked
    researchCost: 0,
  },
  emp: {
    id: "emp",
    name: "EMP Weapon",
    class: "soft_kill",
    description: "Electromagnetic pulse for electronic disruption.",
    typical_range_m: 800,
    power_kw_nominal: 25,
    latency_ms: 50,
    collateral_risk: "medium",
    legal_flags: ["Spectrum-clearance-required"],
    swarm_effectiveness: "high",
    brands: ["Epirus Leonidas", "Raytheon PHASER"],
    sources: [],
    unlockCost: 150, // Tokens to unlock
    researchCost: 50, // Research points to unlock
  },
  laser: {
    id: "laser",
    name: "High-Energy Laser",
    class: "hard_kill",
    description: "Thermal defeat; precise line-of-sight hard-kill.",
    typical_range_m: 2000,
    power_kw_nominal: 10,
    latency_ms: 200,
    collateral_risk: "low",
    legal_flags: ["ITAR-likely", "Export-controlled"],
    swarm_effectiveness: "medium",
    brands: ["Raytheon HELWS/H4", "Rheinmetall Laser Weapon Module"],
    sources: [],
    unlockCost: 300,
    researchCost: 100,
  },
  rf_jam: {
    id: "rf_jam",
    name: "RF Jamming",
    class: "denial",
    description: "Directional RF disruption to sever C2/video links.",
    typical_range_m: 1500,
    power_kw_nominal: 1.2,
    latency_ms: 80,
    collateral_risk: "medium",
    legal_flags: ["Spectrum-clearance-required"],
    swarm_effectiveness: "medium",
    brands: ["DroneShield DroneCannon MkII", "DedroneDefender 2"],
    sources: [],
    unlockCost: 200,
    researchCost: 75,
  },
  net_capture: {
    id: "net_capture",
    name: "Net Capture",
    class: "soft_kill",
    description: "Net projectile to capture airframe intact.",
    typical_range_m: 100,
    power_kw_nominal: 0.1,
    latency_ms: 300,
    collateral_risk: "low",
    legal_flags: [],
    swarm_effectiveness: "low",
    brands: ["OpenWorks SkyWall", "Fortem DroneHunter"],
    sources: [],
    unlockCost: 120,
    researchCost: 40,
  },
};

/**
 * Drone unlock costs and research requirements
 */
export const DRONE_UNLOCK_DATA: Record<string, DroneData> = {
  effector: {
    id: "effector",
    name: "Effector Drone",
    role: "active_defeat",
    notes: "Autonomous pursuit; net capture preferred for low collateral.",
    description:
      "Primary combat drone for direct threat engagement and neutralization.",
    brands: ["Fortem DroneHunter F700", "Anduril Anvil"],
    sources: [],
    unlockCost: 0, // Already unlocked
    researchCost: 0,
    tokenCost: 50, // Cost to deploy one
  },
  jammer: {
    id: "jammer",
    name: "Jammer Drone",
    role: "EW_denial",
    notes: "Airborne jamming platform for electronic warfare.",
    description:
      "Electronic warfare drone for RF jamming and signal disruption.",
    brands: ["Custom Platform"],
    sources: [],
    unlockCost: 180,
    researchCost: 60,
    tokenCost: 75,
  },
  surveillance: {
    id: "surveillance",
    name: "Surveillance Drone",
    role: "detection_tracking",
    notes: "Mobile visual identification and target handoff.",
    description:
      "Reconnaissance and surveillance drone for threat detection and tracking.",
    brands: ["Teledyne FLIR SkyRanger", "Skydio X10D"],
    sources: [],
    unlockCost: 100,
    researchCost: 30,
    tokenCost: 40,
  },
  shield: {
    id: "shield",
    name: "Shield Drone",
    role: "protection",
    notes: "Protective barrier and countermeasure deployment.",
    description:
      "Defensive drone providing protective barriers and countermeasures.",
    brands: ["Custom Platform"],
    sources: [],
    unlockCost: 250,
    researchCost: 80,
    tokenCost: 100,
  },
  "swarm-coordinator": {
    id: "swarm-coordinator",
    name: "Coordinator Drone",
    role: "command_control",
    notes: "Swarm coordination and mission command.",
    description: "Command and control drone for coordinating swarm operations.",
    brands: ["Custom Platform"],
    sources: [],
    unlockCost: 400,
    researchCost: 120,
    tokenCost: 150,
  },
};

/**
 * Research categories and their requirements
 */
export const RESEARCH_CATEGORIES = {
  effector: {
    name: "Effector Research",
    description: "Research new weapon systems and countermeasures",
    icon: "⚡",
  },
  drone: {
    name: "Drone Research",
    description: "Research new drone types and capabilities",
    icon: "🚁",
  },
} as const;

/**
 * Main Resource Manager class
 */
export class ResourceManager {
  private state: ResourceState;
  private onStateChange: (state: ResourceState) => void;

  constructor(
    initialState: ResourceState = DEFAULT_RESOURCE_STATE,
    onStateChange: (state: ResourceState) => void = () => {},
  ) {
    this.state = deepCloneResourceState(initialState);
    this.onStateChange = onStateChange;
  }

  /**
   * Get current resource state
   */
  getState(): ResourceState {
    return deepCloneResourceState(this.state);
  }

  /**
   * Add tokens
   */
  addTokens(amount: number): void {
    this.state.tokens += amount;
    this.notifyChange();
  }

  /**
   * Spend tokens (returns success)
   */
  spendTokens(amount: number): boolean {
    if (this.state.tokens >= amount) {
      this.state.tokens -= amount;
      this.notifyChange();
      return true;
    }
    return false;
  }

  /**
   * Add research points
   */
  addResearchPoints(amount: number): void {
    this.state.researchPoints += amount;
    this.notifyChange();
  }

  /**
   * Start researching a new effector or drone
   */
  startResearch(type: string, category: "effector" | "drone"): boolean {
    if (this.state.activeResearch) {
      return false; // Already researching something
    }

    const data =
      category === "effector"
        ? EFFECTOR_UNLOCK_DATA[type]
        : DRONE_UNLOCK_DATA[type];

    if (
      !data ||
      this.state.unlockedEffectors.includes(type) ||
      this.state.unlockedDrones.includes(type)
    ) {
      return false; // Invalid type or already unlocked
    }

    // Check if we have enough research points
    if (this.state.researchPoints < data.researchCost) {
      return false; // Insufficient research points
    }

    // Deduct research points
    this.state.researchPoints -= data.researchCost;

    this.state.activeResearch = {
      type,
      progress: 0,
      target: data.researchCost,
    };

    this.notifyChange();
    return true;
  }

  /**
   * Add research progress to current research
   */
  addResearchProgress(amount: number): void {
    if (!this.state.activeResearch) {
      return;
    }

    this.state.activeResearch.progress += amount;

    // Check if research is complete
    if (
      this.state.activeResearch.progress >= this.state.activeResearch.target
    ) {
      this.completeResearch();
    } else {
      this.notifyChange();
    }
  }

  /**
   * Complete current research and unlock the item
   */
  private completeResearch(): void {
    if (!this.state.activeResearch) {
      return;
    }

    const { type } = this.state.activeResearch;
    const effectorData = EFFECTOR_UNLOCK_DATA[type];
    const droneData = DRONE_UNLOCK_DATA[type];

    if (effectorData && !this.state.unlockedEffectors.includes(type)) {
      this.state.unlockedEffectors.push(type);
      this.state.availableEffectors.push(type);
    } else if (droneData && !this.state.unlockedDrones.includes(type)) {
      this.state.unlockedDrones.push(type);
      this.state.availableDrones.push(type);
    }

    this.state.activeResearch = null;
    this.notifyChange();
  }

  /**
   * Unlock an effector directly with tokens
   */
  unlockEffector(type: string): boolean {
    const data = EFFECTOR_UNLOCK_DATA[type];
    if (!data || this.state.unlockedEffectors.includes(type)) {
      return false;
    }

    if (this.spendTokens(data.unlockCost)) {
      this.state.unlockedEffectors.push(type);
      this.state.availableEffectors.push(type);
      this.notifyChange();
      return true;
    }

    return false;
  }

  /**
   * Unlock a drone directly with tokens
   */
  unlockDrone(type: string): boolean {
    const data = DRONE_UNLOCK_DATA[type];
    if (!data || this.state.unlockedDrones.includes(type)) {
      return false;
    }

    if (this.spendTokens(data.unlockCost)) {
      this.state.unlockedDrones.push(type);
      this.state.availableDrones.push(type);
      this.notifyChange();
      return true;
    }

    return false;
  }

  /**
   * Purchase a drone deployment with tokens
   */
  purchaseDrone(type: string): boolean {
    const data = DRONE_UNLOCK_DATA[type];
    if (!data || !this.state.unlockedDrones.includes(type)) {
      return false;
    }

    return this.spendTokens(data.tokenCost);
  }

  /**
   * Get available research options
   */
  getAvailableResearch(): ResearchOption[] {
    const options: ResearchOption[] = [];

    // Add effector research options
    Object.entries(EFFECTOR_UNLOCK_DATA).forEach(([type, data]) => {
      if (!this.state.unlockedEffectors.includes(type)) {
        options.push({
          type,
          category: "effector",
          name: data.name,
          description: data.description,
          researchCost: data.researchCost,
          unlockCost: data.unlockCost,
          isUnlocked: false,
        });
      }
    });

    // Add drone research options
    Object.entries(DRONE_UNLOCK_DATA).forEach(([type, data]) => {
      if (!this.state.unlockedDrones.includes(type)) {
        options.push({
          type,
          category: "drone",
          name: data.name,
          description: data.description,
          researchCost: data.researchCost,
          unlockCost: data.unlockCost,
          isUnlocked: false,
        });
      }
    });

    return options;
  }

  /**
   * Get research progress info
   */
  getResearchProgress(): ResearchProgress | null {
    if (!this.state.activeResearch) {
      return null;
    }

    const { type, progress, target } = this.state.activeResearch;
    const effectorData = EFFECTOR_UNLOCK_DATA[type];
    const droneData = DRONE_UNLOCK_DATA[type];

    if (effectorData) {
      return {
        type,
        progress,
        target,
        category: "effector",
        name: effectorData.name,
        description: effectorData.description,
      };
    } else if (droneData) {
      return {
        type,
        progress,
        target,
        category: "drone",
        name: droneData.name,
        description: droneData.description,
      };
    }

    return null;
  }

  /**
   * Get effector data by type
   */
  getEffectorData(type: string): EffectorData | null {
    return EFFECTOR_UNLOCK_DATA[type] || null;
  }

  /**
   * Get drone data by type
   */
  getDroneData(type: string): DroneData | null {
    return DRONE_UNLOCK_DATA[type] || null;
  }

  /**
   * Check if an effector is unlocked
   */
  isEffectorUnlocked(type: string): boolean {
    return this.state.unlockedEffectors.includes(type);
  }

  /**
   * Check if a drone is unlocked
   */
  isDroneUnlocked(type: string): boolean {
    return this.state.unlockedDrones.includes(type);
  }

  /**
   * Get unlocked effectors
   */
  getUnlockedEffectors(): string[] {
    return [...this.state.unlockedEffectors];
  }

  /**
   * Get unlocked drones
   */
  getUnlockedDrones(): string[] {
    return [...this.state.unlockedDrones];
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.state = deepCloneResourceState(DEFAULT_RESOURCE_STATE);
    this.notifyChange();
  }

  /**
   * Notify state change
   */
  private notifyChange(): void {
    this.onStateChange(this.getState());
  }

  /**
   * Award resources based on performance
   */
  awardPerformanceRewards(
    score: number,
    threatsNeutralized: number,
    waveCompleted: boolean,
  ): void {
    // Base token reward
    let tokenReward = Math.floor(score / 100);

    // Bonus for neutralizing threats
    tokenReward += threatsNeutralized * 5;

    // Bonus for completing waves
    if (waveCompleted) {
      tokenReward += 25;
    }

    this.addTokens(tokenReward);

    // Research points (slower accumulation)
    let researchReward = Math.floor(score / 500);
    researchReward += Math.floor(threatsNeutralized / 5);

    if (waveCompleted) {
      researchReward += 5;
    }

    this.addResearchPoints(researchReward);
  }
}

/**
 * Create a new resource manager instance
 */
export function createResourceManager(
  initialState?: ResourceState,
  onStateChange?: (state: ResourceState) => void,
): ResourceManager {
  return new ResourceManager(initialState, onStateChange);
}
