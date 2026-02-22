import { EventSystem, createGameEventSystem } from "../components/utils/eventSystem";

describe("EventSystem", () => {
  let eventSystem: EventSystem;

  beforeEach(() => {
    eventSystem = new EventSystem();
  });

  describe("subscribe and emit", () => {
    it("should deliver events to subscribers", () => {
      const received: unknown[] = [];
      eventSystem.subscribe("test", (event) => {
        received.push(event.data);
      });

      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "unit-test",
        data: { value: 42 },
        priority: 0,
      });
      eventSystem.processEvents();

      expect(received).toHaveLength(1);
      expect(received[0]).toEqual({ value: 42 });
    });

    it("should return a handler ID on subscribe", () => {
      const id = eventSystem.subscribe("test", () => {});
      expect(typeof id).toBe("string");
    });

    it("should use custom handler ID when provided", () => {
      const id = eventSystem.subscribe("test", () => {}, {
        id: "my-handler",
      });
      expect(id).toBe("my-handler");
    });

    it("should not deliver events of different type", () => {
      const received: unknown[] = [];
      eventSystem.subscribe("type-a", (event) => {
        received.push(event.data);
      });

      eventSystem.emit({
        id: "1",
        type: "type-b",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();

      expect(received).toHaveLength(0);
    });
  });

  describe("unsubscribe", () => {
    it("should stop delivering events after unsubscribe", () => {
      const received: unknown[] = [];
      const handlerId = eventSystem.subscribe("test", () => {
        received.push(true);
      });

      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();
      expect(received).toHaveLength(1);

      eventSystem.unsubscribe("test", handlerId);

      eventSystem.emit({
        id: "2",
        type: "test",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();
      expect(received).toHaveLength(1); // No new event
    });

    it("should return false for non-existent handler", () => {
      expect(eventSystem.unsubscribe("test", "non-existent")).toBe(false);
    });

    it("should return false for non-existent event type", () => {
      expect(eventSystem.unsubscribe("no-such-type", "handler")).toBe(false);
    });
  });

  describe("priority ordering", () => {
    it("should deliver to higher priority handlers first", () => {
      const order: number[] = [];

      eventSystem.subscribe("test", () => order.push(1), { priority: 1 });
      eventSystem.subscribe("test", () => order.push(10), { priority: 10 });
      eventSystem.subscribe("test", () => order.push(5), { priority: 5 });

      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();

      expect(order).toEqual([10, 5, 1]);
    });
  });

  describe("once handlers", () => {
    it("should only fire once when once option is set", () => {
      let count = 0;
      eventSystem.subscribe("test", () => count++, { once: true });

      for (let i = 0; i < 3; i++) {
        eventSystem.emit({
          id: `${i}`,
          type: "test",
          timestamp: Date.now(),
          source: "test",
          data: {},
          priority: 0,
        });
        eventSystem.processEvents();
      }

      expect(count).toBe(1);
    });
  });

  describe("event history", () => {
    it("should record events in history", () => {
      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();

      const history = eventSystem.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].type).toBe("test");
    });

    it("should clear history", () => {
      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();
      eventSystem.clearHistory();
      expect(eventSystem.getHistory()).toHaveLength(0);
    });

    it("should respect max history size", () => {
      eventSystem.setMaxHistorySize(5);

      for (let i = 0; i < 10; i++) {
        eventSystem.emit({
          id: `${i}`,
          type: "test",
          timestamp: Date.now(),
          source: "test",
          data: {},
          priority: 0,
        });
      }
      eventSystem.processEvents();

      expect(eventSystem.getHistory().length).toBeLessThanOrEqual(5);
    });
  });

  describe("event filtering", () => {
    it("should filter events by type", () => {
      eventSystem.emit({
        id: "1",
        type: "alpha",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.emit({
        id: "2",
        type: "beta",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();

      const filtered = eventSystem.getEvents({ types: ["alpha"] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe("alpha");
    });

    it("should filter events by source", () => {
      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "source-a",
        data: {},
        priority: 0,
      });
      eventSystem.emit({
        id: "2",
        type: "test",
        timestamp: Date.now(),
        source: "source-b",
        data: {},
        priority: 0,
      });
      eventSystem.processEvents();

      const filtered = eventSystem.getEvents({ sources: ["source-a"] });
      expect(filtered).toHaveLength(1);
    });
  });

  describe("queue management", () => {
    it("should report queue size", () => {
      eventSystem.emit({
        id: "1",
        type: "test",
        timestamp: Date.now(),
        source: "test",
        data: {},
        priority: 0,
      });
      expect(eventSystem.getQueueSize()).toBe(1);

      eventSystem.processEvents();
      expect(eventSystem.getQueueSize()).toBe(0);
    });
  });
});

describe("createGameEventSystem", () => {
  it("should create an event system and factory", () => {
    const { eventSystem, eventFactory } = createGameEventSystem();
    expect(eventSystem).toBeInstanceOf(EventSystem);
    expect(eventFactory).toBeDefined();
  });

  it("should emit game events through factory", () => {
    const { eventSystem, eventFactory } = createGameEventSystem();
    const received: unknown[] = [];

    eventSystem.subscribe("game:started", (event) => {
      received.push(event.data);
    });

    eventFactory.emitGameStarted();
    eventSystem.processEvents();

    expect(received).toHaveLength(1);
  });
});
