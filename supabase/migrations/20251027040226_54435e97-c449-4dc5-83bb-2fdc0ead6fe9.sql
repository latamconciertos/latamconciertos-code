-- Corregir el slug del artículo de Shakira que causa error 404 en Google
UPDATE news_articles 
SET slug = 'shakira-celebra-los-aniversarios-de-pies-descalzos-y-fijacion-oral-con-una-serie-especial-en-spotify',
    updated_at = now()
WHERE id = '380609fc-2357-46d1-804c-68abf839a694';

-- Auditar otros slugs con caracteres problemáticos
-- Esta query mostrará en los logs los slugs que podrían necesitar corrección
DO $$
DECLARE
  article_record RECORD;
  new_slug TEXT;
BEGIN
  FOR article_record IN 
    SELECT id, title, slug, status 
    FROM news_articles 
    WHERE status = 'published'
    AND (
      slug ~ '[áàäâãåæ]' OR 
      slug ~ '[éèëê]' OR 
      slug ~ '[íìïî]' OR 
      slug ~ '[óòöôõø]' OR 
      slug ~ '[úùüû]' OR 
      slug ~ '[ñ]' OR
      slug ~ '[ýÿ]' OR
      slug ~ '[^a-z0-9-]'
    )
  LOOP
    RAISE NOTICE 'Artículo con slug problemático: ID=%, Title=%, Slug=%', 
      article_record.id, article_record.title, article_record.slug;
  END LOOP;
END $$;