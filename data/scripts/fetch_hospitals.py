#!/usr/bin/env python3
"""
fetch_hospitals.py — Fetch real hospitals and clinics for Puri district from OpenStreetMap.

Workflow:
1. Loads cached OSM hospital/clinic data from data/_work/raw_hospitals.json or queries Overpass.
2. Applies updated sanity bounds: lat 19.4 - 20.6, lon 85.0 - 86.5.
3. Name cleaning: Strips leading 6+ digit prefixes; ensures non-empty names.
4. Classifies facility type:
   - district_hospital
   - CHC (Community Health Centre)
   - PHC (Primary Health Centre)
   - clinic
   - hospital
5. Extracts beds tag if present; otherwise defaults to 0 (indicating unknown, never null).
6. Sets source="osm".
7. Deduplicates by name and proximity (~100m).
8. Deterministically sorts by (lat, lon, name) and assigns stable IDs: PURI-H0001, etc.
9. Saves raw features to data/_work/hospitals_raw.geojson.
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
CACHE_HOSPITALS = os.path.join(WORK_DIR, "raw_hospitals.json")
OUTPUT_RAW = os.path.join(WORK_DIR, "hospitals_raw.geojson")

OVERPASS_ENDPOINTS = [
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

HEADERS = {"User-Agent": "ResQMap-hackathon/1.0 (student project)"}


def fetch_hospital_elements():
    """Fetch raw hospital elements from cache or Overpass API."""
    os.makedirs(WORK_DIR, exist_ok=True)
    if os.path.exists(CACHE_HOSPITALS):
        with open(CACHE_HOSPITALS, "r", encoding="utf-8") as f:
            return json.load(f).get("elements", [])

    print("Querying Overpass API for healthcare facilities in Puri district...")
    q = """
[out:json][timeout:35];
area["name"="Puri"]["admin_level"="5"]->.searchArea;
(
  nwr["amenity"="hospital"](area.searchArea);
  nwr["amenity"="clinic"](area.searchArea);
  nwr["amenity"="doctors"](area.searchArea);
  nwr["healthcare"="hospital"](area.searchArea);
  nwr["healthcare"="clinic"](area.searchArea);
);
out center tags;
"""
    for ep in OVERPASS_ENDPOINTS:
        try:
            r = requests.post(ep, data={"data": q}, headers=HEADERS, timeout=40)
            if r.status_code == 200:
                data = r.json()
                with open(CACHE_HOSPITALS, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                return data.get("elements", [])
        except Exception as e:
            print(f"Error on {ep}: {e}")
        time.sleep(2)

    print("[FAIL] Could not fetch hospitals.")
    sys.exit(1)


def clean_name(raw_name, default_name):
    """Clean facility name: strip leading 6+ digits, ensure non-empty."""
    if not raw_name:
        return default_name
    name = raw_name.strip()
    name = re.sub(r"^\d{6,}\s*[-_:]?\s*", "", name).strip()
    if not name or name.isdigit():
        return default_name
    return name


def classify_hospital_type(name, tags):
    """Classify facility into agreed schema types."""
    nl = name.lower()
    amenity = tags.get("amenity", "").lower()
    healthcare = tags.get("healthcare", "").lower()

    if "district headquarter" in nl or "district hospital" in nl:
        return "district_hospital"
    elif "chc" in nl or "community health" in nl:
        return "CHC"
    elif "phc" in nl or "primary health" in nl:
        return "PHC"
    elif amenity == "clinic" or healthcare == "clinic" or "nursing home" in nl or amenity == "doctors":
        return "clinic"
    return "hospital"


def parse_beds(tags):
    """Parse beds tag as integer, or return 0 (unknown)."""
    beds_raw = tags.get("beds")
    if beds_raw:
        nums = re.findall(r"\d+", str(beds_raw))
        if nums:
            return int(nums[0])
    return 0


def process_hospitals(elements):
    """Clean, classify, deduplicate, and assign deterministic IDs."""
    raw_list = []
    outside_count = 0

    for el in elements:
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue

        if not (LAT_MIN <= lat <= LAT_MAX and LON_MIN <= lon <= LON_MAX):
            outside_count += 1
            continue

        tags = el.get("tags", {})
        raw_name = tags.get("name:en") or tags.get("name") or "Medical Facility (Hospital/Clinic)"
        name = clean_name(raw_name, "Medical Facility (Hospital/Clinic)")
        htype = classify_hospital_type(name, tags)
        beds = parse_beds(tags)

        raw_list.append({
            "name": name,
            "type": htype,
            "beds": beds,
            "source": "osm",
            "lat": lat,
            "lon": lon,
        })

    print(f"Bounds filtering: {len(raw_list)} inside bounds [{LON_MIN}-{LON_MAX}, {LAT_MIN}-{LAT_MAX}], {outside_count} excluded.")

    # Deduplicate by (name, ~100m location)
    deduped = []
    seen = set()
    for item in raw_list:
        key = (item["name"].lower().strip(), round(item["lat"], 3), round(item["lon"], 3))
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    print(f"Total distinct hospitals after deduplication: {len(deduped)}")

    # Sort deterministically: lat ASC, lon ASC, name ASC
    deduped.sort(key=lambda x: (x["lat"], x["lon"], x["name"]))

    features = []
    type_counts = {}

    for idx, item in enumerate(deduped, start=1):
        hospital_id = f"PURI-H{idx:04d}"
        t = item["type"]
        type_counts[t] = type_counts.get(t, 0) + 1

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [round(item["lon"], 7), round(item["lat"], 7)],
            },
            "properties": {
                "hospital_id": hospital_id,
                "name": item["name"],
                "type": item["type"],
                "beds": item["beds"],
                "source": item["source"],
            },
        }
        features.append(feature)

    geojson = {"type": "FeatureCollection", "features": features}
    return geojson, type_counts


def main():
    print("=" * 60)
    print("  ResQMap — Fetch Real Hospitals & Clinics (Puri District, Bounds: 85.0-86.5, 19.4-20.6)")
    print("=" * 60)

    raw_elements = fetch_hospital_elements()
    geojson, type_counts = process_hospitals(raw_elements)

    with open(OUTPUT_RAW, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)

    print(f"\nSaved {len(geojson['features'])} raw hospitals to: {OUTPUT_RAW}")
    print(f"Hospital types breakdown: {type_counts}")
    print(f"IDs PURI-H0001 to PURI-H{len(geojson['features']):04d} are now FINAL.")
    print("=" * 60)
    return len(geojson["features"]), type_counts


if __name__ == "__main__":
    main()
