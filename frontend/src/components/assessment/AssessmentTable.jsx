import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, X, ChevronDown, ChevronRight, ArrowUp, ArrowDown, MapPin } from "lucide-react";
import PriorityBadge from "../PriorityBadge";
import { PRIORITY_ORDER, PRIORITY_STYLES } from "../../config/priority";

// Table columns: key, heading, how to sort, and whether the column is numeric
const COLUMNS = [
  { key: "name", label: "Village", numeric: false, value: (r) => r.name ?? "" },
  {
    key: "priority",
    label: "Priority",
    numeric: false,
    value: (r) => {
      const i = PRIORITY_ORDER.indexOf(r.priority);
      return i === -1 ? PRIORITY_ORDER.length : i;
    }
  },
  { key: "exposed_population", label: "Exposed population", numeric: true, value: (r) => r.exposed_population ?? 0 },
  { key: "nearby_shelters", label: "Shelters ≤10 km", numeric: true, value: (r) => r.nearby_shelters ?? 0 },
  { key: "nearby_hospitals", label: "Hospitals ≤10 km", numeric: true, value: (r) => r.nearby_hospitals ?? 0 },
  { key: "unverified_blockage_reports", label: "Unverified blockages", numeric: true, value: (r) => r.unverified_blockage_reports ?? 0 }
];

const fmt = (n) => Number(n).toLocaleString("en-IN");

// Sortable, filterable table of the backend's assessment results.
// Click a row to see the backend's reasons for its priority.
function AssessmentTable({ items }) {
  const [query, setQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [sort, setSort] = useState({ key: "priority", ascending: true });
  const [expanded, setExpanded] = useState(() => new Set());

  const rows = useMemo(() => {
    const column = COLUMNS.find((c) => c.key === sort.key);
    const text = query.trim().toLowerCase();

    return items
      .filter((r) => priorityFilter === "ALL" || r.priority === priorityFilter)
      .filter((r) => !text || r.name?.toLowerCase().includes(text) || r.village_id?.toLowerCase().includes(text))
      .sort((a, b) => {
        const va = column.value(a);
        const vb = column.value(b);
        const result = typeof va === "string" ? va.localeCompare(vb) : va - vb;
        // tie-break: larger exposed population first
        return (sort.ascending ? result : -result) || (b.exposed_population ?? 0) - (a.exposed_population ?? 0);
      });
  }, [items, query, priorityFilter, sort]);

  function changeSort(key) {
    setSort((current) =>
      current.key === key
        ? { key, ascending: !current.ascending }
        : // numbers start largest-first; text and priority start A→Z / most urgent first
          { key, ascending: !COLUMNS.find((c) => c.key === key).numeric }
    );
  }

  function toggleRow(id) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const counts = items.reduce((acc, r) => ({ ...acc, [r.priority]: (acc[r.priority] ?? 0) + 1 }), {});

  return (
    <div className="assessment-table-wrap">
      {/* ---------- Controls ---------- */}
      <div className="table-controls">
        <label className="search-box">
          <Search size={15} />
          <input
            type="search"
            placeholder="Search village or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search assessed villages"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>

        <div className="priority-filters" role="group" aria-label="Filter by priority">
          <button
            className={priorityFilter === "ALL" ? "filter-chip on" : "filter-chip"}
            style={{ "--chip-color": "#55d1df" }}
            onClick={() => setPriorityFilter("ALL")}
            aria-pressed={priorityFilter === "ALL"}
          >
            All <span className="chip-count">{items.length}</span>
          </button>
          {PRIORITY_ORDER.map((p) => (
            <button
              key={p}
              className={priorityFilter === p ? "filter-chip on" : "filter-chip"}
              style={{ "--chip-color": PRIORITY_STYLES[p].color }}
              onClick={() => setPriorityFilter(p)}
              aria-pressed={priorityFilter === p}
            >
              {PRIORITY_STYLES[p].label} <span className="chip-count">{counts[p] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="list-count">
        Showing {rows.length} of {items.length} assessed villages · click a row to see the backend's reasons
      </p>

      {/* ---------- Table ---------- */}
      <div className="table-scroll">
        <table className="assessment-table">
          <thead>
            <tr>
              <th aria-label="Expand" />
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className={c.numeric ? "numeric" : ""}
                  aria-sort={sort.key === c.key ? (sort.ascending ? "ascending" : "descending") : "none"}
                >
                  <button onClick={() => changeSort(c.key)}>
                    {c.label}
                    {sort.key === c.key &&
                      (sort.ascending ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="table-empty">
                  No assessed villages match these filters.
                </td>
              </tr>
            )}

            {rows.map((r) => {
              const open = expanded.has(r.village_id);
              return (
                <Fragment key={r.village_id}>
                  <tr className={open ? "open" : ""} onClick={() => toggleRow(r.village_id)}>
                    <td className="expand-cell">
                      <button
                        aria-expanded={open}
                        aria-label={`${open ? "Hide" : "Show"} reasons for ${r.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(r.village_id);
                        }}
                      >
                        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </td>
                    <td>
                      <strong>{r.name}</strong>
                      <small>{r.village_id}</small>
                    </td>
                    <td><PriorityBadge priority={r.priority} size="small" /></td>
                    <td className="numeric">{fmt(r.exposed_population ?? 0)}</td>
                    <td className={`numeric ${r.nearby_shelters === 0 ? "warn" : ""}`}>{r.nearby_shelters ?? "—"}</td>
                    <td className={`numeric ${r.nearby_hospitals === 0 ? "warn" : ""}`}>{r.nearby_hospitals ?? "—"}</td>
                    <td className={`numeric ${r.unverified_blockage_reports > 0 ? "warn" : ""}`}>
                      {r.unverified_blockage_reports ?? 0}
                    </td>
                  </tr>

                  {open && (
                    <tr className="reasons-row">
                      <td />
                      <td colSpan={COLUMNS.length}>
                        <div className="reasons-box">
                          <div>
                            <span className="fact-label">Reasons given by the backend</span>
                            <ul>
                              {(r.reasons ?? []).map((reason) => (
                                <li key={reason}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                          <Link to={`/settlements?village=${encodeURIComponent(r.village_id)}`} className="secondary-button">
                            <MapPin size={14} /> View on map
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AssessmentTable;
