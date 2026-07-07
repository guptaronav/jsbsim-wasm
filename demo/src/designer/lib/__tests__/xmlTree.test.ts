import { describe, it, expect } from "vitest";
import {
  findChild,
  findChildren,
  makeElement,
  parseXml,
  serializeXml,
  textOf,
  withAttr,
  withChild,
  withText,
} from "../xmlTree";

const SAMPLE = `<?xml version="1.0"?>
<root>
  <a foo="1">hello</a>
  <b>
    <c/>
  </b>
</root>`;

describe("parseXml", () => {
  it("parses the root tag and attributes", () => {
    const root = parseXml(SAMPLE);
    expect(root.tag).toBe("root");
  });

  it("parses child elements and their attributes", () => {
    const root = parseXml(SAMPLE);
    const a = findChild(root, "a");
    expect(a?.attrs.foo).toBe("1");
    expect(textOf(a)).toBe("hello");
  });

  it("parses nested elements", () => {
    const root = parseXml(SAMPLE);
    const b = findChild(root, "b");
    const c = b ? findChild(b, "c") : undefined;
    expect(c?.tag).toBe("c");
  });

  it("throws a descriptive error on malformed XML", () => {
    expect(() => parseXml("<root><unclosed></root>")).toThrow(/parse error/i);
  });
});

describe("serializeXml round-trip", () => {
  it("preserves tag names, attributes, and text through parse -> serialize -> parse", () => {
    const root = parseXml(SAMPLE);
    const serialized = serializeXml(root);
    const reparsed = parseXml(serialized);

    expect(reparsed.tag).toBe("root");
    expect(textOf(findChild(reparsed, "a"))).toBe("hello");
    expect(findChild(reparsed, "a")?.attrs.foo).toBe("1");
  });

  it("is deterministic — parsing its own output twice yields identical XML", () => {
    const root = parseXml(SAMPLE);
    const first = serializeXml(root);
    const second = serializeXml(parseXml(first));
    expect(second).toBe(first);
  });

  it("renders self-closing tags for elements with no children", () => {
    const el = makeElement("empty");
    expect(serializeXml(el)).toContain("<empty/>");
  });
});

describe("findChildren", () => {
  it("returns all matching siblings, not just the first", () => {
    const root = parseXml(`<root><item n="1"/><item n="2"/><other/></root>`);
    const items = findChildren(root, "item");
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.attrs.n)).toEqual(["1", "2"]);
  });
});

describe("withChild / withText / withAttr immutability", () => {
  it("withChild returns a new object and does not mutate the original", () => {
    const root = parseXml(SAMPLE);
    const newB = makeElement("b", {}, []);
    const updated = withChild(root, newB);

    expect(updated).not.toBe(root);
    expect(findChild(root, "b")?.children.length).toBeGreaterThan(0);
    expect(findChild(updated, "b")?.children.length).toBe(0);
  });

  it("withText replaces direct text content without mutating the original", () => {
    const root = parseXml(SAMPLE);
    const a = findChild(root, "a")!;
    const updated = withText(a, "goodbye");

    expect(textOf(a)).toBe("hello");
    expect(textOf(updated)).toBe("goodbye");
  });

  it("withAttr sets an attribute without mutating the original", () => {
    const el = makeElement("x");
    const updated = withAttr(el, "id", "42");

    expect(el.attrs.id).toBeUndefined();
    expect(updated.attrs.id).toBe("42");
  });
});
