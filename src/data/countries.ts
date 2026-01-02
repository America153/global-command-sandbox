import * as topojson from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';

// Country data types
export interface CountryData {
  id: string;
  name: string;
  coordinates: number[][][][]; // MultiPolygon coordinates
}

// Store for loaded countries
export let COUNTRIES: CountryData[] = [];

// Load countries from TopoJSON world atlas
export async function loadCountries(): Promise<CountryData[]> {
  if (COUNTRIES.length > 0) return COUNTRIES;
  
  try {
    const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const topology = await response.json() as Topology<{ countries: GeometryCollection }>;
    
    // Convert TopoJSON to GeoJSON features
    const geojson = topojson.feature(topology, topology.objects.countries);
    
    if (geojson.type === 'FeatureCollection') {
      COUNTRIES = geojson.features.map((feature) => {
        const geom = feature.geometry;
        let coordinates: number[][][][] = [];
        
        if (geom.type === 'Polygon') {
          coordinates = [geom.coordinates as number[][][]];
        } else if (geom.type === 'MultiPolygon') {
          coordinates = geom.coordinates as number[][][][];
        }
        
        const props = feature.properties as { name?: string } | null;
        return {
          id: String(feature.id || props?.name || Math.random()),
          name: props?.name || 'Unknown',
          coordinates,
        };
      });
    }
    
    console.log(`Loaded ${COUNTRIES.length} countries with accurate borders`);
    return COUNTRIES;
  } catch (e) {
    console.error('Failed to load countries:', e);
    return COUNTRIES;
  }
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
