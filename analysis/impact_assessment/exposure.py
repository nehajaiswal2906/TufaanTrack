
import geopandas as gpd
import pandas as pd


def assess_exposure(
    settlements,
    warning_zones,
    name_col="settlement",
    population_col="population"
):
    """
    Identify settlements intersecting cyclone warning zones
    and estimate their exposed population.

    Parameters:
        settlements: GeoDataFrame containing settlement points.
        warning_zones: GeoDataFrame containing warning polygons.
        name_col: Column containing settlement names.
        population_col: Column containing population estimates.

    Returns:
        Dictionary containing exposure assessment results.
    """

    # 1. Validate the input data
    if settlements.empty:
        raise ValueError("Settlement dataset is empty.")

    if warning_zones.empty:
        raise ValueError("Warning zone dataset is empty.")

    if settlements.crs is None or warning_zones.crs is None:
        raise ValueError("Both datasets must have a defined CRS.")

    if name_col not in settlements.columns:
        raise ValueError(f"Missing column: {name_col}")

    if population_col not in settlements.columns:
        raise ValueError(f"Missing column: {population_col}")

    # 2. Make sure both datasets use the same coordinate system
    warning_zones = warning_zones.to_crs(settlements.crs)

    # 3. Convert population values into numeric data
    settlements = settlements.copy()

    settlements[population_col] = pd.to_numeric(
        settlements[population_col],
        errors="coerce"
    )

    # 4. Combine all warning polygons into one assessment boundary
    warning_boundary = warning_zones.geometry.union_all()

    # 5. Check which settlement points intersect the warning boundary
    exposed_mask = settlements.geometry.intersects(warning_boundary)

    exposed = settlements.loc[exposed_mask].copy()

    # 6. Calculate population statistics
    known_population = exposed[population_col].dropna()

    exposed_population = int(known_population.sum())

    missing_population_count = int(
        exposed[population_col].isna().sum()
    )

    # 7. Prepare settlement-wise results
    exposed_settlements = []

    for _, row in exposed.iterrows():

        exposed_settlements.append({
            "settlement": str(row[name_col]),
            "population": (
                int(row[population_col])
                if pd.notna(row[population_col])
                else None
            )
        })

    # 8. Return the assessment
    return {
        "total_settlements": len(settlements),
        "exposed_settlements": len(exposed),
        "exposed_population": exposed_population,
        "missing_population_count": missing_population_count,
        "settlements": exposed_settlements,
        "assessment": "EXPOSURE DETECTED" if not exposed.empty
                      else "NO SETTLEMENT POINTS INTERSECTED"
    }
