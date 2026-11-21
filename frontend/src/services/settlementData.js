import { api } from "./api";
import { loadMapPoints } from "./mapData";

// Loads everything the Settlements page needs:
//   - settlements, shelters and hospitals (map points)
//   - the impact assessment (/api/assessment), matched to each village
//
// If only the assessment fails, the page still works and shows a note,
// because the settlement list itself does not depend on it.
export async function loadSettlementData() {
  const [pointsResult, assessmentResult] = await Promise.allSettled([
    loadMapPoints(),
    api.getAssessment()
  ]);

  // Without map points there is nothing to show
  if (pointsResult.status === "rejected") throw pointsResult.reason;
  const points = pointsResult.value;

  const assessmentOk = assessmentResult.status === "fulfilled" && Array.isArray(assessmentResult.value);
  const assessment = assessmentOk ? assessmentResult.value : [];

  // Look up each village's assessment by its village_id
  const assessmentById = new Map(assessment.map((entry) => [entry.village_id, entry]));

  const settlements = points.settlement.map((village) => ({
    ...village,
    assessment: assessmentById.get(village.village_id) ?? null
  }));

  return {
    points: { ...points, settlement: settlements },
    settlements,
    assessmentAvailable: assessmentOk,
    assessmentError: assessmentOk ? null : assessmentResult.reason?.message ?? "Assessment unavailable"
  };
}
