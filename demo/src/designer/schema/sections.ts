import type { SectionSchema } from "./types";

function loc(name: string, axis: "x" | "y" | "z") {
  return [{ tag: "location", match: { name } }, { tag: axis }];
}

export const GENERAL_INFO_SECTION: SectionSchema = {
  id: "generalInformation",
  label: "General Information",
  rootTag: "fileheader",
  fields: [
    { id: "author", label: "Author", type: "text", path: [{ tag: "author" }] },
    { id: "filecreationdate", label: "File Creation Date", type: "text", path: [{ tag: "filecreationdate" }] },
    { id: "version", label: "Version", type: "text", path: [{ tag: "version" }] },
    { id: "description", label: "Description", type: "text", path: [{ tag: "description" }] },
  ],
};

export const METRICS_SECTION: SectionSchema = {
  id: "metrics",
  label: "Metrics",
  rootTag: "metrics",
  fields: [
    { id: "wingarea", label: "Wing Area", type: "number", unit: "ft²", path: [{ tag: "wingarea" }], required: true },
    { id: "wingspan", label: "Wing Span", type: "number", unit: "ft", path: [{ tag: "wingspan" }] },
    { id: "chord", label: "Chord", type: "number", unit: "ft", path: [{ tag: "chord" }] },
    { id: "htailarea", label: "Horizontal Tail Area", type: "number", unit: "ft²", path: [{ tag: "htailarea" }] },
    { id: "htailarm", label: "Horizontal Tail Arm", type: "number", unit: "ft", path: [{ tag: "htailarm" }] },
    { id: "vtailarea", label: "Vertical Tail Area", type: "number", unit: "ft²", path: [{ tag: "vtailarea" }] },
    { id: "vtailarm", label: "Vertical Tail Arm", type: "number", unit: "ft", path: [{ tag: "vtailarm" }] },
    { id: "aerorpX", label: "Aero Reference Point X", type: "number", unit: "in", path: loc("AERORP", "x") },
    { id: "aerorpY", label: "Aero Reference Point Y", type: "number", unit: "in", path: loc("AERORP", "y") },
    { id: "aerorpZ", label: "Aero Reference Point Z", type: "number", unit: "in", path: loc("AERORP", "z") },
    { id: "eyepointX", label: "Eyepoint X", type: "number", unit: "in", path: loc("EYEPOINT", "x") },
    { id: "eyepointY", label: "Eyepoint Y", type: "number", unit: "in", path: loc("EYEPOINT", "y") },
    { id: "eyepointZ", label: "Eyepoint Z", type: "number", unit: "in", path: loc("EYEPOINT", "z") },
    { id: "vrpX", label: "Visual Reference Point X", type: "number", unit: "in", path: loc("VRP", "x") },
    { id: "vrpY", label: "Visual Reference Point Y", type: "number", unit: "in", path: loc("VRP", "y") },
    { id: "vrpZ", label: "Visual Reference Point Z", type: "number", unit: "in", path: loc("VRP", "z") },
  ],
};

export const MASS_BALANCE_SECTION: SectionSchema = {
  id: "massBalance",
  label: "Mass & Balance",
  rootTag: "mass_balance",
  fields: [
    { id: "ixx", label: "Ixx", type: "number", unit: "slug·ft²", path: [{ tag: "ixx" }], required: true },
    { id: "iyy", label: "Iyy", type: "number", unit: "slug·ft²", path: [{ tag: "iyy" }], required: true },
    { id: "izz", label: "Izz", type: "number", unit: "slug·ft²", path: [{ tag: "izz" }], required: true },
    { id: "emptywt", label: "Empty Weight", type: "number", unit: "lbs", path: [{ tag: "emptywt" }], required: true },
    { id: "cgX", label: "CG X", type: "number", unit: "in", path: loc("CG", "x") },
    { id: "cgY", label: "CG Y", type: "number", unit: "in", path: loc("CG", "y") },
    { id: "cgZ", label: "CG Z", type: "number", unit: "in", path: loc("CG", "z") },
  ],
};

export const GROUND_REACTIONS_SECTION: SectionSchema = {
  id: "groundReactions",
  label: "Ground Reactions",
  rootTag: "ground_reactions",
  fields: [
    { id: "contactName", label: "Contact Name", type: "text", path: [{ tag: "contact" }], attr: "name" },
    { id: "contactType", label: "Contact Type", type: "text", path: [{ tag: "contact" }], attr: "type" },
    { id: "contactX", label: "Location X", type: "number", unit: "in", path: [{ tag: "contact" }, { tag: "location" }, { tag: "x" }] },
    { id: "contactY", label: "Location Y", type: "number", unit: "in", path: [{ tag: "contact" }, { tag: "location" }, { tag: "y" }] },
    { id: "contactZ", label: "Location Z", type: "number", unit: "in", path: [{ tag: "contact" }, { tag: "location" }, { tag: "z" }] },
    { id: "staticFriction", label: "Static Friction", type: "number", path: [{ tag: "contact" }, { tag: "static_friction" }] },
    { id: "dynamicFriction", label: "Dynamic Friction", type: "number", path: [{ tag: "contact" }, { tag: "dynamic_friction" }] },
    { id: "rollingFriction", label: "Rolling Friction", type: "number", path: [{ tag: "contact" }, { tag: "rolling_friction" }] },
    { id: "springCoeff", label: "Spring Coefficient", type: "number", unit: "lbs/ft", path: [{ tag: "contact" }, { tag: "spring_coeff" }] },
    { id: "dampingCoeff", label: "Damping Coefficient", type: "number", unit: "lbs/ft/sec", path: [{ tag: "contact" }, { tag: "damping_coeff" }] },
    { id: "maxSteer", label: "Max Steer Angle", type: "number", unit: "deg", path: [{ tag: "contact" }, { tag: "max_steer" }] },
    { id: "brakeGroup", label: "Brake Group", type: "text", path: [{ tag: "contact" }, { tag: "brake_group" }] },
    { id: "retractable", label: "Retractable", type: "select", options: [{ value: "0", label: "No" }, { value: "1", label: "Yes" }], path: [{ tag: "contact" }, { tag: "retractable" }] },
  ],
};

export const PROPULSION_SECTION: SectionSchema = {
  id: "propulsion",
  label: "Propulsion",
  rootTag: "propulsion",
  fields: [],
};

export const FLIGHT_CONTROL_SECTION: SectionSchema = {
  id: "flightControl",
  label: "Flight Control",
  rootTag: "flight_control",
  fields: [],
};

export const SIMPLE_SECTIONS: readonly SectionSchema[] = [
  GENERAL_INFO_SECTION,
  METRICS_SECTION,
  MASS_BALANCE_SECTION,
  GROUND_REACTIONS_SECTION,
  PROPULSION_SECTION,
  FLIGHT_CONTROL_SECTION,
];
