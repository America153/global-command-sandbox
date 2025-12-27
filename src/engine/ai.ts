// Stub AI Decision Engine
// Rule-based fallback when LLM is not running
// Future: Connect to Ollama for Llama 3 / Mistral strategic decisions

import type { AIDecision, Nation, Base, Unit, GameState } from '@/types/game';

interface AIContext {
  nation: Nation;
  ownBases: Base[];
  ownUnits: Unit[];
  enemyBases: Base[];
  enemyUnits: Unit[];
  resources: number;
}

interface LLMRequest {
  model: string;
  messages: { role: string; content: string }[];
  format: 'json';
}

interface LLMResponse {
  intent: 'build' | 'deploy' | 'attack' | 'defend' | 'expand';
  priority: number;
  reasoning: string;
  target?: { latitude: number; longitude: number };
  unitType?: string;
  baseType?: string;
}

// Rule-based AI fallback
function makeRuleBasedDecision(context: AIContext): AIDecision {
  const { nation, ownBases, ownUnits, enemyBases, resources } = context;

  // Priority 1: Build HQ if none exists
  if (ownBases.length === 0) {
    return {
      nationId: nation.id,
      intent: 'build',
      priority: 100,
      baseType: 'hq',
      reasoning: 'No headquarters established. Must build command center.',
    };
  }

  // Priority 2: Build military bases if resources allow
  if (resources > 1000 && ownBases.length < 5) {
    const baseTypes = ['army', 'airforce', 'navy'] as const;
    const randomBase = baseTypes[Math.floor(Math.random() * baseTypes.length)];
    
    return {
      nationId: nation.id,
      intent: 'build',
      priority: 80,
      baseType: randomBase,
      reasoning: `Expanding military infrastructure with ${randomBase} base.`,
    };
  }

  // Priority 3: Produce units if bases exist
  if (ownBases.length > 1 && ownUnits.length < ownBases.length * 3) {
    return {
      nationId: nation.id,
      intent: 'deploy',
      priority: 70,
      unitType: nation.aiPersonality === 'aggressive' ? 'armor' : 'infantry',
      reasoning: 'Building military force for operations.',
    };
  }

  // Priority 4: Attack if aggressive and have forces
  if (nation.aiPersonality === 'aggressive' && ownUnits.length >= 5 && enemyBases.length > 0) {
    const targetBase = enemyBases[0];
    return {
      nationId: nation.id,
      intent: 'attack',
      priority: 90,
      target: targetBase.position,
      reasoning: 'Launching offensive against enemy positions.',
    };
  }

  // Priority 5: Expand territory
  if (nation.aiPersonality === 'expansionist') {
    return {
      nationId: nation.id,
      intent: 'expand',
      priority: 60,
      reasoning: 'Extending territorial influence.',
    };
  }

  // Default: Defend
  return {
    nationId: nation.id,
    intent: 'defend',
    priority: 50,
    reasoning: 'Maintaining defensive posture.',
  };
}

// LLM-based decision (for when Ollama is available)
async function makeLLMDecision(context: AIContext): Promise<AIDecision | null> {
  const { nation, ownBases, ownUnits, enemyBases, enemyUnits, resources } = context;

  // Compress state for LLM context
  const statePrompt = `
You are an AI military commander for ${nation.name}.
Personality: ${nation.aiPersonality}
Resources: ${resources}
Own Bases: ${ownBases.length} (${ownBases.map(b => b.type).join(', ') || 'none'})
Own Units: ${ownUnits.length}
Enemy Bases: ${enemyBases.length}
Enemy Units: ${enemyUnits.length}

Decide your next strategic action. Respond in JSON format:
{
  "intent": "build" | "deploy" | "attack" | "defend" | "expand",
  "priority": 1-100,
  "reasoning": "brief explanation",
  "unitType": "infantry" | "armor" | "fighter" | null,
  "baseType": "army" | "navy" | "airforce" | null
}
`;

  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3',
        messages: [{ role: 'user', content: statePrompt }],
        format: 'json',
        stream: false,
      } as LLMRequest),
    });

    if (!response.ok) {
      console.warn('LLM not available, using rule-based fallback');
      return null;
    }

    const data = await response.json();
    const parsed: LLMResponse = JSON.parse(data.message.content);

    return {
      nationId: nation.id,
      intent: parsed.intent,
      priority: parsed.priority,
      reasoning: parsed.reasoning,
      unitType: parsed.unitType as any,
      baseType: parsed.baseType as any,
    };
  } catch (error) {
    console.warn('LLM request failed:', error);
    return null;
  }
}

// Main AI decision function
export async function getAIDecision(context: AIContext): Promise<AIDecision> {
  // Try LLM first, fall back to rules
  const llmDecision = await makeLLMDecision(context);
  
  if (llmDecision) {
    return llmDecision;
  }

  return makeRuleBasedDecision(context);
}

// AI Manager - coordinates all AI nations
export class AIManager {
  private nations: Nation[] = [];
  private decisionInterval: number = 10; // Every 10 ticks
  private lastDecisionTick: Map<string, number> = new Map();

  addNation(nation: Nation) {
    this.nations.push(nation);
    this.lastDecisionTick.set(nation.id, 0);
  }

  removeNation(nationId: string) {
    this.nations = this.nations.filter(n => n.id !== nationId);
    this.lastDecisionTick.delete(nationId);
  }

  async processTick(gameState: GameState): Promise<AIDecision[]> {
    const decisions: AIDecision[] = [];

    for (const nation of this.nations) {
      if (nation.faction === 'player') continue;

      const lastTick = this.lastDecisionTick.get(nation.id) || 0;
      if (gameState.tick - lastTick < this.decisionInterval) continue;

      const context: AIContext = {
        nation,
        ownBases: gameState.bases.filter(b => b.faction === nation.faction),
        ownUnits: gameState.units.filter(u => u.faction === nation.faction),
        enemyBases: gameState.bases.filter(b => b.faction !== nation.faction),
        enemyUnits: gameState.units.filter(u => u.faction !== nation.faction),
        resources: nation.resources,
      };

      const decision = await getAIDecision(context);
      decisions.push(decision);
      this.lastDecisionTick.set(nation.id, gameState.tick);
    }

    return decisions;
  }
}

export const aiManager = new AIManager();
