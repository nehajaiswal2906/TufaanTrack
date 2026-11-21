import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  LayersControl,
  ScaleControl
} from "react-leaflet";
import L from "leaflet";
import { LoaderCircle, WifiOff, RefreshCw, Wind } from "lucide-react";
import "leaflet/dist/leaflet.css";
import "./map/map.css";

import {
  MAP_CENTER,
  MAP_ZOOM,
  BASE_LAYERS,
  CATEGORIES,
  TRACK_COLOR
} from "../config/mapConfig";
import { DEMO_MAP_DATA } from "../data/demoMapData";
import { isSimulated } from "../services/cycloneData";
import { flattenLatLngs } from "../utils/geojson";
import { MARKER_ICONS } from "./map/markerIcons";
import MapPopup from "./map/MapPopup";
import MapLegend from "./map/MapLegend";
import MapControls from "./map/MapControls";
import CycloneLayers from "./map/CycloneLayers";

const EMPTY_DATA = { settlement: [], shelter: [], hospital: [] };

// Interactive Leaflet map.
// Props:
//   height   – map height, e.g. 430 or "70vh" (default 430)
//   data     – { settlement: [...], shelter: [...], hospital: [...] }
//   cyclone  – cyclone scenario from loadCycloneScenario(), or null
//   isDemo   – true while using demo data (shows warning labels)
//   loading  – true while data is being loaded from the backend
//   error    – error message if loading failed
//   onRetry  – function called by the "Try again" button
//   initialLayers – which layers start switched on, e.g. { shelter: false }
//   selectedId – ID of the location to highlight (the map flies to it)
//   onSelect   – called with (categoryKey, item) when a marker is clicked
//   sidePanel  – extra content shown inside the map, on the right
function MapView({
  height = 430,
  data = DEMO_MAP_DATA,
  cyclone = null,
  isDemo = true,
  loading = false,
  error = null,
  onRetry,
  initialLayers = {},
  selectedId = null,
  onSelect,
  sidePanel = null
}) {
  const [map, setMap] = useState(null); // the Leaflet map, once it's ready
  const frameRef = useRef(null); // the box around the map (for fullscreen)
  const points = data ?? EMPTY_DATA;

  // Which layers are switched on
  const [visible, setVisible] = useState({
    settlement: true,
    shelter: true,
    hospital: true,
    cyclone: true,
    ...initialLayers
  });

  function toggleLayer(key) {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  }

  const showCyclone = Boolean(cyclone) && visible.cyclone;
  // Every point of the cyclone track and zones (worked out once per scenario)
  const cycloneLatLngs = useMemo(
    () =>
      cyclone
        ? [
            ...cyclone.tracks.flatMap((track) => track.latlngs),
            ...cyclone.zones.flatMap((zone) => flattenLatLngs(zone.latlngs))
          ]
        : [],
    [cyclone]
  );

  // When loading finishes, zoom the map so every location (and the cyclone) fits
  const hasFitted = useRef(false);
  useEffect(() => {
    if (!map || isDemo || loading || hasFitted.current) return;

    const allLatLngs = [
      ...Object.values(points).flat().map((item) => [item.latitude, item.longitude]),
      ...cycloneLatLngs
    ];
    if (allLatLngs.length === 0) return;

    map.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] });
    hasFitted.current = true;
  }, [map, points, cycloneLatLngs, isDemo, loading]);

  // The selected location (if any), searched across all categories
  const selectedItem = useMemo(
    () =>
      selectedId
        ? Object.values(points).flat().find((item) => item.id === selectedId) ?? null
        : null,
    [points, selectedId]
  );

  // Fly to a location whenever a new one is selected.
  // If a details panel is open, shift the view so the location isn't hidden behind it.
  const hasSidePanel = Boolean(sidePanel);
  useEffect(() => {
    if (!map || !selectedItem) return;

    const zoom = Math.max(map.getZoom(), 12);
    let target = L.latLng(selectedItem.latitude, selectedItem.longitude);

    if (hasSidePanel) {
      const size = map.getSize();
      // Wide map: panel is on the right, so move the location left.
      // Narrow map: panel is at the bottom, so move the location up.
      const offset = size.x > 650 ? L.point(170, 0) : L.point(0, size.y * 0.28);
      target = map.unproject(map.project(target, zoom).add(offset), zoom);
    }

    map.flyTo(target, zoom, { duration: 0.8 });
  }, [map, selectedItem, hasSidePanel]);

  // Coordinates of everything currently visible (for the "fit" button)
  const visibleLatLngs = [
    ...Object.keys(CATEGORIES)
      .filter((key) => visible[key])
      .flatMap((key) => (points[key] ?? []).map((item) => [item.latitude, item.longitude])),
    ...(showCyclone ? cycloneLatLngs : [])
  ];

  return (
    <div className="map-view">
      {/* ---------- LAYER FILTERS ---------- */}
      <div className="map-filters" role="group" aria-label="Show or hide map layers">
        {Object.entries(CATEGORIES).map(([key, category]) => {
          const Icon = category.icon;
          const count = points[key]?.length ?? 0;
          return (
            <button
              key={key}
              className={visible[key] ? "filter-chip on" : "filter-chip"}
              style={{ "--chip-color": category.color }}
              onClick={() => toggleLayer(key)}
              aria-pressed={visible[key]}
            >
              <Icon size={14} />
              {category.label}
              <span className="chip-count">{count}</span>
            </button>
          );
        })}

        {cyclone && (
          <button
            className={visible.cyclone ? "filter-chip on" : "filter-chip"}
            style={{ "--chip-color": TRACK_COLOR }}
            onClick={() => toggleLayer("cyclone")}
            aria-pressed={visible.cyclone}
          >
            <Wind size={14} />
            Cyclone scenario
            {isSimulated(cyclone) && <span className="chip-count">SIM</span>}
          </button>
        )}
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

          {/* Cyclone track and warning zones (drawn under the markers) */}
          {showCyclone && <CycloneLayers scenario={cyclone} />}

          {/* Ring around the selected location */}
          {selectedItem && (
            <CircleMarker
              center={[selectedItem.latitude, selectedItem.longitude]}
              radius={24}
              interactive={false}
              pathOptions={{ color: "#59d9e9", weight: 3, fillColor: "#59d9e9", fillOpacity: 0.12 }}
            />
          )}

          {/* Markers for every switched-on category */}
          {Object.entries(CATEGORIES).map(([key, category]) =>
            visible[key]
              ? (points[key] ?? []).map((item) => (
                  <Marker
                    key={item.id}
                    position={[item.latitude, item.longitude]}
                    icon={MARKER_ICONS[key]}
                    eventHandlers={onSelect ? { click: () => onSelect(key, item) } : undefined}
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

        {/* Optional details panel inside the map (right side) */}
        {sidePanel && <div className="map-side-panel">{sidePanel}</div>}

        {/* Overlays on top of the map */}
        <MapControls map={map} frameRef={frameRef} points={visibleLatLngs} />
        <MapLegend
          zones={showCyclone ? cyclone.zones : []}
          showTrack={showCyclone && cyclone.tracks.length > 0}
        />

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

        {/* Honesty labels */}
        {isDemo ? (
          <div className="map-demo-label">DEMO DATA · NOT LIVE DISASTER INFORMATION</div>
        ) : (
          showCyclone &&
          isSimulated(cyclone) && (
            <div className="map-demo-label">SIMULATED CYCLONE SCENARIO · NOT AN IMD FORECAST</div>
          )
        )}
      </div>
    </div>
  );
}

export default MapView;
