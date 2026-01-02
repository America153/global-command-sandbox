// Dynamic Country Defense System - Spawns defenders when player crosses borders

import { v4 as uuidv4 } from 'uuid';
import type { Base, Unit, Coordinates, BaseType, UnitType } from '@/types/game';
import { BASE_CONFIG } from '@/types/game';

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

// Generate defender bases for a country when invaded
export function generateCountryDefenses(
  countryId: string,
  countryName: string,
  entryPosition: Coordinates,
  currentTick: number
): { bases: Base[]; units: Unit[] } {
  const power = getCountryPower(countryId);
  const bases: Base[] = [];
  const units: Unit[] = [];

  // Number of bases scales with power (1-3 bases)
  const numBases = Math.min(3, Math.ceil(power / 2));
  
  // Base types depend on power level
  const availableBaseTypes: BaseType[] = ['army'];
  if (power >= 2) availableBaseTypes.push('airforce');
  if (power >= 3) availableBaseTypes.push('missile');
  if (power >= 4) availableBaseTypes.push('intelligence');

  // Generate bases spread around the entry point
  for (let i = 0; i < numBases; i++) {
    const angle = (i / numBases) * Math.PI * 2 + Math.random() * 0.5;
    const distance = 2 + Math.random() * 3; // 2-5 degrees away
    
    const baseType = availableBaseTypes[i % availableBaseTypes.length];
    const basePosition: Coordinates = {
      latitude: entryPosition.latitude + Math.sin(angle) * distance,
      longitude: entryPosition.longitude + Math.cos(angle) * distance,
    };

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

    // Generate units for each base
    const unitsForBase = generateUnitsForBase(base, power, countryName, units.length, currentTick);
    units.push(...unitsForBase);
  }

  return { bases, units };
}

// Generate appropriate units for a base
function generateUnitsForBase(
  base: Base,
  power: number,
  countryName: string,
  existingUnitCount: number,
  currentTick: number
): Unit[] {
  const units: Unit[] = [];
  
  // Base unit count on power level (2-8 units per base)
  const unitCount = Math.min(8, 1 + power);

  const unitTypesForBase: Record<BaseType, UnitType[]> = {
    hq: ['infantry', 'armor'],
    army: ['infantry', 'armor', 'artillery', 'air_defense'],
    navy: ['destroyer', 'frigate', 'submarine'],
    airforce: ['fighter', 'bomber', 'helicopter', 'drone'],
    intelligence: ['special_forces', 'intel_team', 'drone'],
    missile: ['infantry', 'air_defense'],
  };

  const availableTypes = unitTypesForBase[base.type] || ['infantry'];

  for (let i = 0; i < unitCount; i++) {
    const unitType = availableTypes[i % availableTypes.length];
    
    // Slight position offset so units don't stack exactly
    const offset = 0.1 + Math.random() * 0.2;
    const angle = Math.random() * Math.PI * 2;

    const unit: Unit = {
      id: uuidv4(),
      templateType: unitType,
      name: `${countryName} ${unitType.replace('_', ' ')} ${existingUnitCount + i + 1}`,
      position: {
        latitude: base.position.latitude + Math.sin(angle) * offset,
        longitude: base.position.longitude + Math.cos(angle) * offset,
      },
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
