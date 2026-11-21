import { BarChart3 } from "lucide-react";
import ModulePlaceholder from "../components/ModulePlaceholder";

function AssessmentPage() {
  return (
    <ModulePlaceholder
      icon={BarChart3}
      module={6}
      title="Impact Assessment Dashboard"
      summary="See which settlements are exposed and how urgently they need help, as assessed by the backend."
      features={[
        "Exposed settlements and population estimates",
        "Priority levels: LOW, MEDIUM, HIGH, NEEDS_ASSESSMENT",
        "Charts, statistics and sortable tables",
        "Reasons supplied by the backend for each priority"
      ]}
    />
  );
}

export default AssessmentPage;
