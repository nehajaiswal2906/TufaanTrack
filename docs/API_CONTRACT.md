# TufaanTrack API Contract

Backend: Python FastAPI. Run it with `cd backend` then `uvicorn app.main:app --reload`.
Base address: `http://127.0.0.1:8000`
All responses are JSON. Map data is GeoJSON with coordinates in [longitude, latitude] order.
Live test page: `http://127.0.0.1:8000/docs`

## Map data (GET)

| Endpoint | Returns |
|---|---|
| `/api/health` | `{"status": "ok"}` |
| `/api/settlements` | GeoJSON FeatureCollection of villages (Point). Details in `properties`: village_id, name, population, elevation_m, pop_source |
| `/api/shelters` | GeoJSON FeatureCollection of shelters (Point). Properties: shelter_id, name, type, capacity, elevation_m, source |
| `/api/hospitals` | GeoJSON FeatureCollection of hospitals (Point). Properties: hospital_id, name, type, beds, elevation_m, source |
| `/api/roads` | Empty FeatureCollection. No road data in this prototype. |
| `/api/cyclone` | GeoJSON FeatureCollection with the simulated cyclone track (LineString) |
| `/api/warning-zone` | GeoJSON FeatureCollection with RED and ORANGE zones (Polygon). Properties: warning_id, zone, projected_surge_m, simulated |

Leaflet tip: `L.geoJSON(data).addTo(map)` draws any of these.

## Reports

### POST /api/sos
Saves a new report. Its status starts as `UNVERIFIED`.

Send:
```json
{
  "report_type": "ROAD_BLOCKAGE",
  "description": "Tree fallen on main road",
  "village_id": "PURI-V0001",
  "latitude": 19.8,
  "longitude": 85.82
}
```
`village_id` is optional. The other fields are required.

Returns the saved report with a `report_id` and `"status": "UNVERIFIED"`.

### GET /api/reports
Returns a list of all reports. Each one has: report_id, report_type, description, village_id, latitude, longitude, status.

### PATCH /api/reports/{report_id}/status
Changes a report's status.

Send:
```json
{ "status": "VERIFIED" }
```
Allowed values: `UNVERIFIED`, `VERIFIED`, `REJECTED`.
Returns the updated report. Errors: 400 for an invalid status, 404 if the report does not exist.

## Impact assessment

### GET /api/assessment
Returns a list with one item for each village inside the warning zone, calculated by Member 4's module from the current data and reports. Each item includes: village_id, name, exposed_population, priority and reasons.
Priority values: `LOW`, `MEDIUM`, `HIGH`, `NEEDS_ASSESSMENT`.

## Common rules

- Coordinate system: WGS84 (EPSG:4326), order [longitude, latitude]
- IDs: village_id, shelter_id, hospital_id, report_id
- Report types used so far: `ROAD_BLOCKAGE` (others are allowed)
- Data is simulated or assumed in places (see `data/SCHEMA.md`). It is not an IMD forecast.