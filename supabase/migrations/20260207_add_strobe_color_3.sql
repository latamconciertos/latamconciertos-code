-- Add strobe_color_3 column to fan_project_color_sequences table
-- This enables 3-color strobe effects for fire simulation and other multi-color effects

ALTER TABLE public.fan_project_color_sequences
ADD COLUMN IF NOT EXISTS strobe_color_3 TEXT;

COMMENT ON COLUMN public.fan_project_color_sequences.strobe_color_3 IS
'Third color for strobe effect. When mode is strobe and this is set, the effect will cycle between color, strobe_color_2, and strobe_color_3. Optional - if not set, only 2 colors will be used.';
