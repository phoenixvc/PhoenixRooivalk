/**
 * Rate Limiter Tests
 */

import {
  checkRateLimit,
  throttle,
  debounce,
  RateLimitedExecutor,
} from "../rateLimiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should allow calls under the limit", () => {
    const key = "test-key-1";
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
    expect(checkRateLimit(key, 3, 1000)).toBe(true);
  });

  it("should block calls over the limit", () => {
    const key = "test-key-2";
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(false);
    expect(checkRateLimit(key, 2, 1000)).toBe(false);
  });

  it("should reset after the window expires", () => {
    const key = "test-key-3";
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(false);

    // Advance time past the window
    jest.advanceTimersByTime(1001);

    expect(checkRateLimit(key, 2, 1000)).toBe(true);
  });

  it("should track different keys independently", () => {
    expect(checkRateLimit("key-a", 1, 1000)).toBe(true);
    expect(checkRateLimit("key-b", 1, 1000)).toBe(true);
    expect(checkRateLimit("key-a", 1, 1000)).toBe(false);
    expect(checkRateLimit("key-b", 1, 1000)).toBe(false);
  });
});

describe("throttle", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should call the function immediately on first call", () => {
    const fn = jest.fn(() => "result");
    const throttled = throttle(fn, 100);

    const result = throttled();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe("result");
  });

  it("should skip calls within the throttle interval", () => {
    const fn = jest.fn(() => "result");
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should allow calls after the interval", () => {
    const fn = jest.fn(() => "result");
    const throttled = throttle(fn, 100);

    throttled();
    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(101);

    throttled();
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("should pass arguments to the function", () => {
    const fn = jest.fn((a: number, b: string) => `${a}-${b}`);
    const throttled = throttle(fn, 100);

    const result = throttled(42, "test");
    expect(fn).toHaveBeenCalledWith(42, "test");
    expect(result).toBe("42-test");
  });
});

describe("debounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should not call immediately", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    expect(fn).not.toHaveBeenCalled();
  });

  it("should call after the delay", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(101);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should reset the delay on subsequent calls", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    jest.advanceTimersByTime(50);

    debounced();
    jest.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(51);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should pass arguments from the last call", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced(1);
    debounced(2);
    debounced(3);

    jest.advanceTimersByTime(101);

    expect(fn).toHaveBeenCalledWith(3);
  });
});

describe("RateLimitedExecutor", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should execute immediately when under rate limit", async () => {
    const executor = new RateLimitedExecutor<string>(100);
    const fn = jest.fn().mockResolvedValue("result");

    const promise = executor.execute(fn);
    await jest.runAllTimersAsync();

    await expect(promise).resolves.toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should enforce minimum interval between executions", async () => {
    const executor = new RateLimitedExecutor<string>(100);
    const fn1 = jest.fn().mockResolvedValue("result1");
    const fn2 = jest.fn().mockResolvedValue("result2");

    const promise1 = executor.execute(fn1);
    const promise2 = executor.execute(fn2);

    // First should execute immediately
    await jest.advanceTimersByTimeAsync(0);
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).not.toHaveBeenCalled();

    // Second should wait for interval
    await jest.advanceTimersByTimeAsync(100);
    expect(fn2).toHaveBeenCalledTimes(1);

    await expect(promise1).resolves.toBe("result1");
    await expect(promise2).resolves.toBe("result2");
  });

  it("should report pending count correctly", async () => {
    const executor = new RateLimitedExecutor<string>(100);

    expect(executor.pendingCount).toBe(0);

    executor.execute(jest.fn().mockResolvedValue("a"));
    executor.execute(jest.fn().mockResolvedValue("b"));

    // After first execution, one should be pending
    await jest.advanceTimersByTimeAsync(0);
    expect(executor.pendingCount).toBe(1);

    await jest.runAllTimersAsync();
    expect(executor.pendingCount).toBe(0);
  });

  it("should enforce queue size limit", async () => {
    const executor = new RateLimitedExecutor<string>(100, 3);
    const fns = [
      jest.fn().mockResolvedValue("1"),
      jest.fn().mockResolvedValue("2"),
      jest.fn().mockResolvedValue("3"),
      jest.fn().mockResolvedValue("4"),
    ];

    fns.forEach((fn) => executor.execute(fn));

    // With max queue of 3, oldest should be dropped
    await jest.runAllTimersAsync();

    // First was executed before queue limit hit, so 3 total should be called
    expect(fns.filter((fn) => fn.mock.calls.length > 0).length).toBeLessThanOrEqual(3);
  });

  it("should clear the queue when requested", () => {
    const executor = new RateLimitedExecutor<string>(100);

    executor.execute(jest.fn().mockResolvedValue("a"));
    executor.execute(jest.fn().mockResolvedValue("b"));

    executor.clear();
    expect(executor.pendingCount).toBe(0);
  });
});
