import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CATEGORIES, WARNING_COLOR, TRACK_COLOR } from "../../config/mapConfig";

// Legend that sits on top of the map (bottom-left corner).
// Click the header to collapse it.
function MapLegend({ showDemoShapes }) {
  // Start open on wide windows, folded on narrow ones
  const [open, setOpen] = useState(() => window.innerWidth > 650);

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

          {showDemoShapes && (
            <>
              <li>
                <span
                  className="legend-area"
                  style={{ borderColor: WARNING_COLOR, background: `${WARNING_COLOR}33` }}
                />
                Warning zone (demo)
              </li>
              <li>
                <span className="legend-line" style={{ borderColor: TRACK_COLOR }} />
                Cyclone track (demo)
              </li>
            </>
          )}
        </ul>
      )}
    </div>
  );
}

export default MapLegend;
