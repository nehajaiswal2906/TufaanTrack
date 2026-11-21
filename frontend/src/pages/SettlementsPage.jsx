import { MapPin } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function SettlementsPage() {
  return (
    <ModulePlaceholder
      icon={MapPin}
      module={4}
      title="Settlement Information"
      summary="Browse monitored villages and see how exposed each one is."
      features={[
        "Settlements displayed on the map",
        "Clickable settlement information panel",
        "Name and population where available",
        "Exposure details and nearby emergency resources"
      ]}
    />
  );
}

export default SettlementsPage;
