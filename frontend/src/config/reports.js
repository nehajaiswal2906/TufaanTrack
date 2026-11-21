// =========================================
// EMERGENCY REPORTS — settings
// Report types offered in the SOS form, and the three statuses
// the backend allows (see docs/API_CONTRACT.md).
// =========================================

// The backend accepts any report_type text. ROAD_BLOCKAGE is the one
// the impact assessment currently uses; the others are form options.
export const REPORT_TYPES = {
  ROAD_BLOCKAGE: "Road blockage",
  FLOODING: "Flooding / waterlogging",
  MEDICAL_EMERGENCY: "Medical emergency",
  STRUCTURE_DAMAGE: "Building or structure damage",
  PEOPLE_STRANDED: "People stranded",
  SHELTER_NEEDED: "Shelter needed",
  POWER_OR_COMMUNICATION: "Power or communication outage",
  OTHER: "Other"
};

// Readable name for any report type, including ones not in the list above
export function reportTypeLabel(type) {
  if (!type) return "Unknown type";
  return (
    REPORT_TYPES[type] ??
    type
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

export const REPORT_STATUSES = {
  UNVERIFIED: { label: "Unverified", color: "#f3b65c" },
  VERIFIED: { label: "Verified", color: "#36d69d" },
  REJECTED: { label: "Rejected", color: "#8ea3b9" }
};

export const STATUS_ORDER = ["UNVERIFIED", "VERIFIED", "REJECTED"];

// Description length limits used by the SOS form
export const DESCRIPTION_MIN = 10;
export const DESCRIPTION_MAX = 500;

// Puri district area (from data/SCHEMA.md) — used to warn, not block,
// if a location looks far outside the monitored area.
export const DISTRICT_BOUNDS = { minLat: 19.4, maxLat: 20.6, minLng: 85.0, maxLng: 86.5 };
