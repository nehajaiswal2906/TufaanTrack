import math


def haversine_km(lat1, lon1, lat2, lon2):
    """
    Calculates the straight-line distance in kilometers between two
    latitude/longitude points using the Haversine formula.
    """
    earth_radius_km = 6371.0

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return earth_radius_km * c


def is_point_in_ring(lon, lat, ring_coords):
    """
    Checks if a point (lon, lat) is inside a single polygon ring using Ray-Casting.
    ring_coords is a list of [longitude, latitude] pairs.
    """
    inside = False
    num_points = len(ring_coords)

    j = num_points - 1
    for i in range(num_points):
        xi, yi = ring_coords[i][0], ring_coords[i][1]
        xj, yj = ring_coords[j][0], ring_coords[j][1]

        intersect = ((yi > lat) != (yj > lat)) and (
            lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi
        )
        if intersect:
            inside = not inside

        j = i

    return inside


def is_point_in_warning_zone(lon, lat, geometry):
    """
    Supports both GeoJSON Polygon and MultiPolygon geometries.
    """
    geom_type = geometry.get("type")
    coords = geometry.get("coordinates", [])

    if not coords:
        return False

    if geom_type == "Polygon":
        return is_point_in_ring(lon, lat, coords[0])

    if geom_type == "MultiPolygon":
        return any(is_point_in_ring(lon, lat, polygon[0]) for polygon in coords if polygon)

    return False


def run_assessment(villages, shelters, hospitals, warning_zone, reports):
    """
    Evaluates cyclone exposure, nearby facilities, unverified road blockages,
    and assigns transparent priority levels for villages inside the warning zone.
    """
    geometry = warning_zone.get("geometry", {})
    if not geometry.get("coordinates"):
        return []

    assessment_results = []

    for village in villages:
        v_lon = village["longitude"]
        v_lat = village["latitude"]

        # 1. Check if the village is inside the warning zone
        if not is_point_in_warning_zone(v_lon, v_lat, geometry):
            continue

        village_id = village["village_id"]
        population = village.get("population", 0)
        reasons = ["Village is inside the selected warning zone."]

        # 2. Count shelters within 10 km
        nearby_shelters = 0
        for shelter in shelters:
            dist = haversine_km(v_lat, v_lon, shelter["latitude"], shelter["longitude"])
            if dist <= 10.0:
                nearby_shelters += 1

        # 3. Count hospitals within 10 km
        nearby_hospitals = 0
        for hospital in hospitals:
            dist = haversine_km(v_lat, v_lon, hospital["latitude"], hospital["longitude"])
            if dist <= 10.0:
                nearby_hospitals += 1

        # 4. Count unverified road blockage reports for this village
        unverified_blockages = 0
        for report in reports:
            if (
                report.get("village_id") == village_id
                and report.get("report_type") == "ROAD_BLOCKAGE"
                and report.get("status") == "UNVERIFIED"
            ):
                unverified_blockages += 1

        # 5. Assign priority and transparent reasons
        if unverified_blockages > 0:
            priority = "NEEDS_ASSESSMENT"
            reasons.append("An unverified road blockage has been reported.")
        elif population >= 2000 or nearby_shelters == 0:
            priority = "HIGH"
            if population >= 2000:
                reasons.append(f"High exposed population ({population} residents).")
            if nearby_shelters == 0:
                reasons.append("No shelters found within 10 km.")
        elif population >= 1000 or nearby_hospitals == 0:
            priority = "MEDIUM"
            if population >= 1000:
                reasons.append(f"Moderate exposed population ({population} residents).")
            if nearby_hospitals == 0:
                reasons.append("No hospitals found within 10 km.")
        else:
            priority = "LOW"
            reasons.append("Lower exposed population with nearby shelter and hospital access.")

        assessment_results.append({
            "village_id": village_id,
            "name": village["name"],
            "exposed_population": population,
            "nearby_shelters": nearby_shelters,
            "nearby_hospitals": nearby_hospitals,
            "unverified_blockage_reports": unverified_blockages,
            "priority": priority,
            "reasons": reasons
        })

    return assessment_results


if __name__ == "__main__":
    import json

    sample_villages = [
        {"village_id": "V1", "name": "Village A", "population": 1200, "latitude": 19.80, "longitude": 85.82},
        {"village_id": "V2", "name": "Village B", "population": 2500, "latitude": 19.82, "longitude": 85.84},
        {"village_id": "V3", "name": "Village C", "population": 800, "latitude": 19.90, "longitude": 85.90},
        {"village_id": "V4", "name": "Village D", "population": 950, "latitude": 19.81, "longitude": 85.83},
    ]

    sample_shelters = [
        {"shelter_id": "S1", "name": "Shelter 1", "latitude": 19.78, "longitude": 85.85},
        {"shelter_id": "S2", "name": "Shelter 2", "latitude": 19.825, "longitude": 85.85},
    ]

    sample_hospitals = [
        {"hospital_id": "H1", "name": "PHC 1", "latitude": 19.77, "longitude": 85.84},
    ]

    sample_warning_zone = {
        "type": "Feature",
        "properties": {"warning_id": "TEST_WARNING_01"},
        "geometry": {
            "type": "Polygon",
            "coordinates": [[
                [85.80, 19.78],
                [85.86, 19.78],
                [85.86, 19.84],
                [85.80, 19.84],
                [85.80, 19.78]
            ]]
        }
    }

    sample_reports = [
        {"report_id": 1, "report_type": "ROAD_BLOCKAGE", "village_id": "V1", "status": "UNVERIFIED"}
    ]

    output = run_assessment(
        sample_villages,
        sample_shelters,
        sample_hospitals,
        sample_warning_zone,
        sample_reports
    )
    print(json.dumps(output, indent=2))
