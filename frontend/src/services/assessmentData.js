import { api } from "./api";

// Loads the backend's impact assessment (/api/assessment).
// Each item: village_id, name, exposed_population, nearby_shelters,
// nearby_hospitals, unverified_blockage_reports, priority, reasons.
// The frontend only displays and counts these — it never changes a priority.
export async function loadAssessment() {
  const items = await api.getAssessment();
  return Array.isArray(items) ? items : [];
}

// Groups reasons that differ only by a number in brackets, e.g.
// "High exposed population (5000 residents)." and "(10000 residents)."
// both count as "High exposed population".
export function reasonGroup(reason) {
  return reason.replace(/\s*\([^)]*\d[^)]*\)\s*/g, "").replace(/\.$/, "").trim();
}

// How many villages mention each reason group, most common first
export function countReasons(items) {
  const counts = new Map();
  for (const item of items) {
    // count each reason group once per village
    for (const group of new Set((item.reasons ?? []).map(reasonGroup))) {
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}
