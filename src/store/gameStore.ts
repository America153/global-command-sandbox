import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { 
  GameState, 
  Base, 
  Unit, 
  GameLog, 
  PlacementTool, 
  Coordinates, 
  BaseType,
  UnitType,
  TerritoryInfluence,
  BASE_CONFIG,
  UNIT_TEMPLATES
} from '@/types/game';

interface GameStore extends GameState {
  // Actions
  setSpeed: (speed: number) => void;
  selectTool: (tool: PlacementTool | null) => void;
  selectEntity: (id: string | null) => void;
  placeHQ: (position: Coordinates) => void;
  placeBase: (type: BaseType, position: Coordinates) => void;
  produceUnit: (baseId: string, unitType: UnitType) => void;
  moveUnit: (unitId: string, destination: Coordinates) => void;
  addLog: (type: GameLog['type'], message: string, position?: Coordinates) => void;
  runTick: () => void;
  resetGame: () => void;
  addResources: (amount: number) => void;
}

const initialState: GameState = {
  tick: 0,
  speed: 1,
  playerFaction: 'player',
  hq: null,
  bases: [],
  units: [],
  territories: [],
  nations: [],
  logs: [],
  resources: 10000,
  selectedTool: null,
  selectedEntity: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setSpeed: (speed) => set({ speed }),

  selectTool: (tool) => set({ selectedTool: tool, selectedEntity: null }),

  selectEntity: (id) => set({ selectedEntity: id, selectedTool: null }),

  placeHQ: (position) => {
    const state = get();
    if (state.hq) {
      get().addLog('warning', 'HQ already placed. Only one HQ allowed.');
      return;
    }

    const hq: Base = {
      id: uuidv4(),
      name: 'Command Headquarters',
      type: 'hq',
      position,
      faction: 'player',
      health: 1000,
      maxHealth: 1000,
      productionCapacity: 2,
      influenceRadius: 100,
      createdAt: state.tick,
    };

    const territory: TerritoryInfluence = {
      position,
      faction: 'player',
      strength: 100,
      radius: 100,
    };

    set({ 
      hq, 
      bases: [...state.bases, hq],
      territories: [...state.territories, territory],
      selectedTool: null,
    });

    get().addLog('info', `HQ established at ${position.latitude.toFixed(4)}°, ${position.longitude.toFixed(4)}°`, position);
  },

  placeBase: (type, position) => {
    const state = get();
    if (!state.hq) {
      get().addLog('warning', 'Must place HQ first before building bases.');
      return;
    }

    const config = {
      hq: { name: 'Headquarters', cost: 0, influenceRadius: 100, symbol: 'HQ' },
      army: { name: 'Army Base', cost: 500, influenceRadius: 75, symbol: 'ARMY' },
      navy: { name: 'Naval Base', cost: 600, influenceRadius: 100, symbol: 'NAVY' },
      airforce: { name: 'Air Force Base', cost: 700, influenceRadius: 150, symbol: 'AF' },
      intelligence: { name: 'Intelligence Center', cost: 400, influenceRadius: 200, symbol: 'INTEL' },
    }[type];

    if (state.resources < config.cost) {
      get().addLog('warning', `Insufficient resources for ${config.name}. Need ${config.cost}, have ${state.resources}.`);
      return;
    }

    const base: Base = {
      id: uuidv4(),
      name: `${config.name} ${state.bases.filter(b => b.type === type).length + 1}`,
      type,
      position,
      faction: 'player',
      health: 500,
      maxHealth: 500,
      productionCapacity: 1,
      influenceRadius: config.influenceRadius,
      createdAt: state.tick,
    };

    const territory: TerritoryInfluence = {
      position,
      faction: 'player',
      strength: 80,
      radius: config.influenceRadius,
    };

    set({ 
      bases: [...state.bases, base],
      territories: [...state.territories, territory],
      resources: state.resources - config.cost,
      selectedTool: null,
    });

    get().addLog('production', `${config.name} constructed at ${position.latitude.toFixed(4)}°, ${position.longitude.toFixed(4)}°`, position);
  },

  produceUnit: (baseId, unitType) => {
    const state = get();
    const base = state.bases.find(b => b.id === baseId);
    if (!base) return;

    // Simplified unit production
    const templates: Record<string, { name: string; cost: number }> = {
      infantry: { name: 'Infantry Battalion', cost: 100 },
      armor: { name: 'Armored Division', cost: 300 },
      fighter: { name: 'Fighter Squadron', cost: 400 },
      destroyer: { name: 'Destroyer', cost: 400 },
    };

    const template = templates[unitType];
    if (!template) return;

    if (state.resources < template.cost) {
      get().addLog('warning', `Insufficient resources for ${template.name}.`);
      return;
    }

    const unit: Unit = {
      id: uuidv4(),
      templateType: unitType,
      name: `${template.name} ${state.units.filter(u => u.templateType === unitType).length + 1}`,
      position: { ...base.position },
      faction: 'player',
      health: 100,
      maxHealth: 100,
      status: 'idle',
      parentBaseId: baseId,
      createdAt: state.tick,
    };

    set({
      units: [...state.units, unit],
      resources: state.resources - template.cost,
    });

    get().addLog('production', `${unit.name} produced at ${base.name}`, base.position);
  },

  moveUnit: (unitId, destination) => {
    set((state) => ({
      units: state.units.map(u => 
        u.id === unitId 
          ? { ...u, destination, status: 'moving' as const }
          : u
      ),
    }));
  },

  addLog: (type, message, position) => {
    const log: GameLog = {
      id: uuidv4(),
      timestamp: get().tick,
      type,
      message,
      position,
    };
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 100), // Keep last 100 logs
    }));
  },

  runTick: () => {
    const state = get();
    if (state.speed === 0) return;

    // Generate passive income from HQ
    const incomePerTick = state.hq ? 10 * state.speed : 0;

    // Move units toward destinations
    const updatedUnits = state.units.map(unit => {
      if (unit.status === 'moving' && unit.destination) {
        const dx = unit.destination.longitude - unit.position.longitude;
        const dy = unit.destination.latitude - unit.position.latitude;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.01) {
          return { ...unit, status: 'idle' as const, destination: undefined };
        }

        const speed = 0.01 * state.speed; // Simplified movement
        const ratio = Math.min(speed / distance, 1);
        
        return {
          ...unit,
          position: {
            latitude: unit.position.latitude + dy * ratio,
            longitude: unit.position.longitude + dx * ratio,
          },
        };
      }
      return unit;
    });

    set({
      tick: state.tick + 1,
      resources: state.resources + incomePerTick,
      units: updatedUnits,
    });
  },

  resetGame: () => set({ ...initialState }),

  addResources: (amount) => set((state) => ({ resources: state.resources + amount })),
}));
