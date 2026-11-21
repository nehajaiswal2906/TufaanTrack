import MapView from "../components/MapView";
import { useApi } from "../hooks/useApi";
import { loadMapPoints } from "../services/mapData";
import { loadCycloneScenario } from "../services/cycloneData";

// Full map page: a taller map with every map tool, using backend data.
function LiveMapPage() {
  const mapData = useApi(loadMapPoints);
  const cyclone = useApi(loadCycloneScenario);

  let badge = { className: "status-badge pending", text: "LOADING" };
  if (mapData.error) badge = { className: "status-badge error", text: "BACKEND OFFLINE" };
  else if (mapData.data) badge = { className: "status-badge live", text: "BACKEND DATA" };

  return (
    <section className="map-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">GEOSPATIAL ANALYSIS</span>
          <h2>Puri District, Odisha</h2>
        </div>
        <span className={badge.className}>
          <span></span> {badge.text}
        </span>
      </div>

      <p className="map-help">
        Use the chips to show or hide layers, click a marker for details,
        and switch between Dark and Street maps from the layers button (top-right).
        Shelters are candidate sites, some populations are estimated, and the cyclone scenario is simulated — check each popup.
      </p>

      {/* Taller map: fills most of the screen, but never shorter than 460px */}
      <MapView
        height="max(460px, calc(100vh - 330px))"
        data={mapData.data ?? { settlement: [], shelter: [], hospital: [] }}
        cyclone={cyclone.data}
        loading={mapData.loading || cyclone.loading}
        error={mapData.error}
        onRetry={mapData.retry}
      />
    </section>
  );
}

export default LiveMapPage;
