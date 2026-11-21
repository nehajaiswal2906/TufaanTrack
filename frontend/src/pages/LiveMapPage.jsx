import MapView from "../components/MapView";
import { useApi } from "../hooks/useApi";
import { loadMapPoints } from "../services/mapData";

// Full map page: a taller map with every map tool, using backend data.
function LiveMapPage() {
  const mapData = useApi(loadMapPoints);

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
        Shelters are candidate sites and some populations are estimated — check each popup.
      </p>

      {/* Taller map: fills most of the screen, but never shorter than 460px */}
      <MapView
        height="max(460px, calc(100vh - 330px))"
        data={mapData.data ?? { settlement: [], shelter: [], hospital: [] }}
        isDemo={false}
        loading={mapData.loading}
        error={mapData.error}
        onRetry={mapData.retry}
      />
    </section>
  );
}

export default LiveMapPage;
