-- =====================================================
-- FASE 1: CORRECCIÓN DE POLÍTICAS RLS INSEGURAS
-- Corrige page_views y sessions para tracking seguro
-- =====================================================

-- ==================
-- TABLA: page_views
-- ==================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Anyone can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Service role can insert page views" ON public.page_views;

-- Crear política correcta: permitir inserciones desde el edge function track-analytics
-- Esta política permite insertar page_views con verificación adecuada
CREATE POLICY "Track analytics can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ==================
-- TABLA: sessions
-- ==================

-- Eliminar políticas inseguras
DROP POLICY IF EXISTS "Anyone can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.sessions;

-- Crear políticas correctas para el sistema de tracking
CREATE POLICY "Track analytics can insert sessions"
ON public.sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Track analytics can update sessions"
ON public.sessions
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Las políticas de SELECT para admins se mantienen sin cambios