import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlayerBase {
  id: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface EnemyUnit {
  id: string;
  latitude: number;
  longitude: number;
  unit_type: string;
  status: string;
  health: number;
}

// Input validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Calculate distance between two points in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// AI decision-making logic
function decideAction(
  alertLevel: string,
  enemyUnits: EnemyUnit[],
  playerBases: PlayerBase[],
  lastActionTime: number
): { action: string; targets: any[]; message: string } | null {
  const now = Date.now();
  const cooldown = alertLevel === 'war' ? 30000 : 60000; // 30s in war, 60s otherwise
  
  if (now - lastActionTime < cooldown) {
    return null;
  }

  const idleUnits = enemyUnits.filter(u => u.status === 'idle' && u.health > 50);
  
  if (idleUnits.length === 0) {
    return null;
  }

  // Find nearest player base for each idle unit
  const attackTargets: any[] = [];
  
  if (alertLevel === 'war' && Math.random() > 0.3) {
    // 70% chance to attack in war mode
    for (const unit of idleUnits.slice(0, 3)) { // Max 3 units per wave
      let nearestBase: PlayerBase | null = null;
      let nearestDist = Infinity;
      
      for (const base of playerBases) {
        const dist = haversineDistance(unit.latitude, unit.longitude, base.latitude, base.longitude);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestBase = base;
        }
      }
      
      if (nearestBase && nearestDist < 5000) { // Within 5000km
        attackTargets.push({
          unitId: unit.id,
          targetLat: nearestBase.latitude,
          targetLon: nearestBase.longitude,
          targetId: nearestBase.id,
        });
      }
    }
    
    if (attackTargets.length > 0) {
      return {
        action: 'attack',
        targets: attackTargets,
        message: `🚨 ENEMY ATTACK: ${attackTargets.length} hostile units inbound!`,
      };
    }
  } else if (alertLevel === 'hostile' && Math.random() > 0.6) {
    // 40% chance for patrol in hostile mode
    const patrolUnits = idleUnits.slice(0, 2);
    return {
      action: 'patrol',
      targets: patrolUnits.map(u => ({ unitId: u.id })),
      message: '⚠️ Enemy patrols detected near border.',
    };
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { sessionId, playerId, playerBases, currentTick } = body;

    // Input validation
    if (!sessionId || typeof sessionId !== 'string' || !isValidUUID(sessionId)) {
      return new Response(JSON.stringify({ error: 'Invalid session ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!playerId || typeof playerId !== 'string') {
      return new Response(JSON.stringify({ error: 'Player ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[enemy-ai] Processing AI for session ${sessionId}, tick ${currentTick}`);

    // Get session state and verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      console.error('[enemy-ai] Session error:', sessionError);
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify session ownership
    if (session.player_id !== playerId) {
      console.warn(`[enemy-ai] Ownership mismatch: expected ${session.player_id}, got ${playerId}`);
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active enemy units
    const { data: enemyUnits, error: unitsError } = await supabase
      .from('enemy_units')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_destroyed', false);

    if (unitsError) {
      console.error('[enemy-ai] Units error:', unitsError);
      throw unitsError;
    }

    // Get last action time
    const { data: lastAction } = await supabase
      .from('ai_actions')
      .select('executed_at')
      .eq('session_id', sessionId)
      .order('executed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastActionTime = lastAction ? new Date(lastAction.executed_at).getTime() : 0;

    // AI decision
    const decision = decideAction(
      session.alert_level,
      enemyUnits || [],
      playerBases || [],
      lastActionTime
    );

    if (decision) {
      console.log(`[enemy-ai] Decision: ${decision.action}`, decision.targets);
      
      // Log the action
      await supabase.from('ai_actions').insert({
        session_id: sessionId,
        action_type: decision.action,
        message: decision.message,
        metadata: { targets: decision.targets, tick: currentTick },
      });

      // Update unit statuses for attacks
      if (decision.action === 'attack') {
        for (const target of decision.targets) {
          await supabase
            .from('enemy_units')
            .update({
              status: 'attacking',
              target_latitude: target.targetLat,
              target_longitude: target.targetLon,
            })
            .eq('id', target.unitId);
        }
      }

      return new Response(JSON.stringify({
        action: decision.action,
        message: decision.message,
        targets: decision.targets,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ action: 'none' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[enemy-ai] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
