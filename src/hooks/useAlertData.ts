import { useEffect, useState, useRef } from "react";
import { fetchActiveAlerts } from "../api/alert";

// Set to true for testing with limited data
const TEST_MODE = false;
const MAX_ALERTS = 50; // Limit alerts in test mode

export function useAlertData(updateIntervalMs: number = 30 * 60 * 1000) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
    
  useEffect(() => {
    isMountedRef.current = true;
    
    async function load() {
      if (!isMountedRef.current) return;
      
      setLoadingAlerts(true);
      try {
        const a = await fetchActiveAlerts();
        // In test mode, limit the number of alerts
        const limitedAlerts = TEST_MODE ? a.slice(0, MAX_ALERTS) : a;
        if (isMountedRef.current) {
          setAlerts(limitedAlerts);
          setLoadingAlerts(false);
        }
      } catch (error) {
        console.error("Error loading alerts:", error);
        if (isMountedRef.current) {
          setLoadingAlerts(false);
        }
      }
    }
    
    // Initial load
    load();
    
    // Set up interval
    intervalRef.current = window.setInterval(load, updateIntervalMs);
    
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateIntervalMs]);

  return { alerts, loadingAlerts };
}