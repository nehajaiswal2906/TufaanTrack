import {
  X,
  Users,
  Mountain,
  MapPin,
  ShieldCheck,
  Cross,
  TriangleAlert,
  ListChecks,
  Info
} from "lucide-react";
import PriorityBadge from "../PriorityBadge";
import { closestItems } from "../../utils/distance";

const fmt = (n) => Number(n).toLocaleString("en-IN");

// One small "label / value" box
function Fact({ icon: Icon, label, value, note }) {
  return (
    <div className="fact">
      <span className="fact-label"><Icon size={12} /> {label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}

// List of the closest facilities (straight-line distance)
function ClosestList({ title, icon: Icon, color, items, onFocus }) {
  return (
    <div className="closest-block">
      <h4><Icon size={13} style={{ color }} /> {title}</h4>
      {items.length === 0 ? (
        <p className="detail-muted">None in the data.</p>
      ) : (
        <ul className="closest-list">
          {items.map((item) => (
            <li key={item.id}>
              <button onClick={() => onFocus(item)} title="Show on map">
                <span>{item.name || "Unnamed"}</span>
                <em>{item.distanceKm.toFixed(1)} km</em>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Details panel for one village, shown inside the map.
function SettlementDetail({ village, shelters, hospitals, assessmentAvailable, onClose, onFocus }) {
  const estimated = village.pop_source === "estimated_default";
  const assessment = village.assessment;

  const nearestShelters = closestItems(village, shelters, 3);
  const nearestHospitals = closestItems(village, hospitals, 3);

  return (
    <div className="settlement-detail">
      {/* ---------- Header ---------- */}
      <div className="detail-head">
        <div>
          <span className="eyebrow">SETTLEMENT</span>
          <h3>{village.name || "Unnamed settlement"}</h3>
          <span className="detail-id">{village.id}</span>
        </div>
        <button className="detail-close" onClick={onClose} aria-label="Close details">
          <X size={16} />
        </button>
      </div>

      {assessment ? (
        <div className="detail-status">
          <PriorityBadge priority={assessment.priority} />
          <span>Inside the warning zone</span>
        </div>
      ) : (
        assessmentAvailable && (
          <div className="detail-status muted">
            <span className="outside-tag">Outside zone</span>
          </div>
        )
      )}

      {/* ---------- Basic facts ---------- */}
      <div className="fact-grid">
        <Fact
          icon={Users}
          label="Population"
          value={village.population != null ? fmt(village.population) : "Not available"}
          note={estimated ? "Assumed default — not Census data" : village.pop_source === "osm" ? "From OpenStreetMap" : null}
        />
        <Fact
          icon={Mountain}
          label="Elevation"
          value={village.elevation_m != null ? `${village.elevation_m} m` : "Not available"}
          note="Approximate (90 m elevation data)"
        />
      </div>
      <p className="detail-coords">
        <MapPin size={12} /> {village.latitude.toFixed(4)}° N, {village.longitude.toFixed(4)}° E
      </p>

      {/* ---------- Exposure (from backend assessment) ---------- */}
      <section className="detail-section">
        <h4 className="detail-heading"><TriangleAlert size={13} /> Exposure</h4>

        {!assessmentAvailable && (
          <p className="detail-muted">The impact assessment could not be loaded from the backend.</p>
        )}

        {assessmentAvailable && !assessment && (
          <p className="detail-muted">
            <Info size={12} /> Not listed in the backend's impact assessment, which only
            includes villages inside the simulated warning zone.
          </p>
        )}

        {assessment && (
          <>
            <div className="fact-grid">
              <Fact icon={Users} label="Exposed population" value={fmt(assessment.exposed_population)} />
              <Fact
                icon={TriangleAlert}
                label="Unverified blockages"
                value={assessment.unverified_blockage_reports ?? 0}
                note="Reported road blockages"
              />
            </div>

            {assessment.reasons?.length > 0 && (
              <div className="reasons">
                <span className="fact-label"><ListChecks size={12} /> Reasons given by the backend</span>
                <ul>
                  {assessment.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      {/* ---------- Nearby resources ---------- */}
      <section className="detail-section">
        <h4 className="detail-heading"><ShieldCheck size={13} /> Nearby emergency resources</h4>

        {assessment && (
          <div className="fact-grid">
            <Fact icon={ShieldCheck} label="Shelters within 10 km" value={assessment.nearby_shelters} note="From backend" />
            <Fact icon={Cross} label="Hospitals within 10 km" value={assessment.nearby_hospitals} note="From backend" />
          </div>
        )}

        <ClosestList title="Closest shelters" icon={ShieldCheck} color="#40d99a" items={nearestShelters} onFocus={onFocus} />
        <ClosestList title="Closest health facilities" icon={Cross} color="#ff6576" items={nearestHospitals} onFocus={onFocus} />

        <p className="detail-footnote">
          Distances are straight-line, calculated in the browser — not road distances.
          Shelters are unverified candidate sites.
        </p>
      </section>
    </div>
  );
}

export default SettlementDetail;
