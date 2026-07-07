import { Suspense, lazy, useState } from "react";

// Self-hosted Monaco (no CDN) — see lib/monacoSetup.ts. Lazy-loaded so the
// Designer's initial bundle stays light; only paid for when a user opens
// the raw-XML escape hatch.
const Editor = lazy(async () => {
  const { setupMonaco } = await import("../../lib/monacoSetup");
  setupMonaco();
  const m = await import("@monaco-editor/react");
  return { default: m.Editor };
});

interface XmlEscapeHatchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function XmlEscapeHatch({ value, onChange }: XmlEscapeHatchProps): JSX.Element {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const apply = (): void => {
    try {
      onChange(draft);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="dz-xml-escape-hatch">
      <Suspense fallback={<div className="dz-xml-loading">Loading editor…</div>}>
        <Editor
          height="240px"
          language="xml"
          theme="vs-light"
          value={draft}
          onChange={(v) => setDraft(v ?? "")}
          options={{ minimap: { enabled: false }, fontSize: 12, wordWrap: "on" }}
        />
      </Suspense>
      <div className="dz-xml-escape-actions">
        <button type="button" className="dz-btn dz-btn--primary" onClick={apply}>
          Apply XML
        </button>
        {error && <span className="dz-field-error-message">{error}</span>}
      </div>
    </div>
  );
}
