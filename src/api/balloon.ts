// Use proxy in development, full URL in production
const BASE = import.meta.env.DEV 
  ? "/treasure"  // Use Vite proxy in development
  : "https://a.windbornesystems.com/treasure";  // Full URL in production

export async function fetchBalloonHour(hourIndex: number) {
  const idx = hourIndex.toString().padStart(2, "0");
  const url = `${BASE}/${idx}.json`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Bad response ${resp.status}`);
    const data = await resp.json();
    return data;
  } catch (err) {
    console.error("Error fetching balloon hour", hourIndex, err);
    return null;
  }
}

export async function fetchLast24Hours() {
  const promises = [];
  for (let i = 0; i < 24; i++) {
    promises.push(fetchBalloonHour(i));
  }
  const results = await Promise.all(promises);
  return results.filter(r => r !== null) as any[];
}

// For testing: fetch only current hour
export async function fetchCurrentHour() {
  const data = await fetchBalloonHour(0);
  return data ? [data] : [];
}