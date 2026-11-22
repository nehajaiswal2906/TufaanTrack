import { useEffect, useState } from "react";
import L from "leaflet";
import { LocateFixed, Scan, Maximize2, Minimize2 } from "lucide-react";
import { MAP_CENTER, MAP_ZOOM } from "../../config/mapConfig";

// Extra buttons on the left side of the map, under the + / − zoom buttons.
// `map` is the Leaflet map, `frameRef` points at the box around the map,
// and `points` is the list of [lat, lng] currently visible.
function MapControls({ map, frameRef, points }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Notice when fullscreen starts/ends (including the Esc key)
  useEffect(() => {
    function handleChange() {
      const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement;
      setIsFullscreen(fullscreenEl === frameRef.current);
      // The map must re-measure itself after its size changes
      setTimeout(() => map?.invalidateSize(), 150);
    }

    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, [map, frameRef]);

  function resetView() {
    map?.flyTo(MAP_CENTER, MAP_ZOOM, { duration: 0.8 });
  }

  function fitToMarkers() {
    if (!map || points.length === 0) return;
    map.flyToBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 13, duration: 0.8 });
  }

  function toggleFullscreen() {
    const frame = frameRef.current;
    if (!frame) return;

    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      (frame.requestFullscreen || frame.webkitRequestFullscreen).call(frame);
    }
  }

  return (
    <div className="map-controls">
      <button onClick={resetView} title="Reset view" aria-label="Reset view">
        <LocateFixed size={16} />
      </button>
      <button
        onClick={fitToMarkers}
        title="Fit all visible markers"
        aria-label="Fit all visible markers"
        disabled={points.length === 0}
      >
        <Scan size={16} />
      </button>
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>
    </div>
  );
}

export default MapControls;
