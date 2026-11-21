// =========================================
// MARKER ICONS
// Builds a round, coloured map pin with a Lucide icon inside
// for each category (settlement, shelter, hospital).
// =========================================

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import { MapPin } from "lucide-react";
import { CATEGORIES } from "../../config/mapConfig";

// Leaflet needs plain HTML text for custom icons, but Lucide icons
// are React components. So we draw the icon once into a temporary
// element and copy out its SVG text.
function iconToSvgText(IconComponent) {
  const container = document.createElement("div");
  const root = createRoot(container);
  flushSync(() => {
    root.render(
      createElement(IconComponent, { size: 15, color: "#ffffff", strokeWidth: 2.4 })
    );
  });
  const svgText = container.innerHTML;
  root.unmount();
  return svgText;
}

function createMarkerIcon(IconComponent, color) {
  return L.divIcon({
    className: "tt-marker", // our own class, styled in map.css
    html: `<div class="tt-marker-pin" style="--pin-color: ${color}">${iconToSvgText(IconComponent)}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15], // centre of the icon sits on the location
    popupAnchor: [0, -16] // popup opens just above the icon
  });
}

// One ready-made icon per category, e.g. MARKER_ICONS.shelter
export const MARKER_ICONS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([key, category]) => [
    key,
    createMarkerIcon(category.icon, category.color)
  ])
);

// Pin for a location the user picks on the map (SOS form)
export const PICK_ICON = L.divIcon({
  className: "tt-marker",
  html: `<div class="tt-pick-pin">${iconToSvgText(MapPin)}</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32]
});
