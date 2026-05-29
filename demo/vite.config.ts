import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

/// <reference types="vitest" />

function getBasePath(): string {
  const value = process.env.DEMO_BASE_PATH;
  if (!value || value === "/") {
    return "/";
  }

  return value.endsWith("/") ? value : `${value}/`;
}

export default defineConfig({
  base: getBasePath(),
  plugins: [react()],
  resolve: {
    alias: {
      "@sdk": path.resolve(__dirname, "../src/index.ts")
    }
  },
  optimizeDeps: {
    exclude: ["@monaco-editor/react"]
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, "..")]
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    exclude: ["**/node_modules/**", "**/*.e2e.test.*", "**/*.e2e.*"],
    alias: {
      "@sdk": path.resolve(__dirname, "../src/index.ts")
    }
  }
});
