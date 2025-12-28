-- Corregir las políticas RLS para la tabla artists
-- Eliminar las políticas existentes
DROP POLICY IF EXISTS "Admins can do anything with artists" ON artists;
DROP POLICY IF EXISTS "Allow public read access to artists" ON artists;

-- Crear nuevas políticas más claras
-- 1. Admins pueden hacer todo con artistas
CREATE POLICY "Admins full access to artists"
ON artists
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 2. Todos pueden ver artistas
CREATE POLICY "Public can view artists"
ON artists
FOR SELECT
TO public
USING (true);