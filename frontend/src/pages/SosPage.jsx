import { Siren } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function SosPage() {
  return (
    <ModulePlaceholder
      icon={Siren}
      module={7}
      title="Submit an SOS Request"
      summary="Send an emergency report with its type, description and location."
      features={[
        "Report type selection",
        "Description field with validation",
        "Location picked on the map or entered manually",
        "Confirmation after submission"
      ]}
    />
  );
}

export default SosPage;
