import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: resolve(__dirname, "../.."),
  plugins: [react()],
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
