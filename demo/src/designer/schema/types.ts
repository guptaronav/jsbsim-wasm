import type { XmlPathSegment } from "../lib/xmlPath";

export type FieldType = "text" | "number" | "select";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldSchema {
  id: string;
  label: string;
  type: FieldType;
  unit?: string;
  help?: string;
  options?: FieldOption[];
  /** Path from the section root to the element holding this field's value. */
  path: XmlPathSegment[];
  /** If set, read/write this attribute on the resolved element instead of its text content. */
  attr?: string;
  required?: boolean;
}

export interface SectionSchema {
  id: string;
  label: string;
  /** Tag of this section's root element directly under <fdm_config>. */
  rootTag: string;
  fields: FieldSchema[];
}
