import MapView from "../components/MapView";
import CycloneInfoPanel from "../components/cyclone/CycloneInfoPanel";
import { useApi } from "../hooks/useApi";
import { loadMapPoints } from "../services/mapData";
import { loadCycloneScenario, isSimulated } from "../services/cycloneData";

// Cyclone Tracking page: map with the track and warning zones,
// plus an information panel on the right.
function CyclonePage() {
  const cyclone = useApi(loadCycloneScenario);
  const mapData = useApi(loadMapPoints);

  let badge = { className: "status-badge pending", text: "LOADING" };
  if (cyclone.error) badge = { className: "status-badge error", text: "BACKEND OFFLINE" };
  else if (cyclone.data && isSimulated(cyclone.data)) badge = { className: "status-badge pending", text: "SIMULATED SCENARIO" };
  else if (cyclone.data) badge = { className: "status-badge live", text: "BACKEND DATA" };

  return (
    <div className="cyclone-layout">
      <section className="map-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">CYCLONE TRACKING</span>
            <h2>Track & Warning Zones</h2>
          </div>
          <span className={badge.className}>
            <span></span> {badge.text}
          </span>
        </div>

        <p className="map-help">
          Arrows show the direction of movement. Click the track, a track point or a
          warning zone for details. Use the chips to add settlements, shelters and hospitals.
        </p>

        <MapView
          height="max(480px, calc(100vh - 340px))"
          data={mapData.data}
          cyclone={cyclone.data}
          isDemo={false}
          loading={cyclone.loading || mapData.loading}
          error={cyclone.error || mapData.error}
          onRetry={() => {
            cyclone.retry();
            mapData.retry();
          }}
          initialLayers={{ settlement: false, shelter: false, hospital: false }}
        />
      </section>

      <CycloneInfoPanel
        scenario={cyclone.data}
        loading={cyclone.loading}
        error={cyclone.error}
        onRetry={cyclone.retry}
      />
    </div>
  );
}

export default CyclonePage;
