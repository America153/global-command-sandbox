// Department Simulation Engine - Budget effects, synergies, crises

import type { 
  Department, 
  DepartmentId, 
  NationalMetrics, 
  CrisisType,
  DepartmentState,
  GameDifficulty
} from '@/types/departments';
import { DIFFICULTY_MODIFIERS } from '@/data/departments';

// Calculate budget trade-off effects
export function calculateBudgetTradeoffs(
  departments: Record<DepartmentId, Department>,
  totalBudget: number,
  difficulty: GameDifficulty
): { politicalCost: number; debtImpact: number; approvalChange: number } {
  const mods = DIFFICULTY_MODIFIERS[difficulty];
  let totalSpending = 0;
  let overBudgetDepts = 0;
  let underBudgetDepts = 0;

  for (const dept of Object.values(departments)) {
    totalSpending += dept.currentBudget;
    const ratio = dept.currentBudget / dept.baselineBudget;
    if (ratio > 1.1) overBudgetDepts++;
    if (ratio < 0.9) underBudgetDepts++;
  }

  const budgetRatio = totalSpending / totalBudget;
  const debtImpact = budgetRatio > 1 ? (budgetRatio - 1) * 500 * mods.debtPenalty : 0;
  const politicalCost = (overBudgetDepts * 5 + underBudgetDepts * 8) * mods.publicSensitivity;
  const approvalChange = underBudgetDepts > 5 ? -underBudgetDepts * 2 : overBudgetDepts > 3 ? -overBudgetDepts : 0;

  return { politicalCost, debtImpact, approvalChange };
}

// Check and activate synergies
export function evaluateSynergies(
  departments: Record<DepartmentId, Department>
): { activeSynergies: string[]; bonuses: Record<DepartmentId, number> } {
  const activeSynergies: string[] = [];
  const bonuses: Record<string, number> = {};

  for (const dept of Object.values(departments)) {
    bonuses[dept.id] = 1.0;
    
    for (const synergy of dept.synergies) {
      const partner = departments[synergy.partnerId];
      const deptFunding = dept.currentBudget / dept.baselineBudget * 100;
      const partnerFunding = partner.currentBudget / partner.baselineBudget * 100;
      
      if (deptFunding >= synergy.requiredFundingThreshold && 
          partnerFunding >= synergy.requiredFundingThreshold) {
        activeSynergies.push(`${dept.abbreviation}-${partner.abbreviation}: ${synergy.name}`);
        bonuses[dept.id] = Math.max(bonuses[dept.id], synergy.bonusMultiplier);
      }
    }
  }

  return { activeSynergies, bonuses: bonuses as Record<DepartmentId, number> };
}

// Update department metrics based on budget
export function updateDepartmentMetrics(
  dept: Department,
  synergyBonus: number = 1.0
): Department {
  const fundingRatio = dept.currentBudget / dept.baselineBudget;
  const updated = { ...dept };
  
  updated.performanceMetrics = dept.performanceMetrics.map(metric => {
    const budgetEffect = (fundingRatio - 1) * 100 * metric.sensitivity * synergyBonus;
    const newValue = Math.max(0, Math.min(100, metric.value + budgetEffect * 0.1));
    const trend = newValue > metric.value ? 'improving' : newValue < metric.value ? 'declining' : 'stable';
    return { ...metric, value: newValue, trend } as typeof metric;
  });

  // Update crisis readiness
  updated.crisisReadiness = Math.max(0, Math.min(100, 
    dept.crisisReadiness + (fundingRatio - 1) * 20 * synergyBonus
  ));

  // Long-term investments (delayed effects)
  if (fundingRatio > 1.1) {
    updated.researchProgress = Math.min(100, dept.researchProgress + 0.5);
    updated.institutionalStrength = Math.min(100, dept.institutionalStrength + 0.3);
  } else if (fundingRatio < 0.8) {
    updated.infrastructureHealth = Math.max(0, dept.infrastructureHealth - 1);
    updated.institutionalStrength = Math.max(0, dept.institutionalStrength - 0.5);
  }

  return updated;
}

// Calculate national metrics from all departments
export function calculateNationalMetrics(
  departments: Record<DepartmentId, Department>,
  currentMetrics: NationalMetrics,
  difficulty: GameDifficulty
): NationalMetrics {
  const mods = DIFFICULTY_MODIFIERS[difficulty];
  
  let totalBudget = 0;
  let avgApproval = 0;
  let militaryScore = 0;
  let diplomaticScore = 0;
  let techScore = 0;

  for (const dept of Object.values(departments)) {
    totalBudget += dept.currentBudget + dept.mandatorySpending;
    avgApproval += dept.publicApproval;
    
    if (dept.operationalDomains.includes('military')) militaryScore += dept.crisisReadiness;
    if (dept.operationalDomains.includes('diplomacy')) diplomaticScore += dept.institutionalStrength;
    if (dept.operationalDomains.includes('research')) techScore += dept.researchProgress;
  }

  const debtGrowth = totalBudget > currentMetrics.totalBudget 
    ? (totalBudget - currentMetrics.totalBudget) * mods.debtPenalty 
    : 0;

  return {
    totalBudget,
    nationalDebt: currentMetrics.nationalDebt + debtGrowth,
    debtToGDP: currentMetrics.debtToGDP + (debtGrowth / 300),
    publicApproval: Math.max(0, Math.min(100, avgApproval / 15)),
    nationalStability: Math.max(0, Math.min(100, currentMetrics.nationalStability)),
    economicGrowth: currentMetrics.economicGrowth,
    technologicalAdvancement: Math.min(100, techScore / 3),
    militaryStrength: Math.min(100, militaryScore),
    diplomaticInfluence: Math.min(100, diplomaticScore),
  };
}

// Simulate a year turn
export function simulateYear(state: DepartmentState): DepartmentState {
  const { activeSynergies, bonuses } = evaluateSynergies(state.departments);
  
  // Update each department
  const updatedDepts = { ...state.departments };
  for (const id of Object.keys(updatedDepts) as DepartmentId[]) {
    updatedDepts[id] = updateDepartmentMetrics(updatedDepts[id], bonuses[id] || 1.0);
    
    // Grow mandatory programs
    for (const program of updatedDepts[id].mandatoryPrograms) {
      program.annualCost *= (1 + program.growthRate / 100);
    }
  }

  const tradeoffs = calculateBudgetTradeoffs(updatedDepts, state.nationalMetrics.totalBudget, state.difficulty);
  const nationalMetrics = calculateNationalMetrics(updatedDepts, state.nationalMetrics, state.difficulty);
  nationalMetrics.publicApproval += tradeoffs.approvalChange;
  nationalMetrics.nationalDebt += tradeoffs.debtImpact;

  return {
    ...state,
    departments: updatedDepts,
    nationalMetrics,
    currentYear: state.currentYear + 1,
    activeSynergies,
  };
}

// Crisis impact
export function applyCrisisImpact(
  state: DepartmentState,
  crisis: CrisisType
): DepartmentState {
  const updatedDepts = { ...state.departments };
  
  for (const id of Object.keys(updatedDepts) as DepartmentId[]) {
    const dept = updatedDepts[id];
    if (dept.crisisCapabilities.includes(crisis)) {
      dept.isInCrisisMode = true;
      dept.currentBudget *= 1.2; // Emergency spending
      dept.publicApproval += dept.crisisReadiness > 70 ? 5 : -10;
    }
  }

  return {
    ...state,
    departments: updatedDepts,
    activeCrises: [...state.activeCrises, crisis],
  };
}
