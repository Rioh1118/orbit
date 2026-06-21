/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  // Unit tests cover pure domain logic (task state graph, URL filters, validation,
  // then-vs-now aggregation/narrative). Pure modules → fast "node" env, no jsdom.
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary"],
      include: ["src/features/tasks/*.ts", "src/lib/thenVsNow.ts"],
      exclude: ["src/features/tasks/hooks.ts", "src/features/tasks/types.ts"],
    },
  },
});
