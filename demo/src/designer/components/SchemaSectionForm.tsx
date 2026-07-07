import type { FieldError } from "../lib/schemaForm";
import type { SectionSchema } from "../schema/types";

interface SchemaSectionFormProps {
  section: SectionSchema;
  getValue: (fieldId: string) => string;
  onChange: (fieldId: string, value: string) => void;
  errors: FieldError[];
}

export default function SchemaSectionForm({
  section,
  getValue,
  onChange,
  errors,
}: SchemaSectionFormProps): JSX.Element {
  if (section.fields.length === 0) {
    return <p className="dz-empty-state">No {section.label.toLowerCase()} elements in this model.</p>;
  }

  return (
    <div className="dz-field-grid">
      {section.fields.map((field) => {
        const value = getValue(field.id);
        const error = errors.find((e) => e.fieldId === field.id);
        const inputId = `dz-field-${section.id}-${field.id}`;

        return (
          <div className={`dz-field ${error ? "dz-field--error" : ""}`} key={field.id}>
            <label htmlFor={inputId}>
              {field.label}
              {field.unit ? <span className="dz-field-unit"> ({field.unit})</span> : null}
            </label>

            {field.type === "select" ? (
              <select id={inputId} value={value} onChange={(e) => onChange(field.id, e.target.value)}>
                <option value="">—</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={inputId}
                type={field.type === "number" ? "number" : "text"}
                value={value}
                onChange={(e) => onChange(field.id, e.target.value)}
              />
            )}

            {field.help && <p className="dz-field-help">{field.help}</p>}
            {error && <p className="dz-field-error-message">{error.message}</p>}
          </div>
        );
      })}
    </div>
  );
}
