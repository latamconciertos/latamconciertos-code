-- Mejorar las políticas RLS para news_articles
-- Eliminar las políticas existentes que pueden causar conflictos
DROP POLICY IF EXISTS "Admins can do anything with news_articles" ON news_articles;
DROP POLICY IF EXISTS "Public access to published news articles" ON news_articles;
DROP POLICY IF EXISTS "Anyone can view published articles" ON news_articles;
DROP POLICY IF EXISTS "Authenticated users can manage their own articles" ON news_articles;
DROP POLICY IF EXISTS "Admins can manage all articles" ON news_articles;
DROP POLICY IF EXISTS "Moderators can do anything with news_articles" ON news_articles;

-- Crear nuevas políticas más claras y sin conflictos
-- 1. Admins pueden hacer todo con cualquier artículo
CREATE POLICY "Admins full access to news articles"
ON news_articles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- 2. Moderadores pueden hacer todo con cualquier artículo
CREATE POLICY "Moderators full access to news articles"
ON news_articles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'moderator'::user_role))
WITH CHECK (has_role(auth.uid(), 'moderator'::user_role));

-- 3. Todos (incluyendo anónimos) pueden ver artículos publicados
CREATE POLICY "Public can view published news articles"
ON news_articles
FOR SELECT
TO public
USING (status = 'published'::article_status);

-- 4. Autores pueden gestionar sus propios artículos
CREATE POLICY "Authors can manage own news articles"
ON news_articles
FOR ALL
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());