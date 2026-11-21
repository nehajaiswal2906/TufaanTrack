#!/usr/bin/env python3
"""
validate_data.py  —  ResQMap GeoJSON data validator
Checks every data file for: required properties & types, no nulls,
no duplicate IDs, [lon,lat] within Puri bounds, valid geometry,
zone values, projected_surge_m numeric, metadata coverage.
Prints PASS/FAIL per file. Exits non-zero on any failure.
"""

import json
import sys
import os
import re

# ── Puri district sanity bounds ──────────────────────────────
LAT_MIN, LAT_MAX = 19.4, 20.6
LON_MIN, LON_MAX = 85.0, 86.5

# Wider bounds for cyclone track (offshore origin in Bay of Bengal)
TRACK_LAT_MIN, TRACK_LAT_MAX = 18.0, 21.5
TRACK_LON_MIN, TRACK_LON_MAX = 84.5, 88.0

# ── Optional: shapely for geometry validity ──────────────────
try:
    from shapely.geometry import shape as shapely_shape
    HAS_SHAPELY = True
except ImportError:
    HAS_SHAPELY = False

# ── Paths ────────────────────────────────────────────────────
DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VILLAGES  = os.path.join(DATA_DIR, "villages.geojson")
SHELTERS  = os.path.join(DATA_DIR, "shelters.geojson")
HOSPITALS = os.path.join(DATA_DIR, "hospitals.geojson")
CYCLONE   = os.path.join(DATA_DIR, "cyclone_warning.geojson")
METADATA  = os.path.join(DATA_DIR, "metadata.json")

ALL_GEOJSON = [VILLAGES, SHELTERS, HOSPITALS, CYCLONE]


# ── Helpers ──────────────────────────────────────────────────

def load_json(path):
    """Read and parse a JSON file."""
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def collect_coords(coords):
    """Flatten any nested coordinate structure into a list of [lon, lat] pairs."""
    if not coords:
        return []
    # Single point: [lon, lat]
    if isinstance(coords[0], (int, float)):
        return [coords]
    # Nested (line, polygon rings, etc.)
    result = []
    for item in coords:
        result.extend(collect_coords(item))
    return result


def check_type(value, expected):
    """Return True if value matches expected type(s), treating bool ≠ int."""
    types = expected if isinstance(expected, tuple) else (expected,)
    if isinstance(value, bool) and bool not in types:
        return False          # reject True/False where int or float expected
    return isinstance(value, expected)


# ── Core validator ───────────────────────────────────────────

def validate_geojson(path, id_field, req_fn, types_fn, allowed_geoms,
                     extra_fn=None, bounds_fn=None):
    """
    Validate a single GeoJSON file.
    req_fn(geom_type)   -> list of required property names
    types_fn(geom_type) -> dict {prop: type_or_tuple}
    Returns (passed: bool, messages: list[str]).
    """
    name = os.path.basename(path)
    msgs, errs = [], []

    # File exists?
    if not os.path.exists(path):
        return False, [f"[FAIL] {name}: file not found"]

    # Valid JSON?
    try:
        data = load_json(path)
    except json.JSONDecodeError as e:
        return False, [f"[FAIL] {name}: bad JSON — {e}"]

    # FeatureCollection?
    if data.get("type") != "FeatureCollection":
        errs.append(f"  root type is '{data.get('type')}', expected FeatureCollection")

    features = data.get("features", [])
    msgs.append(f"  features: {len(features)}")
    if not features:
        errs.append("  no features")

    seen_ids = set()

    for i, feat in enumerate(features):
        props = feat.get("properties") or {}
        geom  = feat.get("geometry") or {}
        gtype = geom.get("type", "")
        coords = geom.get("coordinates", [])

        # Geometry type
        if gtype not in allowed_geoms:
            errs.append(f"  #{i}: geometry '{gtype}' not in {allowed_geoms}")

        # Required properties
        for prop in req_fn(gtype):
            if prop not in props:
                errs.append(f"  #{i}: missing '{prop}'")
            elif props[prop] is None:
                errs.append(f"  #{i}: '{prop}' is null")

        # Type checks
        for prop, exp in types_fn(gtype).items():
            if prop in props and props[prop] is not None:
                if not check_type(props[prop], exp):
                    errs.append(
                        f"  #{i}: '{prop}' should be "
                        f"{exp.__name__ if isinstance(exp, type) else exp}, "
                        f"got {type(props[prop]).__name__}"
                    )

        # Name quality checks (no leading 6+ digits, not whitespace-only, not only digits)
        if "name" in props:
            name_val = props["name"]
            if not isinstance(name_val, str) or not name_val.strip():
                errs.append(f"  #{i}: 'name' is empty or whitespace-only")
            elif name_val.strip().isdigit():
                errs.append(f"  #{i}: 'name' is only digits: '{name_val}'")
            elif re.match(r"^\d{6,}", name_val.strip()):
                errs.append(f"  #{i}: 'name' has leading run of 6+ digits: '{name_val}'")

        # Duplicate IDs
        fid = props.get(id_field)
        if fid is not None:
            if fid in seen_ids:
                errs.append(f"  #{i}: duplicate {id_field} '{fid}'")
            seen_ids.add(fid)

        # Coordinate bounds — use per-feature bounds if a bounds_fn is provided
        if bounds_fn:
            lo_min, lo_max, la_min, la_max = bounds_fn(gtype)
        else:
            lo_min, lo_max, la_min, la_max = LON_MIN, LON_MAX, LAT_MIN, LAT_MAX
        for lon, lat, *_ in collect_coords(coords):
            if not (lo_min <= lon <= lo_max):
                errs.append(f"  #{i}: lon {lon} outside [{lo_min}, {lo_max}]")
                break                    # one error per feature is enough
            if not (la_min <= lat <= la_max):
                errs.append(f"  #{i}: lat {lat} outside [{la_min}, {la_max}]")
                break

        # Shapely geometry validity
        if HAS_SHAPELY and geom:
            try:
                g = shapely_shape(geom)
                if not g.is_valid:
                    errs.append(f"  #{i}: invalid geometry (shapely)")
            except Exception as e:
                errs.append(f"  #{i}: geometry error — {e}")

    # Extra file-level checks
    if extra_fn:
        errs.extend(extra_fn(data, features))

    ok = len(errs) == 0
    tag = "[PASS]" if ok else "[FAIL]"
    return ok, [f"{tag} {name}"] + msgs + errs


def validate_metadata(geojson_paths):
    """Check metadata.json exists and covers every GeoJSON file."""
    name = "metadata.json"
    errs = []

    if not os.path.exists(METADATA):
        return False, [f"[FAIL] {name}: file not found"]
    try:
        meta = load_json(METADATA)
    except json.JSONDecodeError as e:
        return False, [f"[FAIL] {name}: bad JSON — {e}"]

    files = meta.get("files", {})
    for gp in geojson_paths:
        bn = os.path.basename(gp)
        if bn not in files:
            errs.append(f"  missing entry for '{bn}'")
            continue
        entry = files[bn]
        for key in ("source", "date", "reliability"):
            if key not in entry:
                errs.append(f"  '{bn}' missing '{key}'")
            elif entry[key] is None:
                errs.append(f"  '{bn}' has null '{key}'")

    ok = len(errs) == 0
    tag = "[PASS]" if ok else "[FAIL]"
    return ok, [f"{tag} {name} — covers {len(geojson_paths)} files"] + errs


# ── Per-file schemas ─────────────────────────────────────────

# villages
VIL_REQ   = lambda _: ["village_id", "name", "population", "elevation_m", "pop_source"]
VIL_TYPES = lambda _: {
    "village_id": str, "name": str, "population": int,
    "elevation_m": (int, float), "pop_source": str,
}

# shelters
SHL_REQ   = lambda _: ["shelter_id", "name", "type", "capacity", "elevation_m", "source"]
SHL_TYPES = lambda _: {
    "shelter_id": str, "name": str, "type": str,
    "capacity": int, "elevation_m": (int, float), "source": str,
}

# hospitals
HSP_REQ   = lambda _: ["hospital_id", "name", "type", "beds", "elevation_m", "source"]
HSP_TYPES = lambda _: {
    "hospital_id": str, "name": str, "type": str,
    "beds": int, "elevation_m": (int, float), "source": str,
}

# cyclone_warning — schema differs by geometry type
def CW_REQ(gtype):
    base = ["warning_id", "simulated"]
    if gtype == "Polygon":
        return base + ["zone", "projected_surge_m"]
    if gtype == "LineString":
        return base + ["track_name", "category"]
    return base

def CW_TYPES(gtype):
    base = {"warning_id": str, "simulated": bool}
    if gtype == "Polygon":
        base["zone"] = str
        base["projected_surge_m"] = (int, float)
    if gtype == "LineString":
        base["track_name"] = str
        base["category"] = str
    return base

def cw_extra(data, features):
    """Zone must be RED or ORANGE; projected_surge_m must be numeric."""
    errs = []
    for i, f in enumerate(features):
        p = f.get("properties", {})
        g = f.get("geometry", {}).get("type", "")
        if g == "Polygon":
            z = p.get("zone")
            if z not in ("RED", "ORANGE"):
                errs.append(f"  #{i}: zone must be RED or ORANGE, got '{z}'")
            s = p.get("projected_surge_m")
            if s is not None and not isinstance(s, (int, float)):
                errs.append(f"  #{i}: projected_surge_m not numeric")
    return errs


def cw_bounds(gtype):
    """Return bounds box per geometry type: wider for tracks (offshore origin)."""
    if gtype == "LineString":
        return (TRACK_LON_MIN, TRACK_LON_MAX, TRACK_LAT_MIN, TRACK_LAT_MAX)
    return (LON_MIN, LON_MAX, LAT_MIN, LAT_MAX)


# ── Main ─────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  ResQMap Data Validator")
    print("=" * 60)
    if not HAS_SHAPELY:
        print("[WARN] shapely not installed — skipping deep geometry checks\n")

    all_ok = True

    checks = [
        (VILLAGES,  "village_id",  VIL_REQ,  VIL_TYPES,  ["Point"],              None),
        (SHELTERS,  "shelter_id",  SHL_REQ,  SHL_TYPES,  ["Point"],              None),
        (HOSPITALS, "hospital_id", HSP_REQ,  HSP_TYPES,  ["Point"],              None),
        (CYCLONE,   "warning_id",  CW_REQ,   CW_TYPES,   ["Polygon","LineString"], cw_extra, cw_bounds),
    ]

    for path, idf, req, typ, geoms, extra, *rest in checks:
        bfn = rest[0] if rest else None
        ok, msgs = validate_geojson(path, idf, req, typ, geoms, extra, bfn)
        all_ok = all_ok and ok
        for m in msgs:
            print(m)
        print()

    # metadata
    ok, msgs = validate_metadata(ALL_GEOJSON)
    all_ok = all_ok and ok
    for m in msgs:
        print(m)

    print("\n" + "=" * 60)
    if all_ok:
        print("  ALL CHECKS PASSED  ✓")
    else:
        print("  SOME CHECKS FAILED  ✗")
    print("=" * 60)
    sys.exit(0 if all_ok else 1)


if __name__ == "__main__":
    main()
