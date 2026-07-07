/**
 * Structured JSBSim <function> value-expression tree. Reuses XmlElement
 * directly as the node representation — a node's `tag` IS its expression
 * type, so no separate AST/codec is needed for round-tripping.
 */
import { type XmlElement, findChild, isElement, makeElement, textOf, withChild, withText } from "./xmlTree";

export const LEAF_NODE_TYPES = ["property", "value", "table"] as const;
export const OPERATOR_NODE_TYPES = [
  "product",
  "sum",
  "difference",
  "quotient",
  "pow",
  "abs",
  "sin",
  "cos",
] as const;
export const EXPRESSION_NODE_TYPES = [...LEAF_NODE_TYPES, ...OPERATOR_NODE_TYPES] as const;
export type ExpressionNodeType = (typeof EXPRESSION_NODE_TYPES)[number];

export function isOperatorType(tag: string): boolean {
  return (OPERATOR_NODE_TYPES as readonly string[]).includes(tag);
}

export function isExpressionType(tag: string): tag is ExpressionNodeType {
  return (EXPRESSION_NODE_TYPES as readonly string[]).includes(tag);
}

export function createExpressionNode(type: ExpressionNodeType): XmlElement {
  switch (type) {
    case "property":
      return makeElement("property", {}, [{ text: "" }]);
    case "value":
      return makeElement("value", {}, [{ text: "0" }]);
    case "table":
      return makeElement("table", {}, [
        makeElement("independentVar", { lookup: "row" }, [{ text: "" }]),
        makeElement("tableData", {}, [{ text: "" }]),
      ]);
    default:
      return makeElement(type);
  }
}

/** The first non-description element child — every expression node's operands
 * (and a <function>'s top-level value expression) are plain element children. */
export function operandsOf(node: XmlElement): XmlElement[] {
  return node.children.filter(isElement).filter((c) => c.tag !== "description");
}

export function replaceOperandAt(node: XmlElement, index: number, newOperand: XmlElement): XmlElement {
  const target = operandsOf(node)[index];
  if (!target) return node;
  return { ...node, children: node.children.map((c) => (c === target ? newOperand : c)) };
}

export function removeOperandAt(node: XmlElement, index: number): XmlElement {
  const target = operandsOf(node)[index];
  if (!target) return node;
  return { ...node, children: node.children.filter((c) => c !== target) };
}

export function appendOperand(node: XmlElement, operand: XmlElement): XmlElement {
  return { ...node, children: [...node.children, operand] };
}

export function getTableIndependentVar(tableNode: XmlElement): string {
  return textOf(findChild(tableNode, "independentVar"));
}

export function setTableIndependentVar(tableNode: XmlElement, propertyPath: string): XmlElement {
  const existing = findChild(tableNode, "independentVar") ?? makeElement("independentVar", { lookup: "row" });
  return withChild(tableNode, withText(existing, propertyPath));
}

export function getTableData(tableNode: XmlElement): string {
  return textOf(findChild(tableNode, "tableData"));
}

export function setTableData(tableNode: XmlElement, data: string): XmlElement {
  const existing = findChild(tableNode, "tableData") ?? makeElement("tableData");
  return withChild(tableNode, withText(existing, data));
}
