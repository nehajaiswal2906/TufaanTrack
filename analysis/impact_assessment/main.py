
import geopandas as gpd
from shapely.geometry import Point, Polygon

from exposure import assess_exposure
from facility_analysis import analyze_nearby_facilities
from report import save_assessment_report


# =========================================
# TUFAANTRACK - DISASTER RESPONSE INTELLIGENCE
# =========================================


# STEP 1: CREATE SYNTHETIC SETTLEMENT DATA

settlement_data = {
    "settlement": [
        "Village A",
        "Village B",
        "Village C",
        "Village D",
        "Village E"
    ],

    "population": [
        1200,
        2500,
        800,
        1500,
        900
    ],

    "geometry": [
        Point(85.82, 19.80),
        Point(85.84, 19.82),
        Point(85.90, 19.90),
        Point(85.83, 19.81),
        Point(85.95, 19.95)
    ]
}

settlements = gpd.GeoDataFrame(
    settlement_data,
    geometry="geometry",
    crs="EPSG:4326"
)


# STEP 2: CREATE SYNTHETIC WARNING ZONE

warning_polygon = Polygon([
    (85.80, 19.78),
    (85.86, 19.78),
    (85.86, 19.84),
    (85.80, 19.84),
    (85.80, 19.78)
])

warning_zones = gpd.GeoDataFrame(
    {"warning_id": ["TEST_WARNING_01"]},
    geometry=[warning_polygon],
    crs="EPSG:4326"
)


# STEP 3: RUN CYCLONE EXPOSURE ANALYSIS

results = assess_exposure(
    settlements,
    warning_zones
)


# STEP 4: SELECT EXPOSED SETTLEMENTS

exposed_names = {
    item["settlement"]
    for item in results["settlements"]
}

exposed_settlements = settlements[
    settlements["settlement"].isin(exposed_names)
].copy()


# STEP 5: CREATE SYNTHETIC SHELTER DATA

shelter_data = {
    "name": [
        "Shelter A",
        "Shelter B",
        "Shelter C"
    ],

    "geometry": [
        Point(85.825, 19.805),
        Point(85.850, 19.825),
        Point(85.900, 19.900)
    ]
}

shelters = gpd.GeoDataFrame(
    shelter_data,
    geometry="geometry",
    crs="EPSG:4326"
)


# STEP 6: CREATE SYNTHETIC HOSPITAL DATA

hospital_data = {
    "name": [
        "Hospital A",
        "Hospital B"
    ],

    "geometry": [
        Point(85.830, 19.810),
        Point(85.880, 19.880)
    ]
}

hospitals = gpd.GeoDataFrame(
    hospital_data,
    geometry="geometry",
    crs="EPSG:4326"
)


# STEP 7: RUN FACILITY PROXIMITY ANALYSIS

facility_results = analyze_nearby_facilities(
    settlements=exposed_settlements,
    shelters=shelters,
    hospitals=hospitals,
    radius_km=10
)


# STEP 8: DISPLAY EXPOSURE RESULTS

print("\n========== TUFAANTRACK ==========")
print("     CYCLONE EXPOSURE ANALYSIS")
print("=================================\n")

print("Total settlements analysed:",
      results["total_settlements"])

print("Exposed settlements:",
      results["exposed_settlements"])

print("Estimated exposed population:",
      results["exposed_population"])

print("Assessment:",
      results["assessment"])


# STEP 9: DISPLAY FACILITY RESULTS

print("\n====== FACILITY INTELLIGENCE ======\n")

for item in facility_results:

    print("Settlement:", item["settlement"])

    print(
        "Nearby shelters:",
        item["nearby_shelter_count"]
    )

    print(
        "Nearest shelter:",
        item["nearest_shelter"]
    )

    print(
        "Distance to shelter:",
        item["nearest_shelter_distance_km"],
        "km"
    )

    print(
        "Nearby hospitals:",
        item["nearby_hospital_count"]
    )

    print(
        "Nearest hospital:",
        item["nearest_hospital"]
    )

    print(
        "Distance to hospital:",
        item["nearest_hospital_distance_km"],
        "km"
    )

    print("Operational status: Unknown")
    print("---------------------------------")


# STEP 10: GENERATE COMPLETE JSON REPORT

save_assessment_report(
    results=results,

    output_file="output/exposure_report.json",

    metadata={
        "district": "Puri",
        "data_status": "synthetic_test_data",
        "warning_id": "TEST_WARNING_01",
        "coordinate_system": "EPSG:4326",
        "analysis_method": "settlement_point_intersection",
        "facility_search_radius_km": 10
    },

    facility_results=facility_results
)

print("\nTufaanTrack analysis completed successfully!")
