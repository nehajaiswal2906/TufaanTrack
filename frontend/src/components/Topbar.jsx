import { useEffect, useState } from "react";
import { Bell, Search, Menu, Clock } from "lucide-react";

// Formats the current time in Indian Standard Time
function formatIST(date) {
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

// Top header: page breadcrumb + title, live IST clock and action buttons.
function Topbar({ page, onMenuClick }) {
  const [now, setNow] = useState(() => new Date());

  // Update the clock every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer); // stop the timer when the component is removed
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="icon-button menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="page-heading">
          <span>
            TUFAANTRACK / {page.section.toUpperCase()}
          </span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </div>

      <div className="top-actions">
        <div className="clock" title="Indian Standard Time">
          <Clock size={14} />
          <span>{formatIST(now)} IST</span>
        </div>

        <button className="icon-button" title="Search (coming soon)" aria-label="Search">
          <Search size={18} />
        </button>
        <button className="icon-button" title="Notifications (coming soon)" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="profile" title="TufaanTrack operator">TT</div>
      </div>
    </header>
  );
}

export default Topbar;
