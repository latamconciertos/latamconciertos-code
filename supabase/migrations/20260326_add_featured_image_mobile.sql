-- Add mobile featured image column to news_articles
-- This allows separate cropped images for desktop (16:9) and mobile (4:5)
ALTER TABLE news_articles
ADD COLUMN IF NOT EXISTS featured_image_mobile TEXT;
