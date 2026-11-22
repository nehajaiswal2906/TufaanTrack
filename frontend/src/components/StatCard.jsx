import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

// A clickable statistics card.
// Shows "…" while loading, "—" if the backend is unavailable,
// and the real number once it arrives. Never shows a made-up number.
function StatCard({ label, icon: Icon, value, caption, to, loading = false, error = false }) {
  const hasValue = value !== null && value !== undefined;

  let display = "—";
  let status = "NO DATA";
  let statusClass = "stat-status";

  if (loading) {
    display = "…";
    status = "LOADING";
  } else if (error) {
    status = "BACKEND UNAVAILABLE";
    statusClass = "stat-status error";
  } else if (hasValue) {
    display = value.toLocaleString("en-IN");
    status = "FROM BACKEND";
    statusClass = "stat-status live";
  }

  return (
    <Link to={to} className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <div className="stat-icon">
          <Icon size={17} />
        </div>
      </div>

      <h2 className={hasValue && !loading && !error ? "" : "stat-empty"}>{display}</h2>
      <p>{caption}</p>

      <div className="stat-bottom">
        <span className={statusClass}>{status}</span>
        <ArrowUpRight size={14} />
      </div>
    </Link>
  );
}

export default StatCard;
