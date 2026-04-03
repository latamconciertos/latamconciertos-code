-- 1. Agregar campos de nombre y apellido a profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- 2. Crear tabla de insignias disponibles
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- URL del icono o emoji
  criteria_type TEXT NOT NULL, -- 'concert_count', 'artist_specific', 'venue_specific', 'genre_specific'
  criteria_value JSONB, -- Detalles del criterio (ej: {"count": 10} o {"artist_id": "uuid"})
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Crear tabla de insignias ganadas por usuarios
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- 4. Agregar campo de tipo a favorite_concerts para distinguir favorito vs asistencia
ALTER TABLE public.favorite_concerts
ADD COLUMN IF NOT EXISTS attendance_type TEXT DEFAULT 'favorite' CHECK (attendance_type IN ('favorite', 'attending', 'tentative'));

-- 5. Habilitar RLS en las nuevas tablas
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS para badges (todos pueden ver)
CREATE POLICY "Anyone can view badges"
ON public.badges FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage badges"
ON public.badges FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- 7. Políticas RLS para user_badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view others' badges"
ON public.user_badges FOR SELECT
USING (true);

CREATE POLICY "Only system can award badges"
ON public.user_badges FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 8. Insertar algunas insignias de ejemplo
INSERT INTO public.badges (name, description, icon, criteria_type, criteria_value) VALUES
('Primer Concierto', 'Asististe a tu primer concierto', '🎵', 'concert_count', '{"count": 1}'),
('Fan Dedicado', 'Asististe a 5 conciertos', '⭐', 'concert_count', '{"count": 5}'),
('Súper Fan', 'Asististe a 10 conciertos', '🌟', 'concert_count', '{"count": 10}'),
('Leyenda', 'Asististe a 25 conciertos', '👑', 'concert_count', '{"count": 25}'),
('Maratonista', 'Asististe a 50 conciertos', '🏆', 'concert_count', '{"count": 50}')
ON CONFLICT DO NOTHING;