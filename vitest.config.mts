import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // fileURLToPath, not URL.pathname — on Windows the latter yields
      // "/C:/..." and the alias silently fails to resolve.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
