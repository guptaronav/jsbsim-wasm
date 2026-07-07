import type { XmlElement } from "./xmlTree";
import { textOf, withAttr, withText } from "./xmlTree";
import { resolvePath, setAtPath } from "./xmlPath";
import type { FieldSchema, SectionSchema } from "../schema/types";

/** Read a field's current string value from a section root (or "" if absent). */
export function readField(sectionRoot: XmlElement | undefined, field: FieldSchema): string {
  if (!sectionRoot) return "";
  const target = resolvePath(sectionRoot, field.path);
  if (!target) return "";
  return field.attr ? target.attrs[field.attr] ?? "" : textOf(target);
}

/** Immutably write a field's value into a section root, creating any missing elements. */
export function writeField(sectionRoot: XmlElement, field: FieldSchema, value: string): XmlElement {
  return setAtPath(sectionRoot, field.path, (leaf) => (field.attr ? withAttr(leaf, field.attr, value) : withText(leaf, value)));
}

export interface FieldError {
  sectionId: string;
  fieldId: string;
  message: string;
}

function validateFieldValue(field: FieldSchema, value: string): string | null {
  if (field.required && value.trim().length === 0) {
    return `${field.label} is required`;
  }
  if (value.trim().length === 0) return null;
  if (field.type === "number" && Number.isNaN(Number(value))) {
    return `${field.label} must be a number`;
  }
  if (field.type === "select" && field.options && !field.options.some((o) => o.value === value)) {
    return `${field.label} must be one of: ${field.options.map((o) => o.value).join(", ")}`;
  }
  return null;
}

/** Validate every field in a section against the current model. */
export function validateSection(sectionRoot: XmlElement | undefined, section: SectionSchema): FieldError[] {
  const errors: FieldError[] = [];
  for (const field of section.fields) {
    const value = readField(sectionRoot, field);
    const message = validateFieldValue(field, value);
    if (message) errors.push({ sectionId: section.id, fieldId: field.id, message });
  }
  return errors;
}
