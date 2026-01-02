// Dynamic Country Defense System - Spawns defenders within actual country borders

import { v4 as uuidv4 } from 'uuid';
import type { Base, Unit, Coordinates, BaseType, UnitType } from '@/types/game';
import { BASE_CONFIG } from '@/types/game';
import { COUNTRIES, isPointInCountry, type CountryData } from '@/data/countries';

// Country military power ratings (simplified - major countries get more defenders)
// Scale: 1 = minimal, 5 = superpower level
const COUNTRY_POWER: Record<string, number> = {
  // Superpowers & Major Powers
  '840': 5, // USA
  '156': 5, // China
  '643': 5, // Russia
  // Major Regional Powers
  '356': 4, // India
  '392': 4, // Japan
  '276': 4, // Germany
  '826': 4, // UK
  '250': 4, // France
  '410': 3, // South Korea
  '380': 3, // Italy
  '076': 3, // Brazil
  '792': 3, // Turkey
  '818': 3, // Egypt
  '682': 3, // Saudi Arabia
  '364': 3, // Iran
  '586': 3, // Pakistan
  '704': 3, // Vietnam
  '360': 3, // Indonesia
  '036': 3, // Australia
  '124': 3, // Canada
  '616': 3, // Poland
  '724': 3, // Spain
  // Medium Powers
  '484': 2, // Mexico
  '032': 2, // Argentina
  '710': 2, // South Africa
  '804': 2, // Ukraine
  '608': 2, // Philippines
  '764': 2, // Thailand
  '458': 2, // Malaysia
  '566': 2, // Nigeria
  '012': 2, // Algeria
  '504': 2, // Morocco
  '604': 2, // Peru
  '152': 2, // Chile
  '170': 2, // Colombia
  '862': 2, // Venezuela
};

// Get military power rating for a country (default 1 for small nations)
export function getCountryPower(countryId: string): number {
  return COUNTRY_POWER[countryId] || 1;
}

// Calculate centroid of a country's polygon (approximate center)
function calculateCountryCentroid(country: CountryData): Coordinates {
  let totalLat = 0;
  let totalLng = 0;
  let pointCount = 0;

  for (const polygon of country.coordinates) {
    if (!Array.isArray(polygon) || polygon.length === 0) continue;
    const ring = polygon[0];
    if (!Array.isArray(ring)) continue;

    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        totalLng += coord[0];
        totalLat += coord[1];
        pointCount++;
      }
    }
  }

  if (pointCount === 0) {
    return { latitude: 0, longitude: 0 };
  }

  return {
    latitude: totalLat / pointCount,
    longitude: totalLng / pointCount,
  };
}

// Get bounding box for a country
function getCountryBounds(country: CountryData): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const polygon of country.coordinates) {
    if (!Array.isArray(polygon) || polygon.length === 0) continue;
    const ring = polygon[0];
    if (!Array.isArray(ring)) continue;

    for (const coord of ring) {
      if (Array.isArray(coord) && coord.length >= 2) {
        minLng = Math.min(minLng, coord[0]);
        maxLng = Math.max(maxLng, coord[0]);
        minLat = Math.min(minLat, coord[1]);
        maxLat = Math.max(maxLat, coord[1]);
      }
    }
  }

  return { minLat, maxLat, minLng, maxLng };
}

// Find a random point inside a country's actual borders
function getRandomPointInCountry(country: CountryData, maxAttempts: number = 50): Coordinates {
  const bounds = getCountryBounds(country);
  const centroid = calculateCountryCentroid(country);

  // Try random points within the bounding box
  for (let i = 0; i < maxAttempts; i++) {
    const lat = bounds.minLat + Math.random() * (bounds.maxLat - bounds.minLat);
    const lng = bounds.minLng + Math.random() * (bounds.maxLng - bounds.minLng);

    if (isPointInCountry(lat, lng, country)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Fallback to centroid if we can't find a point
  return centroid;
}

// Generate multiple spread-out points within a country
function getSpreadPointsInCountry(country: CountryData, count: number): Coordinates[] {
  const points: Coordinates[] = [];
  const bounds = getCountryBounds(country);

  // Divide the country into rough grid cells and place points
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellWidth = (bounds.maxLng - bounds.minLng) / cols;
  const cellHeight = (bounds.maxLat - bounds.minLat) / rows;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Random point within this cell
    const cellMinLng = bounds.minLng + col * cellWidth;
    const cellMinLat = bounds.minLat + row * cellHeight;

    // Try to find a point in this cell that's inside the country
    let found = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      const lat = cellMinLat + Math.random() * cellHeight;
      const lng = cellMinLng + Math.random() * cellWidth;

      if (isPointInCountry(lat, lng, country)) {
        points.push({ latitude: lat, longitude: lng });
        found = true;
        break;
      }
    }

    // If not found in cell, try random point anywhere in country
    if (!found) {
      points.push(getRandomPointInCountry(country));
    }
  }

  return points;
}

// Generate defender bases for a country when invaded - NOW WITH GEOLOGICAL ACCURACY
export function generateCountryDefenses(
  countryId: string,
  countryName: string,
  _entryPosition: Coordinates, // kept for API compatibility
  currentTick: number
): { bases: Base[]; units: Unit[] } {
  const power = getCountryPower(countryId);
  const bases: Base[] = [];
  const units: Unit[] = [];

  // Find the country data for accurate polygon placement
  const country = COUNTRIES.find((c) => c.id === countryId);
  if (!country) {
    // Fallback if country not found - shouldn't happen
    console.warn(`Country ${countryId} not found for defense spawning`);
    return { bases: [], units: [] };
  }

  // Number of bases scales with power (2-5 bases) + 1 HQ
  const numRegularBases = Math.min(5, 1 + power);
  const totalBases = numRegularBases + 1; // +1 for HQ

  // All base types available for dynamic mix
  const allBaseTypes: BaseType[] = ['army', 'navy', 'airforce', 'intelligence'];
  
  // Shuffle and pick random base types for variety
  const shuffledTypes = [...allBaseTypes].sort(() => Math.random() - 0.5);

  // Get geologically accurate positions spread across the country
  const basePositions = getSpreadPointsInCountry(country, totalBases);

  // First position is for enemy HQ (capital)
  const hqPosition = basePositions[0];
  const enemyHQ: Base = {
    id: `defender-${countryId}-hq`,
    name: `${countryName} Command HQ`,
    type: 'hq',
    position: hqPosition,
    faction: 'ai',
    health: 800,
    maxHealth: 800,
    productionCapacity: 2,
    influenceRadius: BASE_CONFIG['hq'].influenceRadius,
    createdAt: currentTick,
  };
  bases.push(enemyHQ);

  // Generate HQ garrison units
  const hqUnits = generateUnitsForBase(
    enemyHQ,
    power,
    countryName,
    units.length,
    currentTick,
    country
  );
  units.push(...hqUnits);

  // Generate regular bases at remaining positions
  for (let i = 0; i < numRegularBases; i++) {
    // Pick a random base type from shuffled list (cycle through)
    const baseType = shuffledTypes[i % shuffledTypes.length];
    const basePosition = basePositions[i + 1]; // +1 to skip HQ position

    const base: Base = {
      id: `defender-${countryId}-base-${i}`,
      name: `${countryName} ${BASE_CONFIG[baseType].name}`,
      type: baseType,
      position: basePosition,
      faction: 'ai',
      health: baseType === 'army' ? 500 : 400,
      maxHealth: baseType === 'army' ? 500 : 400,
      productionCapacity: 1,
      influenceRadius: BASE_CONFIG[baseType].influenceRadius,
      createdAt: currentTick,
    };

    bases.push(base);

    // Generate units for each base - also within country borders
    const unitsForBase = generateUnitsForBase(
      base,
      power,
      countryName,
      units.length,
      currentTick,
      country
    );
    units.push(...unitsForBase);
  }

  return { bases, units };
}

// Get the enemy HQ ID for a country
export function getCountryHQId(countryId: string): string {
  return `defender-${countryId}-hq`;
}

// Check if all enemy bases (including HQ) in a country are destroyed
export function isCountryConquered(countryId: string, enemyBases: Base[]): boolean {
  const countryBases = enemyBases.filter(b => b.id.startsWith(`defender-${countryId}-`));
  return countryBases.length === 0;
}

// Get all countries that have been invaded (have defenders spawned)
export function getInvadedCountryIds(enemyBases: Base[]): string[] {
  const countryIds = new Set<string>();
  for (const base of enemyBases) {
    const match = base.id.match(/^defender-([^-]+)-/);
    if (match) {
      countryIds.add(match[1]);
    }
  }
  return Array.from(countryIds);
}

// Generate appropriate units for a base - units spawn within country borders
function generateUnitsForBase(
  base: Base,
  power: number,
  countryName: string,
  existingUnitCount: number,
  currentTick: number,
  country: CountryData
): Unit[] {
  const units: Unit[] = [];

  // Base unit count on power level (2-8 units per base)
  const unitCount = Math.min(8, 1 + power);

  const unitTypesForBase: Record<BaseType, UnitType[]> = {
    hq: ['infantry', 'armor', 'engineer'],
    army: ['infantry', 'armor', 'artillery', 'air_defense', 'special_forces'],
    navy: ['destroyer', 'frigate', 'submarine', 'carrier', 'amphibious'],
    airforce: ['fighter', 'bomber', 'helicopter', 'drone', 'transport'],
    intelligence: ['special_forces', 'intel_team', 'drone', 'cyber_team'],
    missile: ['infantry', 'air_defense', 'armor'],
  };

  const availableTypes = unitTypesForBase[base.type] || ['infantry'];
  
  // Shuffle unit types for variety
  const shuffledUnitTypes = [...availableTypes].sort(() => Math.random() - 0.5);

  for (let i = 0; i < unitCount; i++) {
    const unitType = shuffledUnitTypes[i % shuffledUnitTypes.length];

    // Get position near base but within country borders
    let unitPosition: Coordinates;
    const offset = 0.1 + Math.random() * 0.3;
    const angle = Math.random() * Math.PI * 2;
    const candidateLat = base.position.latitude + Math.sin(angle) * offset;
    const candidateLng = base.position.longitude + Math.cos(angle) * offset;

    // Verify it's within country, otherwise use base position
    if (isPointInCountry(candidateLat, candidateLng, country)) {
      unitPosition = { latitude: candidateLat, longitude: candidateLng };
    } else {
      // Try to find a valid nearby position
      let found = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        const tryOffset = 0.05 + Math.random() * 0.15;
        const tryAngle = Math.random() * Math.PI * 2;
        const tryLat = base.position.latitude + Math.sin(tryAngle) * tryOffset;
        const tryLng = base.position.longitude + Math.cos(tryAngle) * tryOffset;
        if (isPointInCountry(tryLat, tryLng, country)) {
          unitPosition = { latitude: tryLat, longitude: tryLng };
          found = true;
          break;
        }
      }
      if (!found) {
        unitPosition = { ...base.position };
      }
    }

    const unit: Unit = {
      id: uuidv4(),
      templateType: unitType,
      name: `${countryName} ${unitType.replace('_', ' ')} ${existingUnitCount + i + 1}`,
      position: unitPosition,
      faction: 'ai',
      health: 100,
      maxHealth: 100,
      status: 'defending',
      parentBaseId: base.id,
      createdAt: currentTick,
    };

    units.push(unit);
  }

  return units;
}

// Calculate total expected defenders for a country (for intel display)
export function getExpectedDefenderCount(countryId: string): { bases: number; units: number } {
  const power = getCountryPower(countryId);
  const numBases = Math.min(3, Math.ceil(power / 2));
  const unitsPerBase = Math.min(8, 1 + power);

  return {
    bases: numBases,
    units: numBases * unitsPerBase,
  };
}
