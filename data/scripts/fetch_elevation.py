#!/usr/bin/env python3
"""
fetch_elevation.py — Enrich GeoJSON features with ground elevation from Open-Meteo Elevation API.

Supports enriching:
- villages (data/_work/villages_raw.geojson -> data/villages.geojson)
- shelters (data/_work/shelters_raw.geojson -> data/shelters.geojson)
- hospitals (data/_work/hospitals_raw.geojson -> data/hospitals.geojson)

Workflow:
1. Loads GeoJSON points from the raw work file.
2. Batches coordinates in chunks of up to 100 points.
3. Queries Open-Meteo Elevation API (Copernicus DEM 90m) with 3 retries and exponential backoff.
4. Adds elevation_m to each feature.
5. Verifies zero nulls or missing elevations exist.
6. Writes to an intermediate work file.
7. Validates features against schema requirements.
8. Only upon 100% validation success, replaces the target GeoJSON in data/.
"""

import json
import os
import shutil
import statistics
import sys
import time
import requests

DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK_DIR = os.path.join(DATA_DIR, "_work")

ELEVATION_API_URL = "https://api.open-meteo.com/v1/elevation"
BATCH_SIZE = 100
MAX_RETRIES = 3
DELAY_BETWEEN_BATCHES_SEC = 0.5

FILE_CONFIGS = {
    "villages": {
        "raw": os.path.join(WORK_DIR, "villages_raw.geojson"),
        "work": os.path.join(WORK_DIR, "villages_with_elevation.geojson"),
        "target": os.path.join(DATA_DIR, "villages.geojson"),
        "req_keys": ["village_id", "name", "population", "elevation_m", "pop_source"],
        "id_field": "village_id",
    },
    "shelters": {
        "raw": os.path.join(WORK_DIR, "shelters_raw.geojson"),
        "work": os.path.join(WORK_DIR, "shelters_with_elevation.geojson"),
        "target": os.path.join(DATA_DIR, "shelters.geojson"),
        "req_keys": ["shelter_id", "name", "type", "capacity", "elevation_m", "source"],
        "id_field": "shelter_id",
    },
    "hospitals": {
        "raw": os.path.join(WORK_DIR, "hospitals_raw.geojson"),
        "work": os.path.join(WORK_DIR, "hospitals_with_elevation.geojson"),
        "target": os.path.join(DATA_DIR, "hospitals.geojson"),
        "req_keys": ["hospital_id", "name", "type", "beds", "elevation_m", "source"],
        "id_field": "hospital_id",
    },
}


def fetch_elevation_batch(lats, lons, retries=MAX_RETRIES):
    """Fetch elevation for a batch of latitudes and longitudes with retries."""
    lat_str = ",".join(f"{lat:.7f}" for lat in lats)
    lon_str = ",".join(f"{lon:.7f}" for lon in lons)
    params = {"latitude": lat_str, "longitude": lon_str}

    for attempt in range(1, retries + 1):
        try:
            res = requests.get(ELEVATION_API_URL, params=params, timeout=20)
            if res.status_code == 200:
                data = res.json()
                elevations = data.get("elevation")
                if elevations is not None and len(elevations) == len(lats):
                    return elevations
                print(f"    [WARN] Batch mismatch: expected {len(lats)} values, got {len(elevations) if elevations else 0}")
            else:
                print(f"    [WARN] Attempt {attempt}: API returned HTTP {res.status_code}")
        except Exception as e:
            print(f"    [WARN] Attempt {attempt}: Connection error: {e}")

        backoff = 2 ** attempt
        print(f"    Retrying batch in {backoff}s...")
        time.sleep(backoff)

    return None


def enrich_dataset(name):
    """Enrich a specific dataset configuration."""
    cfg = FILE_CONFIGS[name]
    raw_path = cfg["raw"]
    work_path = cfg["work"]
    target_path = cfg["target"]
    req_keys = cfg["req_keys"]

    print(f"\n--- Enriching {name.upper()} ---")
    if not os.path.exists(raw_path):
        print(f"[FAIL] Raw file not found: {raw_path}")
        return None

    with open(raw_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    features = data.get("features", [])
    total = len(features)
    print(f"Loaded {total} features from {raw_path}")
    if total == 0:
        print("[FAIL] No features to process.")
        return None

    all_elevations = []
    failed_features = []

    for i in range(0, total, BATCH_SIZE):
        batch = features[i : i + BATCH_SIZE]
        batch_num = (i // BATCH_SIZE) + 1
        total_batches = (total + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"Processing batch {batch_num}/{total_batches} ({len(batch)} points)...")

        lats = [f["geometry"]["coordinates"][1] for f in batch]
        lons = [f["geometry"]["coordinates"][0] for f in batch]

        elevs = fetch_elevation_batch(lats, lons)

        if elevs is None:
            print(f"[FAIL] Batch {batch_num} failed after {MAX_RETRIES} retries.")
            for f in batch:
                failed_features.append(f["properties"].get("name", "Unknown"))
            break

        for feat, elev in zip(batch, elevs):
            if elev is None:
                failed_features.append(feat["properties"].get("name", "Unknown"))
            else:
                elev_val = round(float(elev), 1)
                feat["properties"]["elevation_m"] = int(elev_val) if elev_val.is_integer() else elev_val
                all_elevations.append(elev_val)

        time.sleep(DELAY_BETWEEN_BATCHES_SEC)

    if failed_features:
        print(f"\n[FAIL] Elevation enrichment failed for {len(failed_features)} features.")
        return None

    # Write intermediate work file
    with open(work_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Saved enriched GeoJSON to work file: {work_path}")

    # Validate work file
    for i, feat in enumerate(features):
        props = feat.get("properties", {})
        coords = feat.get("geometry", {}).get("coordinates", [])
        for k in req_keys:
            if k not in props or props[k] is None:
                print(f"[FAIL] Feature #{i} missing or null '{k}'")
                return None
        if not (85.0 <= coords[0] <= 86.5 and 19.4 <= coords[1] <= 20.6):
            print(f"[FAIL] Feature #{i} coordinates out of bounds: {coords}")
            return None

    print(f"Work file validation passed. Replacing stub: {target_path}...")
    shutil.copyfile(work_path, target_path)
    print(f"[OK] {os.path.basename(target_path)} updated successfully!")

    elev_min = min(all_elevations)
    elev_median = statistics.median(all_elevations)
    elev_max = max(all_elevations)
    print(f"Elevation Statistics: Min={elev_min}m | Median={elev_median}m | Max={elev_max}m")
    return len(features), elev_min, elev_median, elev_max


def main():
    print("=" * 60)
    print("  ResQMap — Fetch Elevation (Open-Meteo / Copernicus DEM)")
    print("=" * 60)

    target_to_run = sys.argv[1].lower() if len(sys.argv) > 1 else "all"
    stats_summary = {}

    targets = ["villages", "shelters", "hospitals"] if target_to_run == "all" else [target_to_run]

    for t in targets:
        if t in FILE_CONFIGS:
            res = enrich_dataset(t)
            if res:
                stats_summary[t] = res
        else:
            print(f"Unknown target: {t}")

    print("\n" + "=" * 60)
    print("  Elevation Enrichment Complete")
    for name, s in stats_summary.items():
        print(f"  {name:10s} -> Count: {s[0]} | Min: {s[1]}m | Median: {s[2]}m | Max: {s[3]}m")
    print("=" * 60)


if __name__ == "__main__":
    main()
