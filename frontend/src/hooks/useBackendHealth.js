import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";

// How long to wait before telling the user the backend may be "waking up"
const SLOW_AFTER_MS = 6000;

// =========================================
// useBackendHealth — keeps checking GET /api/health.
//
// status is one of:
//   "checking" – first check in progress
//   "waking"   – first check is slow (free hosting can take ~1 min to wake up)
//   "online"   – backend answered
//   "offline"  – backend could not be reached
// restored is true when the backend came back after being offline.
// =========================================
export function useBackendHealth(intervalMs = 30000) {
  const [status, setStatus] = useState("checking");
  const [restored, setRestored] = useState(false);
  const wasOffline = useRef(false);
  const mounted = useRef(true);

  const check = useCallback(async () => {
    const slowTimer = setTimeout(() => {
      if (mounted.current) setStatus((s) => (s === "checking" ? "waking" : s));
    }, SLOW_AFTER_MS);

    try {
      await api.getHealth();
      if (!mounted.current) return;
      if (wasOffline.current) setRestored(true);
      wasOffline.current = false;
      setStatus("online");
    } catch {
      if (!mounted.current) return;
      wasOffline.current = true;
      setRestored(false);
      setStatus("offline");
    } finally {
      clearTimeout(slowTimer);
    }
  }, []);

  // Check now, then every `intervalMs`
  useEffect(() => {
    mounted.current = true;
    const first = setTimeout(check, 0); // first check straight away (on the next tick)
    const timer = setInterval(check, intervalMs);
    return () => {
      mounted.current = false;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [check, intervalMs]);

  // "Retry now" button
  function recheck() {
    setStatus("checking");
    check();
  }

  return { status, restored, recheck, dismissRestored: () => setRestored(false) };
}
