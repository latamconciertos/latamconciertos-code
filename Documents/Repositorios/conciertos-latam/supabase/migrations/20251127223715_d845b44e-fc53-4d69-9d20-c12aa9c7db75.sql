-- Fase 1 (Corregida): Migración de Seguridad - Actualizar RLS de page_views y sessions

-- =====================================================
-- 1. Limpiar políticas existentes de page_views
-- =====================================================

DROP POLICY IF EXISTS "Allow public insert for page views" ON public.page_views;
DROP POLICY IF EXISTS "Public can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.page_views;
DROP POLICY IF EXISTS "Anyone can track page views" ON public.page_views;
DROP POLICY IF EXISTS "Service role can insert page views" ON public.page_views;
DROP POLICY IF EXISTS "Admins can view all page views" ON public.page_views;
DROP POLICY IF EXISTS "Users can view their own page views" ON public.page_views;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.page_views;

-- Crear nuevas políticas restrictivas para page_views
CREATE POLICY "Service role can insert page views"
  ON public.page_views
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Admins can view all page views"
  ON public.page_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- 2. Limpiar políticas existentes de sessions
-- =====================================================

DROP POLICY IF EXISTS "Allow public insert for sessions" ON public.sessions;
DROP POLICY IF EXISTS "Public can insert sessions" ON public.sessions;
DROP POLICY IF EXISTS "Enable insert for anon users" ON public.sessions;
DROP POLICY IF EXISTS "Anyone can track sessions" ON public.sessions;
DROP POLICY IF EXISTS "Public can update their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow public update for sessions" ON public.sessions;
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sessions;

-- Crear nuevas políticas restrictivas para sessions
CREATE POLICY "Service role can manage sessions"
  ON public.sessions
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Admins can view all sessions"
  ON public.sessions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- =====================================================
-- 3. Actualizar funciones de BD (agregar search_path)
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_admin_setlist_contribution()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  concert_name TEXT;
  artist_name TEXT;
  user_email TEXT;
BEGIN
  IF NEW.status = 'pending' AND NEW.is_official = false THEN
    SELECT c.title, a.name INTO concert_name, artist_name
    FROM concerts c
    LEFT JOIN artists a ON c.artist_id = a.id
    WHERE c.id = NEW.concert_id;
    
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.contributed_by;
    
    INSERT INTO public.admin_notifications (
      type,
      title,
      message,
      reference_id,
      reference_type,
      created_by
    ) VALUES (
      'setlist_contribution',
      'Nueva contribución al setlist',
      user_email || ' agregó "' || NEW.song_name || '" al setlist de ' || COALESCE(concert_name, 'concierto'),
      NEW.id,
      'setlist_song',
      NEW.contributed_by
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_community_member(p_user_id uuid, p_concert_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_community_id UUID;
BEGIN
  SELECT id INTO v_community_id FROM public.concert_communities 
  WHERE concert_id = p_concert_id;
  
  IF v_community_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = v_community_id
    AND user_id = p_user_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.join_concert_community()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_community_id UUID;
BEGIN
  SELECT id INTO v_community_id FROM public.concert_communities 
  WHERE concert_id = NEW.concert_id;
  
  IF v_community_id IS NULL THEN
    INSERT INTO public.concert_communities (concert_id, name, description)
    SELECT 
      NEW.concert_id, 
      COALESCE((SELECT title FROM public.concerts WHERE id = NEW.concert_id), 'Comunidad del concierto'),
      COALESCE((SELECT description FROM public.concerts WHERE id = NEW.concert_id), 'Comunidad para fans de este concierto')
    RETURNING id INTO v_community_id;
  END IF;
  
  INSERT INTO public.community_members (community_id, user_id)
  VALUES (v_community_id, NEW.user_id)
  ON CONFLICT (community_id, user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$function$;