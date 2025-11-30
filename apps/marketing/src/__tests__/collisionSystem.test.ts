/**
 * Tests for Collision System
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  circleCircleCollision,
  circleRectangleCollision,
  rectangleRectangleCollision,
  CollisionSystem,
  createPhysicsObject,
  calculateImpactDamage,
} from "../components/utils/collisionSystem";
import { createMockPhysicsObject } from "./__mocks__/gameMocks";

describe("circleCircleCollision", () => {
  it("should detect collision when circles overlap", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 15, y: 0, radius: 10 };

    const result = circleCircleCollision(circle1, circle2);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBe(5);
    expect(result.impactForce).toBeGreaterThan(0);
    expect(result.collisionPoint).toBeDefined();
    expect(result.collisionNormal).toBeDefined();
  });

  it("should not detect collision when circles are apart", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 25, y: 0, radius: 10 };

    const result = circleCircleCollision(circle1, circle2);

    expect(result.hasCollision).toBe(false);
  });

  it("should detect collision when circles just touch", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 19, y: 0, radius: 10 };

    const result = circleCircleCollision(circle1, circle2);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBe(1);
  });

  it("should handle circles at same position (zero distance)", () => {
    const circle1 = { x: 50, y: 50, radius: 10 };
    const circle2 = { x: 50, y: 50, radius: 10 };

    const result = circleCircleCollision(circle1, circle2);

    expect(result.hasCollision).toBe(true);
    expect(result.collisionNormal).toEqual({ x: 1, y: 0 });
    expect(Number.isNaN(result.collisionNormal!.x)).toBe(false);
    expect(Number.isNaN(result.collisionNormal!.y)).toBe(false);
  });

  it("should calculate correct collision normal", () => {
    const circle1 = { x: 0, y: 0, radius: 10 };
    const circle2 = { x: 10, y: 10, radius: 10 };

    const result = circleCircleCollision(circle1, circle2);

    expect(result.hasCollision).toBe(true);
    // Normal should point from circle1 to circle2
    expect(result.collisionNormal!.x).toBeGreaterThan(0);
    expect(result.collisionNormal!.y).toBeGreaterThan(0);
  });
});

describe("circleRectangleCollision", () => {
  it("should detect collision when circle overlaps rectangle", () => {
    const circle = { x: 15, y: 15, radius: 10 };
    const rectangle = { x: 0, y: 0, width: 20, height: 20 };

    const result = circleRectangleCollision(circle, rectangle);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBeGreaterThan(0);
  });

  it("should not detect collision when circle is outside rectangle", () => {
    const circle = { x: 50, y: 50, radius: 10 };
    const rectangle = { x: 0, y: 0, width: 20, height: 20 };

    const result = circleRectangleCollision(circle, rectangle);

    expect(result.hasCollision).toBe(false);
  });

  it("should detect collision when circle touches rectangle edge", () => {
    const circle = { x: 25, y: 10, radius: 10 };
    const rectangle = { x: 0, y: 0, width: 20, height: 20 };

    const result = circleRectangleCollision(circle, rectangle);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBe(5);
  });

  it("should detect collision when circle is inside rectangle", () => {
    const circle = { x: 10, y: 10, radius: 5 };
    const rectangle = { x: 0, y: 0, width: 20, height: 20 };

    const result = circleRectangleCollision(circle, rectangle);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBe(5);
  });

  it("should handle circle exactly on rectangle corner", () => {
    const circle = { x: 0, y: 0, radius: 10 };
    const rectangle = { x: 0, y: 0, width: 20, height: 20 };

    const result = circleRectangleCollision(circle, rectangle);

    expect(result.hasCollision).toBe(true);
    expect(Number.isNaN(result.collisionNormal!.x)).toBe(false);
  });
});

describe("rectangleRectangleCollision", () => {
  it("should detect collision when rectangles overlap", () => {
    const rect1 = { x: 0, y: 0, width: 20, height: 20 };
    const rect2 = { x: 10, y: 10, width: 20, height: 20 };

    const result = rectangleRectangleCollision(rect1, rect2);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBe(10);
  });

  it("should not detect collision when rectangles are apart", () => {
    const rect1 = { x: 0, y: 0, width: 20, height: 20 };
    const rect2 = { x: 30, y: 30, width: 20, height: 20 };

    const result = rectangleRectangleCollision(rect1, rect2);

    expect(result.hasCollision).toBe(false);
  });

  it("should detect collision when rectangles share edge", () => {
    const rect1 = { x: 0, y: 0, width: 20, height: 20 };
    const rect2 = { x: 19, y: 0, width: 20, height: 20 };

    const result = rectangleRectangleCollision(rect1, rect2);

    expect(result.hasCollision).toBe(true);
    expect(result.penetrationDepth).toBe(1);
  });

  it("should calculate correct collision point at center of overlap", () => {
    const rect1 = { x: 0, y: 0, width: 20, height: 20 };
    const rect2 = { x: 10, y: 10, width: 20, height: 20 };

    const result = rectangleRectangleCollision(rect1, rect2);

    expect(result.collisionPoint).toEqual({ x: 15, y: 15 });
  });
});

describe("CollisionSystem", () => {
  let system: CollisionSystem;

  beforeEach(() => {
    system = new CollisionSystem();
  });

  it("should add and remove objects", () => {
    const obj = createMockPhysicsObject({ id: "test-obj" });
    system.addObject(obj);

    expect(system.getObjects()).toHaveLength(1);

    system.removeObject("test-obj");
    expect(system.getObjects()).toHaveLength(0);
  });

  it("should update object positions", () => {
    const obj = createMockPhysicsObject({ id: "test-obj", x: 0, y: 0 });
    system.addObject(obj);

    system.updateObject("test-obj", 100, 200, { x: 5, y: 10 });

    const objects = system.getObjects();
    expect(objects[0].x).toBe(100);
    expect(objects[0].y).toBe(200);
    expect(objects[0].velocity).toEqual({ x: 5, y: 10 });
  });

  it("should detect collisions between objects", () => {
    const obj1 = createMockPhysicsObject({
      id: "obj1",
      x: 0,
      y: 0,
      type: "circle",
      radius: 10,
    });
    const obj2 = createMockPhysicsObject({
      id: "obj2",
      x: 15,
      y: 0,
      type: "circle",
      radius: 10,
    });

    system.addObject(obj1);
    system.addObject(obj2);

    const collisions = system.checkCollisions();

    expect(collisions).toHaveLength(1);
    expect(collisions[0].result.hasCollision).toBe(true);
  });

  it("should not detect collision for non-overlapping objects", () => {
    const obj1 = createMockPhysicsObject({
      id: "obj1",
      x: 0,
      y: 0,
      type: "circle",
      radius: 10,
    });
    const obj2 = createMockPhysicsObject({
      id: "obj2",
      x: 100,
      y: 100,
      type: "circle",
      radius: 10,
    });

    system.addObject(obj1);
    system.addObject(obj2);

    const collisions = system.checkCollisions();

    expect(collisions).toHaveLength(0);
  });

  it("should handle mixed shape collisions", () => {
    const circle = createMockPhysicsObject({
      id: "circle",
      x: 15,
      y: 15,
      type: "circle",
      radius: 10,
    });
    const rect = createMockPhysicsObject({
      id: "rect",
      x: 0,
      y: 0,
      type: "rectangle",
      width: 20,
      height: 20,
    });

    system.addObject(circle);
    system.addObject(rect);

    const collisions = system.checkCollisions();

    expect(collisions).toHaveLength(1);
  });

  it("should create debris particles", () => {
    system.createDebris(100, 100, 50, 5);

    const debris = system.getDebris();
    expect(debris).toHaveLength(5);
    expect(debris[0].x).toBe(100);
    expect(debris[0].y).toBe(100);
    expect(debris[0].life).toBe(1.0);
  });

  it("should update debris particles", () => {
    system.createDebris(100, 100, 50, 3);

    system.updateDebris(0.1);

    const debris = system.getDebris();
    expect(debris.every((d) => d.life < 1.0)).toBe(true);
  });

  it("should remove expired debris", () => {
    system.createDebris(100, 100, 50, 3);

    // Update multiple times to exhaust debris life
    for (let i = 0; i < 100; i++) {
      system.updateDebris(0.1);
    }

    const debris = system.getDebris();
    expect(debris.length).toBe(0);
  });

  it("should clear all objects and debris", () => {
    system.addObject(createMockPhysicsObject({ id: "obj1" }));
    system.createDebris(100, 100, 50, 5);

    system.clear();

    expect(system.getObjects()).toHaveLength(0);
    expect(system.getDebris()).toHaveLength(0);
  });
});

describe("createPhysicsObject", () => {
  it("should create a circle physics object with defaults", () => {
    const obj = createPhysicsObject("test", 100, 200, "circle");

    expect(obj.id).toBe("test");
    expect(obj.x).toBe(100);
    expect(obj.y).toBe(200);
    expect(obj.type).toBe("circle");
    expect(obj.radius).toBe(10);
    expect(obj.velocity).toEqual({ x: 0, y: 0 });
    expect(obj.mass).toBe(1);
  });

  it("should create a rectangle physics object with defaults", () => {
    const obj = createPhysicsObject("test", 100, 200, "rectangle");

    expect(obj.type).toBe("rectangle");
    expect(obj.width).toBe(20);
    expect(obj.height).toBe(20);
  });

  it("should allow custom options", () => {
    const obj = createPhysicsObject("test", 100, 200, "circle", {
      radius: 25,
      mass: 5,
      velocity: { x: 10, y: 20 },
    });

    expect(obj.radius).toBe(25);
    expect(obj.mass).toBe(5);
    expect(obj.velocity).toEqual({ x: 10, y: 20 });
  });
});

describe("calculateImpactDamage", () => {
  it("should return 0 for no collision", () => {
    const obj1 = createMockPhysicsObject();
    const obj2 = createMockPhysicsObject();

    const damage = calculateImpactDamage(obj1, obj2, { hasCollision: false });

    expect(damage).toBe(0);
  });

  it("should calculate damage based on impact force", () => {
    const obj1 = createMockPhysicsObject({ velocity: { x: 10, y: 0 } });
    const obj2 = createMockPhysicsObject({ velocity: { x: -10, y: 0 } });

    const damage = calculateImpactDamage(obj1, obj2, {
      hasCollision: true,
      impactForce: 50,
    });

    expect(damage).toBeGreaterThan(0);
  });

  it("should factor in relative velocity", () => {
    const obj1 = createMockPhysicsObject({ velocity: { x: 20, y: 0 } });
    const obj2 = createMockPhysicsObject({ velocity: { x: -20, y: 0 } });

    const highVelocityDamage = calculateImpactDamage(obj1, obj2, {
      hasCollision: true,
      impactForce: 50,
    });

    const obj3 = createMockPhysicsObject({ velocity: { x: 1, y: 0 } });
    const obj4 = createMockPhysicsObject({ velocity: { x: -1, y: 0 } });

    const lowVelocityDamage = calculateImpactDamage(obj3, obj4, {
      hasCollision: true,
      impactForce: 50,
    });

    expect(highVelocityDamage).toBeGreaterThan(lowVelocityDamage);
  });

  it("should factor in mass", () => {
    const obj1 = createMockPhysicsObject({ mass: 10 });
    const obj2 = createMockPhysicsObject({ mass: 10 });

    const highMassDamage = calculateImpactDamage(obj1, obj2, {
      hasCollision: true,
      impactForce: 50,
    });

    const obj3 = createMockPhysicsObject({ mass: 1 });
    const obj4 = createMockPhysicsObject({ mass: 1 });

    const lowMassDamage = calculateImpactDamage(obj3, obj4, {
      hasCollision: true,
      impactForce: 50,
    });

    expect(highMassDamage).toBeGreaterThan(lowMassDamage);
  });
});
