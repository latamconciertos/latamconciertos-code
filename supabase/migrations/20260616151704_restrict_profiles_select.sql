-- =============================================
-- SEGURIDAD: Cerrar lectura abierta de profiles (fuga de PII)
-- =============================================
-- Antes: la policy "Authenticated users can view profiles for search" usaba
-- USING(true), permitiendo a CUALQUIER usuario autenticado leer TODAS las
-- columnas de TODOS los perfiles (email, bio, is_admin, etc).
--
-- Ahora: profiles solo es legible por el propio usuario, sus amigos o un admin.
-- La búsqueda global de usuarios y el chat de comunidad usan la vista
-- profiles_search, que expone SOLO columnas no sensibles.

-- 1. Reemplazar la policy permisiva por una restringida
DROP POLICY IF EXISTS "Authenticated users can view profiles for search" ON public.profiles;

CREATE POLICY "Users can view own, friends, or as admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.can_view_full_profile(auth.uid(), id)
  OR public.has_role(auth.uid(), 'admin'::user_role)
);

-- 2. Recrear profiles_search como SECURITY DEFINER (intencional).
--    Con la tabla profiles ahora restringida, una vista security_invoker solo
--    devolvería el propio perfil. La hacemos DEFINER para que la búsqueda
--    global siga funcionando, exponiendo ÚNICAMENTE columnas no sensibles.
DROP VIEW IF EXISTS public.profiles_search;

CREATE VIEW public.profiles_search
WITH (security_invoker = false)
AS
SELECT
  p.id,
  p.username,
  p.first_name,
  p.last_name,
  p.country_id,
  p.city_id,
  c.name     AS country_name,
  c.iso_code AS country_iso_code
FROM public.profiles p
LEFT JOIN public.countries c ON p.country_id = c.id;

GRANT SELECT ON public.profiles_search TO authenticated;

COMMENT ON VIEW public.profiles_search IS
  'Búsqueda de usuarios: SOLO columnas no sensibles (sin email/bio/is_admin). '
  'SECURITY DEFINER es intencional para permitir búsqueda global sin exponer PII de la tabla profiles.';
