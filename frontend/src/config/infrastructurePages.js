// =========================================
// INFRASTRUCTURE PAGES
// One settings object per page. The shared <FacilityPage> reads these,
// so Shelters and Medical Facilities look and work the same way.
// All numbers come from backend fields — nothing is invented here.
// =========================================

import { ShieldCheck, Users, BadgeCheck, Layers, Cross, Stethoscope, Building2, BedDouble } from "lucide-react";
import { SHELTER_TYPES, HOSPITAL_TYPES, typeLabel } from "./facilityTypes";

const fmt = (n) => Number(n).toLocaleString("en-IN");

// Counts items per `type`, e.g. { school: 36 }
export function countByType(items) {
  return items.reduce((counts, item) => {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
    return counts;
  }, {});
}

export const SHELTER_PAGE = {
  categoryKey: "shelter",
  idField: "shelter_id",
  singular: "Shelter",
  plural: "Shelters",
  eyebrow: "EMERGENCY INFRASTRUCTURE",
  types: SHELTER_TYPES,

  notice:
    "These are schools mapped in OpenStreetMap, used as CANDIDATE shelters. Whether each one is an official " +
    "cyclone shelter, its structural safety and its capacity are unverified. A capacity of 50 is an assumed default.",

  // The number shown in each list row and used for sorting
  metric: {
    label: "Capacity",
    sortLabel: "Capacity (largest first)",
    value: (item) => item.capacity ?? null,
    display: (item) =>
      item.capacity != null
        ? `${fmt(item.capacity)} people${item.source === "osm_candidate" ? " (assumed)" : ""}`
        : "Not available"
  },

  summary: (items) => {
    const assumed = items.filter((s) => s.source === "osm_candidate").length;
    const totalCapacity = items.reduce((sum, s) => sum + (s.capacity ?? 0), 0);
    const byType = countByType(items);
    return [
      { icon: ShieldCheck, label: "Candidate shelters", value: fmt(items.length), note: "From OpenStreetMap" },
      {
        icon: Users,
        label: "Total capacity",
        value: fmt(totalCapacity),
        note: assumed ? `Assumed default for ${assumed} of ${items.length}` : "From OpenStreetMap"
      },
      {
        icon: BadgeCheck,
        label: "Verified capacity",
        value: `${items.length - assumed} of ${items.length}`,
        note: "Capacity taken from map data"
      },
      {
        icon: Layers,
        label: "Shelter types",
        value: Object.keys(byType).length,
        note: Object.entries(byType)
          .map(([type, n]) => `${typeLabel(SHELTER_TYPES, type)}: ${n}`)
          .join(", ")
      }
    ];
  },

  // Extra notes shown in the details panel
  notes: (item) =>
    item.source === "osm_candidate"
      ? ["Candidate shelter: official designation, structural safety and capacity are unverified."]
      : []
};

export const HOSPITAL_PAGE = {
  categoryKey: "hospital",
  idField: "hospital_id",
  singular: "Health facility",
  plural: "Medical Facilities",
  eyebrow: "HEALTHCARE NETWORK",
  types: HOSPITAL_TYPES,

  notice:
    "Hospitals and health centres mapped in OpenStreetMap. Most facilities have no bed count recorded — " +
    "these are shown as \"Not recorded\" rather than zero.",

  metric: {
    label: "Beds",
    sortLabel: "Beds (most first)",
    value: (item) => (item.beds > 0 ? item.beds : null),
    display: (item) => (item.beds > 0 ? `${fmt(item.beds)} beds` : "Beds not recorded")
  },

  summary: (items) => {
    const byType = countByType(items);
    const withBeds = items.filter((h) => h.beds > 0).length;
    const larger = (byType.district_hospital ?? 0) + (byType.hospital ?? 0) + (byType.CHC ?? 0);
    return [
      { icon: Cross, label: "Health facilities", value: fmt(items.length), note: "From OpenStreetMap" },
      { icon: Stethoscope, label: "Primary health centres", value: fmt(byType.PHC ?? 0), note: "Type PHC" },
      { icon: Building2, label: "Hospitals & CHCs", value: fmt(larger), note: "District, hospital and CHC" },
      { icon: BedDouble, label: "Bed count recorded", value: `${withBeds} of ${items.length}`, note: "Others not recorded" }
    ];
  },

  notes: (item) => (item.beds > 0 ? [] : ["Bed count is not recorded in the data."])
};
