-- Additional genre mappings for reggaeton variations
-- Run this in Supabase SQL Editor

INSERT INTO genre_mappings (spotify_genre, main_genre) VALUES
-- More reggaeton variations
('reggaeton colombiano', 'Reggaeton'),
('latin trap', 'Reggaeton'),
('puerto rican pop', 'Reggaeton'),
('latin viral pop', 'Reggaeton'),
('dembow', 'Reggaeton'),
('urban contemporary', 'Reggaeton'),

-- Pop Latino variations
('pop urbano', 'Reggaeton'),
('latin arena pop', 'Pop'),
('latin', 'Latino'),

-- More rock variations
('rock espanol', 'Rock'),
('nu metal', 'Metal'),
('progressive rock', 'Rock'),

-- More variations
('trap', 'Hip Hop'),
('trap argentino', 'Reggaeton'),
('musica mexicana', 'Regional Mexicano'),
('corrido tumbado', 'Regional Mexicano')
ON CONFLICT (spotify_genre) DO NOTHING;
