// Simplified country polygons for major nations
export interface CountryData {
  id: string;
  name: string;
  coordinates: [number, number][][]; // Array of polygon rings [lng, lat]
}

export const COUNTRIES: CountryData[] = [
  {
    id: 'usa',
    name: 'United States',
    coordinates: [[
      [-125, 49], [-125, 25], [-100, 25], [-100, 30], [-80, 25], [-80, 45], [-70, 45], [-70, 49], [-125, 49]
    ]]
  },
  {
    id: 'canada',
    name: 'Canada',
    coordinates: [[
      [-141, 70], [-141, 49], [-70, 49], [-55, 50], [-55, 70], [-141, 70]
    ]]
  },
  {
    id: 'mexico',
    name: 'Mexico',
    coordinates: [[
      [-117, 32], [-117, 15], [-87, 15], [-87, 22], [-97, 25], [-100, 28], [-105, 32], [-117, 32]
    ]]
  },
  {
    id: 'brazil',
    name: 'Brazil',
    coordinates: [[
      [-74, 5], [-74, -10], [-60, -15], [-55, -25], [-48, -28], [-35, -10], [-35, 5], [-50, 5], [-74, 5]
    ]]
  },
  {
    id: 'argentina',
    name: 'Argentina',
    coordinates: [[
      [-73, -22], [-73, -55], [-65, -55], [-58, -40], [-58, -22], [-73, -22]
    ]]
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    coordinates: [[
      [-8, 60], [-8, 50], [2, 50], [2, 60], [-8, 60]
    ]]
  },
  {
    id: 'france',
    name: 'France',
    coordinates: [[
      [-5, 51], [-5, 42], [8, 42], [8, 51], [-5, 51]
    ]]
  },
  {
    id: 'germany',
    name: 'Germany',
    coordinates: [[
      [6, 55], [6, 47], [15, 47], [15, 55], [6, 55]
    ]]
  },
  {
    id: 'spain',
    name: 'Spain',
    coordinates: [[
      [-10, 44], [-10, 36], [4, 36], [4, 44], [-10, 44]
    ]]
  },
  {
    id: 'italy',
    name: 'Italy',
    coordinates: [[
      [7, 47], [7, 36], [18, 36], [18, 47], [7, 47]
    ]]
  },
  {
    id: 'poland',
    name: 'Poland',
    coordinates: [[
      [14, 55], [14, 49], [24, 49], [24, 55], [14, 55]
    ]]
  },
  {
    id: 'ukraine',
    name: 'Ukraine',
    coordinates: [[
      [22, 52], [22, 45], [40, 45], [40, 52], [22, 52]
    ]]
  },
  {
    id: 'russia',
    name: 'Russia',
    coordinates: [[
      [30, 72], [30, 45], [180, 45], [180, 72], [30, 72]
    ]]
  },
  {
    id: 'china',
    name: 'China',
    coordinates: [[
      [73, 53], [73, 18], [135, 18], [135, 53], [73, 53]
    ]]
  },
  {
    id: 'india',
    name: 'India',
    coordinates: [[
      [68, 35], [68, 8], [97, 8], [97, 35], [68, 35]
    ]]
  },
  {
    id: 'japan',
    name: 'Japan',
    coordinates: [[
      [129, 46], [129, 31], [146, 31], [146, 46], [129, 46]
    ]]
  },
  {
    id: 'australia',
    name: 'Australia',
    coordinates: [[
      [113, -10], [113, -44], [154, -44], [154, -10], [113, -10]
    ]]
  },
  {
    id: 'southafrica',
    name: 'South Africa',
    coordinates: [[
      [16, -22], [16, -35], [33, -35], [33, -22], [16, -22]
    ]]
  },
  {
    id: 'egypt',
    name: 'Egypt',
    coordinates: [[
      [25, 32], [25, 22], [36, 22], [36, 32], [25, 32]
    ]]
  },
  {
    id: 'nigeria',
    name: 'Nigeria',
    coordinates: [[
      [3, 14], [3, 4], [14, 4], [14, 14], [3, 14]
    ]]
  },
  {
    id: 'saudiarabia',
    name: 'Saudi Arabia',
    coordinates: [[
      [34, 32], [34, 16], [55, 16], [55, 32], [34, 32]
    ]]
  },
  {
    id: 'iran',
    name: 'Iran',
    coordinates: [[
      [44, 40], [44, 25], [63, 25], [63, 40], [44, 40]
    ]]
  },
  {
    id: 'turkey',
    name: 'Turkey',
    coordinates: [[
      [26, 42], [26, 36], [44, 36], [44, 42], [26, 42]
    ]]
  },
  {
    id: 'indonesia',
    name: 'Indonesia',
    coordinates: [[
      [95, 6], [95, -11], [141, -11], [141, 6], [95, 6]
    ]]
  },
  {
    id: 'southkorea',
    name: 'South Korea',
    coordinates: [[
      [125, 38], [125, 33], [130, 33], [130, 38], [125, 38]
    ]]
  },
  {
    id: 'northkorea',
    name: 'North Korea',
    coordinates: [[
      [124, 43], [124, 38], [131, 38], [131, 43], [124, 43]
    ]]
  }
];

// Check if a point is inside a country polygon (ray casting algorithm)
export function isPointInCountry(lat: number, lng: number, country: CountryData): boolean {
  const polygon = country.coordinates[0];
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Find which country a point is in
export function findCountryAtPosition(lat: number, lng: number): CountryData | null {
  for (const country of COUNTRIES) {
    if (isPointInCountry(lat, lng, country)) {
      return country;
    }
  }
  return null;
}
