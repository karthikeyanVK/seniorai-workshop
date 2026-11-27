import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside the Next server bundle; stub for unit tests.
      "server-only": path.resolve(__dirname, "src/test/server-only-stub.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
