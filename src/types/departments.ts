// U.S. Executive Departments Simulation Types

export type DepartmentId = 
  | 'defense'
  | 'hhs'
  | 'veterans'
  | 'homeland'
  | 'education'
  | 'transportation'
  | 'energy'
  | 'commerce'
  | 'interior'
  | 'justice'
  | 'agriculture'
  | 'labor'
  | 'treasury'
  | 'state'
  | 'hud';

export type OperationalDomain = 
  | 'military'
  | 'health'
  | 'education'
  | 'infrastructure'
  | 'diplomacy'
  | 'intelligence'
  | 'economy'
  | 'environment'
  | 'justice'
  | 'welfare'
  | 'research'
  | 'trade'
  | 'housing'
  | 'labor'
  | 'energy';

export type CrisisType = 
  | 'war'
  | 'pandemic'
  | 'financial_crash'
  | 'natural_disaster'
  | 'cyber_attack'
  | 'civil_unrest'
  | 'terrorism'
  | 'supply_chain';

export type PolicyLever = {
  id: string;
  name: string;
  description: string;
  value: number; // 0-100 scale
  minValue: number;
  maxValue: number;
  category: 'funding' | 'reform' | 'oversight' | 'emergency';
};

export type PerformanceMetric = {
  id: string;
  name: string;
  value: number; // Current value
  baseline: number; // Starting value
  target: number; // Ideal value
  trend: 'improving' | 'declining' | 'stable';
  sensitivity: number; // How reactive to budget changes (0-1)
};

export type MandatoryProgram = {
  id: string;
  name: string;
  annualCost: number; // In billions
  growthRate: number; // Annual growth %
  isLocked: boolean;
  politicalCostToReduce: number; // 0-100
  description: string;
};

export type DepartmentSynergy = {
  partnerId: DepartmentId;
  name: string;
  description: string;
  requiredFundingThreshold: number; // % of baseline needed
  bonusMultiplier: number; // Effectiveness boost
  unlockedBenefits: string[];
};

export type Department = {
  id: DepartmentId;
  name: string;
  abbreviation: string;
  mission: string;
  description: string;
  
  // Budget
  baselineBudget: number; // In billions (discretionary)
  currentBudget: number;
  mandatorySpending: number; // In billions
  budgetPercentage: number; // % of total discretionary
  
  // Domains and capabilities
  operationalDomains: OperationalDomain[];
  policyLevers: PolicyLever[];
  performanceMetrics: PerformanceMetric[];
  mandatoryPrograms: MandatoryProgram[];
  synergies: DepartmentSynergy[];
  
  // Crisis response
  crisisCapabilities: CrisisType[];
  crisisReadiness: number; // 0-100
  
  // Long-term investments
  researchProgress: number; // 0-100
  infrastructureHealth: number; // 0-100
  institutionalStrength: number; // 0-100
  
  // Political factors
  publicApproval: number; // 0-100
  politicalCapital: number; // -100 to 100
  
  // State
  isPlayerControlled: boolean;
  isInCrisisMode: boolean;
};

export type BudgetAllocation = {
  departmentId: DepartmentId;
  amount: number;
  changeFromBaseline: number; // %
};

export type NationalMetrics = {
  totalBudget: number;
  nationalDebt: number;
  debtToGDP: number;
  publicApproval: number;
  nationalStability: number;
  economicGrowth: number;
  technologicalAdvancement: number;
  militaryStrength: number;
  diplomaticInfluence: number;
};

export type GameDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

export type DepartmentState = {
  departments: Record<DepartmentId, Department>;
  nationalMetrics: NationalMetrics;
  currentYear: number;
  difficulty: GameDifficulty;
  activeCrises: CrisisType[];
  activeSynergies: string[];
  yearHistory: YearSnapshot[];
};

export type YearSnapshot = {
  year: number;
  nationalMetrics: NationalMetrics;
  departmentBudgets: Record<DepartmentId, number>;
  events: string[];
};

export type BudgetAction = {
  type: 'increase' | 'decrease' | 'reallocate';
  departmentId: DepartmentId;
  amount: number;
  source?: DepartmentId; // For reallocations
};

export type PolicyDecision = {
  departmentId: DepartmentId;
  leverId: string;
  newValue: number;
  timestamp: number;
};
