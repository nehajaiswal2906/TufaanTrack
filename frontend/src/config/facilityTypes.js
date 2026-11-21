// =========================================
// FACILITY TYPES & SOURCES
// Readable names for the `type` and `source` values the backend sends
// (see data/SCHEMA.md). Shared by popups and the infrastructure pages.
// =========================================

export const SHELTER_TYPES = {
  cyclone_shelter: "Cyclone shelter",
  school: "School (candidate shelter)",
  community_hall: "Community hall"
};

export const HOSPITAL_TYPES = {
  district_hospital: "District hospital",
  CHC: "Community Health Centre (CHC)",
  PHC: "Primary Health Centre (PHC)",
  hospital: "Hospital",
  clinic: "Clinic"
};

export const SOURCES = {
  osm: "OpenStreetMap",
  osm_candidate: "OpenStreetMap (candidate)"
};

// Readable name for a type, falling back to the raw value
export const typeLabel = (types, value) => types[value] ?? value ?? "Unknown type";
