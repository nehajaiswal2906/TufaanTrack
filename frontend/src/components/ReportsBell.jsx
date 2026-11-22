import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useApi } from "../hooks/useApi";
import { loadReports } from "../services/reportData";

// Bell in the top bar: links to Emergency Reports and shows how many
// reports are still UNVERIFIED (waiting for an operator).
function ReportsBell() {
  const reports = useApi(loadReports);
  const waiting = (reports.data ?? []).filter((r) => r.status === "UNVERIFIED").length;

  const label = reports.error
    ? "Emergency reports (backend unavailable)"
    : `${waiting} report${waiting === 1 ? "" : "s"} waiting for review`;

  return (
    <Link to="/reports" className="icon-button bell-button" title={label} aria-label={label}>
      <Bell size={18} />
      {waiting > 0 && <span className="bell-count">{waiting > 99 ? "99+" : waiting}</span>}
    </Link>
  );
}

export default ReportsBell;
