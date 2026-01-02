// Country data types
export interface CountryData {
  id: string;
  name: string;
  coordinates: any[]; // GeoJSON polygon coordinates
}

// Initialize with fallback data immediately
export let COUNTRIES: CountryData[] = getFallbackCountries();

// Load countries - uses fallback data (external GeoJSON too large)
export async function loadCountries(): Promise<CountryData[]> {
  return COUNTRIES;
}

// Fallback simplified country data
function getFallbackCountries(): CountryData[] {
  return [
    { id: 'usa', name: 'United States', coordinates: [[[[-125, 49], [-125, 25], [-100, 25], [-80, 25], [-80, 45], [-70, 45], [-70, 49], [-125, 49]]]] },
    { id: 'can', name: 'Canada', coordinates: [[[[-141, 70], [-141, 49], [-70, 49], [-55, 50], [-55, 70], [-141, 70]]]] },
    { id: 'mex', name: 'Mexico', coordinates: [[[[-117, 32], [-117, 15], [-87, 15], [-87, 22], [-97, 25], [-105, 32], [-117, 32]]]] },
    { id: 'bra', name: 'Brazil', coordinates: [[[[-74, 5], [-74, -10], [-60, -15], [-55, -25], [-48, -28], [-35, -10], [-35, 5], [-50, 5], [-74, 5]]]] },
    { id: 'gbr', name: 'United Kingdom', coordinates: [[[[-8, 60], [-8, 50], [2, 50], [2, 60], [-8, 60]]]] },
    { id: 'fra', name: 'France', coordinates: [[[[-5, 51], [-5, 42], [8, 42], [8, 51], [-5, 51]]]] },
    { id: 'deu', name: 'Germany', coordinates: [[[[6, 55], [6, 47], [15, 47], [15, 55], [6, 55]]]] },
    { id: 'rus', name: 'Russia', coordinates: [[[[30, 72], [30, 45], [180, 45], [180, 72], [30, 72]]]] },
    { id: 'chn', name: 'China', coordinates: [[[[73, 53], [73, 18], [135, 18], [135, 53], [73, 53]]]] },
    { id: 'ind', name: 'India', coordinates: [[[[68, 35], [68, 8], [97, 8], [97, 35], [68, 35]]]] },
    { id: 'jpn', name: 'Japan', coordinates: [[[[129, 46], [129, 31], [146, 31], [146, 46], [129, 46]]]] },
    { id: 'aus', name: 'Australia', coordinates: [[[[113, -10], [113, -44], [154, -44], [154, -10], [113, -10]]]] },
    { id: 'zaf', name: 'South Africa', coordinates: [[[[16, -22], [16, -35], [33, -35], [33, -22], [16, -22]]]] },
    { id: 'egy', name: 'Egypt', coordinates: [[[[25, 32], [25, 22], [36, 22], [36, 32], [25, 32]]]] },
    { id: 'sau', name: 'Saudi Arabia', coordinates: [[[[34, 32], [34, 16], [55, 16], [55, 32], [34, 32]]]] },
    { id: 'tur', name: 'Turkey', coordinates: [[[[26, 42], [26, 36], [44, 36], [44, 42], [26, 42]]]] },
    { id: 'kor', name: 'South Korea', coordinates: [[[[125, 38], [125, 33], [130, 33], [130, 38], [125, 38]]]] },
  ];
}

// Check if a point is inside a polygon ring (ray casting)
function isPointInRing(lat: number, lng: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Check if point is in country (handles MultiPolygon)
export function isPointInCountry(lat: number, lng: number, country: CountryData): boolean {
  try {
    for (const polygon of country.coordinates) {
      if (!Array.isArray(polygon) || polygon.length === 0) continue;
      
      const ring = polygon[0];
      if (!Array.isArray(ring) || ring.length < 3) continue;
      
      // Validate first element is a coordinate pair
      if (!Array.isArray(ring[0]) || ring[0].length < 2) continue;
      
      if (isPointInRing(lat, lng, ring as number[][])) {
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          const hole = polygon[i];
          if (Array.isArray(hole) && hole.length > 0 && Array.isArray(hole[0])) {
            if (isPointInRing(lat, lng, hole as number[][])) {
              inHole = true;
              break;
            }
          }
        }
        if (!inHole) return true;
      }
    }
  } catch (e) {
    // Silently fail for malformed data
  }
  return false;
}

// Find country at position
export function findCountryAtPosition(lat: number, lng: number): CountryData | null {
  for (const country of COUNTRIES) {
    if (isPointInCountry(lat, lng, country)) {
      return country;
    }
  }
  return null;
}
