-- Enable RLS on all game data tables (read-only public access)
ALTER TABLE public.elements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_sets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bosses       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.builds       ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon + authenticated) to SELECT, block all writes
CREATE POLICY "public read" ON public.elements    FOR SELECT USING (true);
CREATE POLICY "public read" ON public.roles       FOR SELECT USING (true);
CREATE POLICY "public read" ON public.gear_sets   FOR SELECT USING (true);
CREATE POLICY "public read" ON public.accessories FOR SELECT USING (true);
CREATE POLICY "public read" ON public.characters  FOR SELECT USING (true);
CREATE POLICY "public read" ON public.bosses      FOR SELECT USING (true);
CREATE POLICY "public read" ON public.builds      FOR SELECT USING (true);
