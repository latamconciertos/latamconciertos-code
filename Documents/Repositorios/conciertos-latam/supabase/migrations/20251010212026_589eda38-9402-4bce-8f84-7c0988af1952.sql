-- Agregar columna artist_id a news_articles para relacionar artículos con artistas
ALTER TABLE public.news_articles 
ADD COLUMN artist_id uuid REFERENCES public.artists(id) ON DELETE SET NULL;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX idx_news_articles_artist_id ON public.news_articles(artist_id);

-- Comentario explicativo
COMMENT ON COLUMN public.news_articles.artist_id IS 'Artista relacionado con el artículo. Si no hay featured_image, se usará la foto del artista.';