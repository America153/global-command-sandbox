// Enemy Retaliation System - AI attacks player in response to aggression

import { v4 as uuidv4 } from 'uuid';
import type { Unit, Base, Coordinates } from '@/types/game';
import { UNIT_TEMPLATES } from '@/types/game';
import { calculateDistance } from './simulation';
import type { DiplomaticStatus } from './diplomacy';
import { findCountryAtPosition } from '@/data/countries';

export interface RetaliationAction {
  type: 'unit_attack' | 'missile_strike' | 'reinforce';
  sourceId: string;
  targetPosition: Coordinates;
  unitIds?: string[];
}

// How aggressive AI is based on diplomatic status
const AGGRESSION_LEVEL: Record<DiplomaticStatus, number> = {
  peace: 0,
  tense: 0.1,
  hostile: 0.4,
  war: 0.8,
  allied: 0,
};

// Determine if AI should retaliate this tick
export function shouldRetaliate(
  diplomaticStatus: DiplomaticStatus,
  alertLevel: string,
  ticksSinceLastAction: number
): boolean {
  const aggression = AGGRESSION_LEVEL[diplomaticStatus];
  
  // Minimum ticks between actions to prevent spam
  if (ticksSinceLastAction < 20) return false;

  // Random chance based on aggression
  const warBonus = alertLevel === 'war' ? 0.3 : alertLevel === 'hostile' ? 0.15 : 0;
  const chance = aggression + warBonus;

  return Math.random() < chance;
}

// Random attacks - enemy initiates attacks regardless of player actions
export function shouldLaunchRandomAttack(
  alertLevel: string,
  ticksSinceLastAction: number,
  aiUnitCount: number,
  aiBaseCount: number
): boolean {
  // Need minimum cooldown
  if (ticksSinceLastAction < 50) return false;
  
  // Need units and bases to attack from
  if (aiUnitCount === 0 || aiBaseCount === 0) return false;
  
  // Base chance increases with alert level and enemy strength
  let baseChance = 0.02; // 2% per tick in peace
  
  if (alertLevel === 'vigilant') baseChance = 0.05;
  else if (alertLevel === 'hostile') baseChance = 0.1;
  else if (alertLevel === 'war') baseChance = 0.15;
  
  // More units = more aggressive
  const strengthBonus = Math.min(0.1, aiUnitCount * 0.005);
  
  return Math.random() < (baseChance + strengthBonus);
}

// Find the best target for AI retaliation
export function findRetaliationTarget(
  aiUnits: Unit[],
  aiBases: Base[],
  playerUnits: Unit[],
  playerBases: Base[]
): { target: Coordinates; targetType: 'unit' | 'base'; targetId: string } | null {
  // Prioritize: nearby player units > player bases > HQ

  // Find player entities near AI units
  for (const aiUnit of aiUnits) {
    for (const playerUnit of playerUnits) {
      const distance = calculateDistance(aiUnit.position, playerUnit.position);
      if (distance < 200) {
        return {
          target: playerUnit.position,
          targetType: 'unit',
          targetId: playerUnit.id,
        };
      }
    }
  }

  // Target nearest player base
  if (playerBases.length > 0 && aiBases.length > 0) {
    let nearestBase: Base | null = null;
    let nearestDistance = Infinity;

    for (const aiBase of aiBases) {
      for (const playerBase of playerBases) {
        const distance = calculateDistance(aiBase.position, playerBase.position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestBase = playerBase;
        }
      }
    }

    if (nearestBase && nearestDistance < 1000) {
      return {
        target: nearestBase.position,
        targetType: 'base',
        targetId: nearestBase.id,
      };
    }
  }

  return null;
}

// Move AI units toward player positions
export function getRetaliationMovements(
  aiUnits: Unit[],
  playerUnits: Unit[],
  playerBases: Base[],
  maxUnitsToMove: number = 5
): Unit[] {
  const movedUnits: Unit[] = [];
  let moved = 0;

  for (const aiUnit of aiUnits) {
    if (moved >= maxUnitsToMove) break;
    if (aiUnit.status === 'moving') continue;

    // Find nearest player target
    let nearestTarget: Coordinates | null = null;
    let nearestDistance = Infinity;

    for (const playerUnit of playerUnits) {
      const distance = calculateDistance(aiUnit.position, playerUnit.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = playerUnit.position;
      }
    }

    for (const playerBase of playerBases) {
      const distance = calculateDistance(aiUnit.position, playerBase.position);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = playerBase.position;
      }
    }

    // Only move if target is reasonably close (within 500km)
    if (nearestTarget && nearestDistance < 500) {
      movedUnits.push({
        ...aiUnit,
        destination: nearestTarget,
        status: 'moving',
      });
      moved++;
    }
  }

  return movedUnits;
}

// Generate reinforcement units for AI
export function generateReinforcements(
  base: Base,
  countryName: string,
  currentTick: number,
  existingUnitCount: number
): Unit[] {
  const units: Unit[] = [];
  
  // Reinforce with 1-3 units based on base type
  const reinforceCount = 1 + Math.floor(Math.random() * 3);
  
  const unitTypesForBase: Record<string, string[]> = {
    army: ['infantry', 'armor'],
    airforce: ['fighter', 'drone'],
    navy: ['destroyer', 'frigate'],
    missile: ['air_defense'],
    intelligence: ['special_forces'],
    hq: ['infantry'],
  };

  const availableTypes = unitTypesForBase[base.type] || ['infantry'];

  for (let i = 0; i < reinforceCount; i++) {
    const unitType = availableTypes[i % availableTypes.length] as keyof typeof UNIT_TEMPLATES;
    
    const offset = 0.1 + Math.random() * 0.2;
    const angle = Math.random() * Math.PI * 2;

    const unit: Unit = {
      id: uuidv4(),
      templateType: unitType,
      name: `${countryName} Reinforcement ${existingUnitCount + i + 1}`,
      position: {
        latitude: base.position.latitude + Math.sin(angle) * offset,
        longitude: base.position.longitude + Math.cos(angle) * offset,
      },
      faction: 'ai',
      health: 100,
      maxHealth: 100,
      status: 'idle',
      parentBaseId: base.id,
      createdAt: currentTick,
    };

    units.push(unit);
  }

  return units;
}

// Generate a raid force to attack player territory
export function generateRaidForce(
  sourceBase: Base,
  targetPosition: Coordinates,
  currentTick: number,
  existingUnitCount: number
): Unit[] {
  const units: Unit[] = [];
  
  // Raid with 2-5 units
  const raidSize = 2 + Math.floor(Math.random() * 4);
  
  const raidUnitTypes: (keyof typeof UNIT_TEMPLATES)[] = ['infantry', 'armor', 'fighter', 'helicopter', 'special_forces'];
  
  for (let i = 0; i < raidSize; i++) {
    const unitType = raidUnitTypes[Math.floor(Math.random() * raidUnitTypes.length)];
    
    const unit: Unit = {
      id: uuidv4(),
      templateType: unitType,
      name: `Enemy Raider ${existingUnitCount + i + 1}`,
      position: { ...sourceBase.position },
      destination: targetPosition,
      faction: 'ai',
      health: 100,
      maxHealth: 100,
      status: 'moving',
      parentBaseId: sourceBase.id,
      createdAt: currentTick,
    };
    
    units.push(unit);
  }
  
  return units;
}

// Process AI retaliation for one tick
export function processRetaliation(
  aiUnits: Unit[],
  aiBases: Base[],
  playerUnits: Unit[],
  playerBases: Base[],
  diplomaticStatus: DiplomaticStatus,
  alertLevel: string,
  ticksSinceLastRetaliation: number,
  currentTick: number,
  homeCountryId?: string | null
): {
  movedUnits: Unit[];
  reinforcements: Unit[];
  raidForce: Unit[];
  randomAttack: Unit[];
  logs: string[];
} {
  const logs: string[] = [];
  let movedUnits: Unit[] = [];
  let reinforcements: Unit[] = [];
  let raidForce: Unit[] = [];
  let randomAttack: Unit[] = [];

  // Check if AI should take action
  if (!shouldRetaliate(diplomaticStatus, alertLevel, ticksSinceLastRetaliation)) {
    // Even if not retaliating, check for random attacks
    if (shouldLaunchRandomAttack(alertLevel, ticksSinceLastRetaliation, aiUnits.length, aiBases.length) && playerBases.length > 0) {
      const targetBase = playerBases[Math.floor(Math.random() * playerBases.length)];
      const sourceBase = aiBases[Math.floor(Math.random() * aiBases.length)];
      
      if (sourceBase && targetBase) {
        randomAttack = generateRaidForce(sourceBase, targetBase.position, currentTick, aiUnits.length);
        const targetCountry = findCountryAtPosition(targetBase.position.latitude, targetBase.position.longitude);
        logs.push(`⚔️ ENEMY OFFENSIVE! ${randomAttack.length} units attacking ${targetCountry?.name || 'your base'}!`);
        return { movedUnits: [], reinforcements: [], raidForce: [], randomAttack, logs };
      }
    }
    return { movedUnits: [], reinforcements: [], raidForce: [], randomAttack: [], logs: [] };
  }

  // Move units toward player
  const movements = getRetaliationMovements(aiUnits, playerUnits, playerBases, 3);
  if (movements.length > 0) {
    movedUnits = movements;
    logs.push(`⚠️ Enemy forces advancing! ${movements.length} units moving toward your positions!`);
  }

  // Chance to generate reinforcements during war
  if ((diplomaticStatus === 'war' || alertLevel === 'war') && Math.random() < 0.2) {
    const activeBase = aiBases.find((b) => b.health > 0);
    if (activeBase) {
      const newUnits = generateReinforcements(
        activeBase,
        'Enemy',
        currentTick,
        aiUnits.length
      );
      reinforcements = newUnits;
      logs.push(`🚨 Enemy reinforcements deployed from ${activeBase.name}!`);
    }
  }

  // RAID MECHANIC: Chance to launch raids on player home territory
  if ((diplomaticStatus === 'war' || alertLevel === 'war') && playerBases.length > 0 && aiBases.length > 0) {
    // 15% chance per tick to launch a raid when at war
    const raidChance = alertLevel === 'war' ? 0.15 : 0.08;
    if (Math.random() < raidChance) {
      // Pick a random player base to raid
      const targetBase = playerBases[Math.floor(Math.random() * playerBases.length)];
      
      // Find nearest AI base to launch from
      let nearestAIBase: Base | null = null;
      let nearestDistance = Infinity;
      
      for (const aiBase of aiBases) {
        const dist = calculateDistance(aiBase.position, targetBase.position);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestAIBase = aiBase;
        }
      }
      
      if (nearestAIBase && nearestDistance < 2000) { // Within 2000km
        raidForce = generateRaidForce(nearestAIBase, targetBase.position, currentTick, aiUnits.length);
        
        // Find target country name
        const targetCountry = findCountryAtPosition(targetBase.position.latitude, targetBase.position.longitude);
        const targetName = targetCountry ? targetCountry.name : 'your territory';
        
        logs.push(`🔴 ENEMY RAID INCOMING! ${raidForce.length} hostile units launched toward ${targetName}!`);
      }
    }
  }

  return { movedUnits, reinforcements, raidForce, randomAttack, logs };
}
