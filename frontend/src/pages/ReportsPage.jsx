import { Radio } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function ReportsPage() {
  return (
    <ModulePlaceholder
      icon={Radio}
      module={7}
      title="Emergency Reports"
      summary="Review emergency reports submitted by the community."
      features={[
        "Organised list of submitted reports",
        "UNVERIFIED, VERIFIED and REJECTED status badges",
        "Status update controls for authorised users",
        "Report locations on the map"
      ]}
    />
  );
}

export default ReportsPage;
