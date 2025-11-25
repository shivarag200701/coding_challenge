// Utility functions to robustly extract balloon positions from API data
// The API is undocumented and may be corrupted, so we need to handle various formats

export interface BalloonPosition {
  id: string;
  lat: number;
  lon: number;
  altitude?: number;
  timestamp?: number;
  hourIndex?: number;
}

/**
 * Safely extracts numeric value from various data formats
 */
function safeNumber(value: any): number | null {
  if (typeof value === 'number' && !isNaN(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && isFinite(parsed)) return parsed;
  }
  return null;
}

/**
 * Extracts balloon positions from a single hour's data
 * Expected structure: Array of [latitude, longitude, altitude] arrays
 */
export function extractBalloonPositions(data: any, hourIndex: number): BalloonPosition[] {
  const positions: BalloonPosition[] = [];

  if (!data || typeof data !== 'object') return positions;

  try {
    // Primary structure: Array of [lat, lon, alt] arrays
    if (Array.isArray(data)) {
      data.forEach((item, idx) => {
        // Handle the actual structure: [latitude, longitude, altitude]
        let lat: number | null = null;
        let lon: number | null = null;
        let alt: number | null = null;

        // If item is an array [lat, lon, alt]
        if (Array.isArray(item) && item.length >= 2) {
          lat = safeNumber(item[0]); // First element is latitude
          lon = safeNumber(item[1]); // Second element is longitude
          alt = item.length >= 3 ? safeNumber(item[2]) : null; // Third element is altitude
        }
        // Fallback: try object properties
        else if (item && typeof item === 'object') {
          lat = safeNumber(item?.lat ?? item?.latitude ?? item?.y ?? item?.[0]);
          lon = safeNumber(item?.lon ?? item?.lng ?? item?.longitude ?? item?.[1]);
          alt = safeNumber(item?.alt ?? item?.altitude ?? item?.z ?? item?.[2]);
        }
        
        if (lat !== null && lon !== null && 
            lat >= -90 && lat <= 90 && 
            lon >= -180 && lon <= 180) {
          positions.push({
            id: `balloon-${hourIndex}-${idx}`,
            lat,
            lon,
            altitude: alt ?? undefined,
            hourIndex,
          });
        }
      });
    }
    // Fallback: Object with balloons array
    else if (data.balloons && Array.isArray(data.balloons)) {
      data.balloons.forEach((item: any, idx: number) => {
        let lat: number | null = null;
        let lon: number | null = null;
        let alt: number | null = null;

        if (Array.isArray(item) && item.length >= 2) {
          lat = safeNumber(item[0]);
          lon = safeNumber(item[1]);
          alt = item.length >= 3 ? safeNumber(item[2]) : null;
        } else if (item && typeof item === 'object') {
          lat = safeNumber(item?.lat ?? item?.latitude ?? item?.y ?? item?.[0]);
          lon = safeNumber(item?.lon ?? item?.lng ?? item?.longitude ?? item?.[1]);
          alt = safeNumber(item?.alt ?? item?.altitude ?? item?.z ?? item?.[2]);
        }
        
        if (lat !== null && lon !== null && 
            lat >= -90 && lat <= 90 && 
            lon >= -180 && lon <= 180) {
          positions.push({
            id: `balloon-${hourIndex}-${idx}`,
            lat,
            lon,
            altitude: alt ?? undefined,
            hourIndex,
          });
        }
      });
    }
    // Fallback: Object with data array
    else if (data.data && Array.isArray(data.data)) {
      data.data.forEach((item: any, idx: number) => {
        let lat: number | null = null;
        let lon: number | null = null;
        let alt: number | null = null;

        if (Array.isArray(item) && item.length >= 2) {
          lat = safeNumber(item[0]);
          lon = safeNumber(item[1]);
          alt = item.length >= 3 ? safeNumber(item[2]) : null;
        } else if (item && typeof item === 'object') {
          lat = safeNumber(item?.lat ?? item?.latitude ?? item?.y ?? item?.[0]);
          lon = safeNumber(item?.lon ?? item?.lng ?? item?.longitude ?? item?.[1]);
          alt = safeNumber(item?.alt ?? item?.altitude ?? item?.z ?? item?.[2]);
        }
        
        if (lat !== null && lon !== null && 
            lat >= -90 && lat <= 90 && 
            lon >= -180 && lon <= 180) {
          positions.push({
            id: `balloon-${hourIndex}-${idx}`,
            lat,
            lon,
            altitude: alt ?? undefined,
            hourIndex,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error extracting balloon positions:', error);
  }

  return positions;
}

/**
 * Extracts all balloon positions from 24 hours of data
 * Uses the most recent position for each balloon (00.json)
 */
export function extractAllBalloonPositions(data24h: any[]): BalloonPosition[] {
  const balloonMap = new Map<string, BalloonPosition>();

  // Process from most recent (index 0) to oldest
  data24h.forEach((data, hourIndex) => {
    if (!data) return;
    const positions = extractBalloonPositions(data, hourIndex);
    
    positions.forEach((pos) => {
      // Use the most recent position for each balloon
      if (!balloonMap.has(pos.id) || (pos.hourIndex ?? 24) < (balloonMap.get(pos.id)?.hourIndex ?? 24)) {
        balloonMap.set(pos.id, pos);
      }
    });
  });

  return Array.from(balloonMap.values());
}

// For testing: limit the number of balloons displayed
const TEST_MODE = true;
const MAX_BALLOONS = 100; // Limit balloons in test mode

export function extractBalloonPositionsLimited(data24h: any[]): BalloonPosition[] {
  const allPositions = extractAllBalloonPositions(data24h);
  return TEST_MODE ? allPositions.slice(0, MAX_BALLOONS) : allPositions;
}

