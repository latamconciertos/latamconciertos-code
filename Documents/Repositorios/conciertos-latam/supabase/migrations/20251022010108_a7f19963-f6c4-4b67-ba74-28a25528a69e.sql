-- Add is_featured column to concerts table
ALTER TABLE public.concerts 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;