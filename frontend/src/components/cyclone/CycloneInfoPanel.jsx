import { Navigation2, TriangleAlert, Waves, Route, Wind } from "lucide-react";
import {
  CYCLONE_CATEGORIES,
  ZONE_STYLES,
  DEFAULT_ZONE_STYLE,
  TRACK_COLOR
} from "../../config/mapConfig";
import "./cyclone.css";

const formatPoint = ([lat, lng]) => `${lat.toFixed(2)}° N, ${lng.toFixed(2)}° E`;

// ---------- One cyclone track ----------
function TrackDetails({ track }) {
  const { movement } = track;
  const categoryName = CYCLONE_CATEGORIES[track.category];
  const lastIndex = track.latlngs.length - 1;

  return (
    <>
      <div className="cyclone-title">
        <div className="cyclone-icon" style={{ background: TRACK_COLOR }}>
          <Wind size={20} color="#0e1a28" />
        </div>
        <div>
          <span className="eyebrow">CYCLONE SCENARIO</span>
          <h2>{track.name}</h2>
        </div>
      </div>

      <div className="cyclone-badges">
        {track.category && (
          <span className="module-badge small" title={categoryName}>
            {track.category}
          </span>
        )}
        {track.simulated && <span className="status-badge pending"><span></span> SIMULATED</span>}
      </div>

      {categoryName && <p className="cyclone-category">{categoryName} (IMD category)</p>}

      {/* Movement direction */}
      {movement && (
        <section className="info-section">
          <h3>Movement</h3>
          <div className="movement-box">
            <div className="compass" aria-hidden="true">
              <span className="compass-n">N</span>
              <Navigation2
                size={30}
                fill={TRACK_COLOR}
                color={TRACK_COLOR}
                style={{ transform: `rotate(${movement.bearing}deg)` }}
              />
            </div>
            <div>
              <strong>Moving {movement.direction.long.toLowerCase()}</strong>
              <span>
                Bearing {movement.bearing}° ({movement.direction.short})
              </span>
              <small>Calculated from the first and last track points</small>
            </div>
          </div>
        </section>
      )}

      {/* Track points */}
      <section className="info-section">
        <h3><Route size={14} /> Track points ({track.latlngs.length})</h3>
        <ol className="track-points">
          {track.latlngs.map((point, i) => (
            <li key={i} className={i === lastIndex ? "last" : ""}>
              <span className="point-dot" />
              <span className="point-label">
                {i === 0 ? "First" : i === lastIndex ? "Last" : `Point ${i + 1}`}
              </span>
              <span className="point-coords">{formatPoint(point)}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}

// ---------- Side panel shown on the Cyclone Tracking page ----------
function CycloneInfoPanel({ scenario, loading, error, onRetry }) {
  if (loading) {
    return <aside className="info-panel"><p className="panel-message">Loading cyclone data…</p></aside>;
  }

  if (error) {
    return (
      <aside className="info-panel">
        <p className="panel-message error">{error}</p>
        <button className="secondary-button" onClick={onRetry}>Try again</button>
      </aside>
    );
  }

  if (!scenario || (scenario.tracks.length === 0 && scenario.zones.length === 0)) {
    return (
      <aside className="info-panel">
        <p className="panel-message">No cyclone track or warning zones were received from the backend.</p>
      </aside>
    );
  }

  const anySimulated =
    scenario.tracks.some((t) => t.simulated) || scenario.zones.some((z) => z.simulated);

  return (
    <aside className="info-panel">
      {anySimulated && (
        <div className="simulated-banner">
          <TriangleAlert size={16} />
          <span>
            <strong>Simulated scenario.</strong> This is a practice scenario prepared by the
            data team — not an official IMD forecast or warning.
          </span>
        </div>
      )}

      {scenario.tracks.length === 0 && (
        <p className="panel-message">No cyclone track was received from the backend.</p>
      )}
      {scenario.tracks.map((track) => (
        <TrackDetails key={track.id} track={track} />
      ))}

      {/* Warning zones */}
      <section className="info-section">
        <h3><Waves size={14} /> Warning zones ({scenario.zones.length})</h3>
        {scenario.zones.length === 0 ? (
          <p className="panel-message">No warning zones received.</p>
        ) : (
          <ul className="zone-list">
            {[...scenario.zones].reverse().map((zone) => {
              const style = ZONE_STYLES[zone.zone] ?? DEFAULT_ZONE_STYLE;
              return (
                <li key={zone.id} style={{ "--zone-color": style.color }}>
                  <span className="zone-swatch" />
                  <div>
                    <strong>{style.label}</strong>
                    <small>{zone.id}</small>
                  </div>
                  {zone.surgeMeters != null && (
                    <span className="zone-surge">
                      {Number(zone.surgeMeters).toFixed(1)} m
                      <small>projected surge</small>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </aside>
  );
}

export default CycloneInfoPanel;
