import { describe, it, expect } from "vitest";
import { parseModel } from "../modelCodec";
import { validateModel } from "../validator";

const VALID_FDM = `<?xml version="1.0"?>
<fdm_config name="Test" version="2.0">
  <metrics>
    <wingarea unit="FT2">0.12</wingarea>
  </metrics>
  <mass_balance>
    <ixx unit="SLUG*FT2">0.02</ixx>
    <iyy unit="SLUG*FT2">0.08</iyy>
    <izz unit="SLUG*FT2">0.08</izz>
    <emptywt unit="LBS">4.5</emptywt>
  </mass_balance>
</fdm_config>`;

describe("validateModel", () => {
  it("reports invalid when no model is loaded", () => {
    const result = validateModel(null);
    expect(result.valid).toBe(false);
  });

  it("reports invalid when the root tag is not fdm_config", () => {
    // parseModel would throw for this; simulate a bad model object directly.
    const badModel = { tag: "not_fdm_config", attrs: {}, children: [] };
    const result = validateModel(badModel);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toMatch(/fdm_config/);
  });

  it("passes when all required fields are present and valid", () => {
    const model = parseModel(VALID_FDM);
    const result = validateModel(model);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("flags missing required fields across sections", () => {
    const model = parseModel(`<fdm_config></fdm_config>`);
    const result = validateModel(model);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
