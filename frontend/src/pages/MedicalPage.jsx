import { Hospital } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function MedicalPage() {
  return (
    <ModulePlaceholder
      icon={Hospital}
      module={5}
      title="Medical Facilities"
      summary="Locate hospitals and primary health centres near affected areas."
      features={[
        "Hospital and PHC markers on the map",
        "Facility list with type labels",
        "Information panel for each facility",
        "Distance to nearby settlements when provided"
      ]}
    />
  );
}

export default MedicalPage;
