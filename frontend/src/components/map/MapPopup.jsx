import { MapPin } from "lucide-react";
import { getPopupDetails } from "./popupDetails";

// Content shown inside a marker popup.
// Only shows details that actually exist in the data — nothing is guessed.
function MapPopup({ item, categoryKey, category }) {
  const Icon = category.icon;
  const { rows, notes } = getPopupDetails(categoryKey, item);

  return (
    <div className="tt-popup">
      <div className="tt-popup-head">
        <span className="tt-popup-icon" style={{ background: category.color }}>
          <Icon size={14} color="#ffffff" strokeWidth={2.4} />
        </span>
        <div>
          <span className="tt-popup-type">{category.singular}</span>
          <h4>{item.name || "Unnamed location"}</h4>
        </div>
      </div>

      <dl className="tt-popup-details">
        {rows.map(({ icon: RowIcon, label, value }) => (
          <div key={label}>
            <dt><RowIcon size={12} /> {label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
        <div>
          <dt><MapPin size={12} /> Coordinates</dt>
          <dd>
            {item.latitude.toFixed(4)}° N, {item.longitude.toFixed(4)}° E
          </dd>
        </div>
      </dl>

      {notes.map((note) => (
        <p className="tt-popup-note" key={note}>{note}</p>
      ))}

    </div>
  );
}

export default MapPopup;
