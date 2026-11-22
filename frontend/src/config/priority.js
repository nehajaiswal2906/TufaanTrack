// =========================================
// PRIORITY LEVELS
// The four priority values the backend's impact assessment can return
// (see docs/API_CONTRACT.md). Used by Settlements (Module 4)
// and Impact Assessment (Module 6).
// =========================================

export const PRIORITY_STYLES = {
  HIGH: { label: "High", color: "#ff4d5e" },
  NEEDS_ASSESSMENT: { label: "Needs assessment", color: "#a78bfa" },
  MEDIUM: { label: "Medium", color: "#f3a64c" },
  LOW: { label: "Low", color: "#36d69d" }
};

// Order used when sorting by priority (most urgent first)
export const PRIORITY_ORDER = ["HIGH", "NEEDS_ASSESSMENT", "MEDIUM", "LOW"];

// Used if the backend ever sends a priority we don't know
export const UNKNOWN_PRIORITY = { label: "Unknown", color: "#8ea3b9" };
