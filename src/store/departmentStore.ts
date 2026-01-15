// Department State Management Store

import { create } from 'zustand';
import type { 
  DepartmentId, 
  DepartmentState, 
  Department,
  GameDifficulty,
  CrisisType,
  PolicyDecision
} from '@/types/departments';
import { 
  createInitialDepartments, 
  INITIAL_NATIONAL_METRICS,
  ALL_DEPARTMENT_IDS 
} from '@/data/departments';
import { 
  simulateYear, 
  evaluateSynergies, 
  applyCrisisImpact,
  calculateBudgetTradeoffs
} from '@/engine/departmentSimulation';

interface DepartmentStore extends DepartmentState {
  // Actions
  initializeGame: (difficulty: GameDifficulty) => void;
  setDepartmentBudget: (id: DepartmentId, amount: number) => void;
  adjustPolicyLever: (id: DepartmentId, leverId: string, value: number) => void;
  advanceYear: () => void;
  triggerCrisis: (crisis: CrisisType) => void;
  resolveCrisis: (crisis: CrisisType) => void;
  
  // Computed
  getTotalDiscretionary: () => number;
  getTotalMandatory: () => number;
  getBudgetDeficit: () => number;
  getActiveSynergiesCount: () => number;
}

export const useDepartmentStore = create<DepartmentStore>((set, get) => ({
  departments: createInitialDepartments(),
  nationalMetrics: INITIAL_NATIONAL_METRICS,
  currentYear: 2025,
  difficulty: 'normal',
  activeCrises: [],
  activeSynergies: [],
  yearHistory: [],

  initializeGame: (difficulty) => {
    const departments = createInitialDepartments();
    set({
      departments,
      nationalMetrics: INITIAL_NATIONAL_METRICS,
      currentYear: 2025,
      difficulty,
      activeCrises: [],
      activeSynergies: [],
      yearHistory: [],
    });
  },

  setDepartmentBudget: (id, amount) => {
    set((state) => ({
      departments: {
        ...state.departments,
        [id]: {
          ...state.departments[id],
          currentBudget: Math.max(0, amount),
        },
      },
    }));
  },

  adjustPolicyLever: (id, leverId, value) => {
    set((state) => {
      const dept = state.departments[id];
      const updatedLevers = dept.policyLevers.map((lever) =>
        lever.id === leverId
          ? { ...lever, value: Math.max(lever.minValue, Math.min(lever.maxValue, value)) }
          : lever
      );
      return {
        departments: {
          ...state.departments,
          [id]: { ...dept, policyLevers: updatedLevers },
        },
      };
    });
  },

  advanceYear: () => {
    set((state) => {
      const newState = simulateYear(state);
      return {
        ...newState,
        yearHistory: [
          ...state.yearHistory,
          {
            year: state.currentYear,
            nationalMetrics: state.nationalMetrics,
            departmentBudgets: Object.fromEntries(
              ALL_DEPARTMENT_IDS.map((id) => [id, state.departments[id].currentBudget])
            ) as Record<DepartmentId, number>,
            events: [],
          },
        ],
      };
    });
  },

  triggerCrisis: (crisis) => {
    set((state) => applyCrisisImpact(state, crisis));
  },

  resolveCrisis: (crisis) => {
    set((state) => ({
      activeCrises: state.activeCrises.filter((c) => c !== crisis),
      departments: Object.fromEntries(
        Object.entries(state.departments).map(([id, dept]) => [
          id,
          { ...dept, isInCrisisMode: false },
        ])
      ) as Record<DepartmentId, Department>,
    }));
  },

  getTotalDiscretionary: () => {
    const { departments } = get();
    return Object.values(departments).reduce((sum, d) => sum + d.currentBudget, 0);
  },

  getTotalMandatory: () => {
    const { departments } = get();
    return Object.values(departments).reduce((sum, d) => sum + d.mandatorySpending, 0);
  },

  getBudgetDeficit: () => {
    const state = get();
    const total = state.getTotalDiscretionary() + state.getTotalMandatory();
    return total - state.nationalMetrics.totalBudget;
  },

  getActiveSynergiesCount: () => get().activeSynergies.length,
}));
