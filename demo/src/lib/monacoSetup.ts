/**
 * Self-host Monaco instead of loading it from the jsDelivr CDN.
 *
 * `@monaco-editor/react` defaults to fetching the Monaco runtime from a CDN,
 * which means the model editor breaks offline and adds a third-party
 * dependency. Here we hand the bundled `monaco-editor` package to the loader
 * and wire up the editor web worker through Vite, so everything ships from our
 * own origin.
 *
 * Only the base editor worker is needed — the scenario files are XML/JS and we
 * don't enable Monaco's TS/JSON/CSS/HTML language services.
 */
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
// eslint-disable-next-line import/no-unresolved -- Vite worker import suffix
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

let configured = false;

export function setupMonaco(): void {
  if (configured) return;
  configured = true;

  self.MonacoEnvironment = {
    getWorker() {
      return new EditorWorker();
    },
  };

  loader.config({ monaco });
}
