import { PRIORITY_STYLES, UNKNOWN_PRIORITY } from "../config/priority";

// Small coloured label showing a priority from the backend, e.g. "HIGH".
function PriorityBadge({ priority, size = "normal" }) {
  const style = PRIORITY_STYLES[priority] ?? UNKNOWN_PRIORITY;

  return (
    <span
      className={`priority-badge ${size === "small" ? "small" : ""}`}
      style={{ "--priority-color": style.color }}
      title={`Priority from backend assessment: ${priority}`}
    >
      <span className="priority-dot" />
      {style.label}
    </span>
  );
}

export default PriorityBadge;
