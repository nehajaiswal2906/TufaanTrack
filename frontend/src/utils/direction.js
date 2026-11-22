// =========================================
// DIRECTION HELPERS
// Works out which way the cyclone track is heading,
// using only the track points sent by the backend.
// =========================================

const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;

// Compass bearing from point A to point B, in degrees
// (0 = north, 90 = east, 180 = south, 270 = west).
// Points are [latitude, longitude].
export function bearingDegrees([lat1, lon1], [lat2, lon2]) {
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const lonDiffRad = toRadians(lon2 - lon1);

  const y = Math.sin(lonDiffRad) * Math.cos(lat2Rad);
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiffRad);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS = [
  { short: "N", long: "North" },
  { short: "NE", long: "North-east" },
  { short: "E", long: "East" },
  { short: "SE", long: "South-east" },
  { short: "S", long: "South" },
  { short: "SW", long: "South-west" },
  { short: "W", long: "West" },
  { short: "NW", long: "North-west" }
];

// Turns a bearing like 315° into { short: "NW", long: "North-west" }
export function compassDirection(degrees) {
  return COMPASS[Math.round(degrees / 45) % 8];
}

// Summary of a track: overall direction plus the bearing of each segment.
// `latlngs` is the list of track points in order.
export function describeTrack(latlngs) {
  if (!latlngs || latlngs.length < 2) return null;

  const first = latlngs[0];
  const last = latlngs[latlngs.length - 1];
  const overall = bearingDegrees(first, last);

  const segments = latlngs.slice(1).map((point, i) => {
    const from = latlngs[i];
    return {
      from,
      to: point,
      midpoint: [(from[0] + point[0]) / 2, (from[1] + point[1]) / 2],
      bearing: bearingDegrees(from, point)
    };
  });

  return {
    first,
    last,
    bearing: Math.round(overall),
    direction: compassDirection(overall),
    segments
  };
}
