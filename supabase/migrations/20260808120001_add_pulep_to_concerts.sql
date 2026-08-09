-- PULEP: Colombian government registry code for public events — unique per event,
-- published by ticketers. Canonical cross-source dedupe key for the ingestion pipeline.

ALTER TABLE public.concerts ADD COLUMN IF NOT EXISTS pulep_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_concerts_pulep
  ON public.concerts (pulep_code) WHERE pulep_code IS NOT NULL;

ALTER TABLE public.festivals ADD COLUMN IF NOT EXISTS pulep_code text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_festivals_pulep
  ON public.festivals (pulep_code) WHERE pulep_code IS NOT NULL;
