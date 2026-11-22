import { useEffect, useState } from "react";

// =========================================
// useApi — load data from the backend inside any component.
//
// Usage:
//   const { data, loading, error, retry } = useApi(api.getReports);
//
// `loader` must be a function defined OUTSIDE the component
// (like api.getReports), so it doesn't change on every render.
// =========================================
export function useApi(loader) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [attempt, setAttempt] = useState(0); // bump this number to load again

  useEffect(() => {
    let cancelled = false; // ignore results if the component has closed

    loader()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [loader, attempt]);

  function retry() {
    setState({ data: null, loading: true, error: null });
    setAttempt((n) => n + 1);
  }

  return { ...state, retry };
}
