import path from "node:path";
import fs from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import type { Plugin } from "vite";

/// <reference types="vitest" />

/**
 * Vite plugin that serves WASM-related .mjs files directly from /public
 * without going through Vite's module transform pipeline.
 * Required because Emscripten-generated .mjs files use patterns
 * incompatible with Vite's ES module transformation.
 */
function serveWasmMjs(): Plugin {
  return {
    name: "serve-wasm-mjs",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Strip query string before matching — Vite appends ?t=... cache busters
        const urlPath = (req.url ?? "").split("?")[0];
        if (urlPath.includes("/wasm/") && urlPath.endsWith(".mjs")) {
          const filePath = path.resolve(
            __dirname,
            "public",
            urlPath.replace(/^\//, "")
          );
          if (fs.existsSync(filePath)) {
            res.setHeader("Content-Type", "application/javascript");
            res.setHeader("Cache-Control", "no-cache");
            const stream = fs.createReadStream(filePath);
            stream.on("error", () => next());
            stream.pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

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
    plugins: [react(), serveWasmMjs()],
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
