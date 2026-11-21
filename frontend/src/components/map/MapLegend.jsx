import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  CATEGORIES,
  TRACK_COLOR,
  ZONE_STYLES,
  DEFAULT_ZONE_STYLE
} from "../../config/mapConfig";
import { REPORT_STATUSES, STATUS_ORDER } from "../../config/reports";

// Legend that sits on top of the map (bottom-left corner).
// Click the header to collapse it.
//   zones     – warning zones currently on the map (from the backend)
//   showTrack – true if a cyclone track is on the map
//   showReports – true if emergency reports are on the map
function MapLegend({ zones = [], showTrack = false, showReports = false }) {
  // Start open on wide windows, folded on narrow ones
  const [open, setOpen] = useState(() => window.innerWidth > 650);

  // One legend row per zone type (e.g. RED, ORANGE), no duplicates
  const zoneTypes = [...new Set(zones.map((zone) => zone.zone))].reverse();

  return (
    <div className="map-legend-panel">
      <button
        className="legend-header"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        LEGEND
        {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {open && (
        <ul className="legend-list">
          {Object.entries(CATEGORIES).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <li key={key}>
                <span className="legend-pin" style={{ background: category.color }}>
                  <Icon size={10} color="#ffffff" strokeWidth={2.6} />
                </span>
                {category.label}
              </li>
            );
          })}

          {zoneTypes.map((zoneType) => {
            const style = ZONE_STYLES[zoneType] ?? DEFAULT_ZONE_STYLE;
            return (
              <li key={zoneType}>
                <span
                  className="legend-area"
                  style={{ borderColor: style.color, background: `${style.color}33` }}
                />
                {style.label}
              </li>
            );
          })}

          {showReports &&
            STATUS_ORDER.map((status) => (
              <li key={status}>
                <span className="legend-dot" style={{ background: REPORT_STATUSES[status].color }} />
                Report: {REPORT_STATUSES[status].label.toLowerCase()}
              </li>
            ))}

          {showTrack && (
            <li>
              <span className="legend-line" style={{ borderColor: TRACK_COLOR }} />
              Cyclone track (simulated)
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default MapLegend;
