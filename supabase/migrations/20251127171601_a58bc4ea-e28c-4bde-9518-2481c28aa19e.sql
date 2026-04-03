-- Modificar tabla setlist_songs para soportar colaboración
ALTER TABLE public.setlist_songs
ADD COLUMN contributed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN is_official BOOLEAN DEFAULT false,
ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Crear índices para mejorar performance
CREATE INDEX idx_setlist_songs_status ON public.setlist_songs(status);
CREATE INDEX idx_setlist_songs_contributed_by ON public.setlist_songs(contributed_by);

-- Marcar todas las canciones existentes como oficiales y aprobadas
UPDATE public.setlist_songs 
SET is_official = true, 
    status = 'approved'
WHERE is_official IS NULL;

-- Crear tabla de notificaciones para admin
CREATE TABLE public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Habilitar RLS en admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_notifications
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can create notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Actualizar políticas RLS de setlist_songs
DROP POLICY IF EXISTS "Only admins can insert setlist songs" ON public.setlist_songs;
DROP POLICY IF EXISTS "Only admins can update setlist songs" ON public.setlist_songs;
DROP POLICY IF EXISTS "Only admins can delete setlist songs" ON public.setlist_songs;

-- Usuarios autenticados pueden agregar canciones (pendientes)
CREATE POLICY "Authenticated users can add pending songs"
ON public.setlist_songs FOR INSERT
TO authenticated
WITH CHECK (
  contributed_by = auth.uid() 
  AND status = 'pending' 
  AND is_official = false
);

-- Usuarios pueden eliminar solo sus propias contribuciones pendientes
CREATE POLICY "Users can delete own pending contributions"
ON public.setlist_songs FOR DELETE
TO authenticated
USING (
  contributed_by = auth.uid() 
  AND status = 'pending'
);

-- Admins pueden hacer todo
CREATE POLICY "Admins can manage all setlist songs"
ON public.setlist_songs FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Actualizar política de lectura para mostrar solo aprobadas públicamente
DROP POLICY IF EXISTS "Setlist songs are viewable by everyone" ON public.setlist_songs;

CREATE POLICY "Public can view approved setlist songs"
ON public.setlist_songs FOR SELECT
TO authenticated, anon
USING (status = 'approved');

-- Usuarios pueden ver sus propias contribuciones pendientes
CREATE POLICY "Users can view own pending contributions"
ON public.setlist_songs FOR SELECT
TO authenticated
USING (
  contributed_by = auth.uid() 
  AND status = 'pending'
);

-- Función para crear notificación automáticamente al agregar canción
CREATE OR REPLACE FUNCTION public.notify_admin_setlist_contribution()
RETURNS TRIGGER AS $$
DECLARE
  concert_name TEXT;
  artist_name TEXT;
  user_email TEXT;
BEGIN
  -- Solo crear notificación si es una contribución de usuario (no oficial)
  IF NEW.status = 'pending' AND NEW.is_official = false THEN
    -- Obtener info del concierto
    SELECT c.title, a.name INTO concert_name, artist_name
    FROM concerts c
    LEFT JOIN artists a ON c.artist_id = a.id
    WHERE c.id = NEW.concert_id;
    
    -- Obtener email del usuario
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = NEW.contributed_by;
    
    -- Crear notificación
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para notificar al admin
CREATE TRIGGER trigger_notify_admin_setlist_contribution
AFTER INSERT ON public.setlist_songs
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_setlist_contribution();