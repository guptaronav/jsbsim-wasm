import { Suspense, lazy, useEffect, useState } from "react";
import { useTheme } from "../hooks/useTheme";

// Configure Monaco to load from our own bundle (offline, no CDN) before the
// editor component is imported.
const Editor = lazy(async () => {
  const { setupMonaco } = await import("../lib/monacoSetup");
  setupMonaco();
  const m = await import("@monaco-editor/react");
  return { default: m.Editor };
});

interface MonacoEditorPaneProps {
  filename: string | null;
  content: string;
  isLoading: boolean;
  unsavedChanges: boolean;
  error: string | null;
  onChange: (content: string) => void;
  onSave: () => Promise<void>;
  onSaveAndReload: () => Promise<void>;
  onClose: () => void;
}

export default function MonacoEditorPane({
  filename,
  content,
  isLoading,
  unsavedChanges,
  error,
  onChange,
  onSave,
  onSaveAndReload,
  onClose,
}: MonacoEditorPaneProps): JSX.Element {
  const { theme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [showError, setShowError] = useState(false);

  const isDarkMode = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const editorTheme = isDarkMode ? "vs-dark" : "vs-light";

  const getLanguage = (fname: string | null): string => {
    if (!fname) return "text";
    if (fname.endsWith(".xml")) return "xml";
    if (fname.endsWith(".js")) return "javascript";
    return "text";
  };

  const handleSave = async () => {
    setIsSaving(true);
    setShowError(false);
    try {
      await onSave();
    } catch (err) {
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndReload = async () => {
    setIsSaving(true);
    try {
      await onSaveAndReload();
      setShowError(false);
    } catch (err) {
      setShowError(true);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  if (!filename) {
    return (
      <div className="editor-pane empty">
        <div className="editor-placeholder">
          Select a file from the file tree to edit
        </div>
      </div>
    );
  }

  return (
    <div className="editor-pane">
      <div className="editor-toolbar">
        <div className="editor-filename">
          {filename}
          {unsavedChanges && <span className="editor-dirty-indicator">●</span>}
        </div>
        <button
          className="btn-secondary"
          onClick={handleSave}
          disabled={!unsavedChanges || isSaving || isLoading}
          title="Save file to MEMFS"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          className="btn-secondary"
          onClick={handleSaveAndReload}
          disabled={isSaving || isLoading}
          title="Save and reload simulation"
        >
          {isSaving ? "Reloading..." : "Reload Sim"}
        </button>
        <button
          className="btn-ghost"
          onClick={onClose}
          disabled={isSaving || isLoading}
          title="Close editor"
        >
          ✕
        </button>
      </div>

      {showError && error && (
        <div className="editor-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="editor-container">
        {isLoading ? (
          <div className="editor-loading">Loading file...</div>
        ) : (
          <Suspense fallback={<div className="editor-loading">Loading editor...</div>}>
            <Editor
              language={getLanguage(filename)}
              theme={editorTheme}
              value={content}
              onChange={(value) => onChange(value || "")}
              options={{
                wordWrap: "on",
                fontSize: 13,
                fontFamily: "IBM Plex Mono, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
