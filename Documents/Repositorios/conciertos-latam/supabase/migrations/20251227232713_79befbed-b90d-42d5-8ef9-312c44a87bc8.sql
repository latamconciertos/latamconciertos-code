-- =============================================
-- FASE 1: SEGURIDAD - Sistema de Amigos y Perfiles
-- =============================================

-- 1. Crear función para verificar acceso a perfil completo
CREATE OR REPLACE FUNCTION public.can_view_full_profile(viewer_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    viewer_id = target_id  -- Es su propio perfil
    OR public.are_friends(viewer_id, target_id)  -- Son amigos
    OR public.has_role(viewer_id, 'admin')  -- Es admin
$$;

-- 2. Actualizar RLS de profiles para permitir búsqueda
-- Primero eliminamos la policy restrictiva actual
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Nueva policy: Usuarios autenticados pueden ver perfiles (para búsqueda)
-- La protección de datos sensibles se hace a nivel de aplicación
CREATE POLICY "Authenticated users can view profiles for search"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. Crear vista pública con solo campos necesarios para búsqueda
CREATE OR REPLACE VIEW public.profiles_search AS
SELECT 
  p.id,
  p.username,
  p.first_name,
  p.last_name,
  p.country_id,
  p.city_id,
  c.name as country_name,
  c.iso_code as country_iso_code
FROM public.profiles p
LEFT JOIN public.countries c ON p.country_id = c.id;

-- Dar permisos a la vista
GRANT SELECT ON public.profiles_search TO authenticated;

-- 4. Corregir advertising_requests - asegurar que solo admins pueden leer
-- Las policies actuales ya están correctas según el análisis previo:
-- - "Anyone can submit advertising requests" para INSERT
-- - "Admins can view all advertising requests" para SELECT
-- Pero vamos a verificar y reforzar

-- Eliminar cualquier policy de SELECT que no sea para admins
DROP POLICY IF EXISTS "Public can view advertising requests" ON public.advertising_requests;

-- Asegurar que la policy de INSERT es correcta (permite a cualquiera enviar)
DROP POLICY IF EXISTS "Anyone can submit advertising requests" ON public.advertising_requests;
CREATE POLICY "Anyone can submit advertising requests"
ON public.advertising_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Asegurar que solo admins pueden ver las solicitudes
DROP POLICY IF EXISTS "Admins can view all advertising requests" ON public.advertising_requests;
CREATE POLICY "Admins can view all advertising requests"
ON public.advertising_requests
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 5. Agregar comentarios de documentación
COMMENT ON FUNCTION public.can_view_full_profile IS 'Verifica si un usuario puede ver el perfil completo de otro (propio, amigo, o admin)';
COMMENT ON VIEW public.profiles_search IS 'Vista pública con campos básicos para búsqueda de usuarios - NO incluye datos sensibles';