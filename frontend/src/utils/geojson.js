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
