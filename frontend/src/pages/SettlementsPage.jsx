import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MapPin, TriangleAlert, Users, Siren, Info, WifiOff } from "lucide-react";

import MapView from "../components/MapView";
import SettlementList from "../components/settlements/SettlementList";
import SettlementDetail from "../components/settlements/SettlementDetail";
import { useApi } from "../hooks/useApi";
import { loadSettlementData } from "../services/settlementData";
import { loadCycloneScenario } from "../services/cycloneData";
import "../components/settlements/settlements.css";

const MAP_HEIGHT = "max(540px, calc(100vh - 400px))";

// One summary number at the top of the page
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

function SettlementsPage() {
  const settlementData = useApi(loadSettlementData);
  const cyclone = useApi(loadCycloneScenario);

  // A link like /settlements?village=PURI-V0025 opens with that village selected
  const [searchParams] = useSearchParams();
  const [selectedVillageId, setSelectedVillageId] = useState(() => searchParams.get("village")); // village shown in the panel
  const [focusId, setFocusId] = useState(null); // shelter/hospital highlighted on the map

  const data = settlementData.data;
  const settlements = data?.settlements ?? [];
  const selectedVillage = settlements.find((v) => v.id === selectedVillageId) ?? null;

  function selectVillage(village) {
    setSelectedVillageId(village.id);
    setFocusId(null);
  }

  function handleMarkerClick(categoryKey, item) {
    if (categoryKey === "settlement") selectVillage(item);
    else setFocusId(item.id);
  }

  function closePanel() {
    setSelectedVillageId(null);
    setFocusId(null);
  }

  // ---------- Loading / error ----------
  if (settlementData.loading) {
    return <div className="page-message">Loading settlements from the backend…</div>;
  }

  if (settlementData.error) {
    return (
      <div className="page-message error">
        <WifiOff size={22} />
        <p>{settlementData.error}</p>
        <button className="secondary-button" onClick={settlementData.retry}>Try again</button>
      </div>
    );
  }

  // ---------- Summary numbers (all from backend data) ----------
  const assessed = settlements.filter((v) => v.assessment);
  const exposedTotal = assessed.reduce((sum, v) => sum + (v.assessment.exposed_population ?? 0), 0);
  const highCount = assessed.filter((v) => v.assessment.priority === "HIGH").length;
  const estimatedCount = settlements.filter((v) => v.pop_source === "estimated_default").length;

  return (
    <>
      <section className="summary-row">
        <SummaryTile
          icon={MapPin}
          label="Settlements"
          value={settlements.length}
          note={`${estimatedCount} with estimated population`}
        />
        <SummaryTile
          icon={TriangleAlert}
          label="In warning zone"
          value={data.assessmentAvailable ? assessed.length : "—"}
          note="Simulated scenario"
        />
        <SummaryTile
          icon={Users}
          label="Exposed population"
          value={data.assessmentAvailable ? exposedTotal.toLocaleString("en-IN") : "—"}
          note="Sum of backend figures"
        />
        <SummaryTile
          icon={Siren}
          label="High priority"
          value={data.assessmentAvailable ? highCount : "—"}
          note="From backend assessment"
        />
      </section>

      {!data.assessmentAvailable && (
        <div className="notice error">
          <Info size={16} />
          <span>
            <strong>Assessment unavailable.</strong> {data.assessmentError} Settlement details
            are still shown, but exposure and priority are missing.
          </span>
        </div>
      )}

      <section className="settlement-layout">
        <div className="map-panel list-column" style={{ "--list-height": MAP_HEIGHT }}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">PURI DISTRICT</span>
              <h2>Settlements</h2>
            </div>
          </div>
          <SettlementList
            settlements={settlements}
            selectedId={selectedVillageId}
            onSelect={selectVillage}
            assessmentAvailable={data.assessmentAvailable}
          />
        </div>

        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GEOSPATIAL VIEW</span>
              <h2>{selectedVillage ? selectedVillage.name : "Select a settlement"}</h2>
            </div>
            <span className="status-badge live"><span></span> BACKEND DATA</span>
          </div>

          <MapView
            height={MAP_HEIGHT}
            data={data.points}
            cyclone={cyclone.data}
            isDemo={false}
            loading={cyclone.loading}
            selectedId={focusId ?? selectedVillageId}
            onSelect={handleMarkerClick}
            fitCyclone={false}
            sidePanel={
              selectedVillage && (
                <SettlementDetail
                  village={selectedVillage}
                  shelters={data.points.shelter}
                  hospitals={data.points.hospital}
                  assessmentAvailable={data.assessmentAvailable}
                  onClose={closePanel}
                  onFocus={(item) => setFocusId(item.id)}
                />
              )
            }
          />
        </div>
      </section>
    </>
  );
}

export default SettlementsPage;
