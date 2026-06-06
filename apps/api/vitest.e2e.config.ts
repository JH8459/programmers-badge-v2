import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@programmers-badge/badge-core": fileURLToPath(
        new URL("../../packages/badge-core/src/index.ts", import.meta.url)
      ),
      "@programmers-badge/shared-types": fileURLToPath(
        new URL("../../packages/shared-types/src/index.ts", import.meta.url)
      ),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.e2e-spec.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
