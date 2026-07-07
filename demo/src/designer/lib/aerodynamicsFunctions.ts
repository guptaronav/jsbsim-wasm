/**
 * Reads/writes the <function> elements under <aerodynamics> — split into
 * three groups matching the mockup: a singleton reference-point-shift
 * function, top-level "global" functions, and per-axis functions. Functions
 * themselves are kept as generic XmlElement subtrees here (round-tripped
 * losslessly); the structured <function> builder lands in milestone M6.
 */
import { type XmlElement, findChildren, makeElement, withMatchingChild } from "./xmlTree";

export const AXIS_NAMES = ["LIFT", "DRAG", "SIDE", "ROLL", "PITCH", "YAW"] as const;
export type AxisName = (typeof AXIS_NAMES)[number];

const REF_PT_SHIFT_NAME = "aero_ref_pt_shift_x";

export function getFunctionName(fn: XmlElement): string {
  return fn.attrs.name ?? "(unnamed)";
}

export function getFunctionDescription(fn: XmlElement): string {
  const description = findChildren(fn, "description")[0];
  return description ? description.children.map((c) => ("text" in c ? c.text : "")).join("").trim() : "";
}

export function getGlobalFunctions(aeroRoot: XmlElement): XmlElement[] {
  return findChildren(aeroRoot, "function").filter((f) => f.attrs.name !== REF_PT_SHIFT_NAME);
}

export function getRefPtShiftFunction(aeroRoot: XmlElement): XmlElement | undefined {
  return findChildren(aeroRoot, "function").find((f) => f.attrs.name === REF_PT_SHIFT_NAME);
}

export function getAxisFunctions(aeroRoot: XmlElement, axisName: AxisName): XmlElement[] {
  const axis = findChildren(aeroRoot, "axis").find((a) => a.attrs.name === axisName);
  return axis ? findChildren(axis, "function") : [];
}

export function addGlobalFunction(aeroRoot: XmlElement, functionName: string): XmlElement {
  return { ...aeroRoot, children: [...aeroRoot.children, makeElement("function", { name: functionName })] };
}

export function setRefPtShiftFunction(aeroRoot: XmlElement): XmlElement {
  const newFn = makeElement("function", { name: REF_PT_SHIFT_NAME });
  const hasExisting = getRefPtShiftFunction(aeroRoot) !== undefined;
  if (hasExisting) {
    return withMatchingChild(aeroRoot, (c) => c.tag === "function" && c.attrs.name === REF_PT_SHIFT_NAME, newFn);
  }
  return { ...aeroRoot, children: [...aeroRoot.children, newFn] };
}

export function addAxisFunction(aeroRoot: XmlElement, axisName: AxisName, functionName: string): XmlElement {
  const existingAxis = findChildren(aeroRoot, "axis").find((a) => a.attrs.name === axisName);
  const axis = existingAxis ?? makeElement("axis", { name: axisName });
  const updatedAxis: XmlElement = {
    ...axis,
    children: [...axis.children, makeElement("function", { name: functionName })],
  };
  return withMatchingChild(aeroRoot, (c) => c.tag === "axis" && c.attrs.name === axisName, updatedAxis);
}

// Replace/remove operate by object identity: `target` is a reference into the
// same immutable snapshot the caller read `index` from, so it unambiguously
// identifies the right sibling even when names collide.

export function replaceGlobalFunctionAt(aeroRoot: XmlElement, index: number, newFn: XmlElement): XmlElement {
  const target = getGlobalFunctions(aeroRoot)[index];
  if (!target) return aeroRoot;
  return { ...aeroRoot, children: aeroRoot.children.map((c) => (c === target ? newFn : c)) };
}

export function removeGlobalFunctionAt(aeroRoot: XmlElement, index: number): XmlElement {
  const target = getGlobalFunctions(aeroRoot)[index];
  if (!target) return aeroRoot;
  return { ...aeroRoot, children: aeroRoot.children.filter((c) => c !== target) };
}

export function replaceAxisFunctionAt(
  aeroRoot: XmlElement,
  axisName: AxisName,
  index: number,
  newFn: XmlElement
): XmlElement {
  const axis = findChildren(aeroRoot, "axis").find((a) => a.attrs.name === axisName);
  const target = axis ? getAxisFunctions(aeroRoot, axisName)[index] : undefined;
  if (!axis || !target) return aeroRoot;
  const updatedAxis = { ...axis, children: axis.children.map((c) => (c === target ? newFn : c)) };
  return withMatchingChild(aeroRoot, (c) => c.tag === "axis" && c.attrs.name === axisName, updatedAxis);
}

export function removeAxisFunctionAt(aeroRoot: XmlElement, axisName: AxisName, index: number): XmlElement {
  const axis = findChildren(aeroRoot, "axis").find((a) => a.attrs.name === axisName);
  const target = axis ? getAxisFunctions(aeroRoot, axisName)[index] : undefined;
  if (!axis || !target) return aeroRoot;
  const updatedAxis = { ...axis, children: axis.children.filter((c) => c !== target) };
  return withMatchingChild(aeroRoot, (c) => c.tag === "axis" && c.attrs.name === axisName, updatedAxis);
}

export function replaceRefPtShiftFunction(aeroRoot: XmlElement, newFn: XmlElement): XmlElement {
  const target = getRefPtShiftFunction(aeroRoot);
  if (!target) return { ...aeroRoot, children: [...aeroRoot.children, newFn] };
  return { ...aeroRoot, children: aeroRoot.children.map((c) => (c === target ? newFn : c)) };
}

export function removeRefPtShiftFunction(aeroRoot: XmlElement): XmlElement {
  const target = getRefPtShiftFunction(aeroRoot);
  if (!target) return aeroRoot;
  return { ...aeroRoot, children: aeroRoot.children.filter((c) => c !== target) };
}
