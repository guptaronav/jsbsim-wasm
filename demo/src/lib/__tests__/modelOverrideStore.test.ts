import { describe, it, expect, afterEach } from "vitest";
import { clearModelOverrides, getModelOverride, setModelOverride } from "../modelOverrideStore";

afterEach(() => {
  clearModelOverrides();
});

describe("modelOverrideStore", () => {
  it("returns undefined for a path with no override set", () => {
    expect(getModelOverride("aircraft/x.xml")).toBeUndefined();
  });

  it("returns the content set for a given runtime path", () => {
    setModelOverride("aircraft/x.xml", "<a/>");
    expect(getModelOverride("aircraft/x.xml")).toBe("<a/>");
  });

  it("keeps overrides for different paths independent", () => {
    setModelOverride("aircraft/x.xml", "<a/>");
    setModelOverride("aircraft/y.xml", "<b/>");
    expect(getModelOverride("aircraft/x.xml")).toBe("<a/>");
    expect(getModelOverride("aircraft/y.xml")).toBe("<b/>");
  });

  it("clearModelOverrides removes every override", () => {
    setModelOverride("aircraft/x.xml", "<a/>");
    clearModelOverrides();
    expect(getModelOverride("aircraft/x.xml")).toBeUndefined();
  });
});
