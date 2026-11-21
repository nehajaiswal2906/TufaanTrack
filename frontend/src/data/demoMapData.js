// =========================================
// ⚠️ DEMO DATA — NOT REAL LOCATIONS
// Temporary sample points used only to build and test the map
// interface. These are NOT real settlements, shelters or hospitals.
// They will be replaced by backend data (/api/settlements,
// /api/shelters, /api/hospitals) during integration.
//
// Each item uses the same field names the backend sends:
// latitude, longitude, name (and population for settlements).
// =========================================

export const DEMO_MAP_DATA = {
  settlement: [
    { id: "demo-settlement-a", name: "Demo Settlement A", latitude: 19.8135, longitude: 85.8312 },
    { id: "demo-settlement-b", name: "Demo Settlement B", latitude: 19.862, longitude: 85.772 }
  ],
  shelter: [
    { id: "demo-shelter-a", name: "Demo Shelter A", latitude: 19.85, longitude: 85.88 },
    { id: "demo-shelter-b", name: "Demo Shelter B", latitude: 19.835, longitude: 85.745 }
  ],
  hospital: [
    { id: "demo-hospital-a", name: "Demo Hospital A", latitude: 19.78, longitude: 85.8 },
    { id: "demo-hospital-b", name: "Demo Health Centre B", latitude: 19.885, longitude: 85.83 }
  ]
};

// Sample warning radius and track, kept from the original map.
// Module 3 replaces these with /api/warning-zone and /api/cyclone.
export const DEMO_WARNING_CIRCLE = {
  center: [19.8135, 85.8312],
  radiusMeters: 3500
};

export const DEMO_TRACK = [
  [20.5, 86.5],
  [20.2, 86.2],
  [20.0, 86.0],
  [19.8135, 85.8312]
];
