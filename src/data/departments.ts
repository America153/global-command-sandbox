// U.S. Executive Departments Configuration Data
// Budget figures approximate real-world FY2024 discretionary spending

import type { 
  Department, 
  DepartmentId, 
  NationalMetrics,
  GameDifficulty 
} from '@/types/departments';

// Difficulty multipliers
export const DIFFICULTY_MODIFIERS: Record<GameDifficulty, {
  budgetPressure: number;
  crisisFrequency: number;
  publicSensitivity: number;
  debtPenalty: number;
}> = {
  easy: { budgetPressure: 0.8, crisisFrequency: 0.5, publicSensitivity: 0.7, debtPenalty: 0.5 },
  normal: { budgetPressure: 1.0, crisisFrequency: 1.0, publicSensitivity: 1.0, debtPenalty: 1.0 },
  hard: { budgetPressure: 1.3, crisisFrequency: 1.5, publicSensitivity: 1.3, debtPenalty: 1.5 },
  expert: { budgetPressure: 1.6, crisisFrequency: 2.0, publicSensitivity: 1.6, debtPenalty: 2.0 },
};

export const INITIAL_NATIONAL_METRICS: NationalMetrics = {
  totalBudget: 1700, // ~$1.7T discretionary
  nationalDebt: 34000, // ~$34T
  debtToGDP: 120,
  publicApproval: 50,
  nationalStability: 70,
  economicGrowth: 2.5,
  technologicalAdvancement: 75,
  militaryStrength: 90,
  diplomaticInfluence: 80,
};

export const createDepartment = (id: DepartmentId): Department => {
  const configs: Record<DepartmentId, Omit<Department, 'id' | 'isPlayerControlled' | 'isInCrisisMode'>> = {
    defense: {
      name: 'Department of Defense',
      abbreviation: 'DoD',
      mission: 'Provide military forces needed to deter war and protect the security of the United States',
      description: 'Oversees all military branches, conducts operations worldwide, and maintains readiness.',
      baselineBudget: 886,
      currentBudget: 886,
      mandatorySpending: 15,
      budgetPercentage: 52,
      operationalDomains: ['military', 'intelligence', 'research'],
      policyLevers: [
        { id: 'force_readiness', name: 'Force Readiness', description: 'Combat readiness level', value: 75, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'modernization', name: 'Modernization', description: 'Investment in new systems', value: 60, minValue: 20, maxValue: 100, category: 'reform' },
        { id: 'overseas_presence', name: 'Overseas Presence', description: 'Global military footprint', value: 70, minValue: 20, maxValue: 100, category: 'funding' },
        { id: 'emergency_deployment', name: 'Emergency Deployment', description: 'Rapid response capability', value: 50, minValue: 0, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'combat_readiness', name: 'Combat Readiness', value: 85, baseline: 85, target: 95, trend: 'stable', sensitivity: 0.8 },
        { id: 'recruitment', name: 'Recruitment Rate', value: 70, baseline: 70, target: 100, trend: 'declining', sensitivity: 0.5 },
        { id: 'tech_advantage', name: 'Technological Edge', value: 90, baseline: 90, target: 100, trend: 'stable', sensitivity: 0.6 },
      ],
      mandatoryPrograms: [
        { id: 'military_retirement', name: 'Military Retirement', annualCost: 15, growthRate: 2.5, isLocked: true, politicalCostToReduce: 90, description: 'Retirement benefits for service members' },
      ],
      synergies: [
        { partnerId: 'energy', name: 'Advanced Weapons R&D', description: 'Joint nuclear and energy research', requiredFundingThreshold: 80, bonusMultiplier: 1.25, unlockedBenefits: ['Nuclear modernization', 'Directed energy weapons', 'Advanced propulsion'] },
        { partnerId: 'veterans', name: 'Force Continuum', description: 'Seamless military-to-veteran transition', requiredFundingThreshold: 70, bonusMultiplier: 1.15, unlockedBenefits: ['Improved retention', 'Better morale', 'Reduced VA burden'] },
        { partnerId: 'homeland', name: 'Integrated Defense', description: 'Coordinated homeland and military security', requiredFundingThreshold: 75, bonusMultiplier: 1.2, unlockedBenefits: ['Border security', 'Counter-terrorism', 'Cyber defense'] },
      ],
      crisisCapabilities: ['war', 'terrorism', 'cyber_attack', 'natural_disaster'],
      crisisReadiness: 85,
      researchProgress: 70,
      infrastructureHealth: 75,
      institutionalStrength: 90,
      publicApproval: 65,
      politicalCapital: 20,
    },
    
    hhs: {
      name: 'Health and Human Services',
      abbreviation: 'HHS',
      mission: 'Enhance and protect the health and well-being of all Americans',
      description: 'Administers Medicare, Medicaid, CDC, FDA, NIH, and public health programs.',
      baselineBudget: 127,
      currentBudget: 127,
      mandatorySpending: 1500,
      budgetPercentage: 7.5,
      operationalDomains: ['health', 'welfare', 'research'],
      policyLevers: [
        { id: 'public_health', name: 'Public Health Investment', description: 'CDC and prevention funding', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'research_grants', name: 'NIH Research Grants', description: 'Medical research funding', value: 70, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'healthcare_access', name: 'Healthcare Access', description: 'Expand coverage programs', value: 55, minValue: 20, maxValue: 100, category: 'reform' },
        { id: 'pandemic_prep', name: 'Pandemic Preparedness', description: 'Emergency health readiness', value: 45, minValue: 10, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'life_expectancy', name: 'Life Expectancy', value: 77, baseline: 77, target: 82, trend: 'declining', sensitivity: 0.3 },
        { id: 'insurance_coverage', name: 'Insurance Coverage', value: 92, baseline: 92, target: 100, trend: 'stable', sensitivity: 0.6 },
        { id: 'disease_prevention', name: 'Disease Prevention', value: 70, baseline: 70, target: 90, trend: 'stable', sensitivity: 0.7 },
      ],
      mandatoryPrograms: [
        { id: 'medicare', name: 'Medicare', annualCost: 850, growthRate: 5.0, isLocked: true, politicalCostToReduce: 95, description: 'Health insurance for seniors' },
        { id: 'medicaid', name: 'Medicaid', annualCost: 600, growthRate: 4.0, isLocked: true, politicalCostToReduce: 85, description: 'Health coverage for low-income' },
      ],
      synergies: [
        { partnerId: 'education', name: 'Workforce Health', description: 'Healthy and educated workforce', requiredFundingThreshold: 70, bonusMultiplier: 1.2, unlockedBenefits: ['School health programs', 'Reduced absenteeism', 'Long-term productivity'] },
        { partnerId: 'veterans', name: 'Health Coordination', description: 'Shared medical research and facilities', requiredFundingThreshold: 65, bonusMultiplier: 1.15, unlockedBenefits: ['Trauma research', 'Mental health advances', 'Cost savings'] },
        { partnerId: 'agriculture', name: 'Food Safety Alliance', description: 'Farm-to-table health integration', requiredFundingThreshold: 60, bonusMultiplier: 1.1, unlockedBenefits: ['Nutrition programs', 'Food safety', 'Reduced obesity'] },
      ],
      crisisCapabilities: ['pandemic', 'natural_disaster'],
      crisisReadiness: 60,
      researchProgress: 75,
      infrastructureHealth: 65,
      institutionalStrength: 80,
      publicApproval: 55,
      politicalCapital: -10,
    },
    
    veterans: {
      name: 'Department of Veterans Affairs',
      abbreviation: 'VA',
      mission: 'Care for those who have borne the battle and their families',
      description: 'Provides healthcare, benefits, and services to military veterans.',
      baselineBudget: 135,
      currentBudget: 135,
      mandatorySpending: 170,
      budgetPercentage: 8,
      operationalDomains: ['health', 'welfare'],
      policyLevers: [
        { id: 'healthcare_quality', name: 'Healthcare Quality', description: 'VA hospital standards', value: 55, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'claims_processing', name: 'Claims Processing', description: 'Benefits administration speed', value: 50, minValue: 20, maxValue: 100, category: 'reform' },
        { id: 'mental_health', name: 'Mental Health Services', description: 'PTSD and counseling programs', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'crisis_line', name: 'Crisis Intervention', description: 'Suicide prevention resources', value: 70, minValue: 40, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'veteran_satisfaction', name: 'Veteran Satisfaction', value: 60, baseline: 60, target: 85, trend: 'improving', sensitivity: 0.8 },
        { id: 'wait_times', name: 'Appointment Wait Times', value: 55, baseline: 55, target: 90, trend: 'stable', sensitivity: 0.9 },
        { id: 'homelessness', name: 'Veteran Housing', value: 70, baseline: 70, target: 95, trend: 'improving', sensitivity: 0.6 },
      ],
      mandatoryPrograms: [
        { id: 'disability_comp', name: 'Disability Compensation', annualCost: 120, growthRate: 6.0, isLocked: true, politicalCostToReduce: 98, description: 'Service-connected disability payments' },
        { id: 'gi_bill', name: 'GI Bill Education', annualCost: 50, growthRate: 3.0, isLocked: true, politicalCostToReduce: 85, description: 'Educational benefits for veterans' },
      ],
      synergies: [
        { partnerId: 'defense', name: 'Force Continuum', description: 'Seamless military-to-veteran transition', requiredFundingThreshold: 70, bonusMultiplier: 1.15, unlockedBenefits: ['Career counseling', 'Skills translation', 'Reduced homelessness'] },
        { partnerId: 'hhs', name: 'Health Coordination', description: 'Shared medical infrastructure', requiredFundingThreshold: 65, bonusMultiplier: 1.15, unlockedBenefits: ['Telehealth expansion', 'Research sharing', 'Cost efficiency'] },
        { partnerId: 'hud', name: 'Veteran Housing Initiative', description: 'Housing-first approach to homelessness', requiredFundingThreshold: 60, bonusMultiplier: 1.2, unlockedBenefits: ['Rapid rehousing', 'Transitional housing', 'Family support'] },
      ],
      crisisCapabilities: ['war'],
      crisisReadiness: 55,
      researchProgress: 50,
      infrastructureHealth: 55,
      institutionalStrength: 65,
      publicApproval: 75,
      politicalCapital: 30,
    },
    
    homeland: {
      name: 'Department of Homeland Security',
      abbreviation: 'DHS',
      mission: 'Safeguard the American people, homeland, and values',
      description: 'Coordinates domestic security, border protection, immigration, and disaster response.',
      baselineBudget: 62,
      currentBudget: 62,
      mandatorySpending: 8,
      budgetPercentage: 3.6,
      operationalDomains: ['intelligence', 'infrastructure'],
      policyLevers: [
        { id: 'border_security', name: 'Border Security', description: 'CBP funding and personnel', value: 70, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'cyber_defense', name: 'Cyber Defense', description: 'CISA and infrastructure protection', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'immigration_enforcement', name: 'Immigration Enforcement', description: 'ICE operations intensity', value: 55, minValue: 20, maxValue: 100, category: 'oversight' },
        { id: 'disaster_response', name: 'FEMA Readiness', description: 'Disaster response capability', value: 65, minValue: 30, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'border_effectiveness', name: 'Border Security', value: 60, baseline: 60, target: 85, trend: 'stable', sensitivity: 0.7 },
        { id: 'cyber_incidents', name: 'Cyber Resilience', value: 65, baseline: 65, target: 90, trend: 'declining', sensitivity: 0.8 },
        { id: 'disaster_response_time', name: 'Disaster Response', value: 70, baseline: 70, target: 95, trend: 'stable', sensitivity: 0.9 },
      ],
      mandatoryPrograms: [
        { id: 'flood_insurance', name: 'Flood Insurance', annualCost: 5, growthRate: 4.0, isLocked: false, politicalCostToReduce: 60, description: 'National flood insurance program' },
      ],
      synergies: [
        { partnerId: 'defense', name: 'Integrated Defense', description: 'Military-homeland coordination', requiredFundingThreshold: 75, bonusMultiplier: 1.2, unlockedBenefits: ['Intelligence sharing', 'Joint operations', 'Unified command'] },
        { partnerId: 'justice', name: 'Law Enforcement Fusion', description: 'Federal law enforcement coordination', requiredFundingThreshold: 70, bonusMultiplier: 1.15, unlockedBenefits: ['Task forces', 'Data sharing', 'Joint training'] },
        { partnerId: 'transportation', name: 'Transit Security', description: 'Transportation security enhancement', requiredFundingThreshold: 65, bonusMultiplier: 1.1, unlockedBenefits: ['TSA efficiency', 'Port security', 'Rail safety'] },
      ],
      crisisCapabilities: ['terrorism', 'natural_disaster', 'cyber_attack', 'civil_unrest'],
      crisisReadiness: 75,
      researchProgress: 45,
      infrastructureHealth: 60,
      institutionalStrength: 70,
      publicApproval: 45,
      politicalCapital: -5,
    },
    
    education: {
      name: 'Department of Education',
      abbreviation: 'ED',
      mission: 'Promote student achievement and preparation for global competitiveness',
      description: 'Administers federal education funding, student loans, and educational policy.',
      baselineBudget: 79,
      currentBudget: 79,
      mandatorySpending: 140,
      budgetPercentage: 4.6,
      operationalDomains: ['education', 'research'],
      policyLevers: [
        { id: 'k12_funding', name: 'K-12 Funding', description: 'Title I and school support', value: 65, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'higher_ed', name: 'Higher Education', description: 'Pell grants and university support', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'stem_initiative', name: 'STEM Initiative', description: 'Science and math education focus', value: 55, minValue: 20, maxValue: 100, category: 'reform' },
        { id: 'loan_forgiveness', name: 'Loan Forgiveness', description: 'Student debt relief programs', value: 40, minValue: 0, maxValue: 100, category: 'reform' },
      ],
      performanceMetrics: [
        { id: 'graduation_rate', name: 'Graduation Rate', value: 88, baseline: 88, target: 95, trend: 'improving', sensitivity: 0.4 },
        { id: 'stem_proficiency', name: 'STEM Proficiency', value: 65, baseline: 65, target: 85, trend: 'stable', sensitivity: 0.5 },
        { id: 'college_access', name: 'College Access', value: 70, baseline: 70, target: 85, trend: 'stable', sensitivity: 0.6 },
      ],
      mandatoryPrograms: [
        { id: 'student_loans', name: 'Student Loan Programs', annualCost: 100, growthRate: 3.5, isLocked: true, politicalCostToReduce: 70, description: 'Federal student loan servicing' },
        { id: 'pell_grants', name: 'Pell Grants', annualCost: 40, growthRate: 2.5, isLocked: true, politicalCostToReduce: 75, description: 'Need-based college grants' },
      ],
      synergies: [
        { partnerId: 'hhs', name: 'Workforce Health', description: 'Healthy students learn better', requiredFundingThreshold: 70, bonusMultiplier: 1.2, unlockedBenefits: ['School nutrition', 'Mental health support', 'Physical education'] },
        { partnerId: 'labor', name: 'Workforce Pipeline', description: 'Education-to-employment pathway', requiredFundingThreshold: 65, bonusMultiplier: 1.25, unlockedBenefits: ['Apprenticeships', 'Job training', 'Career readiness'] },
        { partnerId: 'energy', name: 'STEM Excellence', description: 'Advanced science education', requiredFundingThreshold: 60, bonusMultiplier: 1.15, unlockedBenefits: ['Lab partnerships', 'Research opportunities', 'Tech scholarships'] },
      ],
      crisisCapabilities: [],
      crisisReadiness: 30,
      researchProgress: 60,
      infrastructureHealth: 55,
      institutionalStrength: 70,
      publicApproval: 50,
      politicalCapital: -15,
    },
    
    transportation: {
      name: 'Department of Transportation',
      abbreviation: 'DOT',
      mission: 'Ensure safe and efficient movement of people and goods',
      description: 'Oversees highways, aviation, railroads, maritime, and transit systems.',
      baselineBudget: 105,
      currentBudget: 105,
      mandatorySpending: 12,
      budgetPercentage: 6.2,
      operationalDomains: ['infrastructure', 'economy'],
      policyLevers: [
        { id: 'highway_funding', name: 'Highway Investment', description: 'Interstate and road maintenance', value: 70, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'aviation_safety', name: 'Aviation Safety', description: 'FAA modernization and oversight', value: 75, minValue: 50, maxValue: 100, category: 'oversight' },
        { id: 'transit_expansion', name: 'Public Transit', description: 'Urban transit funding', value: 50, minValue: 20, maxValue: 100, category: 'funding' },
        { id: 'infrastructure_emergency', name: 'Emergency Repairs', description: 'Rapid infrastructure response', value: 55, minValue: 20, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'road_quality', name: 'Infrastructure Quality', value: 60, baseline: 60, target: 85, trend: 'declining', sensitivity: 0.5 },
        { id: 'traffic_fatalities', name: 'Traffic Safety', value: 65, baseline: 65, target: 90, trend: 'stable', sensitivity: 0.6 },
        { id: 'congestion', name: 'Traffic Flow', value: 55, baseline: 55, target: 75, trend: 'declining', sensitivity: 0.4 },
      ],
      mandatoryPrograms: [
        { id: 'highway_trust', name: 'Highway Trust Fund', annualCost: 10, growthRate: 2.0, isLocked: false, politicalCostToReduce: 55, description: 'Gas tax funded road maintenance' },
      ],
      synergies: [
        { partnerId: 'commerce', name: 'Trade Corridors', description: 'Freight and commerce infrastructure', requiredFundingThreshold: 70, bonusMultiplier: 1.2, unlockedBenefits: ['Port efficiency', 'Supply chain speed', 'Export capacity'] },
        { partnerId: 'energy', name: 'Clean Transport', description: 'EV infrastructure and efficiency', requiredFundingThreshold: 65, bonusMultiplier: 1.15, unlockedBenefits: ['EV charging network', 'Fuel efficiency', 'Emissions reduction'] },
        { partnerId: 'homeland', name: 'Transit Security', description: 'Secure transportation networks', requiredFundingThreshold: 65, bonusMultiplier: 1.1, unlockedBenefits: ['Threat detection', 'Resilient systems', 'Rapid recovery'] },
      ],
      crisisCapabilities: ['natural_disaster', 'supply_chain'],
      crisisReadiness: 60,
      researchProgress: 50,
      infrastructureHealth: 55,
      institutionalStrength: 75,
      publicApproval: 55,
      politicalCapital: 5,
    },
    
    energy: {
      name: 'Department of Energy',
      abbreviation: 'DOE',
      mission: 'Advance energy technology and ensure nuclear security',
      description: 'Manages nuclear weapons, national laboratories, and energy research.',
      baselineBudget: 52,
      currentBudget: 52,
      mandatorySpending: 5,
      budgetPercentage: 3.1,
      operationalDomains: ['energy', 'research', 'military'],
      policyLevers: [
        { id: 'nuclear_security', name: 'Nuclear Security', description: 'Weapons complex maintenance', value: 80, minValue: 60, maxValue: 100, category: 'funding' },
        { id: 'clean_energy', name: 'Clean Energy R&D', description: 'Renewable and efficiency research', value: 55, minValue: 20, maxValue: 100, category: 'funding' },
        { id: 'national_labs', name: 'National Laboratories', description: 'Scientific research infrastructure', value: 70, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'grid_security', name: 'Grid Security', description: 'Power grid resilience', value: 60, minValue: 30, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'nuclear_readiness', name: 'Nuclear Deterrent', value: 90, baseline: 90, target: 98, trend: 'stable', sensitivity: 0.9 },
        { id: 'energy_innovation', name: 'Energy Innovation', value: 70, baseline: 70, target: 90, trend: 'improving', sensitivity: 0.5 },
        { id: 'grid_reliability', name: 'Grid Reliability', value: 75, baseline: 75, target: 95, trend: 'stable', sensitivity: 0.7 },
      ],
      mandatoryPrograms: [],
      synergies: [
        { partnerId: 'defense', name: 'Advanced Weapons R&D', description: 'Military-energy technology', requiredFundingThreshold: 80, bonusMultiplier: 1.25, unlockedBenefits: ['Hypersonics', 'Directed energy', 'Nuclear modernization'] },
        { partnerId: 'interior', name: 'Resource Management', description: 'Energy-land coordination', requiredFundingThreshold: 60, bonusMultiplier: 1.1, unlockedBenefits: ['Drilling efficiency', 'Renewables siting', 'Grid expansion'] },
        { partnerId: 'transportation', name: 'Clean Transport', description: 'Vehicle electrification', requiredFundingThreshold: 65, bonusMultiplier: 1.15, unlockedBenefits: ['Battery tech', 'Charging infrastructure', 'Fuel alternatives'] },
      ],
      crisisCapabilities: ['cyber_attack', 'natural_disaster'],
      crisisReadiness: 70,
      researchProgress: 80,
      infrastructureHealth: 70,
      institutionalStrength: 85,
      publicApproval: 50,
      politicalCapital: 0,
    },
    
    commerce: {
      name: 'Department of Commerce',
      abbreviation: 'DOC',
      mission: 'Promote economic growth, job creation, and sustainable development',
      description: 'Manages trade, census, patents, weather service, and economic data.',
      baselineBudget: 12,
      currentBudget: 12,
      mandatorySpending: 2,
      budgetPercentage: 0.7,
      operationalDomains: ['economy', 'trade', 'research'],
      policyLevers: [
        { id: 'trade_promotion', name: 'Trade Promotion', description: 'Export assistance and trade deals', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'patent_system', name: 'Patent System', description: 'USPTO efficiency and protection', value: 65, minValue: 40, maxValue: 100, category: 'reform' },
        { id: 'weather_service', name: 'Weather Forecasting', description: 'NOAA capabilities', value: 70, minValue: 50, maxValue: 100, category: 'funding' },
        { id: 'export_controls', name: 'Export Controls', description: 'Technology transfer restrictions', value: 55, minValue: 20, maxValue: 100, category: 'oversight' },
      ],
      performanceMetrics: [
        { id: 'trade_balance', name: 'Trade Performance', value: 45, baseline: 45, target: 60, trend: 'stable', sensitivity: 0.4 },
        { id: 'patent_processing', name: 'Innovation Protection', value: 70, baseline: 70, target: 90, trend: 'improving', sensitivity: 0.5 },
        { id: 'forecast_accuracy', name: 'Weather Accuracy', value: 85, baseline: 85, target: 95, trend: 'improving', sensitivity: 0.6 },
      ],
      mandatoryPrograms: [],
      synergies: [
        { partnerId: 'state', name: 'Trade Diplomacy', description: 'Commercial diplomacy integration', requiredFundingThreshold: 65, bonusMultiplier: 1.2, unlockedBenefits: ['Trade agreements', 'Market access', 'Sanctions coordination'] },
        { partnerId: 'transportation', name: 'Trade Corridors', description: 'Logistics and commerce', requiredFundingThreshold: 70, bonusMultiplier: 1.2, unlockedBenefits: ['Port efficiency', 'Supply chains', 'Export capacity'] },
        { partnerId: 'treasury', name: 'Economic Policy', description: 'Fiscal-commercial alignment', requiredFundingThreshold: 60, bonusMultiplier: 1.15, unlockedBenefits: ['Currency policy', 'Investment incentives', 'Tax optimization'] },
      ],
      crisisCapabilities: ['financial_crash', 'supply_chain'],
      crisisReadiness: 50,
      researchProgress: 55,
      infrastructureHealth: 60,
      institutionalStrength: 70,
      publicApproval: 45,
      politicalCapital: -5,
    },
    
    interior: {
      name: 'Department of the Interior',
      abbreviation: 'DOI',
      mission: 'Conserve and manage natural resources and cultural heritage',
      description: 'Manages federal lands, national parks, wildlife, and tribal affairs.',
      baselineBudget: 18,
      currentBudget: 18,
      mandatorySpending: 15,
      budgetPercentage: 1.1,
      operationalDomains: ['environment', 'energy'],
      policyLevers: [
        { id: 'park_maintenance', name: 'Park Maintenance', description: 'National park upkeep', value: 55, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'resource_extraction', name: 'Resource Leasing', description: 'Oil, gas, mining permits', value: 50, minValue: 10, maxValue: 100, category: 'reform' },
        { id: 'tribal_programs', name: 'Tribal Programs', description: 'Bureau of Indian Affairs', value: 60, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'wildfire_response', name: 'Wildfire Response', description: 'Fire suppression capability', value: 65, minValue: 30, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'land_health', name: 'Land Conservation', value: 70, baseline: 70, target: 85, trend: 'stable', sensitivity: 0.4 },
        { id: 'park_access', name: 'Park Accessibility', value: 75, baseline: 75, target: 90, trend: 'stable', sensitivity: 0.5 },
        { id: 'resource_revenue', name: 'Resource Revenue', value: 60, baseline: 60, target: 75, trend: 'declining', sensitivity: 0.6 },
      ],
      mandatoryPrograms: [
        { id: 'tribal_trust', name: 'Tribal Trust', annualCost: 12, growthRate: 2.0, isLocked: true, politicalCostToReduce: 80, description: 'Trust obligations to tribes' },
      ],
      synergies: [
        { partnerId: 'energy', name: 'Resource Management', description: 'Energy-land coordination', requiredFundingThreshold: 60, bonusMultiplier: 1.1, unlockedBenefits: ['Balanced extraction', 'Renewables expansion', 'Revenue sharing'] },
        { partnerId: 'agriculture', name: 'Rural Stewardship', description: 'Land and agriculture coordination', requiredFundingThreshold: 55, bonusMultiplier: 1.1, unlockedBenefits: ['Grazing management', 'Water rights', 'Conservation'] },
      ],
      crisisCapabilities: ['natural_disaster'],
      crisisReadiness: 60,
      researchProgress: 40,
      infrastructureHealth: 50,
      institutionalStrength: 65,
      publicApproval: 60,
      politicalCapital: 5,
    },
    
    justice: {
      name: 'Department of Justice',
      abbreviation: 'DOJ',
      mission: 'Enforce the law and ensure public safety against threats',
      description: 'Oversees FBI, DEA, ATF, federal prosecutors, and prisons.',
      baselineBudget: 40,
      currentBudget: 40,
      mandatorySpending: 8,
      budgetPercentage: 2.4,
      operationalDomains: ['justice', 'intelligence'],
      policyLevers: [
        { id: 'law_enforcement', name: 'Law Enforcement', description: 'FBI and federal policing', value: 70, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'prosecution', name: 'Prosecution', description: 'US Attorney resources', value: 65, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'prison_system', name: 'Corrections', description: 'Federal prison operations', value: 55, minValue: 30, maxValue: 100, category: 'oversight' },
        { id: 'civil_rights', name: 'Civil Rights Enforcement', description: 'Civil rights division activity', value: 50, minValue: 20, maxValue: 100, category: 'reform' },
      ],
      performanceMetrics: [
        { id: 'crime_rate', name: 'Crime Reduction', value: 60, baseline: 60, target: 80, trend: 'stable', sensitivity: 0.5 },
        { id: 'conviction_rate', name: 'Prosecution Success', value: 75, baseline: 75, target: 90, trend: 'stable', sensitivity: 0.4 },
        { id: 'recidivism', name: 'Recidivism Prevention', value: 45, baseline: 45, target: 70, trend: 'improving', sensitivity: 0.3 },
      ],
      mandatoryPrograms: [
        { id: 'victim_comp', name: 'Victim Compensation', annualCost: 5, growthRate: 2.0, isLocked: false, politicalCostToReduce: 65, description: 'Crime victim assistance' },
      ],
      synergies: [
        { partnerId: 'homeland', name: 'Law Enforcement Fusion', description: 'Federal law enforcement coordination', requiredFundingThreshold: 70, bonusMultiplier: 1.15, unlockedBenefits: ['Intelligence sharing', 'Joint task forces', 'Unified response'] },
        { partnerId: 'treasury', name: 'Financial Crimes', description: 'Economic crime enforcement', requiredFundingThreshold: 65, bonusMultiplier: 1.2, unlockedBenefits: ['Money laundering', 'Tax evasion', 'Sanctions enforcement'] },
      ],
      crisisCapabilities: ['terrorism', 'civil_unrest'],
      crisisReadiness: 70,
      researchProgress: 35,
      infrastructureHealth: 55,
      institutionalStrength: 80,
      publicApproval: 45,
      politicalCapital: -10,
    },
    
    agriculture: {
      name: 'Department of Agriculture',
      abbreviation: 'USDA',
      mission: 'Provide leadership on food, agriculture, and rural development',
      description: 'Manages farm programs, food safety, nutrition assistance, and forestry.',
      baselineBudget: 28,
      currentBudget: 28,
      mandatorySpending: 155,
      budgetPercentage: 1.6,
      operationalDomains: ['welfare', 'economy', 'environment'],
      policyLevers: [
        { id: 'farm_subsidies', name: 'Farm Support', description: 'Agricultural subsidies', value: 65, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'food_safety', name: 'Food Safety', description: 'Inspection and standards', value: 70, minValue: 50, maxValue: 100, category: 'oversight' },
        { id: 'nutrition_programs', name: 'Nutrition Assistance', description: 'SNAP and school meals', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'rural_development', name: 'Rural Development', description: 'Rural infrastructure and loans', value: 50, minValue: 20, maxValue: 100, category: 'funding' },
      ],
      performanceMetrics: [
        { id: 'food_security', name: 'Food Security', value: 88, baseline: 88, target: 98, trend: 'stable', sensitivity: 0.6 },
        { id: 'farm_income', name: 'Farm Economy', value: 65, baseline: 65, target: 80, trend: 'declining', sensitivity: 0.5 },
        { id: 'food_safety_score', name: 'Food Safety', value: 90, baseline: 90, target: 98, trend: 'stable', sensitivity: 0.7 },
      ],
      mandatoryPrograms: [
        { id: 'snap', name: 'SNAP (Food Stamps)', annualCost: 120, growthRate: 3.0, isLocked: true, politicalCostToReduce: 85, description: 'Supplemental nutrition assistance' },
        { id: 'school_meals', name: 'School Meals', annualCost: 25, growthRate: 2.5, isLocked: true, politicalCostToReduce: 90, description: 'Free and reduced lunch programs' },
      ],
      synergies: [
        { partnerId: 'hhs', name: 'Food Safety Alliance', description: 'Farm-to-table health', requiredFundingThreshold: 60, bonusMultiplier: 1.1, unlockedBenefits: ['Inspection coordination', 'Nutrition policy', 'Disease prevention'] },
        { partnerId: 'interior', name: 'Rural Stewardship', description: 'Land and water management', requiredFundingThreshold: 55, bonusMultiplier: 1.1, unlockedBenefits: ['Conservation programs', 'Grazing policy', 'Water allocation'] },
        { partnerId: 'commerce', name: 'Agricultural Trade', description: 'Export promotion', requiredFundingThreshold: 60, bonusMultiplier: 1.15, unlockedBenefits: ['Export markets', 'Trade agreements', 'Commodity pricing'] },
      ],
      crisisCapabilities: ['natural_disaster', 'supply_chain'],
      crisisReadiness: 55,
      researchProgress: 50,
      infrastructureHealth: 60,
      institutionalStrength: 75,
      publicApproval: 55,
      politicalCapital: 10,
    },
    
    labor: {
      name: 'Department of Labor',
      abbreviation: 'DOL',
      mission: 'Foster, promote, and develop the welfare of working people',
      description: 'Oversees employment standards, job training, workplace safety, and unemployment.',
      baselineBudget: 14,
      currentBudget: 14,
      mandatorySpending: 50,
      budgetPercentage: 0.8,
      operationalDomains: ['labor', 'economy', 'welfare'],
      policyLevers: [
        { id: 'job_training', name: 'Job Training', description: 'Workforce development programs', value: 55, minValue: 20, maxValue: 100, category: 'funding' },
        { id: 'osha_enforcement', name: 'Workplace Safety', description: 'OSHA inspections and standards', value: 60, minValue: 30, maxValue: 100, category: 'oversight' },
        { id: 'wage_enforcement', name: 'Wage Enforcement', description: 'Minimum wage and overtime', value: 55, minValue: 20, maxValue: 100, category: 'oversight' },
        { id: 'unemployment_system', name: 'Unemployment System', description: 'UI modernization', value: 50, minValue: 30, maxValue: 100, category: 'reform' },
      ],
      performanceMetrics: [
        { id: 'unemployment_rate', name: 'Employment Rate', value: 96, baseline: 96, target: 98, trend: 'stable', sensitivity: 0.4 },
        { id: 'workplace_safety', name: 'Workplace Safety', value: 85, baseline: 85, target: 95, trend: 'improving', sensitivity: 0.6 },
        { id: 'wage_growth', name: 'Wage Growth', value: 55, baseline: 55, target: 75, trend: 'stable', sensitivity: 0.3 },
      ],
      mandatoryPrograms: [
        { id: 'unemployment_ins', name: 'Unemployment Insurance', annualCost: 35, growthRate: 2.0, isLocked: true, politicalCostToReduce: 80, description: 'Federal unemployment programs' },
      ],
      synergies: [
        { partnerId: 'education', name: 'Workforce Pipeline', description: 'Education-to-employment', requiredFundingThreshold: 65, bonusMultiplier: 1.25, unlockedBenefits: ['Apprenticeships', 'Credential programs', 'Career pathways'] },
        { partnerId: 'commerce', name: 'Economic Development', description: 'Jobs and business coordination', requiredFundingThreshold: 60, bonusMultiplier: 1.15, unlockedBenefits: ['Regional development', 'Industry partnerships', 'Job creation'] },
      ],
      crisisCapabilities: ['financial_crash'],
      crisisReadiness: 45,
      researchProgress: 35,
      infrastructureHealth: 50,
      institutionalStrength: 65,
      publicApproval: 50,
      politicalCapital: 0,
    },
    
    treasury: {
      name: 'Department of the Treasury',
      abbreviation: 'Treasury',
      mission: 'Maintain a strong economy and promote financial security',
      description: 'Manages federal finances, IRS, economic policy, and sanctions.',
      baselineBudget: 16,
      currentBudget: 16,
      mandatorySpending: 500,
      budgetPercentage: 0.9,
      operationalDomains: ['economy', 'intelligence'],
      policyLevers: [
        { id: 'tax_collection', name: 'Tax Enforcement', description: 'IRS funding and audits', value: 55, minValue: 30, maxValue: 100, category: 'oversight' },
        { id: 'sanctions', name: 'Sanctions Policy', description: 'Economic warfare tools', value: 70, minValue: 30, maxValue: 100, category: 'oversight' },
        { id: 'debt_management', name: 'Debt Management', description: 'Treasury operations', value: 75, minValue: 50, maxValue: 100, category: 'funding' },
        { id: 'financial_stability', name: 'Financial Stability', description: 'Crisis prevention measures', value: 65, minValue: 40, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'revenue_collection', name: 'Revenue Collection', value: 75, baseline: 75, target: 90, trend: 'stable', sensitivity: 0.7 },
        { id: 'debt_cost', name: 'Debt Servicing', value: 60, baseline: 60, target: 80, trend: 'declining', sensitivity: 0.8 },
        { id: 'sanctions_effectiveness', name: 'Sanctions Impact', value: 70, baseline: 70, target: 85, trend: 'stable', sensitivity: 0.5 },
      ],
      mandatoryPrograms: [
        { id: 'interest_payments', name: 'Debt Interest', annualCost: 450, growthRate: 8.0, isLocked: true, politicalCostToReduce: 100, description: 'Interest on national debt' },
      ],
      synergies: [
        { partnerId: 'commerce', name: 'Economic Policy', description: 'Fiscal-commercial coordination', requiredFundingThreshold: 60, bonusMultiplier: 1.15, unlockedBenefits: ['Growth policy', 'Investment incentives', 'Trade finance'] },
        { partnerId: 'justice', name: 'Financial Crimes', description: 'Economic crime enforcement', requiredFundingThreshold: 65, bonusMultiplier: 1.2, unlockedBenefits: ['Tax evasion', 'Money laundering', 'Fraud prevention'] },
        { partnerId: 'state', name: 'Economic Diplomacy', description: 'Financial statecraft', requiredFundingThreshold: 70, bonusMultiplier: 1.2, unlockedBenefits: ['Sanctions coordination', 'Development finance', 'Currency policy'] },
      ],
      crisisCapabilities: ['financial_crash'],
      crisisReadiness: 70,
      researchProgress: 30,
      infrastructureHealth: 65,
      institutionalStrength: 85,
      publicApproval: 35,
      politicalCapital: -20,
    },
    
    state: {
      name: 'Department of State',
      abbreviation: 'State',
      mission: 'Advance freedom for the benefit of the American people',
      description: 'Conducts diplomacy, manages embassies, and coordinates foreign policy.',
      baselineBudget: 60,
      currentBudget: 60,
      mandatorySpending: 5,
      budgetPercentage: 3.5,
      operationalDomains: ['diplomacy', 'intelligence'],
      policyLevers: [
        { id: 'embassy_operations', name: 'Embassy Operations', description: 'Diplomatic presence worldwide', value: 70, minValue: 40, maxValue: 100, category: 'funding' },
        { id: 'foreign_aid', name: 'Foreign Assistance', description: 'Development and security aid', value: 55, minValue: 20, maxValue: 100, category: 'funding' },
        { id: 'public_diplomacy', name: 'Public Diplomacy', description: 'International communications', value: 50, minValue: 20, maxValue: 100, category: 'reform' },
        { id: 'crisis_diplomacy', name: 'Crisis Diplomacy', description: 'Conflict resolution capacity', value: 60, minValue: 30, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'global_influence', name: 'Global Influence', value: 75, baseline: 75, target: 90, trend: 'declining', sensitivity: 0.5 },
        { id: 'alliance_strength', name: 'Alliance Health', value: 70, baseline: 70, target: 85, trend: 'stable', sensitivity: 0.6 },
        { id: 'conflict_prevention', name: 'Conflict Prevention', value: 60, baseline: 60, target: 80, trend: 'stable', sensitivity: 0.4 },
      ],
      mandatoryPrograms: [],
      synergies: [
        { partnerId: 'defense', name: 'Diplomatic-Military Balance', description: 'Smart power integration', requiredFundingThreshold: 75, bonusMultiplier: 1.2, unlockedBenefits: ['Deterrence credibility', 'Coalition building', 'Conflict resolution'] },
        { partnerId: 'commerce', name: 'Trade Diplomacy', description: 'Commercial diplomacy', requiredFundingThreshold: 65, bonusMultiplier: 1.2, unlockedBenefits: ['Trade agreements', 'Market access', 'Economic statecraft'] },
        { partnerId: 'treasury', name: 'Economic Diplomacy', description: 'Financial statecraft', requiredFundingThreshold: 70, bonusMultiplier: 1.2, unlockedBenefits: ['Sanctions policy', 'Development finance', 'Currency coordination'] },
      ],
      crisisCapabilities: ['war', 'terrorism'],
      crisisReadiness: 65,
      researchProgress: 25,
      infrastructureHealth: 60,
      institutionalStrength: 75,
      publicApproval: 40,
      politicalCapital: -15,
    },
    
    hud: {
      name: 'Housing and Urban Development',
      abbreviation: 'HUD',
      mission: 'Create strong, sustainable, inclusive communities',
      description: 'Manages housing programs, mortgage insurance, and community development.',
      baselineBudget: 73,
      currentBudget: 73,
      mandatorySpending: 40,
      budgetPercentage: 4.3,
      operationalDomains: ['housing', 'welfare', 'economy'],
      policyLevers: [
        { id: 'public_housing', name: 'Public Housing', description: 'Public housing maintenance', value: 55, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'vouchers', name: 'Housing Vouchers', description: 'Section 8 assistance', value: 60, minValue: 30, maxValue: 100, category: 'funding' },
        { id: 'fha_programs', name: 'FHA Programs', description: 'Mortgage assistance', value: 65, minValue: 40, maxValue: 100, category: 'reform' },
        { id: 'homelessness', name: 'Homelessness Programs', description: 'Emergency housing', value: 50, minValue: 20, maxValue: 100, category: 'emergency' },
      ],
      performanceMetrics: [
        { id: 'affordability', name: 'Housing Affordability', value: 45, baseline: 45, target: 70, trend: 'declining', sensitivity: 0.4 },
        { id: 'homelessness_rate', name: 'Homelessness Rate', value: 55, baseline: 55, target: 85, trend: 'stable', sensitivity: 0.7 },
        { id: 'homeownership', name: 'Homeownership Rate', value: 65, baseline: 65, target: 75, trend: 'stable', sensitivity: 0.3 },
      ],
      mandatoryPrograms: [
        { id: 'section_8', name: 'Section 8 Vouchers', annualCost: 30, growthRate: 3.5, isLocked: true, politicalCostToReduce: 75, description: 'Rental assistance vouchers' },
      ],
      synergies: [
        { partnerId: 'veterans', name: 'Veteran Housing Initiative', description: 'Veteran homelessness prevention', requiredFundingThreshold: 60, bonusMultiplier: 1.2, unlockedBenefits: ['VASH vouchers', 'Transitional housing', 'Supportive services'] },
        { partnerId: 'transportation', name: 'Urban Development', description: 'Transit-oriented development', requiredFundingThreshold: 65, bonusMultiplier: 1.15, unlockedBenefits: ['Affordable transit', 'Smart growth', 'Job access'] },
      ],
      crisisCapabilities: ['natural_disaster', 'civil_unrest'],
      crisisReadiness: 50,
      researchProgress: 30,
      infrastructureHealth: 45,
      institutionalStrength: 60,
      publicApproval: 40,
      politicalCapital: -10,
    },
  };

  const config = configs[id];
  return {
    id,
    ...config,
    isPlayerControlled: true,
    isInCrisisMode: false,
  };
};

export const ALL_DEPARTMENT_IDS: DepartmentId[] = [
  'defense', 'hhs', 'veterans', 'homeland', 'education',
  'transportation', 'energy', 'commerce', 'interior', 'justice',
  'agriculture', 'labor', 'treasury', 'state', 'hud'
];

export const createInitialDepartments = (): Record<DepartmentId, Department> => {
  const departments: Partial<Record<DepartmentId, Department>> = {};
  for (const id of ALL_DEPARTMENT_IDS) {
    departments[id] = createDepartment(id);
  }
  return departments as Record<DepartmentId, Department>;
};
