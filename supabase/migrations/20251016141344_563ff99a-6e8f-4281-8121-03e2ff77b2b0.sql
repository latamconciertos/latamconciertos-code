-- Agregar tabla para multimedia de noticias
CREATE TABLE IF NOT EXISTS public.news_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  media_url TEXT NOT NULL,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para optimizar consultas por artículo
CREATE INDEX idx_news_media_article_id ON public.news_media(article_id);

-- Habilitar RLS
ALTER TABLE public.news_media ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para news_media
CREATE POLICY "Public can view media from published articles"
ON public.news_media
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.news_articles
    WHERE news_articles.id = news_media.article_id
    AND news_articles.status = 'published'
  )
);

CREATE POLICY "Admins can manage all news media"
ON public.news_media
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Función para actualizar updated_at automáticamente
CREATE TRIGGER update_news_media_updated_at
  BEFORE UPDATE ON public.news_media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_column();

-- Agregar índice para optimizar consultas de noticias por concierto
CREATE INDEX IF NOT EXISTS idx_news_articles_concert_id ON public.news_articles(concert_id);