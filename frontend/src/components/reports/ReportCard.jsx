import { useState } from "react";
import { MapPin, House, CircleCheck, CircleX, RotateCcw, LoaderCircle, TriangleAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { reportTypeLabel } from "../../config/reports";

// The status changes an operator can make from each status
const ACTIONS = {
  UNVERIFIED: [
    { to: "VERIFIED", label: "Verify", icon: CircleCheck, className: "verify" },
    { to: "REJECTED", label: "Reject", icon: CircleX, className: "reject" }
  ],
  VERIFIED: [{ to: "UNVERIFIED", label: "Mark unverified", icon: RotateCcw, className: "" }],
  REJECTED: [{ to: "UNVERIFIED", label: "Mark unverified", icon: RotateCcw, className: "" }]
};

// One report in the list, with operator controls.
//   villageName – name of the linked village, if it matches a known settlement
//   onChangeStatus(report, newStatus) – returns a Promise
function ReportCard({ report, villageName, selected, onSelect, onChangeStatus }) {
  const [pending, setPending] = useState(null); // status waiting for confirmation
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const actions = ACTIONS[report.status] ?? ACTIONS.UNVERIFIED;

  async function confirm() {
    setSaving(true);
    setError(null);
    try {
      await onChangeStatus(report, pending);
      setPending(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className={selected ? "report-card selected" : "report-card"}>
      <button className="report-main" onClick={() => onSelect(report)} title="Show on map">
        <div className="report-top">
          <strong>{reportTypeLabel(report.report_type)}</strong>
          <StatusBadge status={report.status} />
        </div>
        {report.description && <p className="report-desc">{report.description}</p>}
        <div className="report-meta">
          <span>#{report.report_id}</span>
          {report.village_id && (
            <span>
              <House size={11} /> {villageName ? `${villageName} (${report.village_id})` : `${report.village_id} · not in settlement list`}
            </span>
          )}
          <span>
            <MapPin size={11} /> {report.latitude.toFixed(4)}° N, {report.longitude.toFixed(4)}° E
          </span>
        </div>
      </button>

      {/* ---------- Operator controls ---------- */}
      <div className="report-actions">
        {pending ? (
          <div className="confirm-row">
            <span>
              Change status to <strong>{pending}</strong>?
            </span>
            <button className="small-button primary" onClick={confirm} disabled={saving}>
              {saving ? <LoaderCircle size={12} className="spin" /> : null}
              {saving ? "Saving…" : "Confirm"}
            </button>
            <button className="small-button" onClick={() => setPending(null)} disabled={saving}>
              Cancel
            </button>
          </div>
        ) : (
          actions.map(({ to, label, icon: Icon, className }) => (
            <button key={to} className={`small-button ${className}`} onClick={() => setPending(to)}>
              <Icon size={12} /> {label}
            </button>
          ))
        )}
      </div>

      {error && (
        <p className="report-error">
          <TriangleAlert size={12} /> Status not changed: {error}
        </p>
      )}
    </article>
  );
}

export default ReportCard;
