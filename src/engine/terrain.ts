// Terrain checking utilities for realistic unit movement
// Uses a simplified approach based on known ocean/land boundaries

import type { Coordinates, UnitDomain } from '@/types/game';

// Major ocean bounding boxes (simplified)
const OCEAN_REGIONS = [
  // Atlantic Ocean
  { minLat: -60, maxLat: 60, minLng: -80, maxLng: 0 },
  // Pacific Ocean (west)
  { minLat: -60, maxLat: 60, minLng: 100, maxLng: 180 },
  // Pacific Ocean (east)
  { minLat: -60, maxLat: 60, minLng: -180, maxLng: -100 },
  // Indian Ocean
  { minLat: -60, maxLat: 25, minLng: 20, maxLng: 120 },
  // Arctic
  { minLat: 70, maxLat: 90, minLng: -180, maxLng: 180 },
  // Southern Ocean
  { minLat: -90, maxLat: -60, minLng: -180, maxLng: 180 },
];

// Major land masses bounding boxes (simplified)
const LAND_REGIONS = [
  // North America
  { minLat: 15, maxLat: 72, minLng: -170, maxLng: -50 },
  // South America  
  { minLat: -56, maxLat: 12, minLng: -82, maxLng: -34 },
  // Europe
  { minLat: 35, maxLat: 71, minLng: -10, maxLng: 60 },
  // Africa
  { minLat: -35, maxLat: 37, minLng: -18, maxLng: 52 },
  // Asia
  { minLat: 5, maxLat: 77, minLng: 25, maxLng: 180 },
  // Australia
  { minLat: -45, maxLat: -10, minLng: 110, maxLng: 155 },
];

// Check if a point is likely in water (simplified)
export function isWater(lat: number, lng: number): boolean {
  // Check if in any major land region
  for (const land of LAND_REGIONS) {
    if (lat >= land.minLat && lat <= land.maxLat && 
        lng >= land.minLng && lng <= land.maxLng) {
      return false; // Likely land
    }
  }
  return true; // Default to water if not in land regions
}

// Check if a point is likely on land
export function isLand(lat: number, lng: number): boolean {
  return !isWater(lat, lng);
}

// Get terrain type
export function getTerrainType(lat: number, lng: number): 'land' | 'water' {
  return isWater(lat, lng) ? 'water' : 'land';
}

// Check if a domain can traverse the terrain
export function canTraverse(domain: UnitDomain, lat: number, lng: number): boolean {
  const terrain = getTerrainType(lat, lng);
  
  switch (domain) {
    case 'naval':
      return terrain === 'water';
    case 'land':
      return terrain === 'land';
    case 'air':
    case 'space':
    case 'cyber':
    case 'special':
      return true; // Can go anywhere
    default:
      return true;
  }
}

// Calculate waypoints for a path that respects terrain
export function calculatePath(
  start: Coordinates,
  end: Coordinates,
  domain: UnitDomain,
  steps: number = 20
): Coordinates[] {
  const path: Coordinates[] = [start];
  
  // Air, space, cyber, special can go direct
  if (domain === 'air' || domain === 'space' || domain === 'cyber' || domain === 'special') {
    // Great circle interpolation for air units
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      path.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
    return path;
  }

  // For land/naval, we need to check terrain along the way
  const needsWater = domain === 'naval';
  
  // Simple approach: try direct path first
  let canGoDirect = true;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const lat = start.latitude + (end.latitude - start.latitude) * t;
    const lng = start.longitude + (end.longitude - start.longitude) * t;
    
    if (needsWater && !isWater(lat, lng)) {
      canGoDirect = false;
      break;
    }
    if (!needsWater && isWater(lat, lng)) {
      canGoDirect = false;
      break;
    }
  }
  
  if (canGoDirect) {
    // Direct path works
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      path.push({
        latitude: start.latitude + (end.latitude - start.latitude) * t,
        longitude: start.longitude + (end.longitude - start.longitude) * t,
      });
    }
  } else {
    // Try to route around obstacles by adding waypoints
    // For naval: go around major landmasses
    // For land: this is simplified - in reality would need proper pathfinding
    
    if (needsWater) {
      // Naval routing - try going via southern or northern route
      const midLat = Math.abs(start.latitude) < 30 && Math.abs(end.latitude) < 30 
        ? -50 // Go south around Africa/S.America
        : (start.latitude + end.latitude) / 2;
      const midLng = (start.longitude + end.longitude) / 2;
      
      // First leg to waypoint
      for (let i = 1; i <= steps / 2; i++) {
        const t = i / (steps / 2);
        path.push({
          latitude: start.latitude + (midLat - start.latitude) * t,
          longitude: start.longitude + (midLng - start.longitude) * t,
        });
      }
      // Second leg from waypoint
      for (let i = 1; i <= steps / 2; i++) {
        const t = i / (steps / 2);
        path.push({
          latitude: midLat + (end.latitude - midLat) * t,
          longitude: midLng + (end.longitude - midLng) * t,
        });
      }
    } else {
      // Land routing - prefer staying on continents
      // Simplified: just go direct but units may pause at water
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        path.push({
          latitude: start.latitude + (end.latitude - start.latitude) * t,
          longitude: start.longitude + (end.longitude - start.longitude) * t,
        });
      }
    }
  }
  
  return path;
}

// Get next valid position for a unit
export function getNextPosition(
  current: Coordinates,
  destination: Coordinates,
  domain: UnitDomain,
  speedFactor: number = 0.01
): { position: Coordinates; blocked: boolean } {
  const dx = destination.longitude - current.longitude;
  const dy = destination.latitude - current.latitude;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance < 0.01) {
    return { position: destination, blocked: false };
  }
  
  const ratio = Math.min(speedFactor / distance, 1);
  const nextPosition = {
    latitude: current.latitude + dy * ratio,
    longitude: current.longitude + dx * ratio,
  };
  
  // Check if next position is valid for this domain
  if (!canTraverse(domain, nextPosition.latitude, nextPosition.longitude)) {
    // Try to find an alternate route
    // For now, just mark as blocked - unit will wait
    return { position: current, blocked: true };
  }
  
  return { position: nextPosition, blocked: false };
}
