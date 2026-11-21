import { api } from "./api";
import { geometryToLatLngs } from "../utils/geojson";
import { describeTrack } from "../utils/direction";

// Draw ORANGE first and RED last, so the more severe zone sits on top
const ZONE_DRAW_ORDER = { ORANGE: 0, RED: 1 };

// Loads the cyclone track (/api/cyclone) and warning zones (/api/warning-zone)
// and returns them ready for the map and the information panel:
//   {
//     tracks: [{ id, name, category, simulated, latlngs, movement }],
//     zones:  [{ id, zone, surgeMeters, simulated, latlngs }]
//   }
export async function loadCycloneScenario() {
  const [trackCollection, zoneCollection] = await Promise.all([
    api.getCyclone(),
    api.getWarningZone()
  ]);

  const tracks = (trackCollection?.features ?? [])
    .filter((feature) => feature?.geometry?.type === "LineString")
    .map((feature, index) => {
      const props = feature.properties ?? {};
      const latlngs = geometryToLatLngs(feature.geometry);
      return {
        id: props.warning_id ?? `track-${index}`,
        name: props.track_name ?? "Unnamed cyclone track",
        category: props.category ?? null,
        simulated: props.simulated === true,
        latlngs,
        movement: describeTrack(latlngs)
      };
    });

  const zones = (zoneCollection?.features ?? [])
    .filter((feature) => ["Polygon", "MultiPolygon"].includes(feature?.geometry?.type))
    .map((feature, index) => {
      const props = feature.properties ?? {};
      return {
        id: props.warning_id ?? `zone-${index}`,
        zone: props.zone ?? "UNKNOWN",
        surgeMeters: props.projected_surge_m ?? null,
        simulated: props.simulated === true,
        latlngs: geometryToLatLngs(feature.geometry)
      };
    })
    .sort((a, b) => (ZONE_DRAW_ORDER[a.zone] ?? -1) - (ZONE_DRAW_ORDER[b.zone] ?? -1));

  return { tracks, zones };
}

// True if any part of the scenario is marked as simulated
export function isSimulated(scenario) {
  return Boolean(
    scenario &&
      (scenario.tracks.some((t) => t.simulated) || scenario.zones.some((z) => z.simulated))
  );
}
