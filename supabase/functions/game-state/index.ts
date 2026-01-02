import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { action, sessionId, playerId, data } = await req.json();
    
    console.log(`[game-state] Action: ${action}, Session: ${sessionId}`);

    switch (action) {
      case 'create': {
        // Create new game session
        const { data: session, error: sessionError } = await supabase
          .from('game_sessions')
          .insert({
            player_id: playerId || 'anonymous',
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
        // Save game state
        const { resources, alertLevel, capturedCountries, currentTick } = data;

        const { error: updateError } = await supabase
          .from('game_sessions')
          .update({
            resources,
            alert_level: alertLevel,
            captured_countries: capturedCountries,
            last_tick: currentTick,
          })
          .eq('id', sessionId);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'damage_base': {
        const { baseId, damage } = data;
        
        const { data: base, error: baseError } = await supabase
          .from('enemy_bases')
          .select('*')
          .eq('id', baseId)
          .single();

        if (baseError) throw baseError;

        const newHealth = Math.max(0, base.health - damage);
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
        const { unitId, damage } = data;
        
        const { data: unit, error: unitError } = await supabase
          .from('enemy_units')
          .select('*')
          .eq('id', unitId)
          .single();

        if (unitError) throw unitError;

        const newHealth = Math.max(0, unit.health - damage);
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
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
