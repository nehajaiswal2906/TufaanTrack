# ResQMap Data Schema

> All files use **WGS84 (EPSG:4326)**, `[lon, lat]` coordinate order.
>
> **Puri district bounds** (villages, shelters, hospitals, warning polygons):
> lat 19.4–20.6, lon 85.0–86.5
>
> **Cyclone track bounds** (LineString only — starts offshore in Bay of Bengal):
> lat 18.0–21.5, lon 84.5–88.0
>
> No `null` values in any required field.

---

## villages.geojson

| Field | Type | Required | Description |
|---|---|---|---|
| `village_id` | string | ✅ | Unique identifier (`PURI-V0001` to `PURI-V0072`). Deterministic sort order (lat, lon, name). Final and immutable. |
| `name` | string | ✅ | Settlement name (prefers `name:en`, falls back to Odia `name`). Stripped of leading OSM numeric IDs/prefixes. Never empty. |
| `population` | integer | ✅ | Population count. Always an integer, never null. |
| `elevation_m` | number | ✅ | Ground elevation in metres (from Open-Meteo / Copernicus DEM 90m). |
| `pop_source` | string | ✅ | Origin of the population value: `"osm"` (from OSM tag, 5 settlements) or `"estimated_default"` (assumed default values: 500 for village, 150 for hamlet/locality, 50 for isolated dwelling — not Census data; 67 settlements). |

**Geometry:** `Point`

---

## shelters.geojson

| Field | Type | Required | Description |
|---|---|---|---|
| `shelter_id` | string | ✅ | Unique identifier (`PURI-S0001` to `PURI-S0036`). Deterministic sort order (lat, lon, name). Final and immutable. |
| `name` | string | ✅ | Facility name. Validated against empty, whitespace, and digit prefixes. |
| `type` | string | ✅ | Facility type: `"cyclone_shelter"`, `"school"`, or `"community_hall"`. Schools mapped in OpenStreetMap (`amenity=school`), used as CANDIDATE shelters. No dedicated cyclone shelters are mapped in OSM for Puri. Whether each school is an actual designated shelter, its structural safety, and its capacity are UNVERIFIED. Capacity 50 is an assumed default. |
| `capacity` | integer | ✅ | Estimated capacity (persons). Uses OSM `capacity` if present; otherwise assumed default value of 50 for candidate schools (capacity is UNVERIFIED). Always an integer, never null. |
| `elevation_m` | number | ✅ | Ground elevation in metres (from Open-Meteo / Copernicus DEM 90m). |
| `source` | string | ✅ | Data origin: `"osm"` (dedicated shelters) or `"osm_candidate"` (schools). All 36 are `"osm_candidate"`. |

**Geometry:** `Point`

### Candidate Shelter Provenance Note
> Schools mapped in OpenStreetMap (`amenity=school`), used as CANDIDATE shelters. No dedicated cyclone shelters are mapped in OSM for Puri. Whether each school is an actual designated shelter, its structural safety, and its capacity are UNVERIFIED. Capacity 50 is an assumed default.

---

## hospitals.geojson

| Field | Type | Required | Description |
|---|---|---|---|
| `hospital_id` | string | ✅ | Unique identifier (`PURI-H0001` to `PURI-H0042`). Deterministic sort order (lat, lon, name). Final and immutable. |
| `name` | string | ✅ | Facility name. Validated against empty, whitespace, and digit prefixes. |
| `type` | string | ✅ | Facility type: `"district_hospital"`, `"CHC"`, `"PHC"`, `"hospital"`, or `"clinic"`. |
| `beds` | integer | ✅ | Bed count. Uses OSM `beds` if present; otherwise `0` indicating unknown count (never null). |
| `elevation_m` | number | ✅ | Ground elevation in metres (from Open-Meteo / Copernicus DEM 90m). |
| `source` | string | ✅ | Data origin: `"osm"`. |

**Geometry:** `Point`

---

## cyclone_warning.geojson

Mixed geometry file: **Polygons** (warning zones) + **LineString** (cyclone track).

### Warning-zone features (Polygon)

| Field | Type | Required | Description |
|---|---|---|---|
| `warning_id` | string | ✅ | Unique identifier (`WRN_RED_001`, `WRN_ORANGE_001`). |
| `zone` | string | ✅ | `"RED"` or `"ORANGE"` only. |
| `projected_surge_m` | number | ✅ | Projected storm-surge height in metres (RED: 4.5m, ORANGE: 2.0m). |
| `simulated` | boolean | ✅ | `true` = not a real IMD warning (simulated scenario). |

### Cyclone-track features (LineString)

| Field | Type | Required | Description |
|---|---|---|---|
| `warning_id` | string | ✅ | Unique identifier (`TRK_SIM_001`). |
| `track_name` | string | ✅ | Name of the cyclone (`"Simulated Cyclone ASTRA"`). |
| `category` | string | ✅ | IMD category: `"VSCS"` (Very Severe Cyclonic Storm). |
| `simulated` | boolean | ✅ | `true` = not a real track. |

---

## Zone-overlap rule (proposed — pending Member 4 confirmation)

Where a village or shelter falls inside **both** a RED and an ORANGE warning polygon,
the **highest severity zone wins** (RED > ORANGE). The analysis/impact engine
should assign the feature's effective zone as `RED` and use the RED polygon's
`projected_surge_m` (4.5m) for flood-risk calculations.

---

## Elevation Honesty Note

Elevations are queried from the **Open-Meteo Elevation API**, which serves data from the **Copernicus DEM GLO-90** (90-meter spatial resolution, integer meter values).
- In coastal grid cells, elevation values blend land and water surfaces, meaning near-zero coastal elevations (0–2m) are approximate (for example, Natara at 0 m is a likely coastal-cell artifact).
- While adequate for hackathon macro-inundation modeling, a real-world deployment would require sub-meter vertical accuracy from airborne LiDAR or high-resolution drone-based DSMs.

---

## metadata.json

Top-level object with a `"files"` key. Each entry is keyed by filename:

| Field | Type | Required | Description |
|---|---|---|---|
| `source` | string | ✅ | Where the data came from. |
| `date` | string | ✅ | ISO date of creation/fetch (`2026-11-22`). |
| `reliability` | string | ✅ | Quality label: `"osm_verified_with_assumed_default_pop"`, `"osm_candidate_shelters"`, `"osm_verified"`, `"simulated"`. |
| `simulated` | boolean | — | `true` if data is simulated. |
| `feature_count` | integer | — | Number of features in the file. |
| `notes` | string | — | Detailed provenance and methodological notes. |
