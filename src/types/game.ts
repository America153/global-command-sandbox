// Core game types for Global Battlespace Sandbox

export type Faction = 'player' | 'ai' | 'neutral';
export type Affiliation = 'friendly' | 'hostile' | 'neutral' | 'unknown';

export interface Coordinates {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export type BaseType = 'hq' | 'army' | 'navy' | 'airforce' | 'intelligence' | 'missile';

export type MissileType = 'tactical' | 'cruise' | 'icbm';

export interface MissileTemplate {
  type: MissileType;
  name: string;
  range: number; // km
  damage: number;
  cost: number;
  flightTime: number; // seconds for arc animation
}

export const MISSILE_TEMPLATES: Record<MissileType, MissileTemplate> = {
  tactical: { type: 'tactical', name: 'Tactical Missile', range: 500, damage: 50, cost: 100, flightTime: 3 },
  cruise: { type: 'cruise', name: 'Cruise Missile', range: 2500, damage: 80, cost: 300, flightTime: 5 },
  icbm: { type: 'icbm', name: 'ICBM', range: 12000, damage: 100, cost: 1000, flightTime: 8 },
};

export interface Base {
  id: string;
  name: string;
  type: BaseType;
  position: Coordinates;
  faction: Faction;
  health: number;
  maxHealth: number;
  productionCapacity: number;
  influenceRadius: number; // km
  createdAt: number;
}

export type UnitDomain = 'land' | 'air' | 'naval' | 'cyber' | 'space' | 'special';

export type UnitType = 
  // Land
  | 'infantry' | 'armor' | 'artillery' | 'air_defense' | 'engineer'
  // Air
  | 'fighter' | 'bomber' | 'transport' | 'helicopter' | 'drone'
  // Naval
  | 'destroyer' | 'carrier' | 'submarine' | 'frigate' | 'amphibious'
  // Special
  | 'special_forces' | 'cyber_team' | 'intel_team';

export interface UnitTemplate {
  type: UnitType;
  domain: UnitDomain;
  name: string;
  symbol: string; // NATO symbol code
  speed: number; // km/h
  range: number; // km
  attack: number;
  defense: number;
  cost: number;
  productionTime: number; // ticks
  requiredBase: BaseType[];
}

export interface Unit {
  id: string;
  templateType: UnitType;
  name: string;
  position: Coordinates;
  destination?: Coordinates;
  faction: Faction;
  health: number;
  maxHealth: number;
  status: 'idle' | 'moving' | 'attacking' | 'defending' | 'retreating';
  parentBaseId: string;
  createdAt: number;
}

export interface TerritoryInfluence {
  position: Coordinates;
  faction: Faction;
  strength: number; // 0-100
  radius: number; // km
}

export interface Nation {
  id: string;
  name: string;
  faction: Faction;
  resources: number;
  productionRate: number;
  territory: Coordinates[]; // rough border
  hostileToPlayer: boolean;
  aiPersonality: 'aggressive' | 'defensive' | 'expansionist' | 'balanced';
}

export interface GameState {
  tick: number;
  speed: number; // 0 = paused, 1 = normal, 2 = fast, 3 = ultra
  playerFaction: Faction;
  hq: Base | null;
  bases: Base[];
  units: Unit[];
  territories: TerritoryInfluence[];
  nations: Nation[];
  logs: GameLog[];
  resources: number;
  selectedTool: PlacementTool | null;
  selectedEntity: string | null;
}

export type PlacementTool = 
  | { type: 'hq' }
  | { type: 'base'; baseType: BaseType }
  | { type: 'unit'; unitType: UnitType };

export interface GameLog {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'combat' | 'intel' | 'production' | 'movement';
  message: string;
  position?: Coordinates;
}

export interface AIDecision {
  nationId: string;
  intent: 'build' | 'deploy' | 'attack' | 'defend' | 'expand';
  priority: number;
  target?: Coordinates;
  unitType?: UnitType;
  baseType?: BaseType;
  reasoning: string;
}

// Unit templates database
export const UNIT_TEMPLATES: Record<UnitType, UnitTemplate> = {
  // Land units - 10x speed boost
  infantry: {
    type: 'infantry',
    domain: 'land',
    name: 'Infantry Battalion',
    symbol: 'INF',
    speed: 300, // 30 * 10
    range: 500,
    attack: 40,
    defense: 50,
    cost: 100,
    productionTime: 2,
    requiredBase: ['army', 'hq'],
  },
  armor: {
    type: 'armor',
    domain: 'land',
    name: 'Armored Division',
    symbol: 'ARM',
    speed: 600, // 60 * 10
    range: 400,
    attack: 80,
    defense: 70,
    cost: 300,
    productionTime: 4,
    requiredBase: ['army'],
  },
  artillery: {
    type: 'artillery',
    domain: 'land',
    name: 'Artillery Battery',
    symbol: 'ART',
    speed: 250, // 25 * 10
    range: 50,
    attack: 90,
    defense: 20,
    cost: 200,
    productionTime: 3,
    requiredBase: ['army'],
  },
  air_defense: {
    type: 'air_defense',
    domain: 'land',
    name: 'Air Defense System',
    symbol: 'ADA',
    speed: 400, // 40 * 10
    range: 200,
    attack: 70,
    defense: 40,
    cost: 250,
    productionTime: 3,
    requiredBase: ['army', 'airforce'],
  },
  engineer: {
    type: 'engineer',
    domain: 'land',
    name: 'Engineer Corps',
    symbol: 'ENG',
    speed: 350, // 35 * 10
    range: 300,
    attack: 20,
    defense: 30,
    cost: 150,
    productionTime: 2,
    requiredBase: ['army', 'hq'],
  },
  // Air units
  fighter: {
    type: 'fighter',
    domain: 'air',
    name: 'Fighter Squadron',
    symbol: 'FTR',
    speed: 2000,
    range: 1500,
    attack: 85,
    defense: 50,
    cost: 400,
    productionTime: 4,
    requiredBase: ['airforce'],
  },
  bomber: {
    type: 'bomber',
    domain: 'air',
    name: 'Bomber Wing',
    symbol: 'BMB',
    speed: 900,
    range: 3000,
    attack: 95,
    defense: 30,
    cost: 500,
    productionTime: 5,
    requiredBase: ['airforce'],
  },
  transport: {
    type: 'transport',
    domain: 'air',
    name: 'Transport Squadron',
    symbol: 'TRP',
    speed: 700,
    range: 4000,
    attack: 5,
    defense: 20,
    cost: 200,
    productionTime: 3,
    requiredBase: ['airforce'],
  },
  helicopter: {
    type: 'helicopter',
    domain: 'air',
    name: 'Attack Helicopter',
    symbol: 'HEL',
    speed: 280,
    range: 500,
    attack: 75,
    defense: 40,
    cost: 300,
    productionTime: 3,
    requiredBase: ['airforce', 'army'],
  },
  drone: {
    type: 'drone',
    domain: 'air',
    name: 'UAV Squadron',
    symbol: 'UAV',
    speed: 400,
    range: 1000,
    attack: 60,
    defense: 10,
    cost: 150,
    productionTime: 2,
    requiredBase: ['airforce', 'intelligence'],
  },
  // Naval units
  destroyer: {
    type: 'destroyer',
    domain: 'naval',
    name: 'Destroyer',
    symbol: 'DDG',
    speed: 55,
    range: 8000,
    attack: 70,
    defense: 60,
    cost: 400,
    productionTime: 5,
    requiredBase: ['navy'],
  },
  carrier: {
    type: 'carrier',
    domain: 'naval',
    name: 'Aircraft Carrier',
    symbol: 'CVN',
    speed: 55,
    range: 12000,
    attack: 40,
    defense: 80,
    cost: 1000,
    productionTime: 10,
    requiredBase: ['navy'],
  },
  submarine: {
    type: 'submarine',
    domain: 'naval',
    name: 'Attack Submarine',
    symbol: 'SSN',
    speed: 45,
    range: 10000,
    attack: 85,
    defense: 50,
    cost: 500,
    productionTime: 6,
    requiredBase: ['navy'],
  },
  frigate: {
    type: 'frigate',
    domain: 'naval',
    name: 'Frigate',
    symbol: 'FFG',
    speed: 50,
    range: 6000,
    attack: 55,
    defense: 50,
    cost: 300,
    productionTime: 4,
    requiredBase: ['navy'],
  },
  amphibious: {
    type: 'amphibious',
    domain: 'naval',
    name: 'Amphibious Assault Ship',
    symbol: 'LHD',
    speed: 40,
    range: 9000,
    attack: 30,
    defense: 60,
    cost: 600,
    productionTime: 7,
    requiredBase: ['navy'],
  },
  // Special units - 10x speed boost for land-based
  special_forces: {
    type: 'special_forces',
    domain: 'special',
    name: 'Special Forces Team',
    symbol: 'SOF',
    speed: 500, // 50 * 10
    range: 2000,
    attack: 70,
    defense: 40,
    cost: 200,
    productionTime: 3,
    requiredBase: ['army', 'intelligence'],
  },
  cyber_team: {
    type: 'cyber_team',
    domain: 'cyber',
    name: 'Cyber Operations Team',
    symbol: 'CYB',
    speed: 0,
    range: 10000,
    attack: 50,
    defense: 80,
    cost: 300,
    productionTime: 4,
    requiredBase: ['intelligence'],
  },
  intel_team: {
    type: 'intel_team',
    domain: 'special',
    name: 'Intelligence Cell',
    symbol: 'INT',
    speed: 400, // 40 * 10
    range: 3000,
    attack: 10,
    defense: 30,
    cost: 150,
    productionTime: 2,
    requiredBase: ['intelligence', 'hq'],
  },
};

export const BASE_CONFIG: Record<BaseType, { name: string; cost: number; influenceRadius: number; symbol: string }> = {
  hq: { name: 'Headquarters', cost: 0, influenceRadius: 100, symbol: 'HQ' },
  army: { name: 'Army Base', cost: 500, influenceRadius: 75, symbol: 'ARMY' },
  navy: { name: 'Naval Base', cost: 600, influenceRadius: 100, symbol: 'NAVY' },
  airforce: { name: 'Air Force Base', cost: 700, influenceRadius: 150, symbol: 'AF' },
  intelligence: { name: 'Intelligence Center', cost: 400, influenceRadius: 200, symbol: 'INTEL' },
  missile: { name: 'Missile Silo', cost: 800, influenceRadius: 50, symbol: 'MSL' },
};
