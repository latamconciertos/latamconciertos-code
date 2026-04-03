-- Agregar columna is_favorite a favorite_concerts
ALTER TABLE public.favorite_concerts 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;

-- Migrar datos existentes: los que tenían attendance_type = 'favorite' ahora son is_favorite = true
UPDATE public.favorite_concerts 
SET is_favorite = true 
WHERE attendance_type = 'favorite';

-- Limpiar attendance_type de registros que eran solo favoritos (ahora attendance_type debe ser null)
UPDATE public.favorite_concerts 
SET attendance_type = NULL 
WHERE attendance_type = 'favorite';

-- Crear índice para mejorar consultas de favoritos
CREATE INDEX IF NOT EXISTS idx_favorite_concerts_is_favorite 
ON public.favorite_concerts(user_id, is_favorite) 
WHERE is_favorite = true;

-- Crear índice para consultas de asistencia
CREATE INDEX IF NOT EXISTS idx_favorite_concerts_attendance 
ON public.favorite_concerts(user_id, attendance_type) 
WHERE attendance_type IS NOT NULL;