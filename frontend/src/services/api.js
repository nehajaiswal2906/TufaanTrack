// =========================================
// API SERVICE
// The ONLY place where the frontend talks to the backend.
// Every page uses these functions instead of calling fetch() itself.
// Endpoints follow docs/API_CONTRACT.md.
// =========================================

// Backend address comes from the .env file (VITE_API_BASE_URL).
// If it's missing, we fall back to the address in the API contract.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/$/, ""); // remove a trailing "/" if there is one

// Sends one request and returns the JSON response.
// Throws a clear, readable error if something goes wrong.
async function request(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options
    });
  } catch {
    // fetch() itself failed: backend not running, wrong address, or no network
    throw new Error(
      `Cannot reach the backend at ${API_BASE_URL}. Is it running?`
    );
  }

  if (!response.ok) {
    // The backend answered with an error (e.g. 400 or 404)
    let detail = "";
    try {
      detail = (await response.json()).detail ?? "";
    } catch {
      // response had no JSON body — ignore
    }
    throw new Error(detail || `Request failed (${response.status}) for ${path}`);
  }

  return response.json();
}

export const api = {
  // ---------- Map data (GeoJSON FeatureCollections) ----------
  getHealth: () => request("/api/health"),
  getSettlements: () => request("/api/settlements"),
  getShelters: () => request("/api/shelters"),
  getHospitals: () => request("/api/hospitals"),
  getRoads: () => request("/api/roads"),
  getCyclone: () => request("/api/cyclone"),
  getWarningZone: () => request("/api/warning-zone"),

  // ---------- Impact assessment ----------
  getAssessment: () => request("/api/assessment"),

  // ---------- Emergency reports ----------
  getReports: () => request("/api/reports"),

  submitSos: (report) =>
    request("/api/sos", {
      method: "POST",
      body: JSON.stringify(report)
    }),

  updateReportStatus: (reportId, status) =>
    request(`/api/reports/${reportId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    })
};
