/**
 * ParameterEditor - Live parameter tuning during simulation
 * Allows real-time adjustment of simulation properties with validation
 */

import { useState } from "react";

export interface Parameter {
  id: string;
  name: string;
  category: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

interface ParameterEditorProps {
  parameters: Parameter[];
  onParameterChange: (id: string, value: number) => void;
  isDarkMode?: boolean;
  disabled?: boolean;
}

const DEFAULT_PARAMETERS: Parameter[] = [
  {
    id: "throttle",
    name: "Throttle",
    category: "Engine",
    value: 0,
    min: 0,
    max: 1,
    step: 0.01,
    unit: "%",
    description: "Engine throttle position",
  },
  {
    id: "elevator",
    name: "Elevator",
    category: "Controls",
    value: 0,
    min: -1,
    max: 1,
    step: 0.1,
    unit: "rad",
    description: "Pitch control surface",
  },
  {
    id: "aileron",
    name: "Aileron",
    category: "Controls",
    value: 0,
    min: -1,
    max: 1,
    step: 0.1,
    unit: "rad",
    description: "Roll control surface",
  },
  {
    id: "rudder",
    name: "Rudder",
    category: "Controls",
    value: 0,
    min: -1,
    max: 1,
    step: 0.1,
    unit: "rad",
    description: "Yaw control surface",
  },
];

export default function ParameterEditor({
  parameters = DEFAULT_PARAMETERS,
  onParameterChange,
  isDarkMode = false,
  disabled = false,
}: ParameterEditorProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Engine");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Group parameters by category
  const categorized = parameters.reduce(
    (acc, param) => {
      if (!acc[param.category]) {
        acc[param.category] = [];
      }
      acc[param.category].push(param);
      return acc;
    },
    {} as Record<string, Parameter[]>
  );

  const categories = Object.keys(categorized).sort();

  return (
    <div className="parameter-editor">
      <h3 className="editor-title">Parameter Control</h3>

      <div className="parameters-list">
        {categories.map((category) => (
          <div key={category} className="parameter-category">
            <button
              className={`category-header ${expandedCategory === category ? "expanded" : ""}`}
              onClick={() =>
                setExpandedCategory(expandedCategory === category ? null : category)
              }
            >
              <span className="category-toggle">
                {expandedCategory === category ? "▼" : "▶"}
              </span>
              <span className="category-name">{category}</span>
              <span className="category-count">({categorized[category].length})</span>
            </button>

            {expandedCategory === category && (
              <div className="category-content">
                {categorized[category].map((param) => (
                  <div key={param.id} className="parameter-item">
                    <div className="param-header">
                      <label className="param-label">{param.name}</label>
                      <span className="param-unit">{param.unit}</span>
                    </div>

                    <div className="param-control">
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={param.value}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          onParameterChange(param.id, value);
                        }}
                        disabled={disabled || editingId !== param.id}
                        className="param-slider"
                      />
                      <input
                        type="number"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={param.value.toFixed(3)}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= param.min && value <= param.max) {
                            onParameterChange(param.id, value);
                          }
                        }}
                        onFocus={() => setEditingId(param.id)}
                        onBlur={() => setEditingId(null)}
                        disabled={disabled}
                        className="param-input"
                      />
                    </div>

                    <div className="param-footer">
                      <span className="param-range">
                        {param.min.toFixed(2)} - {param.max.toFixed(2)}
                      </span>
                      <span className="param-desc">{param.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {disabled && (
        <div className="editor-disabled-overlay">
          <span>Pause simulation to edit parameters</span>
        </div>
      )}
    </div>
  );
}
