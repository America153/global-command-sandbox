-- Enemy game state tables

-- Table for game sessions
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_tick INTEGER NOT NULL DEFAULT 0,
  resources INTEGER NOT NULL DEFAULT 1000,
  alert_level TEXT NOT NULL DEFAULT 'peace',
  is_active BOOLEAN NOT NULL DEFAULT true,
  captured_countries TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for enemy bases
CREATE TABLE public.enemy_bases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  base_type TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  health INTEGER NOT NULL DEFAULT 500,
  max_health INTEGER NOT NULL DEFAULT 500,
  country_id TEXT,
  is_revealed BOOLEAN NOT NULL DEFAULT false,
  is_destroyed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for enemy units
CREATE TABLE public.enemy_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  base_id UUID REFERENCES public.enemy_bases(id) ON DELETE SET NULL,
  unit_type TEXT NOT NULL,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  target_latitude DOUBLE PRECISION,
  target_longitude DOUBLE PRECISION,
  health INTEGER NOT NULL DEFAULT 100,
  max_health INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'idle',
  is_destroyed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI actions/decisions log
CREATE TABLE public.ai_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  message TEXT,
  target_latitude DOUBLE PRECISION,
  target_longitude DOUBLE PRECISION,
  metadata JSONB DEFAULT '{}',
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enemy_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enemy_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_actions ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (game doesn't require auth)
CREATE POLICY "Allow all access to game_sessions" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to enemy_bases" ON public.enemy_bases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to enemy_units" ON public.enemy_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ai_actions" ON public.ai_actions FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for enemy_units and ai_actions
ALTER PUBLICATION supabase_realtime ADD TABLE enemy_units;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_actions;

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();