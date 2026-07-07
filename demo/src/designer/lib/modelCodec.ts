import { type XmlElement, findChild, parseXml, serializeXml } from "./xmlTree";
import { setAtPath } from "./xmlPath";
import { readField, writeField } from "./schemaForm";
import type { FieldSchema, SectionSchema } from "../schema/types";

/** A Designer model IS the parsed <fdm_config> tree — schema fields are
 * typed views/setters into specific paths within it. Unmapped elements
 * (engine internals, function math nodes, …) pass through untouched. */
export type DesignerModel = XmlElement;

export function parseModel(xmlText: string): DesignerModel {
  const root = parseXml(xmlText);
  if (root.tag !== "fdm_config") {
    throw new Error(`Expected root element <fdm_config>, got <${root.tag}>`);
  }
  return root;
}

export function serializeModel(model: DesignerModel): string {
  return serializeXml(model);
}

export function getSectionRoot(model: DesignerModel | null, section: SectionSchema): XmlElement | undefined {
  return model ? findChild(model, section.rootTag) : undefined;
}

export function getModelField(model: DesignerModel | null, section: SectionSchema, field: FieldSchema): string {
  return readField(getSectionRoot(model, section), field);
}

export function setModelField(
  model: DesignerModel,
  section: SectionSchema,
  field: FieldSchema,
  value: string
): DesignerModel {
  return setAtPath(model, [{ tag: section.rootTag }], (sectionRoot) => writeField(sectionRoot, field, value));
}

/** Immutably replace an entire section's subtree (used by the aerodynamics
 * function editors, which mutate the aerodynamics tree directly). */
export function setSectionRoot(model: DesignerModel, section: SectionSchema, newSectionRoot: XmlElement): DesignerModel {
  return setAtPath(model, [{ tag: section.rootTag }], () => newSectionRoot);
}
