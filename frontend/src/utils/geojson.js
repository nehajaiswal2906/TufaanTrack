// =========================================
// GEOJSON HELPERS
// The backend sends map data as GeoJSON, where every coordinate
// is written as [longitude, latitude].
// Leaflet markers need [latitude, longitude], so we convert here.
// =========================================

// Turns a GeoJSON FeatureCollection of Points into simple objects:
//   { id, latitude, longitude, ...all the properties }
// `idField` is the property that holds the ID, e.g. "village_id".
export function featuresToPoints(collection, idField) {
  const features = collection?.features ?? [];

  return features
    .filter((feature) => feature?.geometry?.type === "Point")
    .map((feature, index) => {
      const [longitude, latitude] = feature.geometry.coordinates; // GeoJSON order!
      const properties = feature.properties ?? {};

      return {
        ...properties,
        id: properties[idField] ?? `${idField}-${index}`,
        latitude,
        longitude
      };
    });
}

// Converts one GeoJSON position [longitude, latitude] to Leaflet's [latitude, longitude]
export const toLatLng = ([longitude, latitude]) => [latitude, longitude];

// Converts a GeoJSON line or polygon into the nested [lat, lng] arrays
// that react-leaflet's <Polyline> and <Polygon> expect.
export function geometryToLatLngs(geometry) {
  if (!geometry) return [];

  switch (geometry.type) {
    case "LineString":
      return geometry.coordinates.map(toLatLng);
    case "Polygon":
      return geometry.coordinates.map((ring) => ring.map(toLatLng));
    case "MultiPolygon":
      return geometry.coordinates.map((polygon) =>
        polygon.map((ring) => ring.map(toLatLng))
      );
    default:
      return [];
  }
}

// Flattens any nesting of [lat, lng] arrays into one simple list of points
export function flattenLatLngs(nested) {
  if (!Array.isArray(nested) || nested.length === 0) return [];
  if (typeof nested[0] === "number") return [nested]; // this is one point
  return nested.flatMap(flattenLatLngs);
}
