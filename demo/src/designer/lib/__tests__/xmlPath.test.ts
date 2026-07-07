import { describe, it, expect } from "vitest";
import { parseXml, textOf, findChild, withText } from "../xmlTree";
import { ensurePath, resolvePath, setAtPath } from "../xmlPath";

const SAMPLE = `<?xml version="1.0"?>
<metrics>
  <wingarea unit="FT2">0.12</wingarea>
  <location name="AERORP" unit="IN">
    <x>1.0</x>
    <y>2.0</y>
    <z>3.0</z>
  </location>
  <location name="EYEPOINT" unit="IN">
    <x>4.0</x>
    <y>5.0</y>
    <z>6.0</z>
  </location>
</metrics>`;

describe("resolvePath", () => {
  it("resolves a simple single-segment path", () => {
    const root = parseXml(SAMPLE);
    const el = resolvePath(root, [{ tag: "wingarea" }]);
    expect(textOf(el)).toBe("0.12");
  });

  it("disambiguates repeated siblings using match attributes", () => {
    const root = parseXml(SAMPLE);
    const aerorpX = resolvePath(root, [{ tag: "location", match: { name: "AERORP" } }, { tag: "x" }]);
    const eyepointX = resolvePath(root, [{ tag: "location", match: { name: "EYEPOINT" } }, { tag: "x" }]);
    expect(textOf(aerorpX)).toBe("1.0");
    expect(textOf(eyepointX)).toBe("4.0");
  });

  it("returns undefined when a path segment does not exist", () => {
    const root = parseXml(SAMPLE);
    expect(resolvePath(root, [{ tag: "nope" }])).toBeUndefined();
  });

  it("returns undefined given an undefined root", () => {
    expect(resolvePath(undefined, [{ tag: "wingarea" }])).toBeUndefined();
  });
});

describe("ensurePath", () => {
  it("returns the existing leaf without creating duplicates", () => {
    const root = parseXml(SAMPLE);
    const { root: updated, leaf } = ensurePath(root, [{ tag: "wingarea" }]);
    expect(textOf(leaf)).toBe("0.12");
    expect(findChild(updated, "wingarea")).toBeDefined();
    // No duplicate wingarea elements were created.
    expect(updated.children.filter((c) => "tag" in c && c.tag === "wingarea")).toHaveLength(1);
  });

  it("creates missing intermediate elements with match attributes applied", () => {
    const root = parseXml(SAMPLE);
    const { root: updated, leaf } = ensurePath(root, [{ tag: "location", match: { name: "VRP" } }, { tag: "x" }]);
    expect(leaf.tag).toBe("x");

    const vrp = resolvePath(updated, [{ tag: "location", match: { name: "VRP" } }]);
    expect(vrp?.attrs.name).toBe("VRP");
  });

  it("does not disturb existing siblings when creating a new one", () => {
    const root = parseXml(SAMPLE);
    const { root: updated } = ensurePath(root, [{ tag: "location", match: { name: "VRP" } }, { tag: "x" }]);
    const aerorpX = resolvePath(updated, [{ tag: "location", match: { name: "AERORP" } }, { tag: "x" }]);
    expect(textOf(aerorpX)).toBe("1.0");
  });

  it("resolving with the same disambiguated path after ensurePath finds the created leaf", () => {
    const root = parseXml(SAMPLE);
    const { root: updated } = ensurePath(root, [{ tag: "location", match: { name: "VRP" } }, { tag: "z" }]);
    const z = resolvePath(updated, [{ tag: "location", match: { name: "VRP" } }, { tag: "z" }]);
    expect(z).toBeDefined();
  });
});

describe("setAtPath", () => {
  it("applies the updater to an existing leaf", () => {
    const root = parseXml(SAMPLE);
    const updated = setAtPath(root, [{ tag: "wingarea" }], (leaf) => withText(leaf, "0.20"));
    expect(textOf(resolvePath(updated, [{ tag: "wingarea" }]))).toBe("0.20");
  });

  it("creates missing elements and applies the updater to the new leaf", () => {
    const root = parseXml(SAMPLE);
    const updated = setAtPath(
      root,
      [{ tag: "location", match: { name: "VRP" } }, { tag: "x" }],
      (leaf) => withText(leaf, "9.9")
    );
    expect(textOf(resolvePath(updated, [{ tag: "location", match: { name: "VRP" } }, { tag: "x" }]))).toBe("9.9");
  });

  it("leaves the original root untouched (immutable)", () => {
    const root = parseXml(SAMPLE);
    setAtPath(root, [{ tag: "wingarea" }], (leaf) => withText(leaf, "9.99"));
    expect(textOf(resolvePath(root, [{ tag: "wingarea" }]))).toBe("0.12");
  });
});
