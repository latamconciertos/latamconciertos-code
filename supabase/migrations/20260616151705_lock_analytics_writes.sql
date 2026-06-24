-- =============================================
-- SEGURIDAD: Cerrar INSERT/UPDATE anónimo en page_views y sessions
-- =============================================
-- Antes: la migración 20251127225938 reabrió INSERT/UPDATE a anon/authenticated
-- con WITH CHECK(true)/USING(true), permitiendo a cualquiera inyectar analítica
-- falsa y MODIFICAR sesiones ajenas (UPDATE sessions USING(true)).
--
-- El tracking legítimo lo realiza la Edge Function track-analytics usando el
-- SERVICE ROLE, que IGNORA RLS. Por tanto cerrar estas policies NO afecta el
-- tracking. El admin sigue leyendo gracias a sus policies de SELECT (intactas).

-- page_views: eliminar INSERT abierto (+ variantes legacy defensivas)
DROP POLICY IF EXISTS "Track analytics can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Service role can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Allow anonymous page view inserts" ON public.page_views;

-- sessions: eliminar INSERT/UPDATE abiertos (+ variantes legacy defensivas)
DROP POLICY IF EXISTS "Track analytics can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Track analytics can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow anonymous session inserts" ON public.sessions;
DROP POLICY IF EXISTS "Allow anonymous session updates" ON public.sessions;

-- Asegurar RLS habilitado (deny-all por defecto salvo policies explícitas)
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions   ENABLE ROW LEVEL SECURITY;

-- Revocar grants de tabla: ni siquiera con una policy accidental futura podrán
-- anon/authenticated escribir. El service role no se ve afectado.
REVOKE INSERT, UPDATE, DELETE ON public.page_views FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.sessions   FROM anon, authenticated;
