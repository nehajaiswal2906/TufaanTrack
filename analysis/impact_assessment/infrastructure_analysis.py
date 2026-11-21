import geopandas as gpd


def analyze_infrastructure_exposure(roads, bridges, warning_zones):
    """
    Identifies roads and bridges intersecting the cyclone warning zone.
    """
    # Combine warning polygons into a single geometry for intersection checks
    warning_union = warning_zones.geometry.union_all()

    affected_roads = []
    for _, row in roads.iterrows():
        if row.geometry.intersects(warning_union):
            affected_roads.append({
                "road_id": row["road_id"],
                "name": row["name"],
                "road_type": row["road_type"],
                "status": "At Risk - Intersects Warning Zone"
            })

    affected_bridges = []
    for _, row in bridges.iterrows():
        if row.geometry.intersects(warning_union):
            affected_bridges.append({
                "bridge_id": row["bridge_id"],
                "name": row["name"],
                "status": "At Risk - Inside Warning Zone"
            })

    return {
        "total_roads_analysed": len(roads),
        "affected_roads_count": len(affected_roads),
        "affected_roads": affected_roads,
        "total_bridges_analysed": len(bridges),
        "affected_bridges_count": len(affected_bridges),
        "affected_bridges": affected_bridges
    }
