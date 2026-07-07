import { useRef } from "react";
import type { ValidationResult } from "../lib/validator";

interface DesignerHeaderProps {
  filename: string;
  validation: ValidationResult;
  onImportFile: (file: File) => void;
  onDownload: () => void;
  onRunModel: () => void;
}

export default function DesignerHeader({
  filename,
  validation,
  onImportFile,
  onDownload,
  onRunModel,
}: DesignerHeaderProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="dz-header">
      <div className="dz-header-title">
        <h1>JSBSim Model Designer</h1>
        <p>Reusable editor shell for building and validating JSBSim model files.</p>
      </div>
      <div className="dz-header-actions">
        <span className="dz-filename">{filename}</span>
        <span className={`dz-validation-badge ${validation.valid ? "dz-validation-badge--ok" : "dz-validation-badge--error"}`}>
          {validation.valid ? "✓ Valid" : `${validation.errors.length} issue${validation.errors.length === 1 ? "" : "s"}`}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml"
          className="visually-hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onImportFile(file);
            e.target.value = "";
          }}
        />
        <button type="button" className="dz-btn dz-btn--secondary" onClick={() => fileInputRef.current?.click()}>
          Import Files
        </button>
        <button type="button" className="dz-btn dz-btn--primary" onClick={onDownload}>
          Download Files
        </button>
        <button type="button" className="dz-btn dz-btn--primary" onClick={onRunModel}>
          Run this model
        </button>
      </div>
    </header>
  );
}
