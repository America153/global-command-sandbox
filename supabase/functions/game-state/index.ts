import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_ACTIONS = ['create', 'load', 'save', 'damage_base', 'damage_unit'];

// Input validation helper
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Initial enemy base configurations
const INITIAL_ENEMY_BASES = [
  { type: 'hq', lat: 55.7558, lng: 37.6173, name: 'Red Coalition HQ', country: 'RUS' },
  { type: 'army', lat: 51.1605, lng: 71.4704, name: 'Eastern Command', country: 'KAZ' },
  { type: 'airforce', lat: 43.2551, lng: 76.9126, name: 'Air Defense North', country: 'KAZ' },
  { type: 'missile', lat: 48.0196, lng: 66.9237, name: 'Strategic Missile Site', country: 'KAZ' },
  { type: 'navy', lat: 59.9343, lng: 30.3351, name: 'Baltic Fleet Base', country: 'RUS' },
  { type: 'intelligence', lat: 55.0084, lng: 82.9357, name: 'Signals Intelligence', country: 'RUS' },
];

// Initial units per base type
const UNITS_PER_BASE: Record<string, string[]> = {
  'hq': ['infantry', 'infantry', 'armor'],
  'army': ['infantry', 'armor', 'armor'],
  'airforce': ['fighter', 'fighter', 'helicopter'],
  'navy': ['infantry', 'special_forces'],
  'missile': ['infantry'],
  'intelligence': ['special_forces'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { action, sessionId, playerId, data } = body;

    // Input validation
    if (!action || typeof action !== 'string' || !VALID_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
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

    // For non-create actions, validate sessionId
    if (action !== 'create') {
      if (!sessionId || typeof sessionId !== 'string' || !isValidUUID(sessionId)) {
        return new Response(JSON.stringify({ error: 'Invalid session ID' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    console.log(`[game-state] Action: ${action}, Session: ${sessionId}`);

    switch (action) {
      case 'create': {
        // Sanitize playerId - only allow alphanumeric, hyphens, and underscores
        const sanitizedPlayerId = String(playerId).replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 128);
        
        if (!sanitizedPlayerId) {
          return new Response(JSON.stringify({ error: 'Invalid player ID format' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create new game session
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .insert({
            player_id: sanitizedPlayerId,
            resources: 1000,
            alert_level: 'peace',
          })
          .select()
          .single();

        if (sessionError) throw sessionError;

        // Create initial enemy bases
        const basesToInsert = INITIAL_ENEMY_BASES.map(base => ({
          session_id: session.id,
          base_type: base.type,
          name: base.name,
          latitude: base.lat,
          longitude: base.lng,
          country_id: base.country,
          health: base.type === 'hq' ? 1000 : 500,
          max_health: base.type === 'hq' ? 1000 : 500,
          is_revealed: false,
        }));

        const { data: bases, error: basesError } = await supabase
          .from('enemy_bases')
          .insert(basesToInsert)
          .select();

        if (basesError) throw basesError;

        // Create initial units for each base
        const unitsToInsert: any[] = [];
        for (const base of bases) {
          const unitTypes = UNITS_PER_BASE[base.base_type] || [];
          unitTypes.forEach((type, idx) => {
            unitsToInsert.push({
              session_id: session.id,
              base_id: base.id,
              unit_type: type,
              name: `Red ${type.charAt(0).toUpperCase() + type.slice(1)} ${idx + 1}`,
              latitude: base.latitude + (Math.random() - 0.5) * 0.5,
              longitude: base.longitude + (Math.random() - 0.5) * 0.5,
              health: 100,
              max_health: 100,
              status: 'idle',
            });
          });
        }

        if (unitsToInsert.length > 0) {
          const { error: unitsError } = await supabase
            .from('enemy_units')
            .insert(unitsToInsert);
          if (unitsError) throw unitsError;
        }

        console.log(`[game-state] Created session ${session.id} with ${bases.length} bases and ${unitsToInsert.length} units`);

        return new Response(JSON.stringify({
          sessionId: session.id,
          bases: bases.length,
          units: unitsToInsert.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'load': {
        // Load existing session
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

        // Verify session ownership
        if (session.player_id !== playerId) {
          console.warn(`[game-state] Load ownership mismatch: expected ${session.player_id}, got ${playerId}`);
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: bases } = await supabase
          .from('enemy_bases')
          .select('*')
          .eq('session_id', sessionId);

        const { data: units } = await supabase
          .from('enemy_units')
          .select('*')
          .eq('session_id', sessionId)
          .eq('is_destroyed', false);

        const { data: actions } = await supabase
          .from('ai_actions')
          .select('*')
          .eq('session_id', sessionId)
          .order('executed_at', { ascending: false })
          .limit(10);

        return new Response(JSON.stringify({
          session,
          bases: bases || [],
          units: units || [],
          recentActions: actions || [],
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'save': {
        // First verify session ownership
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .select('player_id')
          .eq('id', sessionId)
          .maybeSingle();

        if (sessionError || !session) {
          return new Response(JSON.stringify({ error: 'Session not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (session.player_id !== playerId) {
          console.warn(`[game-state] Save ownership mismatch: expected ${session.player_id}, got ${playerId}`);
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate and sanitize save data
        if (!data || typeof data !== 'object') {
          return new Response(JSON.stringify({ error: 'Invalid save data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { resources, alertLevel, capturedCountries, currentTick } = data;

        // Validate data types
        const safeResources = typeof resources === 'number' ? Math.max(0, Math.floor(resources)) : undefined;
        const safeAlertLevel = ['peace', 'vigilant', 'hostile', 'war'].includes(alertLevel) ? alertLevel : undefined;
        const safeCapturedCountries = Array.isArray(capturedCountries) 
          ? capturedCountries.filter(c => typeof c === 'string').slice(0, 100) 
          : undefined;
        const safeCurrentTick = typeof currentTick === 'number' ? Math.max(0, Math.floor(currentTick)) : undefined;

        const updateData: Record<string, any> = {};
        if (safeResources !== undefined) updateData.resources = safeResources;
        if (safeAlertLevel !== undefined) updateData.alert_level = safeAlertLevel;
        if (safeCapturedCountries !== undefined) updateData.captured_countries = safeCapturedCountries;
        if (safeCurrentTick !== undefined) updateData.last_tick = safeCurrentTick;

        const { error: updateError } = await supabase
          .from('game_sessions')
          .update(updateData)
          .eq('id', sessionId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'damage_base': {
        if (!data || typeof data !== 'object') {
          return new Response(JSON.stringify({ error: 'Invalid damage data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { baseId, damage } = data;

        if (!baseId || typeof baseId !== 'string' || !isValidUUID(baseId)) {
          return new Response(JSON.stringify({ error: 'Invalid base ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (typeof damage !== 'number' || damage < 0) {
          return new Response(JSON.stringify({ error: 'Invalid damage value' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Get base and verify it belongs to the session
        const { data: base, error: baseError } = await supabase
          .from('enemy_bases')
          .select('*, game_sessions!inner(player_id)')
          .eq('id', baseId)
          .single();

        if (baseError || !base) {
          return new Response(JSON.stringify({ error: 'Base not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify session ownership through the base's session
        if ((base as any).game_sessions.player_id !== playerId) {
          console.warn(`[game-state] Damage base ownership mismatch`);
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const safeDamage = Math.min(damage, 10000); // Cap damage to prevent overflow
        const newHealth = Math.max(0, base.health - safeDamage);
        const isDestroyed = newHealth <= 0;

        await supabase
          .from('enemy_bases')
          .update({
            health: newHealth,
            is_destroyed: isDestroyed,
            is_revealed: true,
          })
          .eq('id', baseId);

        // If base destroyed, also destroy all units at that base
        if (isDestroyed) {
          await supabase
            .from('enemy_units')
            .update({ is_destroyed: true })
            .eq('base_id', baseId);
        }

        return new Response(JSON.stringify({
          baseId,
          newHealth,
          isDestroyed,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'damage_unit': {
        if (!data || typeof data !== 'object') {
          return new Response(JSON.stringify({ error: 'Invalid damage data' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { unitId, damage } = data;

        if (!unitId || typeof unitId !== 'string' || !isValidUUID(unitId)) {
          return new Response(JSON.stringify({ error: 'Invalid unit ID' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (typeof damage !== 'number' || damage < 0) {
          return new Response(JSON.stringify({ error: 'Invalid damage value' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Get unit and verify it belongs to a session owned by the player
        const { data: unit, error: unitError } = await supabase
          .from('enemy_units')
          .select('*, game_sessions!inner(player_id)')
          .eq('id', unitId)
          .single();

        if (unitError || !unit) {
          return new Response(JSON.stringify({ error: 'Unit not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Verify session ownership through the unit's session
        if ((unit as any).game_sessions.player_id !== playerId) {
          console.warn(`[game-state] Damage unit ownership mismatch`);
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const safeDamage = Math.min(damage, 1000); // Cap damage to prevent overflow
        const newHealth = Math.max(0, unit.health - safeDamage);
        const isDestroyed = newHealth <= 0;

        await supabase
          .from('enemy_units')
          .update({
            health: newHealth,
            is_destroyed: isDestroyed,
          })
          .eq('id', unitId);

        return new Response(JSON.stringify({
          unitId,
          newHealth,
          isDestroyed,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('[game-state] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
