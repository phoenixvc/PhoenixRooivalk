import {
  ObjectPool,
  Poolable,
  PoolManager,
  createThreatPool,
  createDronePool,
  createProjectilePool,
  createParticlePool,
} from "../components/utils/objectPool";

interface TestObject extends Poolable {
  value: number;
}

const createTestPool = (initial = 3, max = 10) =>
  new ObjectPool<TestObject>({
    initialSize: initial,
    maxSize: max,
    createFn: () => ({
      id: "",
      isActive: false,
      lastUsed: 0,
      value: 0,
    }),
    resetFn: (obj) => {
      obj.value = 0;
    },
  });

describe("ObjectPool", () => {
  describe("initialization", () => {
    it("should pre-allocate initialSize objects", () => {
      const pool = createTestPool(5, 10);
      const stats = pool.getStats();
      expect(stats.totalObjects).toBe(5);
      expect(stats.activeObjects).toBe(0);
      expect(stats.inactiveObjects).toBe(5);
    });

    it("should have 0% utilization initially", () => {
      const pool = createTestPool(5, 10);
      expect(pool.getStats().utilizationRate).toBe(0);
    });
  });

  describe("acquire", () => {
    it("should return an active object", () => {
      const pool = createTestPool();
      const obj = pool.acquire();
      expect(obj).not.toBeNull();
      expect(obj!.isActive).toBe(true);
    });

    it("should assign a unique ID", () => {
      const pool = createTestPool();
      const a = pool.acquire()!;
      const b = pool.acquire()!;
      expect(a.id).not.toBe(b.id);
    });

    it("should set lastUsed timestamp", () => {
      const pool = createTestPool();
      const before = Date.now();
      const obj = pool.acquire()!;
      expect(obj.lastUsed).toBeGreaterThanOrEqual(before);
    });

    it("should grow the pool up to maxSize", () => {
      const pool = createTestPool(1, 3);
      const a = pool.acquire();
      const b = pool.acquire();
      const c = pool.acquire();
      expect(a).not.toBeNull();
      expect(b).not.toBeNull();
      expect(c).not.toBeNull();
      expect(pool.getStats().totalObjects).toBe(3);
    });

    it("should return null when pool is exhausted", () => {
      const pool = createTestPool(2, 2);
      pool.acquire();
      pool.acquire();
      expect(pool.acquire()).toBeNull();
    });

    it("should update utilization rate", () => {
      const pool = createTestPool(4, 4);
      pool.acquire();
      pool.acquire();
      expect(pool.getStats().utilizationRate).toBe(0.5);
    });
  });

  describe("release", () => {
    it("should mark object as inactive", () => {
      const pool = createTestPool();
      const obj = pool.acquire()!;
      pool.release(obj);
      expect(obj.isActive).toBe(false);
    });

    it("should call resetFn on the object", () => {
      const pool = createTestPool();
      const obj = pool.acquire()!;
      obj.value = 42;
      pool.release(obj);
      expect(obj.value).toBe(0); // reset
    });

    it("should make the slot available for reuse", () => {
      const pool = createTestPool(1, 1);
      const obj = pool.acquire()!;
      expect(pool.acquire()).toBeNull();

      pool.release(obj);
      const reused = pool.acquire();
      expect(reused).not.toBeNull();
    });

    it("should ignore objects not from this pool", () => {
      const pool = createTestPool();
      const foreign: TestObject = {
        id: "foreign-id",
        isActive: true,
        lastUsed: 0,
        value: 99,
      };
      pool.release(foreign);
      // Should not throw or affect pool stats
      expect(pool.getStats().activeObjects).toBe(0);
    });
  });

  describe("releaseById", () => {
    it("should release an object by its ID", () => {
      const pool = createTestPool();
      const obj = pool.acquire()!;
      pool.releaseById(obj.id);
      expect(obj.isActive).toBe(false);
      expect(pool.getStats().activeObjects).toBe(0);
    });

    it("should be a no-op for unknown ID", () => {
      const pool = createTestPool();
      pool.acquire();
      pool.releaseById("unknown");
      expect(pool.getStats().activeObjects).toBe(1);
    });
  });

  describe("getById", () => {
    it("should find an active object by ID", () => {
      const pool = createTestPool();
      const obj = pool.acquire()!;
      obj.value = 77;
      const found = pool.getById(obj.id);
      expect(found).not.toBeNull();
      expect(found!.value).toBe(77);
    });

    it("should not find released objects", () => {
      const pool = createTestPool();
      const obj = pool.acquire()!;
      const id = obj.id;
      pool.release(obj);
      expect(pool.getById(id)).toBeNull();
    });

    it("should return null for unknown ID", () => {
      const pool = createTestPool();
      expect(pool.getById("nope")).toBeNull();
    });
  });

  describe("getActive", () => {
    it("should return only active objects", () => {
      const pool = createTestPool(5, 5);
      pool.acquire();
      pool.acquire();
      const third = pool.acquire()!;
      pool.release(third);

      const active = pool.getActive();
      expect(active).toHaveLength(2);
      expect(active.every((o) => o.isActive)).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("should remove old inactive objects", () => {
      const pool = createTestPool(5, 10);
      // All 5 objects are inactive with lastUsed=0
      // cleanup with maxAge=0 should remove them all
      pool.cleanup(0);
      expect(pool.getStats().totalObjects).toBe(0);
    });

    it("should not remove active objects", () => {
      const pool = createTestPool(3, 10);
      pool.acquire();
      pool.cleanup(0);
      // Active object should remain
      expect(pool.getStats().activeObjects).toBe(1);
    });
  });

  describe("validateActive", () => {
    it("should release objects that fail validation", () => {
      const pool = new ObjectPool<TestObject>({
        initialSize: 3,
        maxSize: 10,
        createFn: () => ({ id: "", isActive: false, lastUsed: 0, value: 0 }),
        resetFn: (obj) => { obj.value = 0; },
        validateFn: (obj) => obj.value > 0,
      });

      const a = pool.acquire()!;
      const b = pool.acquire()!;
      a.value = 10; // valid
      b.value = 0;  // invalid

      pool.validateActive();
      expect(pool.getStats().activeObjects).toBe(1);
      expect(a.isActive).toBe(true);
      expect(b.isActive).toBe(false);
    });

    it("should be a no-op when no validateFn is configured", () => {
      const pool = createTestPool();
      const obj = pool.acquire()!;
      obj.value = -1;
      pool.validateActive(); // no validateFn, should not release
      expect(obj.isActive).toBe(true);
    });
  });

  describe("getStats", () => {
    it("should return correct utilization for empty pool", () => {
      const pool = new ObjectPool<TestObject>({
        initialSize: 0,
        maxSize: 5,
        createFn: () => ({ id: "", isActive: false, lastUsed: 0, value: 0 }),
        resetFn: () => {},
      });
      pool.cleanup(0); // remove any pre-allocated
      expect(pool.getStats().utilizationRate).toBe(0);
    });
  });
});

describe("Game pool factories", () => {
  it("createThreatPool should create a pool with default size", () => {
    const pool = createThreatPool(5);
    expect(pool.getStats().totalObjects).toBe(5);
    const threat = pool.acquire()!;
    expect(threat.type).toBe("threat");
    expect(threat.health).toBe(100);
  });

  it("createDronePool should create a pool with drone objects", () => {
    const pool = createDronePool(3);
    const drone = pool.acquire()!;
    expect(drone.type).toBe("drone");
    expect(drone.energy).toBe(100);
  });

  it("createProjectilePool should create a pool with projectile objects", () => {
    const pool = createProjectilePool(3);
    const proj = pool.acquire()!;
    expect(proj.type).toBe("projectile");
    expect(proj.damage).toBe(50);
  });

  it("createParticlePool should create a pool with particle objects", () => {
    const pool = createParticlePool(3);
    const p = pool.acquire()!;
    expect(p.type).toBe("particle");
    expect(p.life).toBe(1.0);
  });

  it("threat pool validate rejects dead or negative-position threats", () => {
    const pool = createThreatPool(1);
    const t = pool.acquire()!;
    t.health = 0;
    pool.validateActive();
    expect(t.isActive).toBe(false);
  });

  it("drone pool validate rejects drones with zero energy", () => {
    const pool = createDronePool(1);
    const d = pool.acquire()!;
    d.energy = 0;
    pool.validateActive();
    expect(d.isActive).toBe(false);
  });

  it("projectile pool validate rejects zero-damage projectiles", () => {
    const pool = createProjectilePool(1);
    const p = pool.acquire()!;
    p.damage = 0;
    pool.validateActive();
    expect(p.isActive).toBe(false);
  });

  it("particle pool validate rejects dead particles", () => {
    const pool = createParticlePool(1);
    const p = pool.acquire()!;
    p.life = 0;
    pool.validateActive();
    expect(p.isActive).toBe(false);
  });
});

describe("PoolManager", () => {
  let manager: PoolManager;

  beforeEach(() => {
    manager = new PoolManager();
  });

  it("should initialize with 4 pools", () => {
    const stats = manager.getAllStats();
    expect(Object.keys(stats)).toEqual(
      expect.arrayContaining(["threats", "drones", "projectiles", "particles"]),
    );
  });

  it("should get a pool by name", () => {
    const pool = manager.getPool("threats");
    expect(pool).not.toBeNull();
  });

  it("should return null for unknown pool name", () => {
    expect(manager.getPool("invalid")).toBeNull();
  });

  it("should cleanup all pools", () => {
    manager.cleanupAll(0);
    const stats = manager.getAllStats();
    // After cleanup with maxAge=0, all inactive pre-allocated objects are removed
    Object.values(stats).forEach((s) => {
      expect(s.activeObjects).toBe(0);
    });
  });

  it("should validate all pools", () => {
    // Acquire and invalidate
    const threatPool = manager.getPool("threats")!;
    const t = threatPool.acquire();
    if (t) t.health = 0;

    manager.validateAll();
    expect(threatPool.getStats().activeObjects).toBe(0);
  });

  it("should estimate memory usage", () => {
    const mem = manager.getMemoryUsage();
    expect(mem.totalObjects).toBeGreaterThan(0);
    expect(mem.activeObjects).toBe(0);
    expect(mem.estimatedMemoryMB).toBeGreaterThan(0);
  });
});
