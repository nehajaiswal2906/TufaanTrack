#!/usr/bin/env python3
"""
fetch_shelters.py — Fetch real shelters and emergency assembly points for Puri district from OpenStreetMap.

Workflow:
1. Checks cache in data/_work/raw_candidates.json or queries Overpass for dedicated cyclone shelters.
2. Applies updated sanity bounds: lat 19.4 - 20.6, lon 85.0 - 86.5.
3. Pre-approved fallback: When fewer than 10 dedicated cyclone shelters are found,
   adds candidate shelters: schools (amenity=school) and community centres (amenity=community_centre).
4. Name cleaning: Strips leading 6+ digit prefixes; ensures non-empty, valid facility names.
5. Dedicated shelters: type="cyclone_shelter", source="osm", default capacity=100.
6. Candidate shelters: type="school" / "community_hall", source="osm_candidate", default capacity=50.
7. Deduplicates by name and proximity (~100m).
8. Deterministically sorts by (lat, lon, name) and assigns stable IDs: PURI-S0001, PURI-S0002, etc.
9. Saves raw shelters to data/_work/shelters_raw.geojson.
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
CACHE_CANDIDATES = os.path.join(WORK_DIR, "raw_candidates.json")
CACHE_DEDICATED = os.path.join(WORK_DIR, "raw_shelters_dedicated.json")
OUTPUT_RAW = os.path.join(WORK_DIR, "shelters_raw.geojson")

OVERPASS_ENDPOINTS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

HEADERS = {"User-Agent": "ResQMap-hackathon/1.0 (student project)"}


def fetch_shelter_elements():
    """Fetch dedicated shelters or fallback candidates from cache or Overpass API."""
    os.makedirs(WORK_DIR, exist_ok=True)
    dedicated = []
    candidates = []

    if os.path.exists(CACHE_DEDICATED):
        with open(CACHE_DEDICATED, "r", encoding="utf-8") as f:
            dedicated = json.load(f).get("elements", [])

    if os.path.exists(CACHE_CANDIDATES):
        with open(CACHE_CANDIDATES, "r", encoding="utf-8") as f:
            candidates = json.load(f).get("elements", [])

    if not candidates:
        q_cand = """
[out:json][timeout:35];
area["name"="Puri"]["admin_level"="5"]->.searchArea;
(
  nwr["amenity"="school"](area.searchArea);
  nwr["amenity"="community_centre"](area.searchArea);
);
out center tags;
"""
        print("Querying Overpass for candidate shelters (schools & community centres)...")
        for ep in OVERPASS_ENDPOINTS:
            try:
                r = requests.post(ep, data={"data": q_cand}, headers=HEADERS, timeout=40)
                if r.status_code == 200:
                    data = r.json()
                    candidates = data.get("elements", [])
                    with open(CACHE_CANDIDATES, "w", encoding="utf-8") as f:
                        json.dump(data, f, indent=2)
                    break
            except Exception as e:
                print(f"Error on {ep}: {e}")
            time.sleep(2)

    return dedicated, candidates


def clean_name(raw_name, default_name):
    """Clean facility name: strip leading 6+ digits, ensure non-empty."""
    if not raw_name:
        return default_name
    name = raw_name.strip()
    name = re.sub(r"^\d{6,}\s*[-_:]?\s*", "", name).strip()
    if not name or name.isdigit():
        return default_name
    return name


def parse_capacity(tags, default_val):
    """Parse capacity as integer or return fallback default."""
    cap_raw = tags.get("capacity")
    if cap_raw:
        nums = re.findall(r"\d+", str(cap_raw))
        if nums:
            return int(nums[0])
    return default_val


def process_shelters(dedicated_elements, candidate_elements):
    """Process, classify, deduplicate, and assign deterministic IDs."""
    raw_list = []

    # Dedicated shelters (<10 expected)
    for el in dedicated_elements:
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None or not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
            continue
        tags = el.get("tags", {})
        raw_name = tags.get("name:en") or tags.get("name") or "Cyclone Shelter"
        name = clean_name(raw_name, "Cyclone Shelter")
        raw_list.append({
            "name": name,
            "type": "cyclone_shelter",
            "capacity": parse_capacity(tags, 100),
            "source": "osm",
            "lat": lat,
            "lon": lon,
        })

    print(f"Dedicated cyclone shelters found: {len(raw_list)}")

    # Pre-approved fallback if < 10 dedicated shelters
    if len(raw_list) < 10:
        print("Fewer than 10 dedicated cyclone shelters found. Activating pre-approved candidate fallback...")
        for el in candidate_elements:
            lat = el.get("lat") or el.get("center", {}).get("lat")
            lon = el.get("lon") or el.get("center", {}).get("lon")
            if lat is None or lon is None or not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
                continue
            tags = el.get("tags", {})
            amenity = tags.get("amenity", "")
            stype = "community_hall" if amenity == "community_centre" else "school"
            default_label = "Community Centre" if stype == "community_hall" else "Primary / High School"
            raw_name = tags.get("name:en") or tags.get("name") or default_label
            name = clean_name(raw_name, default_label)

            raw_list.append({
                "name": name,
                "type": stype,
                "capacity": parse_capacity(tags, 50),
                "source": "osm_candidate",
                "lat": lat,
                "lon": lon,
            })

    # Deduplicate by (name, ~100m location)
    deduped = []
    seen = set()
    for item in raw_list:
        key = (item["name"].lower().strip(), round(item["lat"], 3), round(item["lon"], 3))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    print(f"Total distinct shelters after deduplication: {len(deduped)}")

    # Sort deterministically: lat ASC, lon ASC, name ASC
    deduped.sort(key=lambda x: (x["lat"], x["lon"], x["name"]))

    features = []
    type_counts = {}

    for idx, item in enumerate(deduped, start=1):
        shelter_id = f"PURI-S{idx:04d}"
        t = item["type"]
        type_counts[t] = type_counts.get(t, 0) + 1

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(item["lon"], 7), round(item["lat"], 7)],
            },
            "properties": {
                "shelter_id": shelter_id,
                "name": item["name"],
                "type": item["type"],
                "capacity": item["capacity"],
                "source": item["source"],
            },
        }
        features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}
    return geojson, type_counts


def main():
    print("=" * 60)
    print("  ResQMap — Fetch Real Shelters (Puri District, Bounds: 85.0-86.5, 19.4-20.6)")
    print("=" * 60)

    dedicated, candidates = fetch_shelter_elements()
    geojson, type_counts = process_shelters(dedicated, candidates)

    with open(OUTPUT_RAW, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)

    print(f"\nSaved {len(geojson['features'])} raw shelters to: {OUTPUT_RAW}")
    print(f"Shelter types breakdown: {type_counts}")
    print(f"IDs PURI-S0001 to PURI-S{len(geojson['features']):04d} are now FINAL.")
    print("=" * 60)
    return len(geojson["features"]), type_counts


if __name__ == "__main__":
    main()
