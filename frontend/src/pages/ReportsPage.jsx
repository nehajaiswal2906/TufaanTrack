import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Radio, CircleHelp, CircleCheck, CircleX, Search, X, RefreshCw, ShieldAlert, WifiOff, Siren, Inbox } from "lucide-react";

import MapView from "../components/MapView";
import ReportCard from "../components/reports/ReportCard";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";
import { loadMapPoints } from "../services/mapData";
import { loadReports, reportsToPoints } from "../services/reportData";
import { REPORT_STATUSES, STATUS_ORDER, reportTypeLabel } from "../config/reports";
import "../components/settlements/settlements.css";
import "../components/reports/reports.css";

const MAP_HEIGHT = "max(540px, calc(100vh - 420px))";

function SummaryTile({ icon: Icon, label, value, note }) {
  return (
    <div className="summary-tile">
      <div className="summary-icon"><Icon size={17} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </div>
    </div>
  );
}

function ReportsPage() {
  const reportsData = useApi(loadReports);
  const mapData = useApi(loadMapPoints);

  // Reports changed by the operator in this session (report_id → updated report)
  const [updated, setUpdated] = useState({});
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  // Latest version of every report (backend data + this session's changes)
  const reports = useMemo(
    () => (reportsData.data ?? []).map((r) => updated[r.report_id] ?? r),
    [reportsData.data, updated]
  );

  const villageNames = useMemo(
    () => new Map((mapData.data?.settlement ?? []).map((v) => [v.village_id, v.name])),
    [mapData.data]
  );

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return reports
      .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
      .filter((r) => typeFilter === "ALL" || r.report_type === typeFilter)
      .filter(
        (r) =>
          !text ||
          r.description?.toLowerCase().includes(text) ||
          String(r.report_id).includes(text) ||
          r.village_id?.toLowerCase().includes(text) ||
          villageNames.get(r.village_id)?.toLowerCase().includes(text)
      )
      .sort((a, b) => b.report_id - a.report_id); // newest first
  }, [reports, statusFilter, typeFilter, query, villageNames]);

  // Map points for the visible reports (worked out only when the list changes)
  const reportPoints = useMemo(() => reportsToPoints(visible), [visible]);

  // Sends the status change to the backend, then shows the saved version
  async function changeStatus(report, status) {
    const saved = await api.updateReportStatus(report.report_id, status);
    setUpdated((current) => ({ ...current, [saved.report_id]: saved }));
  }

  function refresh() {
    setUpdated({});
    reportsData.retry();
  }

  // ---------- Loading / error ----------
  if (reportsData.loading) return <div className="page-message">Loading reports from the backend…</div>;
  if (reportsData.error) {
    return (
      <div className="page-message error">
        <WifiOff size={22} />
        <p>{reportsData.error}</p>
        <button className="secondary-button" onClick={reportsData.retry}>Try again</button>
      </div>
    );
  }

  const count = (status) => reports.filter((r) => r.status === status).length;
  const types = [...new Set(reports.map((r) => r.report_type))].sort();

  return (
    <>
      <section className="summary-row">
        <SummaryTile icon={Radio} label="All reports" value={reports.length} note="From the backend" />
        <SummaryTile icon={CircleHelp} label="Unverified" value={count("UNVERIFIED")} note="Waiting for review" />
        <SummaryTile icon={CircleCheck} label="Verified" value={count("VERIFIED")} note="Confirmed by an operator" />
        <SummaryTile icon={CircleX} label="Rejected" value={count("REJECTED")} note="Not confirmed" />
      </section>

      <div className="notice">
        <ShieldAlert size={16} />
        <span>
          <strong>Operator controls.</strong> The backend does not have user login yet, so anyone
          using this site can change a report's status. Each change asks for confirmation.
          Unverified road-blockage reports linked to a village are used by the impact assessment.
        </span>
      </div>

      <section className="settlement-layout">
        {/* ---------- List ---------- */}
        <div className="map-panel list-column" style={{ "--list-height": MAP_HEIGHT }}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">COMMUNITY SUBMISSIONS</span>
              <h2>Emergency reports</h2>
            </div>
            <button className="icon-button" onClick={refresh} title="Refresh reports" aria-label="Refresh reports">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="settlement-list-panel">
            <div className="list-controls">
              <label className="search-box">
                <Search size={15} />
                <input
                  type="search"
                  placeholder="Search description, ID or village…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search reports"
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search">
                    <X size={14} />
                  </button>
                )}
              </label>

              <div className="segmented" role="group" aria-label="Filter by status">
                <button className={statusFilter === "ALL" ? "active" : ""} onClick={() => setStatusFilter("ALL")}>
                  All <span>{reports.length}</span>
                </button>
                {STATUS_ORDER.map((s) => (
                  <button key={s} className={statusFilter === s ? "active" : ""} onClick={() => setStatusFilter(s)}>
                    {REPORT_STATUSES[s].label} <span>{count(s)}</span>
                  </button>
                ))}
              </div>

              {types.length > 1 && (
                <label className="sort-select">
                  Type
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="ALL">All types</option>
                    {types.map((t) => (
                      <option key={t} value={t}>{reportTypeLabel(t)}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <p className="list-count">Showing {visible.length} of {reports.length} reports · newest first</p>

            {reports.length === 0 ? (
              <div className="list-empty">
                <Inbox size={22} />
                <p>No reports have been submitted yet.</p>
                <Link to="/sos" className="secondary-button"><Siren size={14} /> Submit the first SOS</Link>
              </div>
            ) : visible.length === 0 ? (
              <div className="list-empty">
                <p>No reports match these filters.</p>
                <button className="link-button" onClick={() => { setQuery(""); setStatusFilter("ALL"); setTypeFilter("ALL"); }}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="report-list">
                {visible.map((report) => (
                  <ReportCard
                    key={report.report_id}
                    report={report}
                    villageName={villageNames.get(report.village_id)}
                    selected={selectedId === `report-${report.report_id}`}
                    onSelect={(r) => setSelectedId(`report-${r.report_id}`)}
                    onChangeStatus={changeStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ---------- Map ---------- */}
        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GEOSPATIAL VIEW</span>
              <h2>Report locations</h2>
            </div>
            <Link to="/sos" className="map-button"><Siren size={15} /> New SOS</Link>
          </div>
          <MapView
            height={MAP_HEIGHT}
            data={mapData.data ?? { settlement: [], shelter: [], hospital: [] }}
            reports={reportPoints}
            loading={mapData.loading}
            initialLayers={{ settlement: false, shelter: false, hospital: false }}
            selectedId={selectedId}
            onSelect={(key, item) => {
              if (key === "report") setSelectedId(item.id);
            }}
          />
        </div>
      </section>
    </>
  );
}

export default ReportsPage;
