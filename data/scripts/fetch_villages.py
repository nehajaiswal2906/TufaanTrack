#!/usr/bin/env python3
"""
fetch_villages.py — Fetch, clean, and prepare real villages for Puri district from OpenStreetMap.

Rules & Pipeline:
1. Queries / loads OSM elements (nwr with place=village, place=hamlet, place=locality,
   and place=isolated_dwelling) inside Puri district.
2. Applies updated sanity bounds: lat 19.4 - 20.6, lon 85.0 - 86.5.
3. Name handling & cleanup:
   - Prefers name:en if present, otherwise name.
   - Strips leading run of 6 or more digits (e.g. accidental OSM ID prefixes).
   - Never leaves name empty or whitespace-only.
4. Non-settlement filtering:
   - Automatically removes water bodies and non-settlement features (names matching
     'lake', 'chilika', 'chilka', 'sea', 'river', 'bay', etc.).
5. Population rules:
   - OSM tag -> 'osm'
   - Defaults: village -> 500, hamlet -> 150, locality -> 150, isolated_dwelling -> 50
     -> 'estimated_default' (assumed default values, not Census data).
6. Deduplication by (normalized name, ~100m location).
7. Deterministic sorting by (lat, lon, name) and final ID assignment (PURI-V0001 format).
8. Saves raw features to data/_work/villages_raw.geojson.
"""

import json
import os
import re
import sys
import time
import requests

LAT_MIN, LAT_MAX = 19.4, 20.6
LON_MIN, LON_MAX = 85.0, 86.5

DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK_DIR = os.path.join(DATA_DIR, "_work")
CACHE_EXPANDED = os.path.join(WORK_DIR, "raw_villages_expanded.json")
CACHE_AREA = os.path.join(WORK_DIR, "raw_overpass_area.json")
OUTPUT_RAW = os.path.join(WORK_DIR, "villages_raw.geojson")

OVERPASS_ENDPOINTS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

HEADERS = {"User-Agent": "ResQMap-hackathon/1.0 (student project)"}

WATER_WORDS = ["lake", "chilika", "chilka", "sea", "river", "bay"]


def fetch_raw_elements():
    """Fetch raw elements from local caches or Overpass API."""
    os.makedirs(WORK_DIR, exist_ok=True)
    elements_map = {}

    # Load from available cached responses
    if os.path.exists(CACHE_AREA):
        with open(CACHE_AREA, "r", encoding="utf-8") as f:
            for el in json.load(f).get("elements", []):
                elements_map[el["id"]] = el

    if os.path.exists(CACHE_EXPANDED):
        with open(CACHE_EXPANDED, "r", encoding="utf-8") as f:
            for el in json.load(f).get("elements", []):
                elements_map[el["id"]] = el

    if elements_map:
        print(f"Loaded {len(elements_map)} unique raw elements from cache.")
        return "cache", list(elements_map.values())

    print("Querying Overpass API for Puri district (expanded place tags)...")
    q = """
[out:json][timeout:45];
area["name"="Puri"]["admin_level"="5"]->.searchArea;
(
  nwr["place"="village"](area.searchArea);
  nwr["place"="hamlet"](area.searchArea);
  nwr["place"="locality"](area.searchArea);
  nwr["place"="isolated_dwelling"](area.searchArea);
);
out center tags;
"""
    for ep in OVERPASS_ENDPOINTS:
        try:
            r = requests.post(ep, data={"data": q}, headers=HEADERS, timeout=45)
            if r.status_code == 200:
                data = r.json()
                with open(CACHE_EXPANDED, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                return ep, data.get("elements", [])
        except Exception as e:
            print(f"Error on {ep}: {e}")
        time.sleep(2)

    print("[FAIL] Could not fetch villages.")
    sys.exit(1)


def clean_name(raw_name):
    """
    Clean name:
    - Strip leading run of 6 or more digits (e.g. accidental OSM ID prefix).
    - Strip whitespace.
    - Fallback if empty or digits-only.
    """
    if not raw_name:
        return "Unnamed Settlement"
    name = raw_name.strip()
    # Strip leading 6+ digits and any trailing punctuation/space
    name = re.sub(r"^\d{6,}\s*[-_:]?\s*", "", name).strip()
    if not name or name.isdigit():
        return "Unnamed Settlement"
    return name


def parse_population(tags):
    """Parse population integer and assign pop_source."""
    pop_raw = tags.get("population")
    if pop_raw:
        nums = re.findall(r"\d+", str(pop_raw))
        if nums:
            avg_pop = int(sum(int(x) for x in nums) / len(nums))
            return avg_pop, "osm"

    place = tags.get("place", "village")
    if place == "isolated_dwelling":
        return 50, "estimated_default"
    elif place in ("hamlet", "locality"):
        return 150, "estimated_default"
    return 500, "estimated_default"


def process_villages(elements):
    """Process settlements, clean names, filter water bodies, and deduplicate."""
    inside = []
    outside = []
    water_removed = []
    name_cleaned_count = 0
    odia_regex = re.compile(r"[\u0B00-\u0B7F]")
    odia_name_count = 0

    for el in elements:
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue

        tags = el.get("tags", {})
        raw_name = tags.get("name:en") or tags.get("name") or "Unnamed Settlement"

        # Check for numeric prefix before cleaning
        if re.match(r"^\d{6,}", raw_name.strip()):
            name_cleaned_count += 1

        name = clean_name(raw_name)

        # Sanity bounds check: lat 19.4-20.6, lon 85.0-86.5
        if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
            outside.append((name, tags.get("place"), lat, lon))
            continue

        # Water body / non-settlement filter
        if any(w in name.lower() for w in WATER_WORDS):
            water_removed.append((name, tags.get("place"), lat, lon))
            continue

        if odia_regex.search(name):
            odia_name_count += 1

        pop, pop_source = parse_population(tags)

        inside.append({
            "osm_id": el.get("id"),
            "name": name,
            "place": tags.get("place", "village"),
            "lat": lat,
            "lon": lon,
            "population": pop,
            "pop_source": pop_source,
        })

    print(f"\nProcessing results:")
    print(f"  - Inside new bounds [{LON_MIN}-{LON_MAX}, {LAT_MIN}-{LAT_MAX}]: {len(inside)}")
    print(f"  - Excluded outside bounds: {len(outside)}")
    print(f"  - Filtered water bodies / non-settlements: {len(water_removed)}")
    for w in water_removed:
        print(f"      Removed: '{w[0]}' ({w[1]}) at [{w[3]}, {w[2]}] (water body)")
    print(f"  - Names with numeric prefix stripped: {name_cleaned_count}")
    print(f"  - Names in non-Latin (Odia) script: {odia_name_count}")

    # Deduplicate by (normalized name, ~100m coordinates)
    deduped = []
    seen = set()
    for item in inside:
        loc_key = (item["name"].lower().strip(), round(item["lat"], 3), round(item["lon"], 3))
        if loc_key in seen:
            continue
        seen.add(loc_key)
        deduped.append(item)

    print(f"  - Distinct settlements after deduplication: {len(deduped)}")

    # Deterministic sort: lat ASC, lon ASC, name ASC
    deduped.sort(key=lambda x: (x["lat"], x["lon"], x["name"]))

    # Final ID assignment: PURI-V0001, etc.
    features = []
    pop_counts = {"osm": 0, "estimated_default": 0}

    for idx, item in enumerate(deduped, start=1):
        village_id = f"PURI-V{idx:04d}"
        pop_counts[item["pop_source"]] = pop_counts.get(item["pop_source"], 0) + 1

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(item["lon"], 7), round(item["lat"], 7)],
            },
            "properties": {
                "village_id": village_id,
                "name": item["name"],
                "population": int(item["population"]),
                "pop_source": item["pop_source"],
            },
        }
        features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}
    return geojson, pop_counts, odia_name_count, water_removed, outside


def main():
    print("=" * 60)
    print("  ResQMap — Fetch & Clean Villages (Puri District, Bounds: 85.0-86.5, 19.4-20.6)")
    print("=" * 60)

    source, raw_elements = fetch_raw_elements()
    geojson, pop_counts, odia_count, water_removed, outside = process_villages(raw_elements)

    with open(OUTPUT_RAW, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)

    print(f"\nSaved {len(geojson['features'])} cleaned villages to: {OUTPUT_RAW}")
    print(f"Population breakdown: {pop_counts}")
    print(f"IDs PURI-V0001 to PURI-V{len(geojson['features']):04d} are now FINAL.")
    print("=" * 60)
    return len(geojson["features"]), pop_counts, odia_count, water_removed, outside


if __name__ == "__main__":
    main()
