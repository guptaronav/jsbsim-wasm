import { describe, it, expect } from "vitest";
import { parseXml, textOf } from "../xmlTree";
import { resolvePath } from "../xmlPath";
import { readField, validateSection, writeField } from "../schemaForm";
import type { FieldSchema, SectionSchema } from "../../schema/types";

const METRICS_XML = `<?xml version="1.0"?>
<metrics>
  <wingarea unit="FT2">0.12</wingarea>
  <location name="AERORP" unit="IN">
    <x>1.0</x>
  </location>
</metrics>`;

const wingareaField: FieldSchema = {
  id: "wingarea",
  label: "Wing Area",
  type: "number",
  unit: "ft²",
  path: [{ tag: "wingarea" }],
  required: true,
};

const wingareaUnitField: FieldSchema = {
  id: "wingareaUnit",
  label: "Wing Area Unit",
  type: "text",
  path: [{ tag: "wingarea" }],
  attr: "unit",
};

const aerorpXField: FieldSchema = {
  id: "aerorpX",
  label: "AERORP X",
  type: "number",
  path: [{ tag: "location", match: { name: "AERORP" } }, { tag: "x" }],
};

const missingField: FieldSchema = {
  id: "missing",
  label: "Missing Field",
  type: "text",
  path: [{ tag: "nonexistent" }],
};

describe("readField", () => {
  it("reads text content at a resolved path", () => {
    const root = parseXml(METRICS_XML);
    expect(readField(root, wingareaField)).toBe("0.12");
  });

  it("reads an attribute when field.attr is set", () => {
    const root = parseXml(METRICS_XML);
    expect(readField(root, wingareaUnitField)).toBe("FT2");
  });

  it("reads through a disambiguated nested path", () => {
    const root = parseXml(METRICS_XML);
    expect(readField(root, aerorpXField)).toBe("1.0");
  });

  it("returns an empty string when the section root is undefined", () => {
    expect(readField(undefined, wingareaField)).toBe("");
  });

  it("returns an empty string when the path does not resolve", () => {
    const root = parseXml(METRICS_XML);
    expect(readField(root, missingField)).toBe("");
  });
});

describe("writeField", () => {
  it("writes text content immutably", () => {
    const root = parseXml(METRICS_XML);
    const updated = writeField(root, wingareaField, "0.25");
    expect(readField(root, wingareaField)).toBe("0.12");
    expect(readField(updated, wingareaField)).toBe("0.25");
  });

  it("writes an attribute when field.attr is set", () => {
    const root = parseXml(METRICS_XML);
    const updated = writeField(root, wingareaUnitField, "M2");
    expect(readField(updated, wingareaUnitField)).toBe("M2");
    // Text content is untouched.
    expect(textOf(resolvePath(updated, [{ tag: "wingarea" }]))).toBe("0.12");
  });

  it("creates missing elements on write", () => {
    const root = parseXml(METRICS_XML);
    const updated = writeField(root, missingField, "hello");
    expect(readField(updated, missingField)).toBe("hello");
  });
});

describe("validateSection", () => {
  const section: SectionSchema = {
    id: "metrics",
    label: "Metrics",
    rootTag: "metrics",
    fields: [wingareaField, aerorpXField],
  };

  it("returns no errors when required fields are populated and valid", () => {
    const root = parseXml(METRICS_XML);
    expect(validateSection(root, section)).toEqual([]);
  });

  it("flags a required field that is missing", () => {
    const emptyRoot = parseXml(`<metrics></metrics>`);
    const errors = validateSection(emptyRoot, section);
    expect(errors.some((e) => e.fieldId === "wingarea")).toBe(true);
  });

  it("flags a non-numeric value for a number field", () => {
    const root = parseXml(`<metrics><wingarea unit="FT2">not-a-number</wingarea></metrics>`);
    const errors = validateSection(root, section);
    expect(errors.some((e) => e.fieldId === "wingarea" && /number/.test(e.message))).toBe(true);
  });

  it("does not flag an optional, absent field", () => {
    const emptyRoot = parseXml(`<metrics><wingarea unit="FT2">0.1</wingarea></metrics>`);
    const errors = validateSection(emptyRoot, section);
    expect(errors.some((e) => e.fieldId === "aerorpX")).toBe(false);
  });
});
