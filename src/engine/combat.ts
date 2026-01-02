// Combat System - Handles unit vs unit and unit vs base combat

import type { Unit, Base, Coordinates } from '@/types/game';
import { UNIT_TEMPLATES } from '@/types/game';
import { calculateDistance } from './simulation';

export interface CombatResult {
  attackerId: string;
  defenderId: string;
  attackerDamage: number;
  defenderDamage: number;
  attackerDestroyed: boolean;
  defenderDestroyed: boolean;
}

// Engagement range in km - units within this range will fight
const ENGAGEMENT_RANGE_KM = 50;

// Check if two units are in combat range
export function areUnitsInRange(unit1: Unit, unit2: Unit): boolean {
  const distance = calculateDistance(unit1.position, unit2.position);
  return distance <= ENGAGEMENT_RANGE_KM;
}

// Check if unit is in range of base
export function isUnitInBaseRange(unit: Unit, base: Base): boolean {
  const distance = calculateDistance(unit.position, base.position);
  return distance <= ENGAGEMENT_RANGE_KM;
}

// Resolve combat between two units
export function resolveUnitCombat(attacker: Unit, defender: Unit): CombatResult {
  const attackerTemplate = UNIT_TEMPLATES[attacker.templateType];
  const defenderTemplate = UNIT_TEMPLATES[defender.templateType];

  // Base damage calculation with templates
  const attackerAttack = attackerTemplate?.attack || 50;
  const defenderDefense = defenderTemplate?.defense || 30;
  const defenderAttack = defenderTemplate?.attack || 50;
  const attackerDefense = attackerTemplate?.defense || 30;

  // Combat formula: damage = attack * (1 - defense/200) * random variance
  const variance = () => 0.7 + Math.random() * 0.6; // 0.7 to 1.3

  // Domain bonuses (air beats land, naval balanced, special ops get bonuses)
  const domainBonus = getDomainBonus(attackerTemplate?.domain, defenderTemplate?.domain);

  const damageToDefender = Math.floor(
    attackerAttack * domainBonus * (1 - defenderDefense / 200) * variance()
  );
  const damageToAttacker = Math.floor(
    defenderAttack * (1 / domainBonus) * (1 - attackerDefense / 200) * variance()
  );

  const newAttackerHealth = attacker.health - damageToAttacker;
  const newDefenderHealth = defender.health - damageToDefender;

  return {
    attackerId: attacker.id,
    defenderId: defender.id,
    attackerDamage: damageToAttacker,
    defenderDamage: damageToDefender,
    attackerDestroyed: newAttackerHealth <= 0,
    defenderDestroyed: newDefenderHealth <= 0,
  };
}

// Resolve combat between unit and base
export function resolveUnitVsBaseCombat(attacker: Unit, base: Base): { damage: number } {
  const attackerTemplate = UNIT_TEMPLATES[attacker.templateType];
  const attack = attackerTemplate?.attack || 50;

  // Bases have inherent defense of 50
  const baseDefense = 50;
  const variance = 0.8 + Math.random() * 0.4;

  const damage = Math.floor(attack * (1 - baseDefense / 200) * variance);

  return { damage };
}

// Domain advantage multiplier
function getDomainBonus(attackerDomain?: string, defenderDomain?: string): number {
  if (!attackerDomain || !defenderDomain) return 1;

  // Air dominance over land
  if (attackerDomain === 'air' && defenderDomain === 'land') return 1.3;
  if (attackerDomain === 'land' && defenderDomain === 'air') return 0.7;

  // Air defense counters air
  if (defenderDomain === 'land' && attackerDomain === 'air') return 0.8;

  // Naval vs land (amphibious operations)
  if (attackerDomain === 'naval' && defenderDomain === 'land') return 0.9;

  // Special ops bonus
  if (attackerDomain === 'special') return 1.2;

  return 1;
}

// Find all enemy units within engagement range
export function findEnemiesInRange(
  unit: Unit,
  allUnits: Unit[],
  enemyBases: Base[]
): { enemyUnits: Unit[]; enemyBases: Base[] } {
  const enemyUnits = allUnits.filter(
    (other) =>
      other.faction !== unit.faction &&
      other.id !== unit.id &&
      areUnitsInRange(unit, other)
  );

  const basesInRange = enemyBases.filter(
    (base) => base.faction !== unit.faction && isUnitInBaseRange(unit, base)
  );

  return { enemyUnits, enemyBases: basesInRange };
}

// Process all combat for a game tick
export function processCombatTick(
  playerUnits: Unit[],
  playerBases: Base[],
  enemyUnits: Unit[],
  enemyBases: Base[]
): {
  updatedPlayerUnits: Unit[];
  updatedPlayerBases: Base[];
  updatedEnemyUnits: Unit[];
  updatedEnemyBases: Base[];
  combatLogs: string[];
} {
  const combatLogs: string[] = [];
  
  // Clone arrays for modifications
  let pUnits = playerUnits.map((u) => ({ ...u }));
  let pBases = playerBases.map((b) => ({ ...b }));
  let eUnits = enemyUnits.map((u) => ({ ...u }));
  let eBases = enemyBases.map((b) => ({ ...b }));

  // Track which units have fought this tick to avoid double-combat
  const foughtUnits = new Set<string>();

  // Player units attack enemy units
  for (const playerUnit of pUnits) {
    if (foughtUnits.has(playerUnit.id) || playerUnit.health <= 0) continue;

    // Find closest enemy in range
    const enemiesInRange = eUnits.filter(
      (e) => e.health > 0 && areUnitsInRange(playerUnit, e)
    );

    if (enemiesInRange.length > 0) {
      // Attack closest enemy
      const target = enemiesInRange[0];
      const result = resolveUnitCombat(playerUnit, target);

      // Apply damage
      playerUnit.health = Math.max(0, playerUnit.health - result.attackerDamage);
      target.health = Math.max(0, target.health - result.defenderDamage);

      foughtUnits.add(playerUnit.id);
      foughtUnits.add(target.id);

      if (result.defenderDestroyed) {
        combatLogs.push(`⚔️ ${playerUnit.name} destroyed enemy ${target.name}!`);
      } else if (result.attackerDestroyed) {
        combatLogs.push(`💀 ${playerUnit.name} was destroyed by ${target.name}!`);
      } else {
        combatLogs.push(
          `⚔️ Combat: ${playerUnit.name} vs ${target.name} - both damaged`
        );
      }
    }

    // Player units also attack enemy bases if in range
    const basesInRange = eBases.filter(
      (b) => b.health > 0 && isUnitInBaseRange(playerUnit, b)
    );
    if (basesInRange.length > 0 && !foughtUnits.has(playerUnit.id)) {
      const targetBase = basesInRange[0];
      const { damage } = resolveUnitVsBaseCombat(playerUnit, targetBase);
      targetBase.health = Math.max(0, targetBase.health - damage);
      
      if (targetBase.health <= 0) {
        combatLogs.push(`🔥 ${playerUnit.name} destroyed enemy ${targetBase.name}!`);
      }
    }
  }

  // Enemy units attack player units (retaliation)
  for (const enemyUnit of eUnits) {
    if (foughtUnits.has(enemyUnit.id) || enemyUnit.health <= 0) continue;

    const playersInRange = pUnits.filter(
      (p) => p.health > 0 && areUnitsInRange(enemyUnit, p)
    );

    if (playersInRange.length > 0) {
      const target = playersInRange[0];
      const result = resolveUnitCombat(enemyUnit, target);

      enemyUnit.health = Math.max(0, enemyUnit.health - result.attackerDamage);
      target.health = Math.max(0, target.health - result.defenderDamage);

      foughtUnits.add(enemyUnit.id);
      foughtUnits.add(target.id);

      if (result.defenderDestroyed) {
        combatLogs.push(`💀 Enemy ${enemyUnit.name} destroyed your ${target.name}!`);
      }
    }

    // Enemy units attack player bases
    const pBasesInRange = pBases.filter(
      (b) => b.health > 0 && isUnitInBaseRange(enemyUnit, b)
    );
    if (pBasesInRange.length > 0 && !foughtUnits.has(enemyUnit.id)) {
      const targetBase = pBasesInRange[0];
      const { damage } = resolveUnitVsBaseCombat(enemyUnit, targetBase);
      targetBase.health = Math.max(0, targetBase.health - damage);

      if (targetBase.health <= 0) {
        combatLogs.push(`🔥 Enemy ${enemyUnit.name} destroyed your ${targetBase.name}!`);
      }
    }
  }

  // Filter out destroyed units and bases
  return {
    updatedPlayerUnits: pUnits.filter((u) => u.health > 0),
    updatedPlayerBases: pBases.filter((b) => b.health > 0),
    updatedEnemyUnits: eUnits.filter((u) => u.health > 0),
    updatedEnemyBases: eBases.filter((b) => b.health > 0),
    combatLogs,
  };
}
