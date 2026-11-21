
import json
from pathlib import Path
from datetime import datetime, timezone


def save_assessment_report(
    results,
    output_file,
    metadata=None,
    facility_results=None
):

    if metadata is None:
        metadata = {}

    if facility_results is None:
        facility_results = []

    report = {
        "project": "TufaanTrack",

        "report_generated_at": datetime.now(
            timezone.utc
        ).isoformat(),

        "metadata": metadata,

        "summary": {
            "total_settlements": results["total_settlements"],
            "exposed_settlements": results["exposed_settlements"],
            "estimated_exposed_population": results[
                "exposed_population"
            ],
            "missing_population_count": results[
                "missing_population_count"
            ],
            "assessment": results["assessment"]
        },

        "exposed_locations": [
            {
                "name": village["settlement"],
                "population": village["population"]
            }
            for village in results["settlements"]
        ],

        "facility_assessment": facility_results,

        "limitations": [
            "This test uses synthetic geographical data.",
            "Settlement-centre points are used for exposure analysis.",
            "Facility distances represent straight-line distances.",
            "Road accessibility has not been assessed.",
            "Facility operational status is not verified.",
            "Results are decision-support information, not official evacuation instructions."
        ]
    }

    output_path = Path(output_file)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    with output_path.open("w", encoding="utf-8") as file:

        json.dump(
            report,
            file,
            indent=4,
            ensure_ascii=False
        )

    print(
        f"\nComplete assessment report saved: {output_path}"
    )
