import { describe, it, expect } from "vitest";
import { makeElement, parseXml, textOf } from "../xmlTree";
import {
  appendOperand,
  createExpressionNode,
  getTableData,
  getTableIndependentVar,
  isExpressionType,
  isOperatorType,
  operandsOf,
  removeOperandAt,
  replaceOperandAt,
  setTableData,
  setTableIndependentVar,
} from "../expressionTree";

describe("createExpressionNode", () => {
  it("creates a property leaf with empty text", () => {
    const node = createExpressionNode("property");
    expect(node.tag).toBe("property");
    expect(textOf(node)).toBe("");
  });

  it("creates a value leaf defaulting to 0", () => {
    const node = createExpressionNode("value");
    expect(textOf(node)).toBe("0");
  });

  it("creates a table leaf with independentVar and tableData children", () => {
    const node = createExpressionNode("table");
    expect(getTableIndependentVar(node)).toBe("");
    expect(getTableData(node)).toBe("");
  });

  it("creates an empty operator node with no operands", () => {
    const node = createExpressionNode("product");
    expect(node.tag).toBe("product");
    expect(operandsOf(node)).toEqual([]);
  });
});

describe("isOperatorType / isExpressionType", () => {
  it("classifies operator tags correctly", () => {
    expect(isOperatorType("product")).toBe(true);
    expect(isOperatorType("property")).toBe(false);
  });

  it("classifies all known expression tags", () => {
    expect(isExpressionType("sum")).toBe(true);
    expect(isExpressionType("bogus")).toBe(false);
  });
});

describe("operandsOf", () => {
  it("excludes a <description> child from the operand list", () => {
    const node = parseXml(`<product><description>d</description><property>a</property><value>1</value></product>`);
    const operands = operandsOf(node);
    expect(operands.map((o) => o.tag)).toEqual(["property", "value"]);
  });
});

describe("replaceOperandAt / removeOperandAt / appendOperand", () => {
  it("replaces the operand at the given index without disturbing others", () => {
    const node = parseXml(`<sum><property>a</property><value>1</value></sum>`);
    const replacement = makeElement("value", {}, [{ text: "42" }]);
    const updated = replaceOperandAt(node, 0, replacement);
    expect(operandsOf(updated).map((o) => o.tag)).toEqual(["value", "value"]);
    expect(textOf(operandsOf(updated)[0])).toBe("42");
  });

  it("removes the operand at the given index", () => {
    const node = parseXml(`<sum><property>a</property><value>1</value></sum>`);
    const updated = removeOperandAt(node, 0);
    expect(operandsOf(updated)).toHaveLength(1);
    expect(operandsOf(updated)[0].tag).toBe("value");
  });

  it("appends a new operand", () => {
    const node = createExpressionNode("product");
    const updated = appendOperand(node, createExpressionNode("property"));
    expect(operandsOf(updated)).toHaveLength(1);
  });

  it("does not mutate the original node", () => {
    const node = parseXml(`<sum><property>a</property></sum>`);
    removeOperandAt(node, 0);
    expect(operandsOf(node)).toHaveLength(1);
  });
});

describe("table independentVar / tableData", () => {
  it("sets and reads the independentVar property path", () => {
    const table = createExpressionNode("table");
    const updated = setTableIndependentVar(table, "aero/alpha-rad");
    expect(getTableIndependentVar(updated)).toBe("aero/alpha-rad");
  });

  it("sets and reads raw tableData text", () => {
    const table = createExpressionNode("table");
    const updated = setTableData(table, "0.0 0.1\n1.0 0.5");
    expect(getTableData(updated)).toBe("0.0 0.1\n1.0 0.5");
  });
});
