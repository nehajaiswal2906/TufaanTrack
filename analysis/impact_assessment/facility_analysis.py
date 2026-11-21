
import geopandas as gpd


def analyze_nearby_facilities(
    settlements,
    shelters,
    hospitals,
    radius_km=10,
    settlement_name_col="settlement",
    shelter_name_col="name",
    hospital_name_col="name"
):
    """
    Find nearby shelters and hospitals for each settlement.

    Distances are calculated in metres using UTM Zone 45N.
    Facility operational status is not assumed.
    """

    # STEP 1: Validate coordinate systems

    datasets = {
        "settlements": settlements,
        "shelters": shelters,
        "hospitals": hospitals
    }

    for dataset_name, dataset in datasets.items():

        if dataset.crs is None:
            raise ValueError(
                f"{dataset_name} dataset has no CRS defined."
            )

    if settlements.empty:
        raise ValueError("Settlement dataset is empty.")

    if settlement_name_col not in settlements.columns:
        raise ValueError("Settlement name column is missing.")

    if not shelters.empty and shelter_name_col not in shelters.columns:
        raise ValueError("Shelter name column is missing.")

    if not hospitals.empty and hospital_name_col not in hospitals.columns:
        raise ValueError("Hospital name column is missing.")

    if radius_km <= 0:
        raise ValueError("Search radius must be positive.")

    # STEP 2: Convert datasets to a metric coordinate system

    target_crs = "EPSG:32645"

    settlements_m = settlements.to_crs(target_crs)

    shelters_m = shelters.to_crs(target_crs)

    hospitals_m = hospitals.to_crs(target_crs)

    radius_m = radius_km * 1000

    assessment_results = []

    # STEP 3: Analyse every settlement

    for _, settlement in settlements_m.iterrows():

        settlement_point = settlement.geometry

        if settlement_point is None or settlement_point.is_empty:
            continue

        if not settlement_point.is_valid:
            continue

        result = {
            "settlement": str(settlement[settlement_name_col]),
            "search_radius_km": radius_km,
            "nearby_shelter_count": 0,
            "nearest_shelter": None,
            "nearest_shelter_distance_km": None,
            "shelter_operational_status": "Unknown",
            "nearby_hospital_count": 0,
            "nearest_hospital": None,
            "nearest_hospital_distance_km": None,
            "hospital_operational_status": "Unknown"
        }

        # STEP 4: Find nearby shelters

        if not shelters_m.empty:

            shelter_distances = shelters_m.geometry.distance(
                settlement_point
            )

            nearby_shelters = shelter_distances[
                shelter_distances <= radius_m
            ]

            result["nearby_shelter_count"] = len(
                nearby_shelters
            )

            if not shelter_distances.empty:

                nearest_index = shelter_distances.idxmin()

                nearest_distance = shelter_distances.loc[
                    nearest_index
                ]

                result["nearest_shelter"] = str(
                    shelters_m.loc[
                        nearest_index, shelter_name_col
                    ]
                )

                result["nearest_shelter_distance_km"] = round(
                    nearest_distance / 1000, 2
                )

        # STEP 5: Find nearby hospitals

        if not hospitals_m.empty:

            hospital_distances = hospitals_m.geometry.distance(
                settlement_point
            )

            nearby_hospitals = hospital_distances[
                hospital_distances <= radius_m
            ]

            result["nearby_hospital_count"] = len(
                nearby_hospitals
            )

            if not hospital_distances.empty:

                nearest_index = hospital_distances.idxmin()

                nearest_distance = hospital_distances.loc[
                    nearest_index
                ]

                result["nearest_hospital"] = str(
                    hospitals_m.loc[
                        nearest_index, hospital_name_col
                    ]
                )

                result["nearest_hospital_distance_km"] = round(
                    nearest_distance / 1000, 2
                )

        assessment_results.append(result)

    return assessment_results
