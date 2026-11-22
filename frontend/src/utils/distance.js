// =========================================
// DISTANCE HELPERS (display only)
// Straight-line ("as the crow flies") distances, used only to show
// the closest facilities in the interface. They are NOT road distances,
// and they are not the backend's assessment.
// =========================================

const EARTH_RADIUS_KM = 6371;
const toRadians = (deg) => (deg * Math.PI) / 180;

// Distance in km between two { latitude, longitude } objects
export function distanceKm(a, b) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// The `count` closest items to `origin`, each with a `distanceKm` added
export function closestItems(origin, items, count = 3) {
  return (items ?? [])
    .map((item) => ({ ...item, distanceKm: distanceKm(origin, item) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}
