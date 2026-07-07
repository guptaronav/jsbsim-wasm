import { useState } from "react";
import {
  findChild,
  makeElement,
  parseXml,
  serializeXml,
  textOf,
  withAttr,
  withChild,
  withText,
  type XmlElement,
} from "../lib/xmlTree";
import { appendOperand, createExpressionNode, operandsOf, replaceOperandAt } from "../lib/expressionTree";
import ExpressionNodeEditor, { AddOperandControl } from "./ExpressionNodeEditor";
import XmlEscapeHatch from "./XmlEscapeHatch";

interface FunctionEditorProps {
  node: XmlElement;
  onChange: (newNode: XmlElement) => void;
}

export default function FunctionEditor({ node, onChange }: FunctionEditorProps): JSX.Element {
  const [rawMode, setRawMode] = useState(false);

  const name = node.attrs.name ?? "";
  const description = textOf(findChild(node, "description"));
  const valueExpr = operandsOf(node)[0];

  const setName = (value: string): void => onChange(withAttr(node, "name", value));
  const setDescription = (value: string): void => {
    const descEl = findChild(node, "description") ?? makeElement("description");
    onChange(withChild(node, withText(descEl, value)));
  };

  if (rawMode) {
    return (
      <div className="dz-function-editor">
        <div className="dz-function-editor-toolbar">
          <button type="button" className="dz-btn dz-btn--secondary" onClick={() => setRawMode(false)}>
            Structured Editor
          </button>
        </div>
        <XmlEscapeHatch
          value={serializeXml(node)}
          onChange={(xmlText) => onChange(parseXml(xmlText))}
        />
      </div>
    );
  }

  return (
    <div className="dz-function-editor">
      <div className="dz-function-editor-toolbar">
        <label className="dz-function-name-field">
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="button" className="dz-btn dz-btn--secondary" onClick={() => setRawMode(true)}>
          Raw XML
        </button>
      </div>

      <label className="dz-function-description-field">
        Description
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      {valueExpr ? (
        <ExpressionNodeEditor node={valueExpr} onChange={(newExpr) => onChange(replaceOperandAt(node, 0, newExpr))} />
      ) : (
        <AddOperandControl onAdd={(type) => onChange(appendOperand(node, createExpressionNode(type)))} />
      )}
    </div>
  );
}
