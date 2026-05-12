-- Add difficulties array to bosses (sourced from zeroluck.gg/7dso/bosses/)
ALTER TABLE public.bosses ADD COLUMN IF NOT EXISTS difficulties text[] NOT NULL DEFAULT '{}';

-- Add difficulty column to builds (for future per-difficulty team comps)
ALTER TABLE public.builds ADD COLUMN IF NOT EXISTS difficulty text NOT NULL DEFAULT 'all';

-- Seed boss difficulties
UPDATE public.bosses SET difficulties = ARRAY['Nightmare','Hell','Abyss']          WHERE id = 'galland';
UPDATE public.bosses SET difficulties = ARRAY['Hard','Nightmare','Hell']            WHERE id = 'ancient';
UPDATE public.bosses SET difficulties = ARRAY['Hard','Nightmare','Hell']            WHERE id = 'spiderNest';
UPDATE public.bosses SET difficulties = ARRAY['Hard','Nightmare','Hell','Abyss']    WHERE id = 'capital';
UPDATE public.bosses SET difficulties = ARRAY['Hard','Nightmare','Hell','Abyss']    WHERE id = 'orgot';
UPDATE public.bosses SET difficulties = ARRAY['Normal','Hard']                      WHERE id = 'drake';
UPDATE public.bosses SET difficulties = ARRAY['Easy','Normal','Hard']               WHERE id = 'albion';
UPDATE public.bosses SET difficulties = ARRAY['Easy','Normal','Hard']               WHERE id = 'golem';
UPDATE public.bosses SET difficulties = ARRAY['Normal','Hard','Hell','Abyss']       WHERE id = 'ferzen';
UPDATE public.bosses SET difficulties = ARRAY['World 1','World 2','World 3','World 4','World 5'] WHERE id = 'grayDemon';
UPDATE public.bosses SET difficulties = ARRAY['World 1','World 2','World 3','World 4','World 5'] WHERE id = 'redDemon';
UPDATE public.bosses SET difficulties = ARRAY['World 1','World 2','World 3','World 4','World 5'] WHERE id = 'scorpy';
UPDATE public.bosses SET difficulties = ARRAY['World 1','World 2','World 3','World 4','World 5'] WHERE id = 'banakro';
UPDATE public.bosses SET difficulties = ARRAY['World 1','World 2','World 3','World 4','World 5'] WHERE id = 'molbog';
UPDATE public.bosses SET difficulties = ARRAY['Timespace']                          WHERE id = 'marmas';
