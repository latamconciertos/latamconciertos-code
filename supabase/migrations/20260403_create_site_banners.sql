-- Site banners configurable from admin
CREATE TABLE IF NOT EXISTS site_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  link TEXT,
  active BOOLEAN DEFAULT false,
  bg_color_from TEXT DEFAULT '#004aad',
  bg_color_to TEXT DEFAULT '#003080',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active banners" ON site_banners FOR SELECT USING (true);
CREATE POLICY "Admins can manage banners" ON site_banners FOR ALL USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Seed the wrapped banner
INSERT INTO site_banners (slug, title, description, link, active, bg_color_from, bg_color_to) VALUES
  ('wrapped-2026', 'Tu Wrapped de Conciertos 2026', 'Descubre tus estadisticas, conecta Spotify y comparte tu resumen musical', '/wrapped', false, '#004aad', '#003080')
ON CONFLICT DO NOTHING;
