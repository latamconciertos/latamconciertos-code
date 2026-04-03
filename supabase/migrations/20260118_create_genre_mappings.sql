-- Create genre mappings table
-- This table maps Spotify-specific genres to main commercial genres

CREATE TABLE IF NOT EXISTS genre_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_genre TEXT NOT NULL UNIQUE,
  main_genre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_genre_mappings_spotify_genre ON genre_mappings(spotify_genre);
CREATE INDEX IF NOT EXISTS idx_genre_mappings_main_genre ON genre_mappings(main_genre);

-- Add RLS policy (public read)
ALTER TABLE genre_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Genre mappings are viewable by everyone" ON genre_mappings FOR SELECT USING (true);

-- Insert initial data
INSERT INTO genre_mappings (spotify_genre, main_genre) VALUES
-- Pop variations
('pop', 'Pop'),
('latin pop', 'Pop'),
('colombian pop', 'Pop'),
('mexican pop', 'Pop'),
('argentine pop', 'Pop'),
('chilean pop', 'Pop'),
('spanish pop', 'Pop'),

-- Reggaeton variations
('reggaeton', 'Reggaeton'),
('urbano latino', 'Reggaeton'),
('trap latino', 'Reggaeton'),
('latin urban', 'Reggaeton'),
('perreo', 'Reggaeton'),

-- Rock variations
('rock', 'Rock'),
('latin rock', 'Rock'),
('rock en español', 'Rock'),
('classic rock', 'Rock'),
('hard rock', 'Rock'),
('rock and roll', 'Rock'),
('alternative rock', 'Rock'),
('indie rock', 'Rock'),

-- Salsa variations
('salsa', 'Salsa'),
('tropical', 'Salsa'),
('salsa romantica', 'Salsa'),

-- Cumbia variations
('cumbia', 'Cumbia'),
('cumbia villera', 'Cumbia'),
('cumbia colombiana', 'Cumbia'),

-- Bachata
('bachata', 'Bachata'),

-- Merengue
('merengue', 'Merengue'),

-- Regional Mexicano
('regional mexicano', 'Regional Mexicano'),
('banda', 'Regional Mexicano'),
('norteño', 'Regional Mexicano'),
('mariachi', 'Regional Mexicano'),
('ranchera', 'Regional Mexicano'),
('sierreño', 'Regional Mexicano'),
('corridos', 'Regional Mexicano'),

-- Latino general
('latin', 'Latino'),
('latin alternative', 'Latino'),
('latin christian', 'Latino'),

-- Electrónica
('electro', 'Electrónica'),
('electronic', 'Electrónica'),
('edm', 'Electrónica'),
('house', 'Electrónica'),
('techno', 'Electrónica'),
('dance', 'Electrónica'),

-- Metal
('metal', 'Metal'),
('heavy metal', 'Metal'),
('latin metal', 'Metal'),

-- Hip Hop
('hip hop', 'Hip Hop'),
('rap', 'Hip Hop'),
('latin hip hop', 'Hip Hop'),

-- R&B
('r&b', 'R&B'),
('soul', 'R&B'),
('latin r&b', 'R&B'),

-- Vallenato
('vallenato', 'Vallenato'),

-- Reggae
('reggae', 'Reggae'),
('dancehall', 'Reggae'),

-- Jazz
('jazz', 'Jazz'),
('latin jazz', 'Jazz'),

-- Country
('country', 'Country'),

-- Indie
('indie', 'Indie'),
('indie pop', 'Indie'),

-- Cha cha cha
('cha cha cha', 'Tropical'),

-- Christian
('christian', 'Cristiana'),
('worship', 'Cristiana')
ON CONFLICT (spotify_genre) DO NOTHING;
