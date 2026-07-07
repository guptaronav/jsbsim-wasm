import type { SectionSchema } from "./types";

export const AXIS_SYSTEM_OPTIONS = [
  { value: "STANDARD", label: "Lift/Drag/Side + Roll/Pitch/Yaw" },
  { value: "BODY", label: "Body Axis (X/Y/Z Force + Moment)" },
  { value: "WIND", label: "Wind Axis" },
];

export const AERODYNAMICS_SECTION: SectionSchema = {
  id: "aerodynamics",
  label: "Aerodynamics",
  rootTag: "aerodynamics",
  fields: [
    {
      id: "axisSystem",
      label: "Axis System",
      type: "select",
      path: [],
      attr: "axis-system",
      options: AXIS_SYSTEM_OPTIONS,
      help: "Convention used for the aerodynamic force/moment axes.",
    },
    {
      id: "alphaMin",
      label: "Alpha Min",
      type: "number",
      unit: "deg",
      path: [{ tag: "alpha_min" }],
      help: "Lower bound of the modeled angle-of-attack range before stall logic engages.",
    },
    {
      id: "alphaMax",
      label: "Alpha Max",
      type: "number",
      unit: "deg",
      path: [{ tag: "alpha_max" }],
      help: "Upper bound of the modeled angle-of-attack range before stall logic engages.",
    },
    {
      id: "hysteresisMin",
      label: "Hysteresis Min",
      type: "number",
      unit: "deg",
      path: [{ tag: "hysteresis_min" }],
      help: "Angle-of-attack at which post-stall recovery hysteresis begins.",
    },
    {
      id: "hysteresisMax",
      label: "Hysteresis Max",
      type: "number",
      unit: "deg",
      path: [{ tag: "hysteresis_max" }],
      help: "Angle-of-attack at which post-stall recovery hysteresis ends.",
    },
  ],
};
