import { JSBSimSdk } from "@jsbsim/wasm";
import { useCallback } from "react";
import { ScenarioManifest, ModelEditorState, ModelEditorActions } from "../types";
import FileTree from "./FileTree";
import MonacoEditorPane from "./MonacoEditorPane";

interface ModelEditorPanelProps {
  sdk: JSBSimSdk | null;
  manifest: ScenarioManifest | null;
  modelEditorState: ModelEditorState;
  modelEditorActions: ModelEditorActions;
  running: boolean;
  onReload: () => Promise<void>;
  setFileContents?: (content: string) => void;
}

export default function ModelEditorPanel({
  sdk,
  manifest,
  modelEditorState,
  modelEditorActions,
  running,
  onReload,
  setFileContents,
}: ModelEditorPanelProps): JSX.Element {
  const handleChange = useCallback((newContent: string) => {
    if (setFileContents) {
      setFileContents(newContent);
    }
  }, [setFileContents]);

  const handleSaveAndReload = useCallback(async () => {
    if (!sdk) return;
    // First save the current file
    await modelEditorActions.saveFile();
    // Then reload the simulation
    await onReload();
  }, [sdk, modelEditorActions, onReload]);

  if (!sdk || !manifest) {
    return (
      <div className="model-editor-panel loading">
        <div className="editor-placeholder">
          Waiting for simulation to load...
        </div>
      </div>
    );
  }

  return (
    <div className="model-editor-panel">
      <FileTree
        manifest={manifest}
        activeFile={modelEditorState.activeFile}
        onFileSelect={modelEditorActions.openFile}
      />

      <MonacoEditorPane
        filename={modelEditorState.activeFile}
        content={modelEditorState.fileContents}
        isLoading={modelEditorState.isLoading}
        unsavedChanges={modelEditorState.unsavedChanges}
        error={modelEditorState.error}
        onChange={(content) => {
          // This is handled by updating state in useSimulation
          // For now, just track that content changed
          if (content !== modelEditorState.fileContents) {
            // Update will happen through the hook
          }
        }}
        onSave={modelEditorActions.saveFile}
        onSaveAndReload={handleSaveAndReload}
        onClose={modelEditorActions.closeEditor}
      />
    </div>
  );
}
