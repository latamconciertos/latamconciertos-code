-- =====================================================================
-- VERIFICACIÓN DE SEGURIDAD — correr manualmente en el SQL Editor de Supabase
-- =====================================================================
-- Las tablas base `profiles` y `user_roles` no están en las migraciones del
-- repo (fueron creadas vía dashboard/Lovable). De ellas depende TODO el modelo
-- de admin: si un usuario puede auto-asignarse rol admin, toda la autorización
-- es spoofeable. Estas consultas confirman que están bien protegidas.

-- ---------------------------------------------------------------------
-- 1. ¿Tienen RLS habilitado profiles y user_roles?  (relrowsecurity = true)
-- ---------------------------------------------------------------------
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('profiles', 'user_roles')
  AND relnamespace = 'public'::regnamespace;

-- ---------------------------------------------------------------------
-- 2. Revisar las policies de user_roles. NO debe existir ninguna policy de
--    INSERT/UPDATE/DELETE que permita a un usuario escribir su propia fila
--    (p.ej. WITH CHECK (user_id = auth.uid())). La escritura de roles debe
--    estar restringida a has_role(auth.uid(),'admin') o al service role.
-- ---------------------------------------------------------------------
SELECT polname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'user_roles';

-- ---------------------------------------------------------------------
-- 3. Revisar policies de profiles. Confirmar que el SELECT nuevo existe
--    ("Users can view own, friends, or as admin") y que NINGÚN UPDATE permite
--    al usuario cambiar su propio is_admin (idealmente is_admin no debería ser
--    editable por el usuario; la columna de rol real vive en user_roles).
-- ---------------------------------------------------------------------
SELECT polname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'profiles';

-- ---------------------------------------------------------------------
-- 4. PRUEBA ACTIVA (ejecutar logueado como un usuario NORMAL, no admin,
--    desde la app o con su JWT). Ambas deben FALLAR por RLS:
-- ---------------------------------------------------------------------
--   UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
--   INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin');
-- Si alguna tiene ÉXITO => agujero de escalada de privilegios: hay que añadir
-- una migración que restrinja la escritura (ver nota abajo).

-- ---------------------------------------------------------------------
-- 5. Verificar las correcciones aplicadas por las migraciones de esta tanda:
-- ---------------------------------------------------------------------
SELECT tablename, polname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('page_views', 'sessions')
ORDER BY tablename, cmd;
-- Esperado: SOLO policies de SELECT (admin). Sin INSERT/UPDATE para anon/authenticated.

-- Probar el rate limiter (debe devolver allowed=false tras superar el límite):
-- SELECT * FROM public.bump_rate_limit('test-fn', 'ip:1.2.3.4', 60, 2);  -- correr 3 veces

-- ---------------------------------------------------------------------
-- MIGRACIÓN CORRECTIVA (aplicar SOLO si el paso 4 reveló un agujero)
-- ---------------------------------------------------------------------
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Users can manage their roles" ON public.user_roles;  -- nombre real según paso 2
-- CREATE POLICY "Only admins manage roles" ON public.user_roles
--   FOR ALL TO authenticated
--   USING (public.has_role(auth.uid(), 'admin'::user_role))
--   WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));
-- -- Permitir a cada usuario LEER sus propios roles (necesario para el guard del front):
-- CREATE POLICY "Users can read own roles" ON public.user_roles
--   FOR SELECT TO authenticated USING (user_id = auth.uid());
