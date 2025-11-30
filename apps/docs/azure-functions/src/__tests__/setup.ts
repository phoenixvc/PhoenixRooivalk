/**
 * Jest test setup
 */

// Test-only environment variables
// Note: These only apply to the test environment and are NOT used in production
// The test environment is completely isolated from production
process.env.NODE_ENV = "test";

// Disable auth validation in tests to allow testing without real tokens
// This is safe because tests run in an isolated environment
process.env.SKIP_TOKEN_VALIDATION = "true";

// Mock crypto.randomUUID if not available in test environment
if (typeof crypto === "undefined" || !crypto.randomUUID) {
  (global as any).crypto = {
    randomUUID: () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}

// Global test timeout
jest.setTimeout(10000);

// Cleanup after all tests
afterAll(() => {
  // Reset environment
  delete process.env.SKIP_TOKEN_VALIDATION;
});
