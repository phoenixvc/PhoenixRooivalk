/**
 * Retry Utility
 *
 * Provides exponential backoff retry logic for API calls.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (default: retry all errors) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback called before each retry */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  isRetryable: () => true,
  onRetry: () => {},
};

/**
 * Check if an error is a network error that should be retried
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("timeout") ||
      message.includes("connection") ||
      message.includes("econnrefused") ||
      message.includes("enotfound")
    );
  }
  return false;
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("resource-exhausted")
    );
  }
  // Check for HTTP 429 status
  if (typeof error === "object" && error !== null) {
    const err = error as { code?: string | number; status?: number };
    return err.code === 429 || err.status === 429 || err.code === "resource-exhausted";
  }
  return false;
}

/**
 * Default retryable error check - retries network errors but not rate limits
 */
export function defaultIsRetryable(error: unknown): boolean {
  // Don't retry rate limit errors - let user know they need to wait
  if (isRateLimitError(error)) {
    return false;
  }
  // Retry network errors
  if (isNetworkError(error)) {
    return true;
  }
  // Retry server errors (5xx)
  if (typeof error === "object" && error !== null) {
    const err = error as { code?: string | number; status?: number };
    const status = err.status ?? (typeof err.code === "number" ? err.code : 0);
    return status >= 500 && status < 600;
  }
  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic using exponential backoff
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * // Basic usage
 * const result = await withRetry(() => fetchData());
 *
 * @example
 * // With custom options
 * const result = await withRetry(
 *   () => fetchData(),
 *   {
 *     maxRetries: 5,
 *     onRetry: (attempt, error) => console.log(`Retry ${attempt}:`, error)
 *   }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we've exhausted retries
      if (attempt === opts.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!opts.isRetryable(error)) {
        break;
      }

      // Calculate delay with jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const actualDelay = Math.min(delay + jitter, opts.maxDelay);

      // Notify about retry
      opts.onRetry(attempt + 1, error, actualDelay);

      // Wait before retrying
      await sleep(actualDelay);

      // Increase delay for next attempt
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  throw lastError;
}

/**
 * Create a retryable version of an async function
 *
 * @param fn - The async function to wrap
 * @param options - Retry configuration options
 * @returns A new function that will retry on failure
 *
 * @example
 * const fetchWithRetry = createRetryable(fetchData, { maxRetries: 3 });
 * const result = await fetchWithRetry();
 */
export function createRetryable<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => withRetry(() => fn(...args), options);
}
