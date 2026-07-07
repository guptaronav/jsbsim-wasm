import { useState } from "react";
import { makeElement, type XmlElement } from "../lib/xmlTree";
import {
  AXIS_NAMES,
  addAxisFunction,
  addGlobalFunction,
  getAxisFunctions,
  getFunctionName,
  getGlobalFunctions,
  getRefPtShiftFunction,
  removeAxisFunctionAt,
  removeGlobalFunctionAt,
  removeRefPtShiftFunction,
  replaceAxisFunctionAt,
  replaceGlobalFunctionAt,
  replaceRefPtShiftFunction,
  setRefPtShiftFunction,
  type AxisName,
} from "../lib/aerodynamicsFunctions";
import { AERODYNAMICS_SECTION } from "../schema/aerodynamics";
import type { FieldError } from "../lib/schemaForm";
import SchemaSectionForm from "./SchemaSectionForm";
import AddFunctionControl from "./AddFunctionControl";
import FunctionEditor from "./FunctionEditor";

interface AerodynamicsTabProps {
  aeroRoot: XmlElement | undefined;
  getValue: (fieldId: string) => string;
  onChange: (fieldId: string, value: string) => void;
  onAeroRootChange: (newAeroRoot: XmlElement) => void;
  errors: FieldError[];
}

interface FunctionCardProps {
  fn: XmlElement;
  onChange: (newFn: XmlElement) => void;
  onRemove: () => void;
}

function FunctionCard({ fn, onChange, onRemove }: FunctionCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="dz-function-card">
      <div className="dz-function-card-header">
        <button type="button" className="dz-function-card-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? "▾" : "▸"} <span className="dz-function-name">{getFunctionName(fn)}</span>
        </button>
        <button type="button" className="dz-function-card-remove" aria-label="Remove function" onClick={onRemove}>
          ×
        </button>
      </div>
      {expanded && <FunctionEditor node={fn} onChange={onChange} />}
    </div>
  );
}

export default function AerodynamicsTab({
  aeroRoot,
  getValue,
  onChange,
  onAeroRootChange,
  errors,
}: AerodynamicsTabProps): JSX.Element {
  const root = aeroRoot ?? makeElement("aerodynamics");
  const refPtShift = getRefPtShiftFunction(root);
  const globalFunctions = getGlobalFunctions(root);

  return (
    <div className="dz-aero-tab">
      <section className="dz-aero-section">
        <h3>Aerodynamics Setup</h3>
        <SchemaSectionForm section={AERODYNAMICS_SECTION} getValue={getValue} onChange={onChange} errors={errors} />
      </section>

      <section className="dz-aero-section">
        <h3>Reference Point Shift</h3>
        {refPtShift ? (
          <FunctionCard
            fn={refPtShift}
            onChange={(newFn) => onAeroRootChange(replaceRefPtShiftFunction(root, newFn))}
            onRemove={() => onAeroRootChange(removeRefPtShiftFunction(root))}
          />
        ) : (
          <p className="dz-empty-state">No reference point shift function defined.</p>
        )}
        {!refPtShift && (
          <button
            type="button"
            className="dz-btn dz-btn--secondary"
            onClick={() => onAeroRootChange(setRefPtShiftFunction(root))}
          >
            Add Function
          </button>
        )}
      </section>

      <section className="dz-aero-section">
        <h3>Global Functions</h3>
        {globalFunctions.length === 0 ? (
          <p className="dz-empty-state">No global functions defined.</p>
        ) : (
          <div className="dz-function-list">
            {globalFunctions.map((fn, i) => (
              <FunctionCard
                fn={fn}
                key={`${getFunctionName(fn)}-${i}`}
                onChange={(newFn) => onAeroRootChange(replaceGlobalFunctionAt(root, i, newFn))}
                onRemove={() => onAeroRootChange(removeGlobalFunctionAt(root, i))}
              />
            ))}
          </div>
        )}
        <AddFunctionControl onAdd={(name) => onAeroRootChange(addGlobalFunction(root, name))} />
      </section>

      <section className="dz-aero-section">
        <h3>Axis Functions</h3>
        <div className="dz-axis-grid">
          {AXIS_NAMES.map((axisName: AxisName) => {
            const functions = getAxisFunctions(root, axisName);
            return (
              <div className="dz-axis-card" key={axisName}>
                <h4>{axisName}</h4>
                {functions.length === 0 ? (
                  <p className="dz-empty-state">No functions.</p>
                ) : (
                  <div className="dz-function-list">
                    {functions.map((fn, i) => (
                      <FunctionCard
                        fn={fn}
                        key={`${axisName}-${i}`}
                        onChange={(newFn) => onAeroRootChange(replaceAxisFunctionAt(root, axisName, i, newFn))}
                        onRemove={() => onAeroRootChange(removeAxisFunctionAt(root, axisName, i))}
                      />
                    ))}
                  </div>
                )}
                <AddFunctionControl onAdd={(name) => onAeroRootChange(addAxisFunction(root, axisName, name))} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
