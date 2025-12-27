// Simulation Engine Types and Core Logic
// Deterministic tick-based simulation

import type { 
  GameState, 
  Base, 
  Unit, 
  TerritoryInfluence,
  Coordinates,
  UNIT_TEMPLATES 
} from '@/types/game';

// Calculate distance between two coordinates in km
export function calculateDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Check if a position is within territory influence
export function isWithinTerritory(
  position: Coordinates, 
  territories: TerritoryInfluence[]
): TerritoryInfluence | null {
  for (const territory of territories) {
    const distance = calculateDistance(position, territory.position);
    if (distance <= territory.radius) {
      return territory;
    }
  }
  return null;
}

// Calculate territory overlap and contested areas
export function calculateContested(
  territories: TerritoryInfluence[]
): Coordinates[] {
  const contested: Coordinates[] = [];
  
  for (let i = 0; i < territories.length; i++) {
    for (let j = i + 1; j < territories.length; j++) {
      if (territories[i].faction !== territories[j].faction) {
        const distance = calculateDistance(
          territories[i].position, 
          territories[j].position
        );
        const overlap = (territories[i].radius + territories[j].radius) - distance;
        
        if (overlap > 0) {
          // Midpoint is contested
          contested.push({
            latitude: (territories[i].position.latitude + territories[j].position.latitude) / 2,
            longitude: (territories[i].position.longitude + territories[j].position.longitude) / 2,
          });
        }
      }
    }
  }
  
  return contested;
}

// Simple combat resolution
export function resolveCombat(
  attacker: Unit,
  defender: Unit
): { attackerDamage: number; defenderDamage: number } {
  // Simplified combat - attacker attack vs defender defense with randomness
  const attackPower = 50 * (0.8 + Math.random() * 0.4); // Base attack with variance
  const defensePower = 40 * (0.8 + Math.random() * 0.4);

  return {
    attackerDamage: Math.max(0, defensePower - 20),
    defenderDamage: Math.max(0, attackPower - 10),
  };
}

// Movement calculation - returns new position after one tick
export function calculateMovement(
  unit: Unit,
  speed: number, // Game speed multiplier
  deltaTime: number = 1 // Seconds per tick
): Coordinates | null {
  if (!unit.destination || unit.status !== 'moving') {
    return null;
  }

  const distance = calculateDistance(unit.position, unit.destination);
  
  // Unit speed in km/h, convert to km per tick
  const unitSpeed = 50; // Base speed, should come from template
  const moveDistance = (unitSpeed / 3600) * deltaTime * speed;

  if (distance <= moveDistance) {
    return unit.destination; // Arrived
  }

  // Interpolate position
  const ratio = moveDistance / distance;
  return {
    latitude: unit.position.latitude + 
      (unit.destination.latitude - unit.position.latitude) * ratio,
    longitude: unit.position.longitude + 
      (unit.destination.longitude - unit.position.longitude) * ratio,
  };
}

// Production queue item
interface ProductionItem {
  unitType: string;
  ticksRemaining: number;
  baseId: string;
}

// Economy calculation
export function calculateIncome(bases: Base[]): number {
  let income = 0;
  
  for (const base of bases) {
    switch (base.type) {
      case 'hq':
        income += 10;
        break;
      case 'army':
      case 'navy':
      case 'airforce':
        income += 5;
        break;
      case 'intelligence':
        income += 3;
        break;
    }
  }
  
  return income;
}

// Logistics - supply chain calculation
export function calculateSupplyStatus(
  unit: Unit,
  bases: Base[]
): { supplied: boolean; efficiency: number } {
  // Find nearest friendly base
  const friendlyBases = bases.filter(b => b.faction === unit.faction);
  
  if (friendlyBases.length === 0) {
    return { supplied: false, efficiency: 0 };
  }

  let minDistance = Infinity;
  for (const base of friendlyBases) {
    const d = calculateDistance(unit.position, base.position);
    if (d < minDistance) {
      minDistance = d;
    }
  }

  // Supply efficiency decreases with distance
  const maxRange = 500; // km
  const efficiency = Math.max(0, 1 - (minDistance / maxRange));
  
  return {
    supplied: efficiency > 0.2,
    efficiency,
  };
}
