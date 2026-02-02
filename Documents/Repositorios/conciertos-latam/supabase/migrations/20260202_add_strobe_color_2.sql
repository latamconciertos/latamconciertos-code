-- Add strobe_color_2 column to fan_project_color_sequences table
-- This allows strobe effects to alternate between two colors instead of color/black

ALTER TABLE public.fan_project_color_sequences
ADD COLUMN IF NOT EXISTS strobe_color_2 TEXT DEFAULT '#FFFFFF';

-- Add comment to explain the column
COMMENT ON COLUMN public.fan_project_color_sequences.strobe_color_2 IS 
'Second color for strobe effect. When mode is strobe, the effect will alternate between color and strobe_color_2. Defaults to white (#FFFFFF) for maximum brightness.';
