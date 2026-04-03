-- Add strobe_speed column to fan_project_color_sequences table
-- This allows admins to configure how fast the strobe effect flickers

ALTER TABLE public.fan_project_color_sequences
ADD COLUMN IF NOT EXISTS strobe_speed INTEGER DEFAULT 80;

-- Add comment to explain the column
COMMENT ON COLUMN public.fan_project_color_sequences.strobe_speed IS 
'Speed of strobe effect in milliseconds. Lower values = faster flickering. Recommended range: 40-200ms. Default: 80ms.';
