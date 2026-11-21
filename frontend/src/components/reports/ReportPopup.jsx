import { Hash, MapPin, House } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { reportTypeLabel } from "../../config/reports";

// Content of a report's popup on the map
function ReportPopup({ report }) {
  return (
    <div className="tt-popup">
      <span className="tt-popup-type">Emergency report</span>
      <h4>{reportTypeLabel(report.report_type)}</h4>
      <div style={{ marginTop: 6 }}>
        <StatusBadge status={report.status} />
      </div>
      {report.description && <p className="tt-popup-text">{report.description}</p>}
      <dl className="tt-popup-details">
        <div>
          <dt><Hash size={12} /> Report ID</dt>
          <dd>{report.report_id}</dd>
        </div>
        {report.village_id && (
          <div>
            <dt><House size={12} /> Village ID</dt>
            <dd>{report.village_id}</dd>
          </div>
        )}
        <div>
          <dt><MapPin size={12} /> Coordinates</dt>
          <dd>{report.latitude.toFixed(4)}° N, {report.longitude.toFixed(4)}° E</dd>
        </div>
      </dl>
    </div>
  );
}

export default ReportPopup;
