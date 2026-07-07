import { textOf, withText, type XmlElement } from "../lib/xmlTree";
import {
  EXPRESSION_NODE_TYPES,
  appendOperand,
  createExpressionNode,
  getTableData,
  getTableIndependentVar,
  operandsOf,
  removeOperandAt,
  replaceOperandAt,
  setTableData,
  setTableIndependentVar,
  type ExpressionNodeType,
} from "../lib/expressionTree";

interface ExpressionNodeEditorProps {
  node: XmlElement;
  onChange: (newNode: XmlElement) => void;
}

export function AddOperandControl({ onAdd }: { onAdd: (type: ExpressionNodeType) => void }): JSX.Element {
  return (
    <select
      className="dz-expr-add-operand"
      value=""
      onChange={(e) => {
        if (e.target.value) onAdd(e.target.value as ExpressionNodeType);
      }}
    >
      <option value="">+ operand</option>
      {EXPRESSION_NODE_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

export default function ExpressionNodeEditor({ node, onChange }: ExpressionNodeEditorProps): JSX.Element {
  if (node.tag === "property") {
    return (
      <div className="dz-expr-node dz-expr-leaf">
        <span className="dz-expr-type">property</span>
        <input
          type="text"
          value={textOf(node)}
          placeholder="property/path"
          onChange={(e) => onChange(withText(node, e.target.value))}
        />
      </div>
    );
  }

  if (node.tag === "value") {
    return (
      <div className="dz-expr-node dz-expr-leaf">
        <span className="dz-expr-type">value</span>
        <input type="number" value={textOf(node)} onChange={(e) => onChange(withText(node, e.target.value))} />
      </div>
    );
  }

  if (node.tag === "table") {
    return (
      <div className="dz-expr-node dz-expr-table">
        <span className="dz-expr-type">table</span>
        <label>
          independent var
          <input
            type="text"
            value={getTableIndependentVar(node)}
            placeholder="property/path"
            onChange={(e) => onChange(setTableIndependentVar(node, e.target.value))}
          />
        </label>
        <label>
          table data
          <textarea
            value={getTableData(node)}
            rows={3}
            onChange={(e) => onChange(setTableData(node, e.target.value))}
          />
        </label>
      </div>
    );
  }

  // Operator node (product/sum/difference/quotient/pow/abs/sin/cos): a
  // labeled list of nested expression operands.
  const operands = operandsOf(node);
  return (
    <div className="dz-expr-node dz-expr-operator">
      <span className="dz-expr-type">{node.tag}</span>
      <div className="dz-expr-operands">
        {operands.map((operand, i) => (
          <div className="dz-expr-operand-row" key={i}>
            <ExpressionNodeEditor node={operand} onChange={(newOp) => onChange(replaceOperandAt(node, i, newOp))} />
            <button
              type="button"
              className="dz-expr-remove-operand"
              aria-label={`Remove operand ${i + 1}`}
              onClick={() => onChange(removeOperandAt(node, i))}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <AddOperandControl onAdd={(type) => onChange(appendOperand(node, createExpressionNode(type)))} />
    </div>
  );
}
