import { useMemo } from "react";
import { Polygon, Polyline, Marker, CircleMarker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { Wind, Waves, Hash, Compass, TriangleAlert } from "lucide-react";
import {
  TRACK_COLOR,
  ZONE_STYLES,
  DEFAULT_ZONE_STYLE,
  CYCLONE_CATEGORIES
} from "../../config/mapConfig";

// A small arrow icon, rotated to point the way the cyclone moves
function arrowIcon(bearing) {
  return L.divIcon({
    className: "track-arrow",
    html: `<div style="transform: rotate(${bearing}deg)">
      <svg viewBox="0 0 24 24" width="18" height="18">
        <path d="M12 3 L19 20 L12 16 L5 20 Z" fill="${TRACK_COLOR}" stroke="#0e1a28" stroke-width="1.5" stroke-linejoin="round"/>
      </svg></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

function SimulatedNote() {
  return (
    <p className="tt-popup-demo">
      <TriangleAlert size={11} /> Simulated scenario · not an IMD forecast
    </p>
  );
}

// ---------- Warning zone (one coloured area) ----------
function ZoneLayer({ zone }) {
  const style = ZONE_STYLES[zone.zone] ?? DEFAULT_ZONE_STYLE;

  return (
    <Polygon
      positions={zone.latlngs}
      pathOptions={{
        color: style.color,
        fillColor: style.color,
        fillOpacity: 0.14,
        weight: 2,
        dashArray: zone.zone === "ORANGE" ? "6 5" : null
      }}
    >
      <Popup>
        <div className="tt-popup">
          <div className="tt-popup-head">
            <span className="tt-popup-icon" style={{ background: style.color }}>
              <Waves size={14} color="#ffffff" strokeWidth={2.4} />
            </span>
            <div>
              <span className="tt-popup-type">Warning zone</span>
              <h4>{style.label}</h4>
            </div>
          </div>
          <dl className="tt-popup-details">
            {zone.surgeMeters != null && (
              <div>
                <dt><Waves size={12} /> Projected surge</dt>
                <dd>{Number(zone.surgeMeters).toFixed(1)} m</dd>
              </div>
            )}
            <div>
              <dt><Hash size={12} /> ID</dt>
              <dd>{zone.id}</dd>
            </div>
          </dl>
          {zone.simulated && <SimulatedNote />}
        </div>
      </Popup>
    </Polygon>
  );
}

// ---------- Cyclone track (line + arrows + points) ----------
function TrackLayer({ track }) {
  const { movement } = track;

  // Build the arrow icons once (not on every re-render)
  const arrows = useMemo(
    () =>
      (movement?.segments ?? []).map((segment) => ({
        position: segment.midpoint,
        icon: arrowIcon(segment.bearing)
      })),
    [movement]
  );

  const categoryName = CYCLONE_CATEGORIES[track.category];
  const lastIndex = track.latlngs.length - 1;

  const trackPopup = (
    <Popup>
      <div className="tt-popup">
        <div className="tt-popup-head">
          <span className="tt-popup-icon" style={{ background: TRACK_COLOR }}>
            <Wind size={14} color="#0e1a28" strokeWidth={2.4} />
          </span>
          <div>
            <span className="tt-popup-type">Cyclone track</span>
            <h4>{track.name}</h4>
          </div>
        </div>
        <dl className="tt-popup-details">
          {track.category && (
            <div>
              <dt><Wind size={12} /> Category</dt>
              <dd>{track.category}{categoryName ? ` · ${categoryName}` : ""}</dd>
            </div>
          )}
          {movement && (
            <div>
              <dt><Compass size={12} /> Moving towards</dt>
              <dd>{movement.direction.long} ({movement.bearing}°)</dd>
            </div>
          )}
          <div>
            <dt><Hash size={12} /> Track points</dt>
            <dd>{track.latlngs.length}</dd>
          </div>
        </dl>
        {track.simulated && <SimulatedNote />}
      </div>
    </Popup>
  );

  return (
    <>
      {/* Wide invisible line underneath makes the track easier to click */}
      <Polyline positions={track.latlngs} pathOptions={{ color: TRACK_COLOR, weight: 14, opacity: 0 }}>
        {trackPopup}
      </Polyline>

      <Polyline
        positions={track.latlngs}
        pathOptions={{ color: TRACK_COLOR, weight: 3, opacity: 0.95, dashArray: "10 7" }}
        interactive={false}
      />

      {arrows.map((arrow, i) => (
        <Marker key={`arrow-${i}`} position={arrow.position} icon={arrow.icon} interactive={false} keyboard={false} />
      ))}

      {track.latlngs.map((point, i) => (
        <CircleMarker
          key={`point-${i}`}
          center={point}
          radius={i === lastIndex ? 7 : 4}
          pathOptions={{
            color: "#0e1a28",
            weight: 2,
            fillColor: TRACK_COLOR,
            fillOpacity: 1
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {i === 0 ? "First" : i === lastIndex ? "Last" : `Point ${i + 1}`} track point ·{" "}
            {point[0].toFixed(2)}° N, {point[1].toFixed(2)}° E
          </Tooltip>
          {trackPopup}
        </CircleMarker>
      ))}
    </>
  );
}

// All cyclone layers: warning zones underneath, track on top
function CycloneLayers({ scenario }) {
  return (
    <>
      {scenario.zones.map((zone) => (
        <ZoneLayer key={zone.id} zone={zone} />
      ))}
      {scenario.tracks.map((track) => (
        <TrackLayer key={track.id} track={track} />
      ))}
    </>
  );
}

export default CycloneLayers;
