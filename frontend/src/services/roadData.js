import { api } from "./api";

// Loads roads and bridges from /api/roads (a GeoJSON FeatureCollection).
// The prototype backend currently returns an empty collection.
export async function loadRoads() {
  const roads = await api.getRoads();
  return {
    type: "FeatureCollection",
    features: Array.isArray(roads?.features) ? roads.features : []
  };
}
