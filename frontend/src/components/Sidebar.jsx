import { NavLink } from "react-router-dom";
import { Satellite, X } from "lucide-react";
import { NAV_SECTIONS } from "../config/navigation";
import { API_BASE_URL } from "../services/api";

// Left-hand navigation.
// `isOpen` and `onClose` are only used on narrow screens,
// where the sidebar slides in as a drawer.
function Sidebar({ isOpen, onClose, backendStatus }) {
  // backendStatus comes from Layout, which re-checks the backend every 30 seconds
  const STATUS = {
    checking: { dot: "pending", title: "Checking backend…" },
    waking: { dot: "pending", title: "Backend waking up…" },
    online: { dot: "online", title: "Backend online" },
    offline: { dot: "offline", title: "Backend offline" }
  };
  const status = STATUS[backendStatus] ?? STATUS.checking;

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-icon">
          <Satellite size={23} />
        </div>
        <div>
          <h2>TUFAANTRACK</h2>
          <span>INTELLIGENCE SYSTEM</span>
        </div>

        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => (
          <div className="nav-section" key={section.label}>
            <p className="menu-label">{section.label}</p>

            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                // NavLink automatically adds the "active" class
                // when its path matches the current page.
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className="nav-item"
                  onClick={onClose}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-row">
          <span className={`status-dot ${status.dot}`}></span>
          {status.title}
        </div>
        <p title={API_BASE_URL}>{API_BASE_URL.replace(/^https?:\/\//, "")}</p>
        <small>VERSION 1.0.0 · INDIA</small>
      </div>
    </aside>
  );
}

export default Sidebar;
