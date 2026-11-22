import { Users, Siren, ClipboardList, SearchCheck, Info, WifiOff } from "lucide-react";

import BarChart from "../components/assessment/BarChart";
import AssessmentTable from "../components/assessment/AssessmentTable";
import { useApi } from "../hooks/useApi";
import { loadAssessment, countReasons } from "../services/assessmentData";
import { PRIORITY_ORDER, PRIORITY_STYLES } from "../config/priority";
import "../components/settlements/settlements.css";
import "../components/assessment/assessment.css";

const fmt = (n) => Number(n).toLocaleString("en-IN");

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

function ChartCard({ title, subtitle, children }) {
  return (
    <section className="chart-card">
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </section>
  );
}

// Impact Assessment dashboard (Module 6).
// Shows the backend's assessment results — the frontend only displays,
// counts and sorts them. Priorities and reasons are never changed here.
function AssessmentPage() {
  const assessment = useApi(loadAssessment);

  if (assessment.loading) {
    return <div className="page-message">Loading the impact assessment from the backend…</div>;
  }

  if (assessment.error) {
    return (
      <div className="page-message error">
        <WifiOff size={22} />
        <p>{assessment.error}</p>
        <button className="secondary-button" onClick={assessment.retry}>Try again</button>
      </div>
    );
  }

  const items = assessment.data;

  if (items.length === 0) {
    return (
      <div className="page-message">
        <ClipboardList size={22} />
        <p>The backend returned no assessed villages. No village is currently inside the warning zone.</p>
      </div>
    );
  }

  // ---------- Totals (simple counts and sums of backend values) ----------
  const exposedTotal = items.reduce((sum, i) => sum + (i.exposed_population ?? 0), 0);
  const byPriority = (p) => items.filter((i) => i.priority === p);

  const priorityRows = PRIORITY_ORDER.map((p) => ({
    key: p,
    label: PRIORITY_STYLES[p].label,
    color: PRIORITY_STYLES[p].color,
    value: byPriority(p).length
  }));

  const populationRows = PRIORITY_ORDER.map((p) => ({
    key: p,
    label: PRIORITY_STYLES[p].label,
    color: PRIORITY_STYLES[p].color,
    value: byPriority(p).reduce((sum, i) => sum + (i.exposed_population ?? 0), 0)
  }));

  const gapRows = [
    { key: "no-shelter", label: "No shelter ≤10 km", value: items.filter((i) => i.nearby_shelters === 0).length },
    { key: "no-hospital", label: "No hospital ≤10 km", value: items.filter((i) => i.nearby_hospitals === 0).length },
    { key: "blockage", label: "Unverified blockage", value: items.filter((i) => i.unverified_blockage_reports > 0).length }
  ];

  const reasonRows = countReasons(items).map((r) => ({
    key: r.reason,
    label: r.reason,
    value: r.count,
    tooltip: `${r.count} of ${items.length} villages`
  }));

  const villages = (n) => `${n} ${n === 1 ? "village" : "villages"}`;

  return (
    <>
      <section className="summary-row">
        <SummaryTile icon={ClipboardList} label="Villages assessed" value={items.length} note="Inside the warning zone" />
        <SummaryTile icon={Users} label="Exposed population" value={fmt(exposedTotal)} note="Sum of backend figures" />
        <SummaryTile
          icon={Siren}
          label="High priority"
          value={byPriority("HIGH").length}
          note={`${fmt(byPriority("HIGH").reduce((s, i) => s + (i.exposed_population ?? 0), 0))} people exposed`}
        />
        <SummaryTile
          icon={SearchCheck}
          label="Needs assessment"
          value={byPriority("NEEDS_ASSESSMENT").length}
          note="Unverified road blockage reported"
        />
      </section>

      <div className="notice">
        <Info size={16} />
        <span>
          <strong>About this assessment.</strong> Priorities and reasons are calculated by the
          TufaanTrack backend from a <em>simulated</em> cyclone scenario, partly estimated
          populations and unverified candidate shelters. Use it for planning practice — it is
          not an official IMD warning or government assessment.
        </span>
      </div>

      {/* ---------- Charts: one measure per chart ---------- */}
      <section className="chart-grid">
        <ChartCard title="Villages by priority" subtitle="Number of assessed villages at each level">
          <BarChart rows={priorityRows} formatValue={(v) => villages(v)} />
        </ChartCard>

        <ChartCard title="Exposed population by priority" subtitle="People living in villages at each level">
          <BarChart rows={populationRows} formatValue={(v) => `${fmt(v)} people`} />
        </ChartCard>

        <ChartCard title="Access gaps" subtitle="Assessed villages with each problem">
          <BarChart
            rows={gapRows}
            formatValue={(v) => villages(v)}
            emptyText="No access gaps reported by the backend"
          />
        </ChartCard>

        <ChartCard title="Reasons given" subtitle="How many villages each backend reason applies to">
          <BarChart rows={reasonRows} formatValue={(v) => `${v} of ${items.length}`} />
        </ChartCard>
      </section>

      {/* ---------- Full table ---------- */}
      <section className="map-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">ASSESSMENT RESULTS</span>
            <h2>Assessed villages</h2>
          </div>
          <span className="status-badge live"><span></span> BACKEND DATA</span>
        </div>
        <AssessmentTable items={items} />
      </section>
    </>
  );
}

export default AssessmentPage;
