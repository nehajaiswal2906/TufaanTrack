// =========================================
// BAR CHART (horizontal)
// A simple, accessible bar chart made with plain HTML/CSS.
// Every bar carries its own text label and value, so meaning
// never depends on colour alone. Hovering a bar shows a tooltip.
//
//   rows: [{ key, label, value, color?, tooltip? }]
//   formatValue: turns a number into display text
// =========================================

const DEFAULT_COLOR = "#55d1df";

function BarChart({ rows, formatValue = (v) => v.toLocaleString("en-IN"), emptyText = "No data" }) {
  const max = Math.max(0, ...rows.map((r) => r.value));

  if (rows.length === 0 || max === 0) {
    return <p className="chart-empty">{emptyText}</p>;
  }

  return (
    <ul className="bar-chart">
      {rows.map((row) => {
        const percent = (row.value / max) * 100;
        return (
          <li key={row.key} className="bar-row">
            <span className="bar-label">{row.label}</span>
            <div
              className="bar-track"
              tabIndex={0}
              aria-label={row.tooltip ?? `${row.label}: ${formatValue(row.value)}`}
            >
              <div
                className="bar-fill"
                style={{
                  width: `${Math.max(percent, row.value > 0 ? 1.5 : 0)}%`,
                  background: row.color ?? DEFAULT_COLOR
                }}
              />
              {/* Tooltip shown on hover / keyboard focus */}
              <span className="bar-tooltip" role="tooltip">
                {row.tooltip ?? `${row.label}: ${formatValue(row.value)}`}
              </span>
            </div>
            <span className="bar-value">{formatValue(row.value)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default BarChart;
