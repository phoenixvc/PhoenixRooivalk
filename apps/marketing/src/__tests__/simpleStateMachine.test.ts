import {
  SimpleStateMachineEngine,
  SimpleState,
  SimpleTransition,
  createGameStateMachines,
} from "../components/utils/simpleStateMachine";

describe("SimpleStateMachineEngine", () => {
  let engine: SimpleStateMachineEngine;

  beforeEach(() => {
    engine = new SimpleStateMachineEngine();
  });

  interface TestContext {
    value: number;
    log: string[];
  }

  const makeStates = (): SimpleState<TestContext>[] => [
    {
      name: "idle",
      onEnter: (ctx) => ctx.log.push("enter:idle"),
      onUpdate: (ctx, dt) => ctx.log.push(`update:idle:${dt}`),
      onExit: (ctx) => ctx.log.push("exit:idle"),
    },
    {
      name: "active",
      onEnter: (ctx) => ctx.log.push("enter:active"),
      onUpdate: (ctx, dt) => {
        ctx.value += dt;
        ctx.log.push(`update:active:${dt}`);
      },
      onExit: (ctx) => ctx.log.push("exit:active"),
    },
    {
      name: "done",
      onEnter: (ctx) => ctx.log.push("enter:done"),
    },
  ];

  const makeTransitions = (): SimpleTransition<TestContext>[] => [
    {
      from: "idle",
      to: "active",
      condition: (ctx) => ctx.value > 0,
      onTransition: (ctx) => ctx.log.push("transition:idle->active"),
    },
    {
      from: "active",
      to: "done",
      condition: (ctx) => ctx.value >= 100,
    },
  ];

  describe("createStateMachine", () => {
    it("should create a machine with the given initial state", () => {
      const ctx: TestContext = { value: 0, log: [] };
      const machine = engine.createStateMachine(
        "test",
        "idle",
        makeStates(),
        makeTransitions(),
        ctx,
      );
      expect(machine.currentState).toBe("idle");
      expect(machine.isRunning).toBe(true);
      expect(machine.id).toBe("test");
    });

    it("should call onEnter for the initial state", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("test", "idle", makeStates(), makeTransitions(), ctx);
      expect(ctx.log).toContain("enter:idle");
    });

    it("should not call onEnter if initial state has no hook", () => {
      const states: SimpleState<TestContext>[] = [{ name: "plain" }];
      const ctx: TestContext = { value: 0, log: [] };
      const machine = engine.createStateMachine("test", "plain", states, [], ctx);
      expect(machine.currentState).toBe("plain");
      expect(ctx.log).toHaveLength(0);
    });
  });

  describe("update", () => {
    it("should call onUpdate for the current state", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("test", "idle", makeStates(), makeTransitions(), ctx);
      ctx.log = []; // Clear enter log

      engine.update(16);
      expect(ctx.log).toContain("update:idle:16");
    });

    it("should trigger transition when condition is met", () => {
      const ctx: TestContext = { value: 0, log: [] };
      const machine = engine.createStateMachine(
        "test",
        "idle",
        makeStates(),
        makeTransitions(),
        ctx,
      );
      ctx.log = [];

      // Set value > 0 to trigger transition
      ctx.value = 1;
      engine.update(16);

      expect(machine.currentState).toBe("active");
      expect(ctx.log).toContain("exit:idle");
      expect(ctx.log).toContain("transition:idle->active");
      expect(ctx.log).toContain("enter:active");
    });

    it("should not transition when condition is not met", () => {
      const ctx: TestContext = { value: 0, log: [] };
      const machine = engine.createStateMachine(
        "test",
        "idle",
        makeStates(),
        makeTransitions(),
        ctx,
      );

      engine.update(16);
      expect(machine.currentState).toBe("idle");
    });

    it("should skip paused machines", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("test", "idle", makeStates(), makeTransitions(), ctx);
      ctx.log = [];

      engine.setRunning("test", false);
      engine.update(16);
      expect(ctx.log).toHaveLength(0);
    });

    it("should only transition on the first matching transition", () => {
      const ctx: TestContext = { value: 5, log: [] };
      const transitions: SimpleTransition<TestContext>[] = [
        { from: "idle", to: "active", condition: (c) => c.value > 0 },
        { from: "idle", to: "done", condition: (c) => c.value > 0 },
      ];
      const machine = engine.createStateMachine(
        "test",
        "idle",
        makeStates(),
        transitions,
        ctx,
      );
      ctx.log = [];

      engine.update(16);
      expect(machine.currentState).toBe("active"); // first match wins
    });

    it("should chain transitions across multiple updates", () => {
      const ctx: TestContext = { value: 1, log: [] };
      const machine = engine.createStateMachine(
        "test",
        "idle",
        makeStates(),
        makeTransitions(),
        ctx,
      );

      // First update: idle -> active (value > 0)
      engine.update(16);
      expect(machine.currentState).toBe("active");

      // Active state adds dt to value
      ctx.value = 100;
      engine.update(16);
      expect(machine.currentState).toBe("done");
    });
  });

  describe("getStateMachine", () => {
    it("should return a machine by ID", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("test", "idle", makeStates(), makeTransitions(), ctx);

      const machine = engine.getStateMachine<TestContext>("test");
      expect(machine).not.toBeNull();
      expect(machine!.id).toBe("test");
    });

    it("should return null for unknown ID", () => {
      expect(engine.getStateMachine("nonexistent")).toBeNull();
    });
  });

  describe("setRunning", () => {
    it("should pause and resume a machine", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("test", "idle", makeStates(), makeTransitions(), ctx);

      engine.setRunning("test", false);
      const machine = engine.getStateMachine<TestContext>("test");
      expect(machine!.isRunning).toBe(false);

      engine.setRunning("test", true);
      expect(machine!.isRunning).toBe(true);
    });

    it("should not throw for unknown ID", () => {
      expect(() => engine.setRunning("nope", false)).not.toThrow();
    });
  });

  describe("removeStateMachine", () => {
    it("should remove a machine by ID", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("test", "idle", makeStates(), makeTransitions(), ctx);

      engine.removeStateMachine("test");
      expect(engine.getStateMachine("test")).toBeNull();
    });
  });

  describe("getAllStateMachines", () => {
    it("should return all machines", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("a", "idle", makeStates(), makeTransitions(), ctx);
      engine.createStateMachine("b", "idle", makeStates(), makeTransitions(), ctx);

      const all = engine.getAllStateMachines();
      expect(all.size).toBe(2);
      expect(all.has("a")).toBe(true);
      expect(all.has("b")).toBe(true);
    });

    it("should return a copy, not the internal map", () => {
      const ctx: TestContext = { value: 0, log: [] };
      engine.createStateMachine("a", "idle", makeStates(), makeTransitions(), ctx);

      const map = engine.getAllStateMachines();
      map.delete("a");
      expect(engine.getStateMachine("a")).not.toBeNull();
    });
  });

  describe("transition edge cases", () => {
    it("should not transition to an unknown state", () => {
      const ctx: TestContext = { value: 0, log: [] };
      const transitions: SimpleTransition<TestContext>[] = [
        { from: "idle", to: "nonexistent", condition: () => true },
      ];
      const machine = engine.createStateMachine(
        "test",
        "idle",
        makeStates(),
        transitions,
        ctx,
      );

      engine.update(16);
      expect(machine.currentState).toBe("idle"); // stays in idle
    });
  });
});

describe("createGameStateMachines", () => {
  it("should create an engine with factory functions", () => {
    const { engine, createThreatMachine, createDroneMachine, createWeaponMachine } =
      createGameStateMachines();
    expect(engine).toBeInstanceOf(SimpleStateMachineEngine);
    expect(typeof createThreatMachine).toBe("function");
    expect(typeof createDroneMachine).toBe("function");
    expect(typeof createWeaponMachine).toBe("function");
  });

  describe("threat machine", () => {
    it("should start in patrol state", () => {
      const { createThreatMachine } = createGameStateMachines();
      const machine = createThreatMachine("threat-1", {
        id: "threat-1",
        position: { x: 0, y: 0 },
        speed: 10,
        target: { x: 500, y: 500 },
        detectionRange: 200,
        health: 100,
        maxHealth: 100,
        isAttacking: false,
      });
      expect(machine.currentState).toBe("patrol");
    });

    it("should transition to approach when target is in detection range", () => {
      const { engine, createThreatMachine } = createGameStateMachines();
      const machine = createThreatMachine("threat-1", {
        id: "threat-1",
        position: { x: 0, y: 0 },
        speed: 10,
        target: { x: 50, y: 0 }, // within 200 detection range
        detectionRange: 200,
        health: 100,
        maxHealth: 100,
        isAttacking: false,
      });

      engine.update(0.016);
      expect(machine.currentState).toBe("approach");
    });

    it("should transition to evade when health is low", () => {
      const { engine, createThreatMachine } = createGameStateMachines();
      const machine = createThreatMachine("threat-1", {
        id: "threat-1",
        position: { x: 0, y: 0 },
        speed: 10,
        target: { x: 500, y: 500 },
        detectionRange: 200,
        health: 20, // 20% of 100 max = below 30% threshold
        maxHealth: 100,
        isAttacking: false,
      });

      engine.update(0.016);
      expect(machine.currentState).toBe("evade");
    });
  });

  describe("drone machine", () => {
    it("should start in deployed state", () => {
      const { createDroneMachine } = createGameStateMachines();
      const machine = createDroneMachine("drone-1", {
        id: "drone-1",
        position: { x: 0, y: 0 },
        mothership: { x: 100, y: 100 },
        energy: 100,
        maxEnergy: 100,
        health: 100,
        maxHealth: 100,
        mission: "patrol",
        isActive: false,
        isPatrolling: false,
        isReturning: false,
      });
      expect(machine.currentState).toBe("deployed");
    });

    it("should transition to patrol when mission is patrol", () => {
      const { engine, createDroneMachine } = createGameStateMachines();
      const machine = createDroneMachine("drone-1", {
        id: "drone-1",
        position: { x: 0, y: 0 },
        mothership: { x: 100, y: 100 },
        energy: 100,
        maxEnergy: 100,
        health: 100,
        maxHealth: 100,
        mission: "patrol",
        isActive: false,
        isPatrolling: false,
        isReturning: false,
      });

      engine.update(0.016);
      expect(machine.currentState).toBe("patrol");
    });

    it("should transition to return when energy is low during patrol", () => {
      const { engine, createDroneMachine } = createGameStateMachines();
      const machine = createDroneMachine("drone-1", {
        id: "drone-1",
        position: { x: 0, y: 0 },
        mothership: { x: 100, y: 100 },
        energy: 10, // 10% of 100 = below 20% threshold
        maxEnergy: 100,
        health: 100,
        maxHealth: 100,
        mission: "patrol",
        isActive: false,
        isPatrolling: false,
        isReturning: false,
      });

      // First: deployed -> patrol (mission is "patrol")
      engine.update(0.016);
      expect(machine.currentState).toBe("patrol");

      // Second: patrol -> return (energy < 20%)
      engine.update(0.016);
      expect(machine.currentState).toBe("return");
    });
  });

  describe("weapon machine", () => {
    it("should start in ready state", () => {
      const { createWeaponMachine } = createGameStateMachines();
      const machine = createWeaponMachine("weapon-1", {
        id: "weapon-1",
        isReady: false,
        isFiring: false,
        isReloading: false,
        isOverheated: false,
        cooldown: 0,
        maxCooldown: 500,
        ammo: 30,
        maxAmmo: 30,
        energy: 100,
        maxEnergy: 100,
        target: { x: 100, y: 100 },
      });
      expect(machine.currentState).toBe("ready");
    });

    it("should transition to firing when target, ammo, and energy are available", () => {
      const { engine, createWeaponMachine } = createGameStateMachines();
      const machine = createWeaponMachine("weapon-1", {
        id: "weapon-1",
        isReady: false,
        isFiring: false,
        isReloading: false,
        isOverheated: false,
        cooldown: 0,
        maxCooldown: 500,
        ammo: 30,
        maxAmmo: 30,
        energy: 100,
        maxEnergy: 100,
        target: { x: 100, y: 100 },
      });

      engine.update(0.016);
      expect(machine.currentState).toBe("firing");
    });

    it("should transition to reloading when out of ammo", () => {
      const { engine, createWeaponMachine } = createGameStateMachines();
      const machine = createWeaponMachine("weapon-1", {
        id: "weapon-1",
        isReady: false,
        isFiring: false,
        isReloading: false,
        isOverheated: false,
        cooldown: 0,
        maxCooldown: 500,
        ammo: 0,
        maxAmmo: 30,
        energy: 100,
        maxEnergy: 100,
      });

      engine.update(0.016);
      expect(machine.currentState).toBe("reloading");
    });

    it("should transition to overheated when energy is critically low", () => {
      const { engine, createWeaponMachine } = createGameStateMachines();
      const machine = createWeaponMachine("weapon-1", {
        id: "weapon-1",
        isReady: false,
        isFiring: false,
        isReloading: false,
        isOverheated: false,
        cooldown: 0,
        maxCooldown: 500,
        ammo: 30,
        maxAmmo: 30,
        energy: 5, // below 10 threshold
        maxEnergy: 100,
      });

      engine.update(0.016);
      expect(machine.currentState).toBe("overheated");
    });
  });
});
