import { LoaderCircle, WifiOff, CircleCheck, RefreshCw, X } from "lucide-react";
import { API_BASE_URL } from "../services/api";

// Banner at the top of every page that explains backend connection problems.
// Shows nothing while the backend is online.
function BackendBanner({ health }) {
  const { status, restored, recheck, dismissRestored } = health;

  if (status === "waking") {
    return (
      <div className="backend-banner waking" role="status">
        <LoaderCircle size={16} className="spin" />
        <span>
          <strong>Connecting to the backend…</strong> The prototype's free server sleeps when
          nobody is using it and can take up to a minute to wake up.
        </span>
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="backend-banner offline" role="alert">
        <WifiOff size={16} />
        <span>
          <strong>Backend unavailable.</strong> Can't reach {API_BASE_URL}. Checking again
          automatically every 30 seconds.
        </span>
        <button className="small-button" onClick={recheck}>
          <RefreshCw size={12} /> Retry now
        </button>
      </div>
    );
  }

  if (status === "online" && restored) {
    return (
      <div className="backend-banner restored" role="status">
        <CircleCheck size={16} />
        <span>
          <strong>Backend is back online.</strong> Reload the page to load the latest data.
        </span>
        <button className="small-button primary" onClick={() => window.location.reload()}>
          <RefreshCw size={12} /> Reload
        </button>
        <button className="banner-close" onClick={dismissRestored} aria-label="Dismiss">
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
}

export default BackendBanner;
