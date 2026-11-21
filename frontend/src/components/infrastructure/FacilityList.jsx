import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { typeLabel } from "../../config/facilityTypes";
import { countByType } from "../../config/infrastructurePages";

// Searchable list of shelters or medical facilities, with a type filter.
//   items      – facilities (shelters or hospitals)
//   config     – SHELTER_PAGE or HOSPITAL_PAGE
//   selectedId – currently selected facility
//   onSelect   – called with a facility when its row is clicked
function FacilityList({ items, config, selectedId, onSelect }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

  const typeCounts = useMemo(() => countByType(items), [items]);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    const compare = {
      name: (a, b) => (a.name ?? "").localeCompare(b.name ?? ""),
      metric: (a, b) => (config.metric.value(b) ?? -1) - (config.metric.value(a) ?? -1),
      elevation: (a, b) => (a.elevation_m ?? Infinity) - (b.elevation_m ?? Infinity)
    }[sortBy];

    return items
      .filter((f) => !text || (f.name ?? "").toLowerCase().includes(text) || f.id.toLowerCase().includes(text))
      .filter((f) => typeFilter === "all" || f.type === typeFilter)
      .sort(compare);
  }, [items, query, typeFilter, sortBy, config]);

  return (
    <div className="settlement-list-panel">
      <div className="list-controls">
        <label className="search-box">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search by name or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Search ${config.plural.toLowerCase()}`}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>

        <label className="sort-select">
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types ({items.length})</option>
            {Object.entries(typeCounts).map(([type, count]) => (
              <option key={type} value={type}>
                {typeLabel(config.types, type)} ({count})
              </option>
            ))}
          </select>
        </label>

        <label className="sort-select">
          Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Name (A–Z)</option>
            <option value="metric">{config.metric.sortLabel}</option>
            <option value="elevation">Elevation (lowest first)</option>
          </select>
        </label>
      </div>

      <p className="list-count">
        Showing {visible.length} of {items.length} {config.plural.toLowerCase()}
      </p>

      {visible.length === 0 ? (
        <div className="list-empty">
          <p>Nothing matches your search.</p>
          <button className="link-button" onClick={() => { setQuery(""); setTypeFilter("all"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="settlement-rows">
          {visible.map((facility) => (
            <li key={facility.id}>
              <button
                className={facility.id === selectedId ? "settlement-row selected" : "settlement-row"}
                onClick={() => onSelect(facility)}
              >
                <div className="row-main">
                  <strong>{facility.name || "Unnamed facility"}</strong>
                  <span>
                    {typeLabel(config.types, facility.type)} · {config.metric.display(facility)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default FacilityList;
