import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UNIT_TYPES = ['infantry', 'armor', 'fighter', 'helicopter', 'special_forces'];

function generateRaidUnits(baseId: string, baseLat: number, baseLon: number, intensity: number): any[] {
  const unitCount = Math.min(2 + Math.floor(intensity * 3), 5);
  const units: any[] = [];
  
  for (let i = 0; i < unitCount; i++) {
    const type = UNIT_TYPES[Math.floor(Math.random() * UNIT_TYPES.length)];
    // Spawn near the base with slight offset
    const offsetLat = (Math.random() - 0.5) * 2;
    const offsetLon = (Math.random() - 0.5) * 2;
    
    units.push({
      base_id: baseId,
      unit_type: type,
      name: `Raid ${type.charAt(0).toUpperCase() + type.slice(1)} ${i + 1}`,
      latitude: baseLat + offsetLat,
      longitude: baseLon + offsetLon,
      health: 100,
      max_health: 100,
      status: 'attacking',
    });
  }
  
  return units;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sessionId, triggerType, targetPosition, intensity = 1 } = await req.json();
    
    console.log(`[enemy-retaliation] Triggered: ${triggerType} for session ${sessionId}`);

    // Get session
    const { data: session, error: sessionError } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get active enemy bases near the target
    const { data: bases, error: basesError } = await supabase
      .from('enemy_bases')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_destroyed', false);

    if (basesError) throw basesError;

    // Find nearest surviving base for retaliation
    let retaliationBase = null;
    let minDist = Infinity;
    
    for (const base of bases || []) {
      if (targetPosition) {
        const dist = Math.sqrt(
          Math.pow(base.latitude - targetPosition.latitude, 2) +
          Math.pow(base.longitude - targetPosition.longitude, 2)
        );
        if (dist < minDist) {
          minDist = dist;
          retaliationBase = base;
        }
      } else {
        // If no target, pick a random base
        retaliationBase = bases[Math.floor(Math.random() * bases.length)];
        break;
      }
    }

    if (!retaliationBase) {
      console.log('[enemy-retaliation] No bases available for retaliation');
      return new Response(JSON.stringify({ action: 'none', reason: 'No bases available' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Escalate alert level based on trigger
    let newAlertLevel = session.alert_level;
    let message = '';

    switch (triggerType) {
      case 'border_violation':
        if (session.alert_level === 'peace') {
          newAlertLevel = 'vigilant';
          message = '⚠️ BORDER INCURSION DETECTED: Enemy forces are now on alert.';
        }
        break;
      case 'base_attacked':
        if (session.alert_level !== 'war') {
          newAlertLevel = 'hostile';
          message = '🚨 BASE UNDER ATTACK: Enemy escalating to hostile status!';
        }
        break;
      case 'missile_strike':
        newAlertLevel = 'war';
        message = '☢️ STRATEGIC STRIKE DETECTED: Total war declared!';
        break;
    }

    // Update session alert level
    if (newAlertLevel !== session.alert_level) {
      await supabase
        .from('game_sessions')
        .update({ alert_level: newAlertLevel })
        .eq('id', sessionId);
    }

    // Generate raid force if at war or hostile
    let raidUnits: any[] = [];
    if (newAlertLevel === 'war' || (newAlertLevel === 'hostile' && Math.random() > 0.5)) {
      raidUnits = generateRaidUnits(
        retaliationBase.id,
        retaliationBase.latitude,
        retaliationBase.longitude,
        intensity
      );

      // Insert raid units
      const { error: insertError } = await supabase
        .from('enemy_units')
        .insert(raidUnits.map(u => ({
          ...u,
          session_id: sessionId,
        })));

      if (insertError) {
        console.error('[enemy-retaliation] Insert error:', insertError);
        throw insertError;
      }

      console.log(`[enemy-retaliation] Spawned ${raidUnits.length} raid units`);
    }

    // Reveal bases if attacked
    if (triggerType === 'missile_strike') {
      await supabase
        .from('enemy_bases')
        .update({ is_revealed: true })
        .eq('session_id', sessionId);
    } else if (triggerType === 'border_violation' && retaliationBase) {
      await supabase
        .from('enemy_bases')
        .update({ is_revealed: true })
        .eq('id', retaliationBase.id);
    }

    // Log the retaliation action
    await supabase.from('ai_actions').insert({
      session_id: sessionId,
      action_type: 'retaliation',
      message: message || `Enemy retaliation from ${retaliationBase.name}`,
      target_latitude: targetPosition?.latitude,
      target_longitude: targetPosition?.longitude,
      metadata: {
        trigger: triggerType,
        newAlertLevel,
        unitsSpawned: raidUnits.length,
        retaliationBaseId: retaliationBase.id,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      alertLevel: newAlertLevel,
      message,
      unitsSpawned: raidUnits.length,
      retaliationBase: retaliationBase.name,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[enemy-retaliation] Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
