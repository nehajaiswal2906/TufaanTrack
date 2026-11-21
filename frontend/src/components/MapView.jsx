import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { LoaderCircle, WifiOff, RefreshCw } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  LayersControl,
  ScaleControl
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./map/map.css";

import {
  MAP_CENTER,
  MAP_ZOOM,
  BASE_LAYERS,
  CATEGORIES,
  WARNING_COLOR,
  TRACK_COLOR
} from "../config/mapConfig";
import {
  DEMO_MAP_DATA,
  DEMO_WARNING_CIRCLE,
  DEMO_TRACK
} from "../data/demoMapData";
import { MARKER_ICONS } from "./map/markerIcons";
import MapPopup from "./map/MapPopup";
import MapLegend from "./map/MapLegend";
import MapControls from "./map/MapControls";

// Interactive Leaflet map.
// Props:
//   height   – map height, e.g. 430 or "70vh" (default 430)
//   data     – { settlement: [...], shelter: [...], hospital: [...] }
//   isDemo   – true while using demo data (shows warning labels)
//   loading  – true while data is being loaded from the backend
//   error    – error message if loading failed
//   onRetry  – function called by the "Try again" button
function MapView({
  height = 430,
  data = DEMO_MAP_DATA,
  isDemo = true,
  loading = false,
  error = null,
  onRetry
}) {
  const [map, setMap] = useState(null); // the Leaflet map, once it's ready
  const frameRef = useRef(null); // the box around the map (for fullscreen)

  // Which categories are switched on
  const [visible, setVisible] = useState({
    settlement: true,
    shelter: true,
    hospital: true
  });

  function toggleCategory(key) {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  }

  // When real data first arrives, zoom the map so every location fits
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!map || isDemo || hasFitted.current) return;
    const allPoints = Object.values(data).flat();
    if (allPoints.length === 0) return;
    map.fitBounds(
      L.latLngBounds(allPoints.map((item) => [item.latitude, item.longitude])),
      { padding: [30, 30] }
    );
    hasFitted.current = true;
  }, [map, data, isDemo]);

  // Coordinates of all currently visible markers (for "fit to markers")
  const visiblePoints = Object.keys(CATEGORIES)
    .filter((key) => visible[key])
    .flatMap((key) => (data[key] ?? []).map((item) => [item.latitude, item.longitude]));

  return (
    <div className="map-view">
      {/* ---------- CATEGORY FILTERS ---------- */}
      <div className="map-filters" role="group" aria-label="Show or hide map layers">
        {Object.entries(CATEGORIES).map(([key, category]) => {
          const Icon = category.icon;
          const count = data[key]?.length ?? 0;
          return (
            <button
              key={key}
              className={visible[key] ? "filter-chip on" : "filter-chip"}
              style={{ "--chip-color": category.color }}
              onClick={() => toggleCategory(key)}
              aria-pressed={visible[key]}
            >
              <Icon size={14} />
              {category.label}
              <span className="chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ---------- MAP ---------- */}
      <div className="map-frame" ref={frameRef} style={{ height }}>
        <MapContainer
          ref={setMap}
          center={MAP_CENTER}
          zoom={MAP_ZOOM}
          scrollWheelZoom={true}
          className="leaflet-map"
        >
          {/* Background map switcher (top-right) */}
          <LayersControl position="topright">
            {BASE_LAYERS.map((layer, index) => (
              <LayersControl.BaseLayer
                key={layer.name}
                name={layer.name}
                checked={index === 0}
              >
                <TileLayer
                  url={layer.url}
                  attribution={layer.attribution}
                  className={layer.className}
                />
              </LayersControl.BaseLayer>
            ))}
          </LayersControl>

          <ScaleControl position="bottomright" imperial={false} />

          {/* Demo warning zone and track (replaced in Module 3) */}
          {isDemo && (
            <>
              <Circle
                center={DEMO_WARNING_CIRCLE.center}
                radius={DEMO_WARNING_CIRCLE.radiusMeters}
                pathOptions={{
                  color: WARNING_COLOR,
                  fillColor: WARNING_COLOR,
                  fillOpacity: 0.12,
                  weight: 2
                }}
              />
              <Polyline
                positions={DEMO_TRACK}
                pathOptions={{
                  color: TRACK_COLOR,
                  weight: 3,
                  opacity: 0.9,
                  dashArray: "8 8"
                }}
              />
            </>
          )}

          {/* Markers for every switched-on category */}
          {Object.entries(CATEGORIES).map(([key, category]) =>
            visible[key]
              ? (data[key] ?? []).map((item) => (
                  <Marker
                    key={item.id}
                    position={[item.latitude, item.longitude]}
                    icon={MARKER_ICONS[key]}
                  >
                    <Popup>
                      <MapPopup
                        item={item}
                        categoryKey={key}
                        category={category}
                        isDemo={isDemo}
                      />
                    </Popup>
                  </Marker>
                ))
              : null
          )}
        </MapContainer>

        {/* Overlays on top of the map */}
        <MapControls map={map} frameRef={frameRef} points={visiblePoints} />
        <MapLegend showDemoShapes={isDemo} />

        {/* Loading / error messages on top of the map */}
        {loading && (
          <div className="map-status">
            <LoaderCircle size={22} className="spin" />
            <span>Loading map data from the backend…</span>
          </div>
        )}

        {error && !loading && (
          <div className="map-status error">
            <WifiOff size={22} />
            <span>{error}</span>
            {onRetry && (
              <button className="secondary-button" onClick={onRetry}>
                <RefreshCw size={14} /> Try again
              </button>
            )}
          </div>
        )}

        {isDemo && (
          <div className="map-demo-label">
            DEMO DATA · NOT LIVE DISASTER INFORMATION
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;
