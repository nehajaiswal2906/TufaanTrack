// =========================================
// POPUP DETAILS
// Decides which rows to show in a marker popup for each category,
// using the field names from docs/API_CONTRACT.md and data/SCHEMA.md.
// Data-quality notes come straight from the fields the backend sends
// (pop_source, source, beds = 0) — nothing is guessed here.
// =========================================

import { Users, Mountain, Hash, Tag, BedDouble, Database } from "lucide-react";
import { SHELTER_TYPES, HOSPITAL_TYPES, SOURCES } from "../../config/facilityTypes";

const formatNumber = (n) => Number(n).toLocaleString("en-IN");
const has = (value) => value !== null && value !== undefined && value !== "";

// Returns { rows: [{ icon, label, value }], notes: [text] }
export function getPopupDetails(categoryKey, item) {
  const rows = [];
  const notes = [];

  if (categoryKey === "settlement") {
    if (has(item.population)) {
      const estimated = item.pop_source === "estimated_default";
      rows.push({
        icon: Users,
        label: "Population",
        value: `${formatNumber(item.population)}${estimated ? " (estimated)" : ""}`
      });
      if (estimated) notes.push("Population is an assumed default value, not Census data.");
    }
  }

  if (categoryKey === "shelter") {
    if (has(item.type)) rows.push({ icon: Tag, label: "Type", value: SHELTER_TYPES[item.type] ?? item.type });
    if (has(item.capacity)) {
      const candidate = item.source === "osm_candidate";
      rows.push({
        icon: Users,
        label: "Capacity",
        value: `${formatNumber(item.capacity)} people${candidate ? " (assumed)" : ""}`
      });
      if (candidate) {
        notes.push("Candidate shelter: official designation, structural safety and capacity are unverified.");
      }
    }
  }

  if (categoryKey === "hospital") {
    if (has(item.type)) rows.push({ icon: Tag, label: "Type", value: HOSPITAL_TYPES[item.type] ?? item.type });
    // beds = 0 means "unknown" in the data, so only show real counts
    if (item.beds > 0) {
      rows.push({ icon: BedDouble, label: "Beds", value: formatNumber(item.beds) });
    }
  }

  // Rows shared by every category
  if (has(item.elevation_m)) rows.push({ icon: Mountain, label: "Elevation", value: `${item.elevation_m} m` });
  if (has(item.source)) rows.push({ icon: Database, label: "Source", value: SOURCES[item.source] ?? item.source });
  if (has(item.id)) rows.push({ icon: Hash, label: "ID", value: item.id });

  return { rows, notes };
}
