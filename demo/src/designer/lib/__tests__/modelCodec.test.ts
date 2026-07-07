import { describe, it, expect } from "vitest";
import { getModelField, parseModel, serializeModel, setModelField } from "../modelCodec";
import { GENERAL_INFO_SECTION, METRICS_SECTION } from "../../schema/sections";

const FDM_XML = `<?xml version="1.0"?>
<fdm_config name="Test Rocket" version="2.0">
  <fileheader>
    <author>Test Author</author>
    <version>1.0</version>
  </fileheader>
  <metrics>
    <wingarea unit="FT2">0.12</wingarea>
  </metrics>
</fdm_config>`;

describe("parseModel", () => {
  it("parses a well-formed fdm_config document", () => {
    const model = parseModel(FDM_XML);
    expect(model.tag).toBe("fdm_config");
  });

  it("rejects a document whose root is not fdm_config", () => {
    expect(() => parseModel(`<not_fdm_config></not_fdm_config>`)).toThrow(/fdm_config/);
  });
});

describe("getModelField / setModelField", () => {
  it("reads a field from an existing section", () => {
    const model = parseModel(FDM_XML);
    expect(getModelField(model, GENERAL_INFO_SECTION, GENERAL_INFO_SECTION.fields[0])).toBe("Test Author");
  });

  it("returns empty string for a field whose section is absent", () => {
    const model = parseModel(`<fdm_config></fdm_config>`);
    expect(getModelField(model, GENERAL_INFO_SECTION, GENERAL_INFO_SECTION.fields[0])).toBe("");
  });

  it("writes a field immutably and the change is readable afterward", () => {
    const model = parseModel(FDM_XML);
    const authorField = GENERAL_INFO_SECTION.fields[0];
    const updated = setModelField(model, GENERAL_INFO_SECTION, authorField, "New Author");

    expect(getModelField(model, GENERAL_INFO_SECTION, authorField)).toBe("Test Author");
    expect(getModelField(updated, GENERAL_INFO_SECTION, authorField)).toBe("New Author");
  });

  it("creates a section's fields even if the section did not previously exist", () => {
    const model = parseModel(`<fdm_config></fdm_config>`);
    const wingareaField = METRICS_SECTION.fields[0];
    const updated = setModelField(model, METRICS_SECTION, wingareaField, "0.5");
    expect(getModelField(updated, METRICS_SECTION, wingareaField)).toBe("0.5");
  });
});

describe("parseModel -> serializeModel round-trip", () => {
  it("preserves section field values through a full cycle", () => {
    const model = parseModel(FDM_XML);
    const serialized = serializeModel(model);
    const reparsed = parseModel(serialized);

    expect(getModelField(reparsed, GENERAL_INFO_SECTION, GENERAL_INFO_SECTION.fields[0])).toBe("Test Author");
    expect(getModelField(reparsed, METRICS_SECTION, METRICS_SECTION.fields[0])).toBe("0.12");
  });

  it("is deterministic: re-serializing the reparsed model yields identical XML", () => {
    const model = parseModel(FDM_XML);
    const first = serializeModel(model);
    const second = serializeModel(parseModel(first));
    expect(second).toBe(first);
  });

  it("preserves unmapped elements verbatim (e.g. the fdm_config name attribute)", () => {
    const model = parseModel(FDM_XML);
    const serialized = serializeModel(model);
    expect(serialized).toContain('name="Test Rocket"');
  });
});
