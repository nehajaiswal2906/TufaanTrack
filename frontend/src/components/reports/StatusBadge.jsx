import { CircleHelp, CircleCheck, CircleX } from "lucide-react";
import { REPORT_STATUSES } from "../../config/reports";

const ICONS = { UNVERIFIED: CircleHelp, VERIFIED: CircleCheck, REJECTED: CircleX };

// Report status label with an icon, so it never relies on colour alone
function StatusBadge({ status }) {
  const style = REPORT_STATUSES[status] ?? { label: status ?? "Unknown", color: "#8ea3b9" };
  const Icon = ICONS[status] ?? CircleHelp;

  return (
    <span className="priority-badge small" style={{ "--priority-color": style.color }}>
      <Icon size={11} />
      {style.label}
    </span>
  );
}

export default StatusBadge;
