import { Shield } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function SheltersPage() {
  return (
    <ModulePlaceholder
      icon={Shield}
      module={5}
      title="Cyclone Shelters"
      summary="Locate cyclone shelters and review their details."
      features={[
        "Shelter markers on the map",
        "Shelter list with search",
        "Information panel for each shelter",
        "Roads and bridges when data is available"
      ]}
    />
  );
}

export default SheltersPage;
