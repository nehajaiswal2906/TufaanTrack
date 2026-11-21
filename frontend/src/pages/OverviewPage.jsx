import { Link } from "react-router-dom";
import {
  MapPin,
  Shield,
  Hospital,
  Radio,
  Activity,
  Wind,
  Navigation,
  Satellite,
  Siren,
  ArrowRight,
  Info,
  WifiOff
} from "lucide-react";

import MapView from "../components/MapView";
import StatCard from "../components/StatCard";
import { ALL_PAGES } from "../config/navigation";
import { useApi } from "../hooks/useApi";
import { loadMapPoints } from "../services/mapData";
import { loadReports } from "../services/reportData";
import { loadAssessment } from "../services/assessmentData";
import PriorityBadge from "../components/PriorityBadge";
import StatusBadge from "../components/reports/StatusBadge";
import { PRIORITY_ORDER } from "../config/priority";
import { reportTypeLabel } from "../config/reports";
import { loadCycloneScenario } from "../services/cycloneData";

// One-line summary of the cyclone for the Intelligence Feed
function describeCyclone({ data, loading, error }) {
  if (loading) return "Loading cyclone data…";
  if (error) return "Cyclone data unavailable";
  const track = data?.tracks[0];
  if (!track) return "No cyclone track received";

  const parts = [track.name];
  if (track.category) parts.push(track.category);
  if (track.movement) parts.push(`moving ${track.movement.direction.short}`);
  if (data.zones.length) parts.push(`${data.zones.length} warning zones`);
  return parts.join(" · ") + (track.simulated ? " (simulated)" : "");
}

// Every page except Overview itself, for the "Quick Access" grid
const QUICK_LINKS = ALL_PAGES.filter((page) => page.path !== "/");

function OverviewPage() {
  // Load data from the backend
  const mapData = useApi(loadMapPoints);
  const reports = useApi(loadReports);
  const assessment = useApi(loadAssessment);
  const cyclone = useApi(loadCycloneScenario);

  const points = mapData.data; // { settlement, shelter, hospital } or null

  const stats = [
    { label: "SETTLEMENTS", icon: MapPin, value: points?.settlement.length, caption: "Monitored locations", to: "/settlements", state: mapData },
    { label: "CANDIDATE SHELTERS", icon: Shield, value: points?.shelter.length, caption: "Shelter locations (unverified)", to: "/shelters", state: mapData },
    { label: "MEDICAL FACILITIES", icon: Hospital, value: points?.hospital.length, caption: "Hospitals & health centres", to: "/medical", state: mapData },
    { label: "EMERGENCY REPORTS", icon: Radio, value: reports.data?.length, caption: "Community submissions", to: "/reports", state: reports }
  ];

  const feed = [
    {
      icon: Wind,
      title: "Cyclone Monitoring",
      text: describeCyclone(cyclone)
    },
    {
      icon: MapPin,
      title: "Geographic Coverage",
      text: points ? `${points.settlement.length} settlements loaded in Puri district` : "Waiting for settlement data"
    },
    {
      icon: Shield,
      title: "Emergency Infrastructure",
      text: points
        ? `${points.shelter.length} candidate shelters · ${points.hospital.length} health facilities`
        : "Waiting for shelter & hospital data"
    }
  ];

  // Connection badge next to "Infrastructure Overview"
  let badge = { className: "status-badge pending", text: "CONNECTING" };
  if (mapData.error) badge = { className: "status-badge error", text: "BACKEND OFFLINE" };
  else if (points) badge = { className: "status-badge live", text: "BACKEND CONNECTED" };

  return (
    <>
      {/* ---------- WELCOME BANNER ---------- */}
      <section className="welcome">
        <div className="welcome-text">
          <span className="eyebrow">SPACE-BASED DISASTER MANAGEMENT</span>
          <h2>Monitor. Predict. Respond.</h2>
          <p>
            Geospatial intelligence for cyclone preparedness and
            emergency response across India.
          </p>

          <div className="welcome-actions">
            <Link to="/map" className="primary-button">
              <Navigation size={15} /> Open Live Map
            </Link>
            <Link to="/sos" className="ghost-button">
              <Siren size={15} /> Submit SOS
            </Link>
          </div>
        </div>

        <div className="welcome-icon">
          <Satellite size={72} strokeWidth={1} />
        </div>
      </section>

      {/* ---------- DATA NOTICE ---------- */}
      {mapData.error ? (
        <div className="notice error">
          <WifiOff size={16} />
          <span>
            <strong>Backend unavailable.</strong> {mapData.error}{" "}
            <button className="link-button" onClick={mapData.retry}>Try again</button>
          </span>
        </div>
      ) : (
        <div className="notice">
          <Info size={16} />
          <span>
            <strong>About this data.</strong> Locations come from OpenStreetMap via the
            TufaanTrack backend. Many population figures are estimated, shelters are
            unverified candidate sites, and the cyclone scenario is simulated — not an
            official IMD forecast.
          </span>
        </div>
      )}

      {/* ---------- STATISTICS ---------- */}
      <section className="section-title">
        <div>
          <h2>Infrastructure Overview</h2>
          <p>Emergency resources and monitored locations</p>
        </div>
        <span className={badge.className}>
          <span></span> {badge.text}
        </span>
      </section>

      <section className="stats">
        {stats.map(({ state, ...stat }) => (
          <StatCard
            key={stat.label}
            {...stat}
            loading={state.loading}
            error={Boolean(state.error)}
          />
        ))}
      </section>

      {/* ---------- MAP + FEED ---------- */}
      <section className="workspace">
        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GEOSPATIAL ANALYSIS</span>
              <h2>Regional Intelligence Map</h2>
            </div>
            <Link to="/map" className="map-button">
              <Navigation size={15} /> Explore Map
            </Link>
          </div>

          <MapView
            height={430}
            data={points ?? { settlement: [], shelter: [], hospital: [] }}
            cyclone={cyclone.data}
            loading={mapData.loading || cyclone.loading}
            error={mapData.error}
            onRetry={mapData.retry}
          />
        </div>

        <aside className="intel-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">MONITORING CENTRE</span>
              <h2>Intelligence Feed</h2>
            </div>
            <Activity size={19} />
          </div>

          {feed.map(({ icon: Icon, title, text }) => (
            <div className="intel-card" key={title}>
              <Icon size={20} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}

          <Link to="/cyclone" className="intel-footer">
            <span>Open cyclone tracking</span>
            <ArrowRight size={15} />
          </Link>
        </aside>
      </section>

      {/* ---------- RESPONSE SNAPSHOT ---------- */}
      <section className="section-title spaced">
        <div>
          <h2>Response Snapshot</h2>
          <p>Impact assessment and the latest community reports</p>
        </div>
      </section>

      <section className="snapshot-grid">
        <div className="map-panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">IMPACT ASSESSMENT</span>
              <h2>Villages by priority</h2>
            </div>
            <Link to="/assessment" className="intel-footer inline">
              <span>Open</span> <ArrowRight size={14} />
            </Link>
          </div>
          {assessment.loading && <p className="panel-message">Loading assessment…</p>}
          {assessment.error && <p className="panel-message error">{assessment.error}</p>}
          {assessment.data && (
            <>
              <ul className="snapshot-list">
                {PRIORITY_ORDER.map((p) => {
                  const group = assessment.data.filter((a) => a.priority === p);
                  const people = group.reduce((sum, a) => sum + (a.exposed_population ?? 0), 0);
                  return (
                    <li key={p}>
                      <PriorityBadge priority={p} />
                      <span className="snapshot-count">
                        <strong>{group.length}</strong> {group.length === 1 ? "village" : "villages"}
                      </span>
                      <span className="snapshot-meta">{people.toLocaleString("en-IN")} people</span>
                    </li>
                  );
                })}
              </ul>
              <p className="snapshot-note">From the backend's assessment of a simulated scenario.</p>
            </>
          )}
        </div>

        <div className="map-panel snapshot-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EMERGENCY REPORTS</span>
              <h2>Latest reports</h2>
            </div>
            <Link to="/reports" className="intel-footer inline">
              <span>View all</span> <ArrowRight size={14} />
            </Link>
          </div>
          {reports.loading && <p className="panel-message">Loading reports…</p>}
          {reports.error && <p className="panel-message error">{reports.error}</p>}
          {reports.data && reports.data.length === 0 && (
            <p className="panel-message">
              No reports yet. <Link to="/sos" className="link-button">Submit an SOS</Link>
            </p>
          )}
          {reports.data && reports.data.length > 0 && (
            <ul className="snapshot-list">
              {[...reports.data]
                .sort((a, b) => b.report_id - a.report_id)
                .slice(0, 4)
                .map((r) => (
                  <li key={r.report_id}>
                    <StatusBadge status={r.status} />
                    <span className="snapshot-count">
                      <strong>{reportTypeLabel(r.report_type)}</strong>
                    </span>
                    <span className="snapshot-meta">#{r.report_id}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </section>

      {/* ---------- QUICK ACCESS ---------- */}
      <section className="section-title spaced">
        <div>
          <h2>Quick Access</h2>
          <p>Jump to any TufaanTrack module</p>
        </div>
      </section>

      <section className="quick-grid">
        {QUICK_LINKS.map((page) => {
          const Icon = page.icon;
          return (
            <Link to={page.path} className="quick-card" key={page.path}>
              <div className="quick-icon">
                <Icon size={19} />
              </div>
              <div className="quick-text">
                <h3>{page.label}</h3>
                <p>{page.description}</p>
              </div>
              <ArrowRight size={16} className="quick-arrow" />
            </Link>
          );
        })}
      </section>
    </>
  );
}

export default OverviewPage;
