import { api } from "./api";

// Loads all reports from GET /api/reports.
// Each report: report_id, report_type, description, village_id,
// latitude, longitude, status.
export async function loadReports() {
  const reports = await api.getReports();
  return Array.isArray(reports) ? reports : [];
}

// Turns reports into map points ({ id, latitude, longitude, ... })
// so <MapView reports={...}> can draw and highlight them.
export function reportsToPoints(reports) {
  return (reports ?? [])
    .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude))
    .map((r) => ({ ...r, id: `report-${r.report_id}` }));
}
