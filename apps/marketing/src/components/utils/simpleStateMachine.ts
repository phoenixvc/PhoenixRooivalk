// Simple State Machine System - Deterministic Behavior Patterns
// This system will be ported to Rust in the main application

// Generic State Machine Interfaces
export interface SimpleState<T> {
  name: string;
  onEnter?: (context: T) => void;
  onUpdate?: (context: T, deltaTime: number) => void;
  onExit?: (context: T) => void;
}

export interface SimpleTransition<T> {
  from: string;
  to: string;
  condition: (context: T) => boolean;
  onTransition?: (context: T) => void;
}

export interface SimpleStateMachine<T> {
  id: string;
  currentState: string;
  states: Map<string, SimpleState<T>>;
  transitions: SimpleTransition<T>[];
  context: T;
  isRunning: boolean;
}

// Simple State Machine Engine
export class SimpleStateMachineEngine {
  private machines: Map<string, SimpleStateMachine<unknown>> = new Map();

  // Create a new state machine
  createStateMachine<T>(
    id: string,
    initialState: string,
    states: SimpleState<T>[],
    transitions: SimpleTransition<T>[],
    context: T,
  ): SimpleStateMachine<T> {
    const stateMap = new Map<string, SimpleState<T>>();
    states.forEach((state) => {
      stateMap.set(state.name, state);
    });

    const machine: SimpleStateMachine<T> = {
      id,
      currentState: initialState,
      states: stateMap,
      transitions,
      context,
      isRunning: true,
    };

    this.machines.set(id, machine as SimpleStateMachine<unknown>);

    // Enter initial state
    const initialStateObj = stateMap.get(initialState);
    if (initialStateObj?.onEnter) {
      initialStateObj.onEnter(context);
    }

    return machine;
  }

  // Update all state machines
  update(deltaTime: number): void {
    this.machines.forEach((machine) => {
      if (!machine.isRunning) return;

      const currentStateObj = machine.states.get(machine.currentState);
      if (!currentStateObj) return;

      // Update current state
      if (currentStateObj.onUpdate) {
        currentStateObj.onUpdate(machine.context, deltaTime);
      }

      // Check for transitions
      for (const transition of machine.transitions) {
        if (
          transition.from === machine.currentState &&
          transition.condition(machine.context)
        ) {
          this.transitionTo(
            machine,
            transition.to,
            transition.onTransition as (context: unknown) => void,
          );
          break;
        }
      }
    });
  }

  // Transition to new state
  private transitionTo<T>(
    machine: SimpleStateMachine<T>,
    newState: string,
    onTransition?: (context: T) => void,
  ): void {
    const currentStateObj = machine.states.get(machine.currentState);
    const newStateObj = machine.states.get(newState);

    if (!newStateObj) return;

    // Exit current state
    if (currentStateObj?.onExit) {
      currentStateObj.onExit(machine.context);
    }

    // Execute transition callback
    if (onTransition) {
      onTransition(machine.context);
    }

    // Enter new state
    machine.currentState = newState;
    if (newStateObj.onEnter) {
      newStateObj.onEnter(machine.context);
    }
  }

  // Get state machine by ID
  getStateMachine<T>(id: string): SimpleStateMachine<T> | null {
    return (this.machines.get(id) as SimpleStateMachine<T>) || null;
  }

  // Pause/Resume state machine
  setRunning(id: string, isRunning: boolean): void {
    const machine = this.machines.get(id);
    if (machine) {
      machine.isRunning = isRunning;
    }
  }

  // Remove state machine
  removeStateMachine(id: string): void {
    this.machines.delete(id);
  }

  // Get all state machines
  getAllStateMachines(): Map<string, SimpleStateMachine<unknown>> {
    return new Map(this.machines);
  }
}

// Game-Specific State Machine Definitions

// Context Interfaces
interface ThreatContext {
  id: string;
  position: { x: number; y: number };
  speed: number;
  target: { x: number; y: number };
  detectionRange: number;
  health: number;
  maxHealth: number;
  isAttacking: boolean;
}

interface DroneContext {
  id: string;
  position: { x: number; y: number };
  mothership: { x: number; y: number };
  energy: number;
  maxEnergy: number;
  health: number;
  maxHealth: number;
  mission: string;
  target?: { x: number; y: number };
  isActive: boolean;
  isPatrolling: boolean;
  isReturning: boolean;
}

interface WeaponContext {
  id: string;
  isReady: boolean;
  isFiring: boolean;
  isReloading: boolean;
  isOverheated: boolean;
  cooldown: number;
  maxCooldown: number;
  ammo: number;
  maxAmmo: number;
  energy: number;
  maxEnergy: number;
  target?: { x: number; y: number };
}

// Threat Behavior States
export const THREAT_STATES: SimpleState<ThreatContext>[] = [
  {
    name: "patrol",
    onUpdate: (context, deltaTime) => {
      // Move in random direction
      const angle = Math.random() * Math.PI * 2;
      const speed = context.speed * deltaTime;
      context.position.x += Math.cos(angle) * speed;
      context.position.y += Math.sin(angle) * speed;
    },
  },
  {
    name: "approach",
    onUpdate: (context, deltaTime) => {
      // Move toward target
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const speed = context.speed * deltaTime;
        context.position.x += (dx / distance) * speed;
        context.position.y += (dy / distance) * speed;
      }
    },
  },
  {
    name: "attack",
    onUpdate: (context, _deltaTime) => {
      // Attack behavior
      context.isAttacking = true;
    },
  },
  {
    name: "evade",
    onUpdate: (context, deltaTime) => {
      // Move away from target
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        const speed = context.speed * 1.5 * deltaTime; // Faster when evading
        context.position.x -= (dx / distance) * speed;
        context.position.y -= (dy / distance) * speed;
      }
    },
  },
];

export const THREAT_TRANSITIONS: SimpleTransition<ThreatContext>[] = [
  {
    from: "patrol",
    to: "approach",
    condition: (context) => {
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < context.detectionRange;
    },
  },
  {
    from: "patrol",
    to: "evade",
    condition: (context) => {
      return context.health < context.maxHealth * 0.3;
    },
  },
  {
    from: "approach",
    to: "attack",
    condition: (context) => {
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 50;
    },
  },
  {
    from: "approach",
    to: "patrol",
    condition: (context) => {
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance > context.detectionRange * 2;
    },
  },
  {
    from: "approach",
    to: "evade",
    condition: (context) => {
      return context.health < context.maxHealth * 0.3;
    },
  },
  {
    from: "attack",
    to: "approach",
    condition: (context) => {
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance > 50;
    },
    onTransition: (context) => {
      context.isAttacking = false;
    },
  },
  {
    from: "attack",
    to: "evade",
    condition: (context) => {
      return context.health < context.maxHealth * 0.3;
    },
    onTransition: (context) => {
      context.isAttacking = false;
    },
  },
  {
    from: "evade",
    to: "patrol",
    condition: (context) => {
      const dx = context.target.x - context.position.x;
      const dy = context.target.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return (
        distance > context.detectionRange * 3 &&
        context.health > context.maxHealth * 0.5
      );
    },
  },
  {
    from: "evade",
    to: "approach",
    condition: (context) => {
      return context.health > context.maxHealth * 0.7;
    },
  },
];

// Drone Mission States
export const DRONE_STATES: SimpleState<DroneContext>[] = [
  {
    name: "deployed",
    onUpdate: (context, _deltaTime) => {
      context.isActive = true;
    },
  },
  {
    name: "patrol",
    onUpdate: (context, deltaTime) => {
      context.isPatrolling = true;
      context.energy -= 1 * deltaTime; // Consume energy
    },
  },
  {
    name: "intercept",
    onUpdate: (context, deltaTime) => {
      if (context.target) {
        // Move toward target
        const dx = context.target.x - context.position.x;
        const dy = context.target.y - context.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const speed = 100 * deltaTime;
          context.position.x += (dx / distance) * speed;
          context.position.y += (dy / distance) * speed;
        }
      }
      context.energy -= 2 * deltaTime; // Consume more energy when intercepting
    },
  },
  {
    name: "return",
    onUpdate: (context, deltaTime) => {
      // Move back to mothership
      const dx = context.mothership.x - context.position.x;
      const dy = context.mothership.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        const speed = 80 * deltaTime;
        context.position.x += (dx / distance) * speed;
        context.position.y += (dy / distance) * speed;
      }

      context.isReturning = true;
    },
  },
  {
    name: "docked",
    onUpdate: (context, deltaTime) => {
      // Recharge energy and repair
      context.energy = Math.min(
        context.maxEnergy,
        context.energy + 50 * deltaTime,
      );
      context.health = Math.min(
        context.maxHealth,
        context.health + 10 * deltaTime,
      );
      context.isActive = false;
      context.isReturning = false;
    },
  },
];

export const DRONE_TRANSITIONS: SimpleTransition<DroneContext>[] = [
  {
    from: "deployed",
    to: "patrol",
    condition: (context) => context.mission === "patrol",
  },
  {
    from: "deployed",
    to: "intercept",
    condition: (context) => context.mission === "intercept" && !!context.target,
  },
  {
    from: "deployed",
    to: "return",
    condition: (context) =>
      context.energy < context.maxEnergy * 0.2 ||
      context.health < context.maxHealth * 0.3,
  },
  {
    from: "patrol",
    to: "intercept",
    condition: (context) => context.mission === "intercept" && !!context.target,
  },
  {
    from: "patrol",
    to: "return",
    condition: (context) => context.energy < context.maxEnergy * 0.2,
  },
  {
    from: "intercept",
    to: "patrol",
    condition: (context) => !context.target || context.mission === "patrol",
  },
  {
    from: "intercept",
    to: "return",
    condition: (context) =>
      context.energy < context.maxEnergy * 0.2 ||
      context.health < context.maxHealth * 0.3,
  },
  {
    from: "return",
    to: "docked",
    condition: (context) => {
      const dx = context.mothership.x - context.position.x;
      const dy = context.mothership.y - context.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < 10;
    },
  },
  {
    from: "docked",
    to: "deployed",
    condition: (context) =>
      context.energy >= context.maxEnergy * 0.9 &&
      context.health >= context.maxHealth * 0.9,
  },
];

// Weapon System States
export const WEAPON_STATES: SimpleState<WeaponContext>[] = [
  {
    name: "ready",
    onUpdate: (context, _deltaTime) => {
      context.isReady = true;
    },
  },
  {
    name: "firing",
    onUpdate: (context, _deltaTime) => {
      context.isFiring = true;
      context.cooldown = context.maxCooldown;
      context.ammo -= 1;
      context.energy -= 20;
    },
  },
  {
    name: "cooldown",
    onUpdate: (context, deltaTime) => {
      context.cooldown = Math.max(0, context.cooldown - deltaTime * 1000);
      context.isFiring = false;
    },
  },
  {
    name: "reloading",
    onUpdate: (context, deltaTime) => {
      context.ammo = Math.min(context.maxAmmo, context.ammo + 10 * deltaTime);
      context.isReloading = true;
    },
  },
  {
    name: "overheated",
    onUpdate: (context, deltaTime) => {
      context.energy = Math.min(
        context.maxEnergy,
        context.energy + 5 * deltaTime,
      );
      context.isOverheated = true;
    },
  },
];

export const WEAPON_TRANSITIONS: SimpleTransition<WeaponContext>[] = [
  {
    from: "ready",
    to: "firing",
    condition: (context) =>
      !!context.target && context.ammo > 0 && context.energy > 20,
  },
  {
    from: "ready",
    to: "reloading",
    condition: (context) => context.ammo <= 0,
  },
  {
    from: "ready",
    to: "overheated",
    condition: (context) => context.energy < 10,
  },
  {
    from: "firing",
    to: "cooldown",
    condition: () => true, // Always transition to cooldown after firing
  },
  {
    from: "cooldown",
    to: "ready",
    condition: (context) =>
      context.cooldown <= 0 && context.ammo > 0 && context.energy > 10,
  },
  {
    from: "cooldown",
    to: "reloading",
    condition: (context) => context.ammo <= 0,
  },
  {
    from: "cooldown",
    to: "overheated",
    condition: (context) => context.energy < 10,
  },
  {
    from: "reloading",
    to: "ready",
    condition: (context) =>
      context.ammo >= context.maxAmmo && context.energy > 10,
    onTransition: (context) => {
      context.isReloading = false;
    },
  },
  {
    from: "reloading",
    to: "overheated",
    condition: (context) => context.energy < 10,
  },
  {
    from: "overheated",
    to: "ready",
    condition: (context) => context.energy >= context.maxEnergy * 0.8,
    onTransition: (context) => {
      context.isOverheated = false;
    },
  },
];

// State Machine Factory
export const createGameStateMachines = (): {
  engine: SimpleStateMachineEngine;
  createThreatMachine: (
    id: string,
    context: ThreatContext,
  ) => SimpleStateMachine<ThreatContext>;
  createDroneMachine: (
    id: string,
    context: DroneContext,
  ) => SimpleStateMachine<DroneContext>;
  createWeaponMachine: (
    id: string,
    context: WeaponContext,
  ) => SimpleStateMachine<WeaponContext>;
} => {
  const engine = new SimpleStateMachineEngine();

  return {
    engine,
    createThreatMachine: (id: string, context: ThreatContext) =>
      engine.createStateMachine<ThreatContext>(
        id,
        "patrol",
        THREAT_STATES,
        THREAT_TRANSITIONS,
        context,
      ),
    createDroneMachine: (id: string, context: DroneContext) =>
      engine.createStateMachine<DroneContext>(
        id,
        "deployed",
        DRONE_STATES,
        DRONE_TRANSITIONS,
        context,
      ),
    createWeaponMachine: (id: string, context: WeaponContext) =>
      engine.createStateMachine<WeaponContext>(
        id,
        "ready",
        WEAPON_STATES,
        WEAPON_TRANSITIONS,
        context,
      ),
  };
};
