// AI Enemy System - Manages enemy nation behavior and reactions

import { v4 as uuidv4 } from 'uuid';
import type { Base, Unit, Coordinates, Nation, BaseType, UnitType } from '@/types/game';
import { BASE_CONFIG, UNIT_TEMPLATES } from '@/types/game';

export interface AIEnemyState {
  nation: Nation;
  bases: Base[];
  units: Unit[];
  alertLevel: 'peace' | 'vigilant' | 'hostile' | 'war';
  revealedBases: string[]; // Base IDs that player can see
  lastReactionTick: number;
}

// Predefined enemy nation - can be expanded
export const ENEMY_NATION: Nation = {
  id: 'enemy-nation-1',
  name: 'Red Coalition',
  faction: 'ai',
  resources: 10000,
  productionRate: 50,
  territory: [
    { latitude: 55.7558, longitude: 37.6173 }, // Moscow
    { latitude: 39.9042, longitude: 116.4074 }, // Beijing
  ],
  hostileToPlayer: true,
  aiPersonality: 'defensive',
};

// Initial enemy bases - spread across hostile territory
export function createInitialEnemyBases(): Base[] {
  const enemyPositions: { type: BaseType; lat: number; lng: number; name: string }[] = [
    { type: 'hq', lat: 55.7558, lng: 37.6173, name: 'Red Coalition HQ' },
    { type: 'army', lat: 51.1605, lng: 71.4704, name: 'Eastern Command' },
    { type: 'airforce', lat: 43.2551, lng: 76.9126, name: 'Air Defense North' },
    { type: 'missile', lat: 48.0196, lng: 66.9237, name: 'Strategic Missile Site' },
    { type: 'navy', lat: 59.9343, lng: 30.3351, name: 'Baltic Fleet Base' },
    { type: 'intelligence', lat: 55.0084, lng: 82.9357, name: 'Signals Intelligence' },
  ];

  return enemyPositions.map((pos, index) => ({
    id: `enemy-base-${index}`,
    name: pos.name,
    type: pos.type,
    position: { latitude: pos.lat, longitude: pos.lng },
    faction: 'ai' as const,
    health: pos.type === 'hq' ? 1000 : 500,
    maxHealth: pos.type === 'hq' ? 1000 : 500,
    productionCapacity: pos.type === 'hq' ? 2 : 1,
    influenceRadius: BASE_CONFIG[pos.type].influenceRadius,
    createdAt: 0,
  }));
}

// Create initial enemy units
export function createInitialEnemyUnits(bases: Base[]): Unit[] {
  const units: Unit[] = [];
  
  bases.forEach(base => {
    if (base.type === 'army' || base.type === 'hq') {
      // Add infantry and armor to army bases
      units.push({
        id: uuidv4(),
        templateType: 'infantry',
        name: `Red Infantry ${units.length + 1}`,
        position: { ...base.position },
        faction: 'ai',
        health: 100,
        maxHealth: 100,
        status: 'idle',
        parentBaseId: base.id,
        createdAt: 0,
      });
      units.push({
        id: uuidv4(),
        templateType: 'armor',
        name: `Red Armor ${units.length + 1}`,
        position: { ...base.position },
        faction: 'ai',
        health: 100,
        maxHealth: 100,
        status: 'idle',
        parentBaseId: base.id,
        createdAt: 0,
      });
    }
    if (base.type === 'airforce') {
      units.push({
        id: uuidv4(),
        templateType: 'fighter',
        name: `Red Fighter ${units.length + 1}`,
        position: { ...base.position },
        faction: 'ai',
        health: 100,
        maxHealth: 100,
        status: 'idle',
        parentBaseId: base.id,
        createdAt: 0,
      });
    }
  });

  return units;
}

// Calculate distance between two coordinates in km
function haversineDistance(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

// Check if player unit is within enemy territory (near enemy bases)
export function checkBorderViolation(
  playerUnits: Unit[],
  enemyBases: Base[],
  territoryRadius: number = 500 // km
): { violated: boolean; nearestBase: Base | null; violatingUnit: Unit | null } {
  for (const unit of playerUnits) {
    if (unit.faction !== 'player') continue;
    
    for (const base of enemyBases) {
      const distance = haversineDistance(unit.position, base.position);
      if (distance < territoryRadius) {
        return { violated: true, nearestBase: base, violatingUnit: unit };
      }
    }
  }
  return { violated: false, nearestBase: null, violatingUnit: null };
}

// Check if any enemy bases were struck by missiles
export function checkMissileStrikes(
  explosionPositions: Coordinates[],
  enemyBases: Base[],
  strikeRadius: number = 100 // km
): Base[] {
  const struckBases: Base[] = [];
  
  for (const explosion of explosionPositions) {
    for (const base of enemyBases) {
      const distance = haversineDistance(explosion, base.position);
      if (distance < strikeRadius && !struckBases.includes(base)) {
        struckBases.push(base);
      }
    }
  }
  
  return struckBases;
}

// AI reaction to threats
export interface AIReaction {
  type: 'scramble_units' | 'reveal_bases' | 'launch_counter' | 'increase_alert';
  message: string;
  revealedBases?: string[];
  deployedUnits?: Unit[];
  targetPosition?: Coordinates;
}

export function calculateAIReaction(
  state: AIEnemyState,
  borderViolation: boolean,
  struckBases: Base[],
  currentTick: number
): AIReaction[] {
  const reactions: AIReaction[] = [];
  const reactionCooldown = 50; // Minimum ticks between reactions

  if (currentTick - state.lastReactionTick < reactionCooldown) {
    return reactions;
  }

  // Border violation reaction - reveal nearby bases
  if (borderViolation && state.alertLevel === 'peace') {
    reactions.push({
      type: 'increase_alert',
      message: '⚠️ ENEMY ALERT: Border incursion detected! Enemy forces mobilizing.',
    });

    // Reveal some bases when alert increases
    const basesToReveal = state.bases.slice(0, 3).map(b => b.id);
    reactions.push({
      type: 'reveal_bases',
      message: '🔍 Enemy base locations detected on radar.',
      revealedBases: basesToReveal,
    });
  }

  // Missile strike reaction - reveal all bases, increase to war
  if (struckBases.length > 0) {
    // Reveal all bases when struck
    reactions.push({
      type: 'reveal_bases',
      message: '🚨 CRITICAL: Enemy infrastructure struck! All enemy positions now visible.',
      revealedBases: state.bases.map(b => b.id),
    });

    reactions.push({
      type: 'increase_alert',
      message: '☢️ ENEMY DECLARATION: War status initiated. Expect retaliation.',
    });
  }

  return reactions;
}

// Check if player has intelligence capability
export function hasIntelligenceCapability(playerBases: Base[]): boolean {
  return playerBases.some(base => base.type === 'intelligence' && base.faction === 'player');
}

// Get visible enemy entities based on intel and revealed status
export function getVisibleEnemyEntities(
  enemyBases: Base[],
  enemyUnits: Unit[],
  revealedBaseIds: string[],
  playerHasIntel: boolean
): { visibleBases: Base[]; visibleUnits: Unit[] } {
  // Bases are visible if revealed (by border crossing or missile strike)
  const visibleBases = enemyBases.filter(base => revealedBaseIds.includes(base.id));
  
  // Units are only visible if player has intelligence base
  const visibleUnits = playerHasIntel ? enemyUnits : [];
  
  return { visibleBases, visibleUnits };
}
