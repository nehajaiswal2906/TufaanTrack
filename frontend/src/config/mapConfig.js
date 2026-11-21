// =========================================
// MAP CONFIG
// Settings shared by every map in TufaanTrack:
// starting position, background maps and marker categories.
// =========================================

import { House, ShieldCheck, Cross } from "lucide-react";

// Starting view: Puri, Odisha
export const MAP_CENTER = [19.8135, 85.8312];
export const MAP_ZOOM = 11;

// Background map styles the user can switch between.
// Both use free OpenStreetMap tiles (no API key needed).
// "Dark" is the same map, darkened with a CSS filter (see map.css).
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const BASE_LAYERS = [
  { name: "Dark", url: OSM_URL, attribution: OSM_ATTRIBUTION, className: "dark-tiles" },
  { name: "Street", url: OSM_URL, attribution: OSM_ATTRIBUTION, className: "" }
];

// Marker categories. The keys (settlement, shelter, hospital)
// are used everywhere: filters, legend, icons and data.
export const CATEGORIES = {
  settlement: {
    label: "Settlements",
    singular: "Settlement",
    color: "#46a8ff",
    icon: House
  },
  shelter: {
    label: "Shelters",
    singular: "Shelter",
    color: "#40d99a",
    icon: ShieldCheck
  },
  hospital: {
    label: "Hospitals",
    singular: "Hospital / Health Centre",
    color: "#ff6576",
    icon: Cross
  }
};

// Colours for map shapes (also used by the legend)
export const WARNING_COLOR = "#f3a64c";
export const TRACK_COLOR = "#ff647c";
