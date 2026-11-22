import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import PriorityBadge from "../PriorityBadge";
import { PRIORITY_ORDER } from "../../config/priority";

const SORTS = {
  priority: { label: "Priority (most urgent first)" },
  name: { label: "Name (A–Z)" },
  population: { label: "Population (largest first)" },
  elevation: { label: "Elevation (lowest first)" }
};

// Lower number = more urgent; villages without an assessment go last
function priorityRank(village) {
  const index = PRIORITY_ORDER.indexOf(village.assessment?.priority);
  return index === -1 ? PRIORITY_ORDER.length : index;
}

const COMPARE = {
  priority: (a, b) => priorityRank(a) - priorityRank(b) || a.name.localeCompare(b.name),
  name: (a, b) => a.name.localeCompare(b.name),
  population: (a, b) => (b.population ?? -1) - (a.population ?? -1),
  elevation: (a, b) => (a.elevation_m ?? Infinity) - (b.elevation_m ?? Infinity)
};

// Searchable, filterable, sortable list of villages.
//   settlements – villages with an `assessment` field (or null)
//   selectedId  – currently selected village
//   onSelect    – called with a village when its row is clicked
//   assessmentAvailable – false if /api/assessment could not be loaded
function SettlementList({ settlements, selectedId, onSelect, assessmentAvailable }) {
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all"); // all | inside | outside
  const [sortBy, setSortBy] = useState("priority");

  const insideCount = settlements.filter((v) => v.assessment).length;

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return settlements
      .filter((v) => !text || v.name.toLowerCase().includes(text) || v.id.toLowerCase().includes(text))
      .filter((v) =>
        zoneFilter === "inside" ? v.assessment : zoneFilter === "outside" ? !v.assessment : true
      )
      .sort(COMPARE[sortBy]);
  }, [settlements, query, zoneFilter, sortBy]);

  const filters = [
    { key: "all", label: "All", count: settlements.length },
    { key: "inside", label: "In zone", count: insideCount },
    { key: "outside", label: "Outside", count: settlements.length - insideCount }
  ];

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
            aria-label="Search settlements"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>

        {assessmentAvailable && (
          <div className="segmented" role="group" aria-label="Filter by warning zone">
            {filters.map((f) => (
              <button
                key={f.key}
                className={zoneFilter === f.key ? "active" : ""}
                onClick={() => setZoneFilter(f.key)}
                aria-pressed={zoneFilter === f.key}
              >
                {f.label} <span>{f.count}</span>
              </button>
            ))}
          </div>
        )}

        <label className="sort-select">
          Sort by
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            {Object.entries(SORTS)
              .filter(([key]) => assessmentAvailable || key !== "priority")
              .map(([key, sort]) => (
                <option key={key} value={key}>{sort.label}</option>
              ))}
          </select>
        </label>
      </div>

      <p className="list-count">
        Showing {visible.length} of {settlements.length} settlements
      </p>

      {visible.length === 0 ? (
        <div className="list-empty">
          <p>No settlements match your search.</p>
          <button className="link-button" onClick={() => { setQuery(""); setZoneFilter("all"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="settlement-rows">
          {visible.map((village) => (
            <li key={village.id}>
              <button
                className={village.id === selectedId ? "settlement-row selected" : "settlement-row"}
                onClick={() => onSelect(village)}
              >
                <div className="row-main">
                  <strong>{village.name}</strong>
                  <span>
                    {village.id}
                    {village.population != null && (
                      <> · {village.population.toLocaleString("en-IN")}
                        {village.pop_source === "estimated_default" ? " (est.)" : ""} people</>
                    )}
                  </span>
                </div>
                {village.assessment ? (
                  <PriorityBadge priority={village.assessment.priority} size="small" />
                ) : (
                  assessmentAvailable && <span className="outside-tag">Outside zone</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SettlementList;
