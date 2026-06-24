-- =============================================
-- SEGURIDAD: Rate limiting para Edge Functions (anti-abuso de APIs pagas)
-- =============================================
-- Tabla + función atómica usadas por supabase/functions/_shared/rateLimit.ts.
-- Solo el SERVICE ROLE (que ignora RLS) accede a estos objetos; anon/authenticated
-- quedan completamente bloqueados.

CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket_key    text        NOT NULL,
  function_name text        NOT NULL,
  identifier    text        NOT NULL,
  window_start  timestamptz NOT NULL,
  request_count integer     NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT edge_rate_limits_bucket_key_uniq UNIQUE (bucket_key)
);

CREATE INDEX IF NOT EXISTS idx_edge_rate_limits_window
  ON public.edge_rate_limits (window_start);

-- RLS habilitado SIN policies => deny-all para anon/authenticated.
-- El service role ignora RLS, así que las Edge Functions sí pueden usarla.
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.edge_rate_limits FROM anon, authenticated;

-- Incremento atómico tipo fixed-window. Devuelve si la petición está permitida,
-- el conteo actual y los segundos hasta que se reinicie la ventana.
CREATE OR REPLACE FUNCTION public.bump_rate_limit(
  p_function_name  text,
  p_identifier     text,
  p_window_seconds integer,
  p_max_requests   integer
) RETURNS TABLE(allowed boolean, current_count integer, retry_after integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );
  v_key text := p_function_name || ':' || p_identifier || ':' ||
                extract(epoch FROM v_window_start)::bigint;
  v_count integer;
BEGIN
  INSERT INTO public.edge_rate_limits
    (bucket_key, function_name, identifier, window_start, request_count)
  VALUES (v_key, p_function_name, p_identifier, v_window_start, 1)
  ON CONFLICT (bucket_key)
  DO UPDATE SET request_count = public.edge_rate_limits.request_count + 1
  RETURNING public.edge_rate_limits.request_count INTO v_count;

  RETURN QUERY SELECT
    v_count <= p_max_requests,
    v_count,
    GREATEST(0, (extract(epoch FROM v_window_start)::int + p_window_seconds)
                 - extract(epoch FROM now())::int);
END;
$$;

REVOKE ALL ON FUNCTION public.bump_rate_limit(text, text, integer, integer) FROM anon, authenticated;
