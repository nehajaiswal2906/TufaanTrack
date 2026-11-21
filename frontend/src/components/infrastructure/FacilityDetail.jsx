import { X, Tag, Mountain, MapPin, Database, Info, House } from "lucide-react";
import PriorityBadge from "../PriorityBadge";
import { closestItems, distanceKm } from "../../utils/distance";
import { typeLabel, SOURCES } from "../../config/facilityTypes";

const NEARBY_RADIUS_KM = 10;

// Details panel for one shelter or medical facility, shown inside the map.
//   facility    – the selected shelter/hospital
//   config      – SHELTER_PAGE or HOSPITAL_PAGE
//   settlements – villages (with `assessment`), for "closest settlements"
function FacilityDetail({ facility, config, settlements, assessmentAvailable, onClose, onFocus }) {
  const notes = config.notes(facility);
  const closest = closestItems(facility, settlements, 5);
  const withinRadius = settlements.filter((v) => distanceKm(facility, v) <= NEARBY_RADIUS_KM).length;

  return (
    <div className="settlement-detail">
      {/* ---------- Header ---------- */}
      <div className="detail-head">
        <div>
          <span className="eyebrow">{config.singular.toUpperCase()}</span>
          <h3>{facility.name || "Unnamed facility"}</h3>
          <span className="detail-id">{facility.id}</span>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close details">
          <X size={16} />
        </button>
      </div>

      {/* ---------- Facts ---------- */}
      <div className="fact-grid">
        <div className="fact">
          <span className="fact-label"><Tag size={12} /> Type</span>
          <strong className="fact-text">{typeLabel(config.types, facility.type)}</strong>
        </div>
        {config.metric && (
          <div className="fact">
            <span className="fact-label">{config.metric.label}</span>
            <strong className="fact-text">{config.metric.display(facility)}</strong>
          </div>
        )}
        <div className="fact">
          <span className="fact-label"><Mountain size={12} /> Elevation</span>
          <strong>{facility.elevation_m != null ? `${facility.elevation_m} m` : "Not available"}</strong>
          <small>Approximate (90 m elevation data)</small>
        </div>
        <div className="fact">
          <span className="fact-label"><Database size={12} /> Source</span>
          <strong className="fact-text">{SOURCES[facility.source] ?? facility.source ?? "Not stated"}</strong>
        </div>
      </div>

      <p className="detail-coords">
        <MapPin size={12} /> {facility.latitude.toFixed(4)}° N, {facility.longitude.toFixed(4)}° E
      </p>

      {notes.map((note) => (
        <p className="tt-popup-note" key={note}>{note}</p>
      ))}

      {/* ---------- Closest settlements ---------- */}
      <section className="detail-section">
        <h4 className="detail-heading"><House size={13} /> Closest settlements</h4>
        <p className="detail-muted">
          {withinRadius} settlement{withinRadius === 1 ? "" : "s"} within {NEARBY_RADIUS_KM} km
          (straight-line)
        </p>

        <ul className="closest-list">
          {closest.map((village) => (
            <li key={village.id}>
              <button onClick={() => onFocus(village)} title="Show on map">
                <span>{village.name || "Unnamed"}</span>
                <span className="closest-meta">
                  {village.assessment ? (
                    <PriorityBadge priority={village.assessment.priority} size="small" />
                  ) : (
                    assessmentAvailable && <span className="outside-tag">Outside zone</span>
                  )}
                  <em>{village.distanceKm.toFixed(1)} km</em>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <p className="detail-footnote">
          <Info size={10} /> Distances are straight-line, calculated in the browser — not
          road distances. Priorities come from the backend's impact assessment.
        </p>
      </section>
    </div>
  );
}

export default FacilityDetail;
