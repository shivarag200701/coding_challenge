const ALERTS_BASE = "https://api.weather.gov/alerts/active";

export async function fetchAlertsForPoint(lat: number, lon: number) {
  const url = `${ALERTS_BASE}?point=${lat},${lon}`;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "balloon-hazard-dashboard (shivaraghav200701@gmail.com)" }
    });
    if (!resp.ok) {
      throw new Error(`Alerts fetch failed ${resp.status}`);
    }
    const data = await resp.json();
    return data.features as any[];  // GeoJSON features
  } catch (err) {
    console.error("Error fetching alerts for point", lat, lon, err);
    return [];
  }
}

export async function fetchActiveAlerts() {
    const url = ALERTS_BASE;
    try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "balloon-hazard-dashboard (shivaraghav200701@gmail.com)"
      }
    });
        const data = await resp.json();
        return data.features as any[];
    } catch (err) {
        console.error("Error fetching active alerts", err);
        return [];
    }
  }