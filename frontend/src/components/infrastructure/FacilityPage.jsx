import { useState } from "react";
import { Info, WifiOff, Route } from "lucide-react";

import MapView from "../MapView";
import FacilityList from "./FacilityList";
import FacilityDetail from "./FacilityDetail";
import { useApi } from "../../hooks/useApi";
import { loadSettlementData } from "../../services/settlementData";
import { loadCycloneScenario } from "../../services/cycloneData";
import { loadRoads } from "../../services/roadData";
import "../settlements/settlements.css";

const MAP_HEIGHT = "max(540px, calc(100vh - 460px))";

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

// Shared page for Cyclone Shelters and Medical Facilities.
// `config` is SHELTER_PAGE or HOSPITAL_PAGE (src/config/infrastructurePages.js).
function FacilityPage({ config }) {
  const settlementData = useApi(loadSettlementData);
  const cyclone = useApi(loadCycloneScenario);
  const roads = useApi(loadRoads);

  const [selectedId, setSelectedId] = useState(null); // facility shown in the panel
  const [focusId, setFocusId] = useState(null); // settlement highlighted on the map

  if (settlementData.loading) {
    return <div className="page-message">Loading {config.plural.toLowerCase()} from the backend…</div>;
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

  const data = settlementData.data;
  const items = data.points[config.categoryKey];
  const selected = items.find((f) => f.id === selectedId) ?? null;

  function select(facility) {
    setSelectedId(facility.id);
    setFocusId(null);
  }

  function handleMarkerClick(categoryKey, item) {
    if (categoryKey === config.categoryKey) select(item);
    else setFocusId(item.id);
  }

  const roadCount = roads.data?.features.length ?? 0;

  return (
    <>
      <section className="summary-row">
        {config.summary(items).map((tile) => (
          <SummaryTile key={tile.label} {...tile} />
        ))}
      </section>

      <div className="notice">
        <Info size={16} />
        <span>
          <strong>About this data.</strong> {config.notice}
        </span>
      </div>

      {/* Roads & bridges: only drawn if the backend sends them */}
      {!roads.loading && (
        <div className="notice subtle">
          <Route size={16} />
          <span>
            <strong>Roads & bridges.</strong>{" "}
            {roads.error
              ? "Road data could not be loaded from the backend."
              : roadCount > 0
                ? `${roadCount} road/bridge features from the backend are shown on the map.`
                : "No road or bridge data is available from the backend yet, so none is shown."}
          </span>
        </div>
      )}

      <section className="settlement-layout">
        <div className="map-panel list-column" style={{ "--list-height": MAP_HEIGHT }}>
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{config.eyebrow}</span>
              <h2>{config.plural}</h2>
            </div>
          </div>
          <FacilityList items={items} config={config} selectedId={selectedId} onSelect={select} />
        </div>

        <div className="map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GEOSPATIAL VIEW</span>
              <h2>{selected ? selected.name || "Unnamed facility" : `Select a ${config.singular.toLowerCase()}`}</h2>
            </div>
            <span className="status-badge live"><span></span> BACKEND DATA</span>
          </div>

          <MapView
            height={MAP_HEIGHT}
            data={data.points}
            cyclone={cyclone.data}
            roads={roads.data}
            isDemo={false}
            loading={cyclone.loading}
            selectedId={focusId ?? selectedId}
            onSelect={handleMarkerClick}
            fitCyclone={false}
            initialLayers={{
              settlement: false,
              shelter: config.categoryKey === "shelter",
              hospital: config.categoryKey === "hospital"
            }}
            sidePanel={
              selected && (
                <FacilityDetail
                  facility={selected}
                  config={config}
                  settlements={data.settlements}
                  assessmentAvailable={data.assessmentAvailable}
                  onClose={() => {
                    setSelectedId(null);
                    setFocusId(null);
                  }}
                  onFocus={(village) => setFocusId(village.id)}
                />
              )
            }
          />
        </div>
      </section>
    </>
  );
}

export default FacilityPage;
