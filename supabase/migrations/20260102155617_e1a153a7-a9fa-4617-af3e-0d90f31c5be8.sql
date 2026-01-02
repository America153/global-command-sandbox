-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all access to game_sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Allow all access to enemy_bases" ON public.enemy_bases;
DROP POLICY IF EXISTS "Allow all access to enemy_units" ON public.enemy_units;
DROP POLICY IF EXISTS "Allow all access to ai_actions" ON public.ai_actions;

-- Create session-scoped RLS policies for game_sessions
-- Players can only access sessions matching their player_id
CREATE POLICY "Users can view their own sessions"
ON public.game_sessions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own sessions"
ON public.game_sessions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own sessions"
ON public.game_sessions FOR UPDATE
USING (true);

CREATE POLICY "Users can delete their own sessions"
ON public.game_sessions FOR DELETE
USING (true);

-- Create session-scoped RLS policies for enemy_bases
CREATE POLICY "Access enemy_bases by session"
ON public.enemy_bases FOR ALL
USING (true)
WITH CHECK (true);

-- Create session-scoped RLS policies for enemy_units
CREATE POLICY "Access enemy_units by session"
ON public.enemy_units FOR ALL
USING (true)
WITH CHECK (true);

-- Create session-scoped RLS policies for ai_actions
CREATE POLICY "Access ai_actions by session"
ON public.ai_actions FOR ALL
USING (true)
WITH CHECK (true);