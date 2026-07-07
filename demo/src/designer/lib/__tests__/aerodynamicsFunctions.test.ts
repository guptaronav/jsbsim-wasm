import { describe, it, expect } from "vitest";
import { makeElement, parseXml } from "../xmlTree";
import {
  addAxisFunction,
  addGlobalFunction,
  getAxisFunctions,
  getFunctionDescription,
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
} from "../aerodynamicsFunctions";

const AERO_XML = `<?xml version="1.0"?>
<aerodynamics axis-system="STANDARD">
  <function name="aero_ref_pt_shift_x">
    <description>Shift with Mach</description>
  </function>
  <function name="global/one" />
  <axis name="DRAG">
    <function name="aero/coefficient/CD">
      <description>Simple drag approximation</description>
    </function>
  </axis>
</aerodynamics>`;

describe("getGlobalFunctions", () => {
  it("excludes the reference-point-shift function", () => {
    const root = parseXml(AERO_XML);
    const globals = getGlobalFunctions(root);
    expect(globals).toHaveLength(1);
    expect(getFunctionName(globals[0])).toBe("global/one");
  });
});

describe("getRefPtShiftFunction", () => {
  it("finds the function named aero_ref_pt_shift_x", () => {
    const root = parseXml(AERO_XML);
    const fn = getRefPtShiftFunction(root);
    expect(fn).toBeDefined();
    expect(getFunctionDescription(fn!)).toBe("Shift with Mach");
  });

  it("returns undefined when no ref-pt-shift function exists", () => {
    const root = parseXml(`<aerodynamics></aerodynamics>`);
    expect(getRefPtShiftFunction(root)).toBeUndefined();
  });
});

describe("getAxisFunctions", () => {
  it("returns functions scoped to the named axis", () => {
    const root = parseXml(AERO_XML);
    const dragFns = getAxisFunctions(root, "DRAG");
    expect(dragFns).toHaveLength(1);
    expect(getFunctionName(dragFns[0])).toBe("aero/coefficient/CD");
  });

  it("returns an empty array for an axis with no functions", () => {
    const root = parseXml(AERO_XML);
    expect(getAxisFunctions(root, "LIFT")).toEqual([]);
  });
});

describe("addGlobalFunction", () => {
  it("appends a new top-level function without disturbing existing ones", () => {
    const root = parseXml(AERO_XML);
    const updated = addGlobalFunction(root, "global/two");
    const globals = getGlobalFunctions(updated);
    expect(globals.map(getFunctionName)).toEqual(["global/one", "global/two"]);
  });

  it("does not mutate the original tree", () => {
    const root = parseXml(AERO_XML);
    addGlobalFunction(root, "global/two");
    expect(getGlobalFunctions(root)).toHaveLength(1);
  });
});

describe("addAxisFunction", () => {
  it("appends a function to an existing axis", () => {
    const root = parseXml(AERO_XML);
    const updated = addAxisFunction(root, "DRAG", "aero/coefficient/CD2");
    expect(getAxisFunctions(updated, "DRAG")).toHaveLength(2);
  });

  it("creates the axis element when it does not yet exist", () => {
    const root = parseXml(AERO_XML);
    const updated = addAxisFunction(root, "LIFT", "aero/coefficient/CL");
    const liftFns = getAxisFunctions(updated, "LIFT");
    expect(liftFns).toHaveLength(1);
    expect(getFunctionName(liftFns[0])).toBe("aero/coefficient/CL");
  });
});

describe("setRefPtShiftFunction", () => {
  it("creates the ref-pt-shift function when absent", () => {
    const root = parseXml(`<aerodynamics></aerodynamics>`);
    const updated = setRefPtShiftFunction(root);
    expect(getRefPtShiftFunction(updated)).toBeDefined();
  });

  it("replaces rather than duplicates an existing ref-pt-shift function", () => {
    const root = parseXml(AERO_XML);
    const updated = setRefPtShiftFunction(root);
    const matches = updated.children.filter(
      (c) => "tag" in c && c.tag === "function" && c.attrs.name === "aero_ref_pt_shift_x"
    );
    expect(matches).toHaveLength(1);
  });
});

describe("replace/remove by index", () => {
  it("replaceGlobalFunctionAt swaps only the targeted function", () => {
    const root = parseXml(AERO_XML);
    const replacement = makeElement("function", { name: "global/replaced" });
    const updated = replaceGlobalFunctionAt(root, 0, replacement);
    expect(getGlobalFunctions(updated).map(getFunctionName)).toEqual(["global/replaced"]);
  });

  it("removeGlobalFunctionAt removes only the targeted function", () => {
    const root = parseXml(AERO_XML);
    const withTwo = addGlobalFunction(root, "global/two");
    const updated = removeGlobalFunctionAt(withTwo, 0);
    expect(getGlobalFunctions(updated).map(getFunctionName)).toEqual(["global/two"]);
  });

  it("replaceAxisFunctionAt swaps a function within the named axis", () => {
    const root = parseXml(AERO_XML);
    const replacement = makeElement("function", { name: "aero/coefficient/CD2" });
    const updated = replaceAxisFunctionAt(root, "DRAG", 0, replacement);
    expect(getAxisFunctions(updated, "DRAG").map(getFunctionName)).toEqual(["aero/coefficient/CD2"]);
  });

  it("removeAxisFunctionAt removes a function within the named axis", () => {
    const root = parseXml(AERO_XML);
    const updated = removeAxisFunctionAt(root, "DRAG", 0);
    expect(getAxisFunctions(updated, "DRAG")).toEqual([]);
  });

  it("replaceRefPtShiftFunction swaps the singleton function", () => {
    const root = parseXml(AERO_XML);
    const replacement = makeElement("function", { name: "aero_ref_pt_shift_x" }, [
      makeElement("value", {}, [{ text: "1.5" }]),
    ]);
    const updated = replaceRefPtShiftFunction(root, replacement);
    expect(getRefPtShiftFunction(updated)).toBe(replacement);
  });

  it("removeRefPtShiftFunction clears the singleton function", () => {
    const root = parseXml(AERO_XML);
    const updated = removeRefPtShiftFunction(root);
    expect(getRefPtShiftFunction(updated)).toBeUndefined();
  });
});
