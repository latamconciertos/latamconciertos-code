-- Add mode column to fan_project_color_sequences
ALTER TABLE fan_project_color_sequences 
ADD COLUMN mode TEXT NOT NULL DEFAULT 'fixed' CHECK (mode IN ('fixed', 'strobe'));