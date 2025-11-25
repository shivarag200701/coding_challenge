import { useState, useEffect } from "react";
import { fetchLast24Hours, fetchCurrentHour } from "../api/balloon";

// Set to true for testing with limited data
const TEST_MODE = true;

export function useBalloonData(updateIntervalMs: number = 60 * 60 * 1000) {
  const [data24h, setData24h] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // In test mode, only fetch current hour
      const d = TEST_MODE ? await fetchCurrentHour() : await fetchLast24Hours();
      setData24h(d);
      setLoading(false);
    }
    load();
    const id = setInterval(load, updateIntervalMs);
    return () => clearInterval(id);
  }, [updateIntervalMs]);

  return { data24h, loading };
}