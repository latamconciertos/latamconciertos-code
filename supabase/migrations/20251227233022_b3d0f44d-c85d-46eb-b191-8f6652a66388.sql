-- Corregir la vista para que NO use SECURITY DEFINER
-- Recreamos la vista como SECURITY INVOKER (por defecto)
DROP VIEW IF EXISTS public.profiles_search;

CREATE VIEW public.profiles_search 
WITH (security_invoker = true)
AS
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

COMMENT ON VIEW public.profiles_search IS 'Vista pública con campos básicos para búsqueda de usuarios - NO incluye datos sensibles - SECURITY INVOKER';