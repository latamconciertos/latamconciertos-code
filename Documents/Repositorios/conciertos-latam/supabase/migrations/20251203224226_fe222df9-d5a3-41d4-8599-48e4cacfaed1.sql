-- Add photo_credit column to news_articles table
ALTER TABLE public.news_articles 
ADD COLUMN photo_credit text;