import { type FieldError, validateSection } from "./schemaForm";
import { getSectionRoot, type DesignerModel } from "./modelCodec";
import { SIMPLE_SECTIONS } from "../schema/sections";
import { AERODYNAMICS_SECTION } from "../schema/aerodynamics";

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

const ALL_SECTIONS = [...SIMPLE_SECTIONS, AERODYNAMICS_SECTION];

export function validateModel(model: DesignerModel | null): ValidationResult {
  if (!model) {
    return { valid: false, errors: [{ sectionId: "root", fieldId: "root", message: "No model loaded" }] };
  }
  if (model.tag !== "fdm_config") {
    return {
      valid: false,
      errors: [{ sectionId: "root", fieldId: "root", message: "Root element must be <fdm_config>" }],
    };
  }

  const errors = ALL_SECTIONS.flatMap((section) => validateSection(getSectionRoot(model, section), section));
  return { valid: errors.length === 0, errors };
}
