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
  TerritoryInfluence
} from '@/types/game';
import { BASE_CONFIG, UNIT_TEMPLATES } from '@/types/game';
import { findCountryAtPosition, COUNTRIES } from '@/data/countries';

interface DeploymentState {
  isActive: boolean;
  selectedUnitIds: string[];
}

interface GameStore extends GameState {
  // Actions
  setSpeed: (speed: number) => void;
  selectTool: (tool: PlacementTool | null) => void;
  selectEntity: (id: string | null) => void;
  selectBase: (base: Base | null) => void;
  placeHQ: (position: Coordinates) => void;
  placeBase: (type: BaseType, position: Coordinates) => void;
  produceUnit: (baseId: string, unitType: UnitType) => void;
  moveUnit: (unitId: string, destination: Coordinates) => void;
  deployUnits: (unitIds: string[], destination: Coordinates) => void;
  addLog: (type: GameLog['type'], message: string, position?: Coordinates) => void;
  runTick: () => void;
  resetGame: () => void;
  addResources: (amount: number) => void;
  selectedBase: Base | null;
  // Deployment mode
  deployment: DeploymentState;
  startDeployment: (unitIds: string[]) => void;
  cancelDeployment: () => void;
  // Country control
  homeCountryId: string | null;
  occupiedCountryIds: string[];
}

const initialState: GameState & { selectedBase: Base | null; deployment: DeploymentState; homeCountryId: string | null; occupiedCountryIds: string[] } = {
  tick: 0,
  speed: 1,
  playerFaction: 'player',
  hq: null,
  bases: [],
  units: [],
  territories: [],
  nations: [],
  logs: [],
  resources: 1000000000000,
  selectedTool: null,
  selectedEntity: null,
  selectedBase: null,
  deployment: {
    isActive: false,
    selectedUnitIds: [],
  },
  homeCountryId: null,
  occupiedCountryIds: [],
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setSpeed: (speed) => set({ speed }),

  selectTool: (tool) => set({ selectedTool: tool, selectedEntity: null, selectedBase: null }),

  selectEntity: (id) => set({ selectedEntity: id, selectedTool: null }),

  selectBase: (base) => set({ selectedBase: base, selectedTool: null }),

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

    // Find which country HQ is in
    const homeCountry = findCountryAtPosition(position.latitude, position.longitude);

    set({ 
      hq, 
      bases: [...state.bases, hq],
      territories: [...state.territories, territory],
      selectedTool: null,
      homeCountryId: homeCountry?.id || null,
    });

    const countryName = homeCountry ? ` in ${homeCountry.name}` : '';
    get().addLog('info', `HQ established${countryName} at ${position.latitude.toFixed(4)}°, ${position.longitude.toFixed(4)}°`, position);
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

    // Get template from UNIT_TEMPLATES
    const template = UNIT_TEMPLATES[unitType];
    if (!template) {
      get().addLog('warning', `Unknown unit type: ${unitType}`);
      return;
    }

    if (state.resources < template.cost) {
      get().addLog('warning', `Insufficient resources for ${template.name}.`);
      return;
    }

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
          ? { ...u, destination, status: 'moving' as const, parentBaseId: undefined }
          : u
      ),
    }));
  },

  deployUnits: (unitIds, destination) => {
    const state = get();
    const unitsToMove = state.units.filter(u => unitIds.includes(u.id));
    
    if (unitsToMove.length === 0) return;

    set({
      units: state.units.map(u => 
        unitIds.includes(u.id)
          ? { ...u, destination, status: 'moving' as const, parentBaseId: undefined }
          : u
      ),
      deployment: { isActive: false, selectedUnitIds: [] },
      selectedBase: null,
    });

    get().addLog('movement', `Deploying ${unitsToMove.length} units to ${destination.latitude.toFixed(4)}°, ${destination.longitude.toFixed(4)}°`, destination);
  },

  startDeployment: (unitIds) => {
    set({
      deployment: { isActive: true, selectedUnitIds: unitIds },
      selectedBase: null,
      selectedTool: null,
    });
    get().addLog('info', `Select destination on globe to deploy ${unitIds.length} units`);
  },

  cancelDeployment: () => {
    set({
      deployment: { isActive: false, selectedUnitIds: [] },
    });
    get().addLog('info', 'Deployment cancelled');
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

    // Move units toward destinations and track country occupation
    const newOccupiedCountries = new Set(state.occupiedCountryIds);
    
    const updatedUnits = state.units.map(unit => {
      if (unit.status === 'moving' && unit.destination) {
        const dx = unit.destination.longitude - unit.position.longitude;
        const dy = unit.destination.latitude - unit.position.latitude;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 0.01) {
          // Unit arrived - check if it entered a new country
          const country = findCountryAtPosition(unit.position.latitude, unit.position.longitude);
          if (country && country.id !== state.homeCountryId && !state.occupiedCountryIds.includes(country.id)) {
            newOccupiedCountries.add(country.id);
            get().addLog('combat', `Forces entered ${country.name}!`, unit.position);
          }
          return { ...unit, status: 'idle' as const, destination: undefined };
        }

        const speed = 0.01 * state.speed; // Simplified movement
        const ratio = Math.min(speed / distance, 1);
        
        const newPosition = {
          latitude: unit.position.latitude + dy * ratio,
          longitude: unit.position.longitude + dx * ratio,
        };
        
        // Check if unit crossed into new country during movement
        const country = findCountryAtPosition(newPosition.latitude, newPosition.longitude);
        if (country && country.id !== state.homeCountryId && !state.occupiedCountryIds.includes(country.id)) {
          newOccupiedCountries.add(country.id);
          get().addLog('combat', `Forces entered ${country.name}!`, newPosition);
        }
        
        return {
          ...unit,
          position: newPosition,
        };
      }
      return unit;
    });

    set({
      tick: state.tick + 1,
      resources: state.resources + incomePerTick,
      units: updatedUnits,
      occupiedCountryIds: Array.from(newOccupiedCountries),
    });
  },

  resetGame: () => set({ ...initialState }),

  addResources: (amount) => set((state) => ({ resources: state.resources + amount })),
}));
