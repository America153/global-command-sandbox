// Diplomacy System - Nation relations, war, peace, alliances

export type DiplomaticStatus = 'peace' | 'tense' | 'hostile' | 'war' | 'allied';

export interface NationRelation {
  nationId: string;
  nationName: string;
  status: DiplomaticStatus;
  opinion: number; // -100 to 100
  warScore: number; // 0 to 100, for peace negotiations
  treatiesActive: string[];
}

export interface DiplomacyState {
  relations: Record<string, NationRelation>;
}

// Opinion modifiers
const OPINION_MODIFIERS = {
  BORDER_VIOLATION: -20,
  MISSILE_STRIKE: -50,
  UNIT_DESTROYED: -10,
  BASE_DESTROYED: -30,
  PEACE_OFFER: +15,
  TIME_DECAY: +1, // Per game hour, relations slowly improve
  ALLIED_ATTACKED: -40, // If their ally was attacked
};

// Create initial relation with a nation
export function createNationRelation(nationId: string, nationName: string): NationRelation {
  return {
    nationId,
    nationName,
    status: 'peace',
    opinion: 0,
    warScore: 0,
    treatiesActive: [],
  };
}

// Update diplomatic status based on opinion
export function updateDiplomaticStatus(relation: NationRelation): DiplomaticStatus {
  const { opinion, status } = relation;

  // War doesn't end automatically - requires peace negotiation
  if (status === 'war') {
    return 'war';
  }

  if (opinion <= -75) return 'hostile';
  if (opinion <= -40) return 'tense';
  if (opinion >= 50) return 'allied';
  return 'peace';
}

// Apply an opinion modifier
export function modifyOpinion(
  relation: NationRelation,
  modifier: number,
  reason: string
): { relation: NationRelation; statusChanged: boolean; newStatus: DiplomaticStatus } {
  const newOpinion = Math.max(-100, Math.min(100, relation.opinion + modifier));
  const oldStatus = relation.status;

  const updatedRelation: NationRelation = {
    ...relation,
    opinion: newOpinion,
  };

  // Auto-escalate to war on severe actions
  if (modifier <= -40 && oldStatus !== 'war') {
    updatedRelation.status = 'war';
    updatedRelation.warScore = 0;
    return {
      relation: updatedRelation,
      statusChanged: true,
      newStatus: 'war',
    };
  }

  const newStatus = updateDiplomaticStatus(updatedRelation);
  updatedRelation.status = newStatus;

  return {
    relation: updatedRelation,
    statusChanged: oldStatus !== newStatus,
    newStatus,
  };
}

// Declare war
export function declareWar(relation: NationRelation): NationRelation {
  return {
    ...relation,
    status: 'war',
    opinion: -100,
    warScore: 0,
    treatiesActive: [],
  };
}

// Request peace (requires war score consideration)
export function canRequestPeace(relation: NationRelation): boolean {
  // Need war score > 50 or very negative opinion to force peace
  return relation.status === 'war' && (relation.warScore >= 50 || relation.opinion >= -30);
}

// Accept peace
export function acceptPeace(relation: NationRelation): NationRelation {
  return {
    ...relation,
    status: 'tense',
    warScore: 0,
    opinion: Math.max(-50, relation.opinion + 20),
  };
}

// Calculate war score changes
export function updateWarScore(
  relation: NationRelation,
  playerKills: number,
  playerLosses: number,
  enemyBasesDestroyed: number,
  playerBasesLost: number
): NationRelation {
  // War score increases with enemy losses, decreases with player losses
  const killScore = playerKills * 5;
  const baseScore = enemyBasesDestroyed * 15;
  const lossScore = playerLosses * -3;
  const baseLossScore = playerBasesLost * -10;

  const scoreChange = killScore + baseScore + lossScore + baseLossScore;
  const newWarScore = Math.max(0, Math.min(100, relation.warScore + scoreChange));

  return {
    ...relation,
    warScore: newWarScore,
  };
}

// Get nations that will retaliate (at war or hostile)
export function getNationsAtWar(relations: Record<string, NationRelation>): string[] {
  return Object.values(relations)
    .filter((r) => r.status === 'war' || r.status === 'hostile')
    .map((r) => r.nationId);
}

// Get diplomatic summary for UI
export function getDiplomaticSummary(relations: Record<string, NationRelation>): {
  atWar: number;
  hostile: number;
  tense: number;
  peaceful: number;
  allied: number;
} {
  const values = Object.values(relations);
  return {
    atWar: values.filter((r) => r.status === 'war').length,
    hostile: values.filter((r) => r.status === 'hostile').length,
    tense: values.filter((r) => r.status === 'tense').length,
    peaceful: values.filter((r) => r.status === 'peace').length,
    allied: values.filter((r) => r.status === 'allied').length,
  };
}

// Predefined opinion changes for events
export function getOpinionChange(
  event: 'border_violation' | 'missile_strike' | 'unit_killed' | 'base_destroyed' | 'peace_offer'
): number {
  switch (event) {
    case 'border_violation':
      return OPINION_MODIFIERS.BORDER_VIOLATION;
    case 'missile_strike':
      return OPINION_MODIFIERS.MISSILE_STRIKE;
    case 'unit_killed':
      return OPINION_MODIFIERS.UNIT_DESTROYED;
    case 'base_destroyed':
      return OPINION_MODIFIERS.BASE_DESTROYED;
    case 'peace_offer':
      return OPINION_MODIFIERS.PEACE_OFFER;
    default:
      return 0;
  }
}
