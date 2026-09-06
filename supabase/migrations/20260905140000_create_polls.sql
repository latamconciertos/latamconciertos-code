-- Encuestas de festival (polls): top-N de artistas + perfil anónimo de audiencia.
-- Las respuestas SOLO entran por la edge function poll-submit (service role): el público
-- nunca escribe directo en estas tablas ni en artists. El dashboard para promotores se
-- comparte con un token privado (poll_share_links) que resuelve get_poll_results().

-- ---------------------------------------------------------------------------
-- 1. artists.spotify_id: identidad canónica para deduplicar artistas creados desde encuestas.
--    Hasta ahora vivía solo dentro de social_links->>'spotify_id'.
-- ---------------------------------------------------------------------------
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS spotify_id text;

WITH candidates AS (
  SELECT id, social_links->>'spotify_id' AS sid
  FROM public.artists
  WHERE social_links->>'spotify_id' IS NOT NULL
    AND social_links->>'spotify_id' <> ''
),
uniq AS (
  SELECT sid FROM candidates GROUP BY sid HAVING count(*) = 1
)
UPDATE public.artists a
SET spotify_id = c.sid
FROM candidates c
JOIN uniq u ON u.sid = c.sid
WHERE a.id = c.id AND a.spotify_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS artists_spotify_id_uniq
  ON public.artists (spotify_id)
  WHERE spotify_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Tablas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.polls (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  title            text NOT NULL,
  description      text,
  question         text NOT NULL DEFAULT '¿Qué artistas te gustaría ver en la próxima edición?',
  festival_id      uuid REFERENCES public.festivals(id) ON DELETE SET NULL,
  is_active        boolean NOT NULL DEFAULT false,
  starts_at        timestamptz,
  ends_at          timestamptz,
  max_choices      integer NOT NULL DEFAULT 3 CHECK (max_choices BETWEEN 1 AND 5),
  ask_demographics boolean NOT NULL DEFAULT true,
  day_options      text[] NOT NULL DEFAULT ARRAY['Sábado', 'Domingo', 'Ambos días'],
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Token privado del dashboard de resultados, separado de polls para que el SELECT
-- público de encuestas activas nunca lo exponga.
CREATE TABLE IF NOT EXISTS public.poll_share_links (
  poll_id    uuid PRIMARY KEY REFERENCES public.polls(id) ON DELETE CASCADE,
  token      text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_responses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id           uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  device_token      text NOT NULL,
  -- perfil anónimo de audiencia (todo opcional)
  age_range         text,
  origin_city       text,
  editions_attended text,
  attended_day      text,
  favorite_genre    text,
  heard_from        text,
  source            text NOT NULL DEFAULT 'web',
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_responses_device_uniq UNIQUE (poll_id, device_token)
);

CREATE INDEX IF NOT EXISTS poll_responses_poll_created_idx
  ON public.poll_responses (poll_id, created_at);

CREATE TABLE IF NOT EXISTS public.poll_response_artists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.poll_responses(id) ON DELETE CASCADE,
  poll_id     uuid NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  artist_id   uuid REFERENCES public.artists(id) ON DELETE SET NULL,
  artist_name text NOT NULL,
  spotify_id  text,
  position    integer NOT NULL CHECK (position >= 1),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT poll_response_artists_position_uniq UNIQUE (response_id, position)
);

CREATE INDEX IF NOT EXISTS poll_response_artists_poll_artist_idx
  ON public.poll_response_artists (poll_id, artist_id);

DROP TRIGGER IF EXISTS polls_set_updated_at ON public.polls;
CREATE TRIGGER polls_set_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.create_poll_share_link()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.poll_share_links (poll_id) VALUES (NEW.id)
  ON CONFLICT (poll_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Es un trigger: nadie debe poder invocarlo por RPC.
REVOKE EXECUTE ON FUNCTION public.create_poll_share_link() FROM public, anon, authenticated;

DROP TRIGGER IF EXISTS polls_create_share_link ON public.polls;
CREATE TRIGGER polls_create_share_link
  AFTER INSERT ON public.polls
  FOR EACH ROW EXECUTE FUNCTION public.create_poll_share_link();

-- ---------------------------------------------------------------------------
-- 3. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_share_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_response_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active polls" ON public.polls;
CREATE POLICY "Public can view active polls"
  ON public.polls FOR SELECT TO public
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (ends_at IS NULL OR ends_at >= now())
  );

DROP POLICY IF EXISTS "Admins manage polls" ON public.polls;
CREATE POLICY "Admins manage polls"
  ON public.polls FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "Admins view share links" ON public.poll_share_links;
CREATE POLICY "Admins view share links"
  ON public.poll_share_links FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "Admins view poll responses" ON public.poll_responses;
CREATE POLICY "Admins view poll responses"
  ON public.poll_responses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "Admins delete poll responses" ON public.poll_responses;
CREATE POLICY "Admins delete poll responses"
  ON public.poll_responses FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

DROP POLICY IF EXISTS "Admins view poll response artists" ON public.poll_response_artists;
CREATE POLICY "Admins view poll response artists"
  ON public.poll_response_artists FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

-- ---------------------------------------------------------------------------
-- 4. Resultados agregados (token-gated). SECURITY DEFINER para que el link compartido
--    con la promotora funcione sin sesión; nunca devuelve filas individuales.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.poll_field_breakdown(p_poll_id uuid, p_field text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('value', v, 'count', c) ORDER BY c DESC), '[]'::jsonb)
  FROM (
    SELECT
      CASE p_field
        WHEN 'age_range'         THEN age_range
        WHEN 'editions_attended' THEN editions_attended
        WHEN 'attended_day'      THEN attended_day
        WHEN 'favorite_genre'    THEN favorite_genre
        WHEN 'heard_from'        THEN heard_from
        WHEN 'source'            THEN source
      END AS v,
      count(*) AS c
    FROM public.poll_responses
    WHERE poll_id = p_poll_id
    GROUP BY 1
  ) t
  WHERE v IS NOT NULL AND v <> '';
$$;

REVOKE EXECUTE ON FUNCTION public.poll_field_breakdown(uuid, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_poll_results(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_poll   public.polls%ROWTYPE;
  v_result jsonb;
BEGIN
  SELECT p.* INTO v_poll
  FROM public.polls p
  JOIN public.poll_share_links l ON l.poll_id = p.id
  WHERE l.token = p_token;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  WITH mentions AS (
    SELECT
      pra.position,
      COALESCE(pra.artist_id::text, lower(trim(pra.artist_name))) AS artist_key,
      COALESCE(a.name, pra.artist_name) AS artist_name,
      a.slug      AS artist_slug,
      a.photo_url AS photo_url,
      (v_poll.max_choices - pra.position + 1) AS points,
      r.age_range,
      r.origin_city
    FROM public.poll_response_artists pra
    JOIN public.poll_responses r ON r.id = pra.response_id
    LEFT JOIN public.artists a ON a.id = pra.artist_id
    WHERE pra.poll_id = v_poll.id
  ),
  ranking AS (
    SELECT
      artist_key,
      max(artist_name) AS artist_name,
      max(artist_slug) AS artist_slug,
      max(photo_url)   AS photo_url,
      count(*)         AS mentions,
      sum(points)      AS points,
      count(*) FILTER (WHERE position = 1) AS p1,
      count(*) FILTER (WHERE position = 2) AS p2,
      count(*) FILTER (WHERE position = 3) AS p3,
      count(*) FILTER (WHERE position > 3) AS p_other,
      round(avg(position)::numeric, 2) AS avg_position
    FROM mentions
    GROUP BY artist_key
    ORDER BY points DESC, mentions DESC, p1 DESC, artist_name ASC
    LIMIT 100
  ),
  top10 AS (SELECT artist_key FROM ranking LIMIT 10)
  SELECT jsonb_build_object(
    'poll', jsonb_build_object(
      'id', v_poll.id,
      'slug', v_poll.slug,
      'title', v_poll.title,
      'description', v_poll.description,
      'question', v_poll.question,
      'max_choices', v_poll.max_choices,
      'is_active', v_poll.is_active,
      'day_options', to_jsonb(v_poll.day_options),
      'festival', (
        SELECT jsonb_build_object('name', f.name, 'slug', f.slug, 'start_date', f.start_date)
        FROM public.festivals f WHERE f.id = v_poll.festival_id
      )
    ),
    'totals', (
      SELECT jsonb_build_object(
        'responses', count(*),
        'first_at', min(created_at),
        'last_at', max(created_at),
        'logged_in', count(*) FILTER (WHERE user_id IS NOT NULL)
      )
      FROM public.poll_responses WHERE poll_id = v_poll.id
    ),
    'unique_artists', (SELECT count(DISTINCT artist_key) FROM mentions),
    'artists', (SELECT COALESCE(jsonb_agg(to_jsonb(r)), '[]'::jsonb) FROM ranking r),
    'by_day', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('day', d, 'count', c) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT (created_at AT TIME ZONE 'America/Bogota')::date AS d, count(*) AS c
        FROM public.poll_responses WHERE poll_id = v_poll.id
        GROUP BY 1
      ) t
    ),
    'demographics', jsonb_build_object(
      'age_range',         public.poll_field_breakdown(v_poll.id, 'age_range'),
      'editions_attended', public.poll_field_breakdown(v_poll.id, 'editions_attended'),
      'attended_day',      public.poll_field_breakdown(v_poll.id, 'attended_day'),
      'favorite_genre',    public.poll_field_breakdown(v_poll.id, 'favorite_genre'),
      'heard_from',        public.poll_field_breakdown(v_poll.id, 'heard_from'),
      'source',            public.poll_field_breakdown(v_poll.id, 'source')
    ),
    'cities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('value', v, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (
        SELECT initcap(lower(trim(origin_city))) AS v, count(*) AS c
        FROM public.poll_responses
        WHERE poll_id = v_poll.id AND origin_city IS NOT NULL AND trim(origin_city) <> ''
        GROUP BY 1
        ORDER BY 2 DESC
        LIMIT 30
      ) t
    ),
    'artist_by_age', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'artist_key', artist_key, 'artist_name', artist_name, 'age_range', age_range, 'count', c
      )), '[]'::jsonb)
      FROM (
        SELECT m.artist_key, max(m.artist_name) AS artist_name, m.age_range, count(*) AS c
        FROM mentions m
        JOIN top10 t USING (artist_key)
        WHERE m.age_range IS NOT NULL
        GROUP BY m.artist_key, m.age_range
      ) x
    )
  )
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_poll_results(text) TO anon, authenticated;
