/**
 * Client-side Rate Limiter
 *
 * Provides rate limiting utilities to prevent excessive API calls
 * and improve performance.
 */

interface RateLimitState {
  lastCall: number;
  callCount: number;
  windowStart: number;
}

const limiters: Map<string, RateLimitState> = new Map();

/**
 * Rate limiter with configurable window and max calls.
 * Returns true if the action is allowed, false if rate limited.
 */
export function checkRateLimit(
  key: string,
  maxCalls: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const state = limiters.get(key);

  if (!state) {
    limiters.set(key, {
      lastCall: now,
      callCount: 1,
      windowStart: now,
    });
    return true;
  }

  // Reset window if expired
  if (now - state.windowStart >= windowMs) {
    state.windowStart = now;
    state.callCount = 1;
    state.lastCall = now;
    return true;
  }

  // Check if under limit
  if (state.callCount < maxCalls) {
    state.callCount++;
    state.lastCall = now;
    return true;
  }

  return false;
}

/**
 * Throttle function - ensures function is called at most once per interval.
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastCall = 0;

  return function (...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    if (now - lastCall >= intervalMs) {
      lastCall = now;
      return fn(...args) as ReturnType<T>;
    }
    return undefined;
  };
}

/**
 * Debounce function - delays execution until after a pause in calls.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  };
}

/**
 * Rate-limited function executor.
 * Queues calls and executes them within rate limits.
 */
export class RateLimitedExecutor<T> {
  private queue: Array<() => Promise<T>> = [];
  private processing = false;
  private lastExecution = 0;

  constructor(
    private readonly minIntervalMs: number,
    private readonly maxQueueSize: number = 100
  ) {}

  async execute(fn: () => Promise<T>): Promise<T | null> {
    // Enforce queue size limit
    if (this.queue.length >= this.maxQueueSize) {
      // Remove oldest item
      this.queue.shift();
    }

    return new Promise((resolve) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
          return result;
        } catch (error) {
          resolve(null);
          throw error;
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastExecution;
      const waitTime = Math.max(0, this.minIntervalMs - timeSinceLast);

      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      const fn = this.queue.shift();
      if (fn) {
        this.lastExecution = Date.now();
        try {
          await fn();
        } catch (error) {
          console.error("Rate-limited execution failed:", error);
        }
      }
    }

    this.processing = false;
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

/**
 * Pre-configured rate limiters for common operations
 */
export const rateLimiters = {
  // Progress updates: max 12 per minute (every 5 seconds)
  progress: new RateLimitedExecutor<boolean>(5000, 50),

  // Analytics: max 30 per minute
  analytics: new RateLimitedExecutor<boolean>(2000, 100),

  // Firebase writes: max 60 per minute
  firebaseWrite: new RateLimitedExecutor<boolean>(1000, 100),
};
