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
  MissileType
} from '@/types/game';
import { BASE_CONFIG, UNIT_TEMPLATES, MISSILE_TEMPLATES } from '@/types/game';
import { findCountryAtPosition } from '@/data/countries';
import { getNextPosition } from '@/engine/terrain';
import { 
  AIEnemyState, 
  ENEMY_NATION, 
  checkMissileStrikes,
  calculateAIReaction,
  hasIntelligenceCapability,
  getVisibleEnemyEntities
} from '@/engine/aiEnemy';
import { generateCountryDefenses, getCountryPower } from '@/engine/countryDefenders';
import { processCombatTick } from '@/engine/combat';
import { 
  type DiplomacyState, 
  type NationRelation,
  createNationRelation, 
  modifyOpinion, 
  getOpinionChange,
  getNationsAtWar 
} from '@/engine/diplomacy';
import { processRetaliation } from '@/engine/retaliation';

interface DeploymentState {
  isActive: boolean;
  selectedUnitIds: string[];
}

interface MissileTargetingState {
  isActive: boolean;
  baseId: string | null;
  missileType: MissileType | null;
  targetPosition: Coordinates | null;
}

interface MissileInFlight {
  id: string;
  startPosition: Coordinates;
  targetPosition: Coordinates;
  missileType: MissileType;
  launchTick: number;
  arrivalTick: number;
}

interface Explosion {
  id: string;
  position: Coordinates;
  startTick: number;
  duration: number; // ticks
}

// Initialize enemy state - now empty, enemies spawn dynamically when countries are invaded
const initialAIEnemyState: AIEnemyState = {
  nation: ENEMY_NATION,
  bases: [],
  units: [],
  alertLevel: 'peace',
  revealedBases: [],
  lastReactionTick: 0,
};

// Initialize diplomacy state
const initialDiplomacyState: DiplomacyState = {
  relations: {},
};

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
  struckCountryIds: string[];
  // Missile targeting
  missileTargeting: MissileTargetingState;
  startMissileTargeting: (baseId: string, missileType: MissileType) => void;
  cancelMissileTargeting: () => void;
  fireMissile: (targetPosition: Coordinates) => void;
  missilesInFlight: MissileInFlight[];
  explosions: Explosion[];
  // AI Enemy system
  aiEnemy: AIEnemyState;
  getVisibleEnemyBases: () => Base[];
  getVisibleEnemyUnits: () => Unit[];
  // Diplomacy system
  diplomacy: DiplomacyState;
  lastRetaliationTick: number;
}

const initialState: GameState & { 
  selectedBase: Base | null; 
  deployment: DeploymentState; 
  homeCountryId: string | null; 
  occupiedCountryIds: string[];
  struckCountryIds: string[];
  missileTargeting: MissileTargetingState;
  missilesInFlight: MissileInFlight[];
  explosions: Explosion[];
  aiEnemy: AIEnemyState;
  diplomacy: DiplomacyState;
  lastRetaliationTick: number;
} = {
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
  struckCountryIds: [],
  missileTargeting: {
    isActive: false,
    baseId: null,
    missileType: null,
    targetPosition: null,
  },
  missilesInFlight: [],
  explosions: [],
  aiEnemy: initialAIEnemyState,
  diplomacy: initialDiplomacyState,
  lastRetaliationTick: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  // AI Enemy visibility helpers
  getVisibleEnemyBases: () => {
    const state = get();
    const playerHasIntel = hasIntelligenceCapability(state.bases);
    const { visibleBases } = getVisibleEnemyEntities(
      state.aiEnemy.bases,
      state.aiEnemy.units,
      state.aiEnemy.revealedBases,
      playerHasIntel
    );
    return visibleBases;
  },

  getVisibleEnemyUnits: () => {
    const state = get();
    const playerHasIntel = hasIntelligenceCapability(state.bases);
    const { visibleUnits } = getVisibleEnemyEntities(
      state.aiEnemy.bases,
      state.aiEnemy.units,
      state.aiEnemy.revealedBases,
      playerHasIntel
    );
    return visibleUnits;
  },

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
      missile: { name: 'Missile Silo', cost: 800, influenceRadius: 50, symbol: 'MSL' },
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

  startMissileTargeting: (baseId, missileType) => {
    set({
      missileTargeting: { isActive: true, baseId, missileType, targetPosition: null },
      selectedTool: null,
    });
  },

  cancelMissileTargeting: () => {
    set({
      missileTargeting: { isActive: false, baseId: null, missileType: null, targetPosition: null },
    });
    get().addLog('info', 'Missile targeting cancelled');
  },

  fireMissile: (targetPosition) => {
    const state = get();
    const { missileTargeting, bases } = state;
    
    if (!missileTargeting.isActive || !missileTargeting.baseId || !missileTargeting.missileType) {
      return;
    }

    const base = bases.find(b => b.id === missileTargeting.baseId);
    if (!base) return;

    const template = MISSILE_TEMPLATES[missileTargeting.missileType];
    if (state.resources < template.cost) {
      get().addLog('warning', `Insufficient resources for ${template.name}`);
      return;
    }

    // Find target country
    const targetCountry = findCountryAtPosition(targetPosition.latitude, targetPosition.longitude);
    
    // Create missile in flight
    const missile: MissileInFlight = {
      id: uuidv4(),
      startPosition: base.position,
      targetPosition,
      missileType: missileTargeting.missileType,
      launchTick: state.tick,
      arrivalTick: state.tick + template.flightTime * 10, // Convert to ticks
    };

    // Immediately mark country as struck (red)
    const newStruckCountries = [...state.struckCountryIds];
    if (targetCountry && !newStruckCountries.includes(targetCountry.id)) {
      newStruckCountries.push(targetCountry.id);
    }

    set({
      resources: state.resources - template.cost,
      missilesInFlight: [...state.missilesInFlight, missile],
      struckCountryIds: newStruckCountries,
      missileTargeting: { isActive: false, baseId: null, missileType: null, targetPosition: null },
      selectedBase: null,
    });

    const countryName = targetCountry ? targetCountry.name : 'target location';
    get().addLog('combat', `🚀 ${template.name} launched at ${countryName}!`, targetPosition);
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

        // Get unit domain from template for terrain-aware movement
        const template = UNIT_TEMPLATES[unit.templateType];
        const domain = template?.domain || 'land';
        
        // Calculate next position with terrain awareness
        const { position: newPosition, blocked } = getNextPosition(
          unit.position,
          unit.destination,
          domain,
          0.01 * state.speed
        );
        
        if (blocked) {
          // Unit is blocked by terrain - log once and keep trying
          return unit; // Stay in place
        }
        
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

    // Process missiles - check for arrivals
    const currentTick = state.tick + 1;
    const arrivedMissiles = state.missilesInFlight.filter(m => currentTick >= m.arrivalTick);
    const remainingMissiles = state.missilesInFlight.filter(m => currentTick < m.arrivalTick);
    
    // Create explosions for arrived missiles
    const newExplosions = arrivedMissiles.map(missile => ({
      id: uuidv4(),
      position: missile.targetPosition,
      startTick: currentTick,
      duration: 30, // 30 ticks (~3 seconds at normal speed)
    }));

    // Log missile impacts
    arrivedMissiles.forEach(missile => {
      const country = findCountryAtPosition(missile.targetPosition.latitude, missile.targetPosition.longitude);
      const locationName = country ? country.name : 'target';
      get().addLog('combat', `💥 Missile impact at ${locationName}!`, missile.targetPosition);
    });

    // Clean up old explosions
    const activeExplosions = [...state.explosions, ...newExplosions].filter(
      exp => currentTick - exp.startTick < exp.duration
    );

    // === DYNAMIC COUNTRY DEFENSE SPAWNING ===
    // When player units enter a NEW country, spawn defenders for that country
    let updatedAIEnemy = { ...state.aiEnemy };
    const invadedCountryIds = new Set<string>();

    // Find all countries player units are currently in (that aren't home)
    for (const unit of updatedUnits) {
      if (unit.faction !== 'player') continue;
      const country = findCountryAtPosition(unit.position.latitude, unit.position.longitude);
      if (country && country.id !== state.homeCountryId) {
        invadedCountryIds.add(country.id);
      }
    }

    // Spawn defenders for newly invaded countries (not already in occupiedCountryIds)
    for (const countryId of invadedCountryIds) {
      // Check if we already spawned defenders for this country
      const alreadyHasDefenders = updatedAIEnemy.bases.some(
        (b) => b.id.startsWith(`defender-${countryId}-`)
      );
      
      if (!alreadyHasDefenders && !state.occupiedCountryIds.includes(countryId)) {
        // Find the country info and a unit position to spawn near
        const invadingUnit = updatedUnits.find((u) => {
          if (u.faction !== 'player') return false;
          const c = findCountryAtPosition(u.position.latitude, u.position.longitude);
          return c?.id === countryId;
        });

        if (invadingUnit) {
          const country = findCountryAtPosition(
            invadingUnit.position.latitude,
            invadingUnit.position.longitude
          );
          if (country) {
            const { bases: newBases, units: newUnits } = generateCountryDefenses(
              countryId,
              country.name,
              invadingUnit.position,
              currentTick
            );

            // Add new defenders
            updatedAIEnemy = {
              ...updatedAIEnemy,
              bases: [...updatedAIEnemy.bases, ...newBases],
              units: [...updatedAIEnemy.units, ...newUnits],
              // Immediately reveal these bases since we're invading
              revealedBases: [...updatedAIEnemy.revealedBases, ...newBases.map((b) => b.id)],
            };

            // Log the encounter
            const power = getCountryPower(countryId);
            const powerDesc = power >= 4 ? 'MAJOR' : power >= 2 ? 'MODERATE' : 'LIGHT';
            get().addLog(
              'combat',
              `⚠️ ${country.name} DEFENDERS DETECTED! ${powerDesc} resistance - ${newBases.length} bases, ${newUnits.length} units!`,
              invadingUnit.position
            );

            // Increase alert level
            if (updatedAIEnemy.alertLevel === 'peace') {
              updatedAIEnemy = { ...updatedAIEnemy, alertLevel: 'vigilant' };
            } else if (updatedAIEnemy.alertLevel === 'vigilant') {
              updatedAIEnemy = { ...updatedAIEnemy, alertLevel: 'hostile' };
            }
          }
        }
      }
    }

    // Check for missile strikes on enemy bases
    const explosionPositions = newExplosions.map((e) => e.position);
    const struckBases = checkMissileStrikes(explosionPositions, updatedAIEnemy.bases);

    // Also spawn defenders for missile strike locations
    for (const missile of arrivedMissiles) {
      const country = findCountryAtPosition(
        missile.targetPosition.latitude,
        missile.targetPosition.longitude
      );
      if (country && country.id !== state.homeCountryId) {
        const alreadyHasDefenders = updatedAIEnemy.bases.some(
          (b) => b.id.startsWith(`defender-${country.id}-`)
        );

        if (!alreadyHasDefenders) {
          const { bases: newBases, units: newUnits } = generateCountryDefenses(
            country.id,
            country.name,
            missile.targetPosition,
            currentTick
          );

          updatedAIEnemy = {
            ...updatedAIEnemy,
            bases: [...updatedAIEnemy.bases, ...newBases],
            units: [...updatedAIEnemy.units, ...newUnits],
            revealedBases: [...updatedAIEnemy.revealedBases, ...newBases.map((b) => b.id)],
            alertLevel: 'war',
          };

          const power = getCountryPower(country.id);
          const powerDesc = power >= 4 ? 'MAJOR' : power >= 2 ? 'MODERATE' : 'LIGHT';
          get().addLog(
            'intel',
            `☢️ ${country.name} MOBILIZING! ${powerDesc} military response - ${newBases.length} bases, ${newUnits.length} units detected!`,
            missile.targetPosition
          );
        }
      }
    }

    // Damage enemy bases struck by missiles
    if (struckBases.length > 0) {
      updatedAIEnemy = {
        ...updatedAIEnemy,
        bases: updatedAIEnemy.bases
          .map((base) => {
            if (struckBases.find((s) => s.id === base.id)) {
              const newHealth = Math.max(0, base.health - 200);
              if (newHealth === 0) {
                get().addLog('combat', `🔥 Enemy ${base.name} destroyed!`, base.position);
              }
              return { ...base, health: newHealth };
            }
            return base;
          })
          .filter((base) => base.health > 0),
      };
    }

    // === COMBAT SYSTEM ===
    const playerUnits = updatedUnits.filter(u => u.faction === 'player');
    const combatResult = processCombatTick(
      playerUnits,
      state.bases,
      updatedAIEnemy.units,
      updatedAIEnemy.bases
    );

    // Log combat events
    combatResult.combatLogs.forEach(log => get().addLog('combat', log));

    // Update diplomacy for invaded countries
    let updatedDiplomacy = { ...state.diplomacy };
    for (const countryId of invadedCountryIds) {
      if (!updatedDiplomacy.relations[countryId]) {
        const country = findCountryAtPosition(0, 0); // Get country name from existing data
        updatedDiplomacy.relations[countryId] = createNationRelation(countryId, `Nation ${countryId}`);
      }
      const result = modifyOpinion(
        updatedDiplomacy.relations[countryId],
        getOpinionChange('border_violation'),
        'border violation'
      );
      updatedDiplomacy.relations[countryId] = result.relation;
    }

    // === ENEMY RETALIATION ===
    const nationsAtWar = getNationsAtWar(updatedDiplomacy.relations);
    const isAtWar = nationsAtWar.length > 0 || updatedAIEnemy.alertLevel === 'war';
    let retaliationTick = state.lastRetaliationTick;

    if (isAtWar) {
      const retaliation = processRetaliation(
        combatResult.updatedEnemyUnits,
        combatResult.updatedEnemyBases,
        combatResult.updatedPlayerUnits,
        combatResult.updatedPlayerBases,
        'war',
        updatedAIEnemy.alertLevel,
        currentTick - state.lastRetaliationTick,
        currentTick
      );

      // Apply retaliation movements
      if (retaliation.movedUnits.length > 0 || retaliation.reinforcements.length > 0) {
        retaliationTick = currentTick;
        retaliation.logs.forEach(log => get().addLog('intel', log));
      }

      updatedAIEnemy = {
        ...updatedAIEnemy,
        units: [
          ...combatResult.updatedEnemyUnits.map(u => {
            const moved = retaliation.movedUnits.find(m => m.id === u.id);
            return moved || u;
          }),
          ...retaliation.reinforcements,
        ],
        bases: combatResult.updatedEnemyBases,
      };
    } else {
      updatedAIEnemy = {
        ...updatedAIEnemy,
        units: combatResult.updatedEnemyUnits,
        bases: combatResult.updatedEnemyBases,
      };
    }

    set({
      tick: currentTick,
      resources: state.resources + incomePerTick,
      units: combatResult.updatedPlayerUnits,
      bases: combatResult.updatedPlayerBases,
      occupiedCountryIds: Array.from(newOccupiedCountries),
      missilesInFlight: remainingMissiles,
      explosions: activeExplosions,
      aiEnemy: updatedAIEnemy,
      diplomacy: updatedDiplomacy,
      lastRetaliationTick: retaliationTick,
    });
  },

  resetGame: () => set({ ...initialState }),

  addResources: (amount) => set((state) => ({ resources: state.resources + amount })),
}));
