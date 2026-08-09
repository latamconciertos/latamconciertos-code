-- Ingestion pipeline: sources (config-as-data), staged events (review queue), runs (observability).
-- Sources scale by INSERT — adding a ticketer/country is a row, not code.

CREATE TABLE IF NOT EXISTS public.ingestion_sources (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text NOT NULL UNIQUE,
  base_url     text NOT NULL,
  country_code text NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  fetch_method text NOT NULL DEFAULT 'http' CHECK (fetch_method IN ('http', 'firecrawl')),
  config       jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_run_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.staged_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        uuid NOT NULL REFERENCES public.ingestion_sources(id) ON DELETE CASCADE,
  source_event_key text NOT NULL,
  source_url       text NOT NULL,
  pulep_code       text,
  fingerprint      text NOT NULL,
  -- extracted canonical fields
  title            text NOT NULL,
  artist_name      text,
  venue_name       text,
  city_name        text,
  country_code     text NOT NULL,
  event_date       date,
  event_time       time,
  doors_time       time,
  event_type_guess text NOT NULL DEFAULT 'concert' CHECK (event_type_guess IN ('concert', 'festival', 'other')),
  relevance        text CHECK (relevance IN ('high', 'medium', 'low')),
  confidence       numeric CHECK (confidence >= 0 AND confidence <= 1),
  ticket_url       text,
  image_url        text,
  promoter_name    text,
  price_data       jsonb,
  sale_stages      jsonb,
  extraction_notes text,
  raw              jsonb,
  -- entity matching (computed at ingest, overridable in review UI)
  matched_artist_id         uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  artist_match_confidence   text CHECK (artist_match_confidence IN ('exact', 'partial', 'not_found')),
  matched_venue_id          uuid REFERENCES public.venues(id) ON DELETE SET NULL,
  venue_match_confidence    text CHECK (venue_match_confidence IN ('exact', 'partial', 'not_found')),
  matched_promoter_id       uuid REFERENCES public.promoters(id) ON DELETE SET NULL,
  promoter_match_confidence text CHECK (promoter_match_confidence IN ('exact', 'partial', 'not_found')),
  matched_concert_id        uuid REFERENCES public.concerts(id) ON DELETE SET NULL,
  matched_festival_id       uuid REFERENCES public.festivals(id) ON DELETE SET NULL,
  concert_match_type        text CHECK (concert_match_type IN ('pulep', 'artist_date', 'none')),
  -- review lifecycle
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'discarded', 'error')),
  reviewed_by         uuid REFERENCES auth.users(id),
  reviewed_at         timestamptz,
  promoted_concert_id  uuid REFERENCES public.concerts(id) ON DELETE SET NULL,
  promoted_festival_id uuid REFERENCES public.festivals(id) ON DELETE SET NULL,
  first_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_seen_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staged_events_source_key_uniq UNIQUE (source_id, source_event_key)
);

CREATE TABLE IF NOT EXISTS public.ingestion_runs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id        uuid NOT NULL REFERENCES public.ingestion_sources(id) ON DELETE CASCADE,
  triggered_by     text NOT NULL CHECK (triggered_by IN ('cron', 'manual')),
  status           text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'error')),
  started_at       timestamptz NOT NULL DEFAULT now(),
  finished_at      timestamptz,
  pages_discovered int DEFAULT 0,
  pages_fetched    int DEFAULT 0,
  events_extracted int DEFAULT 0,
  events_new       int DEFAULT 0,
  events_updated   int DEFAULT 0,
  events_skipped   int DEFAULT 0,
  error            text,
  meta             jsonb
);

CREATE INDEX IF NOT EXISTS idx_staged_events_status      ON public.staged_events (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_staged_events_pulep       ON public.staged_events (pulep_code) WHERE pulep_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staged_events_fingerprint ON public.staged_events (fingerprint);
CREATE INDEX IF NOT EXISTS idx_staged_events_event_date  ON public.staged_events (event_date);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source     ON public.ingestion_runs (source_id, started_at DESC);

-- updated_at triggers (reuses public.update_modified_column from the festivals migration)
CREATE TRIGGER update_ingestion_sources_updated_at
  BEFORE UPDATE ON public.ingestion_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

CREATE TRIGGER update_staged_events_updated_at
  BEFORE UPDATE ON public.staged_events
  FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- RLS: admins via has_role(); the worker writes with the service role (bypasses RLS)
ALTER TABLE public.ingestion_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staged_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingestion_runs    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ingestion sources" ON public.ingestion_sources
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins manage staged events" ON public.staged_events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins read ingestion runs" ON public.ingestion_runs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::user_role));

-- Seed: the 4 sources validated by live probes (2026-08-08)
INSERT INTO public.ingestion_sources (name, slug, base_url, country_code, fetch_method, config) VALUES
(
  'TuBoleta', 'tuboleta', 'https://tuboleta.com', 'CO', 'http',
  '{
    "discovery": {
      "type": "both",
      "category_urls": [
        "https://tuboleta.com/es/categorias/conciertos",
        "https://tuboleta.com/es/categorias/festivales"
      ],
      "sitemap_url": "https://tuboleta.com/sitemap.xml",
      "event_url_pattern": "/es/eventos/[^/\"]+",
      "max_new_pages_per_run": 25
    },
    "fetch": {
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    },
    "extract": {
      "prefer_jsonld": false,
      "price_source": "image",
      "hints": "Los precios por localidad suelen estar en una imagen PNG dentro de la sección LOCALIDADES Y PRECIOS: guarda la URL de esa imagen en price_data. Las etapas de preventa (con banco, ej. Davivienda) están en texto en ETAPAS DE VENTA. La FECHA puede venir sin año. El afiche puede incluir un código PULEP."
    },
    "defaults": { "timezone": "America/Bogota", "currency": "COP", "city_name": null, "venue_name": null },
    "category_map": { "conciertos": "concert", "festivales": "festival" }
  }'::jsonb
),
(
  'Ticketmaster Colombia', 'ticketmaster_co', 'https://www.ticketmaster.co', 'CO', 'http',
  '{
    "discovery": {
      "type": "category_pages",
      "category_urls": [
        "https://www.ticketmaster.co/page/CONCIERTOS",
        "https://www.ticketmaster.co/page/FESTIVALES"
      ],
      "event_url_pattern": "/event/[^/\"'']+",
      "max_new_pages_per_run": 25
    },
    "fetch": {
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    },
    "extract": {
      "prefer_jsonld": true,
      "price_source": "html",
      "hints": "Hay JSON-LD de tipo Event; su startDate viene en UTC (convertir a hora Colombia). La tabla TARIFAS, ETAPAS Y PRECIO BOLETERIA trae localidades, etapas, aforo por etapa, precio, cargo por servicio y total: mapear a price_data.zones y sale_stages."
    },
    "defaults": { "timezone": "America/Bogota", "currency": "COP", "city_name": null, "venue_name": null },
    "category_map": { "CONCIERTOS": "concert", "FESTIVALES": "festival" }
  }'::jsonb
),
(
  'Taquilla Live', 'taquillalive', 'https://www.taquillalive.com', 'CO', 'firecrawl',
  '{
    "discovery": {
      "type": "category_pages",
      "category_urls": [
        "https://www.taquillalive.com/eventos-y-boleteria/?event_cat=CONCIERTOS"
      ],
      "event_url_pattern": "/performance-details/\\?[^\"'']+",
      "max_new_pages_per_run": 20
    },
    "fetch": { "wait_for_ms": 6000 },
    "extract": {
      "prefer_jsonld": true,
      "price_source": "html",
      "hints": "Hay JSON-LD de tipo MusicEvent. Extrae el código PULEP (Codigo Pulep) y la promotora (Responsable). CUIDADO: la página incluye un carrusel de OTROS eventos del venue; extrae únicamente el evento principal de la ficha, no los del carrusel."
    },
    "defaults": { "timezone": "America/Bogota", "currency": "COP", "city_name": null, "venue_name": null },
    "category_map": { "CONCIERTOS": "concert" }
  }'::jsonb
),
(
  'Movistar Arena Bogotá', 'movistararena', 'https://movistararena.co', 'CO', 'http',
  '{
    "discovery": {
      "type": "category_pages",
      "category_urls": ["https://movistararena.co/eventos/"],
      "event_url_pattern": "/evento/[^/\"'']+/?",
      "max_new_pages_per_run": 20
    },
    "fetch": {
      "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    },
    "extract": {
      "prefer_jsonld": false,
      "price_source": "none",
      "hints": "Calendario del venue (WordPress). El link de compra puede apuntar a una ticketera externa (TuBoleta, Taquilla Live): guárdalo como ticket_url. Usar siempre el dominio sin www (el certificado de www está roto)."
    },
    "defaults": { "timezone": "America/Bogota", "currency": "COP", "city_name": "Bogotá", "venue_name": "Movistar Arena" },
    "category_map": {}
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
