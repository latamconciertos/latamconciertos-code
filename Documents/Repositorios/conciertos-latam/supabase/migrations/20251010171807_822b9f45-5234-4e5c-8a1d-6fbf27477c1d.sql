-- Add thumbnail_url column to media_items table
ALTER TABLE public.media_items 
ADD COLUMN thumbnail_url TEXT;