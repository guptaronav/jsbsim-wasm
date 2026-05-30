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

export default defineConfig(({ mode }) => {
  const isTest = mode === "test";

  return {
    base: getBasePath(),
    plugins: [react()],
    resolve: {
      alias: {
        "@sdk": path.resolve(__dirname, "../src/index.ts")
      }
    },
    optimizeDeps: {
      // In test mode, disable Rolldown dep optimization to avoid the
      // vitest Vite 8 cold-cache hang: Rolldown's synchronous processing
      // of cssstyle's 6637-line generated properties.js blocked the
      // parent process event loop for >60 s, preventing IPC responses to
      // workers and triggering the worker startup timeout.
      ...(isTest
        ? { disabled: true }
        : { exclude: ["@monaco-editor/react"] })
    },
    server: {
      fs: {
        allow: [path.resolve(__dirname, "..")]
      }
    },
    test: {
      // happy-dom is used instead of jsdom to avoid the jsdom → cssstyle
      // → css-tree transformation chain that hangs Vite 8 on cold cache.
      environment: "happy-dom",
      globals: true,
      setupFiles: [],
      exclude: ["**/node_modules/**", "**/*.e2e.test.*", "**/*.e2e.*"],
      alias: {
        "@sdk": path.resolve(__dirname, "../src/index.ts")
      }
    }
  };
});
