import { Wind } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function CyclonePage() {
  return (
    <ModulePlaceholder
      icon={Wind}
      module={3}
      title="Cyclone Tracking Interface"
      summary="Follow a cyclone's path and see which areas fall inside the warning zone."
      features={[
        "Cyclone track drawn from backend data",
        "Warning-zone polygons on the map",
        "Cyclone details and movement direction panel",
        "Clear labels for historical or simulated data"
      ]}
    />
  );
}

export default CyclonePage;
