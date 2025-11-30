/**
 * Logger Utilities
 */

/**
 * Generate a correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
}

/**
 * Sanitize log data to remove sensitive information
 */
export function sanitizeLogData(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const sensitiveKeys = [
    "password",
    "token",
    "apiKey",
    "secret",
    "authorization",
    "cookie",
    "creditCard",
    "ssn",
  ];

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Truncate long strings for logging
 */
export function truncateForLog(value: string, maxLength: number = 500): string {
  if (value.length <= maxLength) {
    return value;
  }
  return (
    value.substring(0, maxLength) +
    `... [truncated, ${value.length - maxLength} more chars]`
  );
}
