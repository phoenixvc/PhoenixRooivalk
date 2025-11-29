import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/setup.ts",
        "src/__tests__/__mocks__/",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@phoenix-rooivalk/types": path.resolve(
        __dirname,
        "../../packages/types/src/index.ts",
      ),
      "@phoenix-rooivalk/utils": path.resolve(
        __dirname,
        "../../packages/utils/src/index.ts",
      ),
    },
  },
});
