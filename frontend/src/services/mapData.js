import { api } from "./api";
import { featuresToPoints } from "../utils/geojson";

// Loads settlements, shelters and hospitals at the same time and
// returns them in the shape <MapView data={...}> expects:
//   { settlement: [...], shelter: [...], hospital: [...] }
export async function loadMapPoints() {
  const [settlements, shelters, hospitals] = await Promise.all([
    api.getSettlements(),
    api.getShelters(),
    api.getHospitals()
  ]);

  return {
    settlement: featuresToPoints(settlements, "village_id"),
    shelter: featuresToPoints(shelters, "shelter_id"),
    hospital: featuresToPoints(hospitals, "hospital_id")
  };
}
