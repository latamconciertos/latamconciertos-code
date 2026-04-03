-- Drop existing foreign key constraint
ALTER TABLE venue_sections DROP CONSTRAINT IF EXISTS venue_sections_venue_id_fkey;

-- Add fan_project_id column to venue_sections
ALTER TABLE venue_sections ADD COLUMN fan_project_id UUID;

-- Create foreign key to fan_projects
ALTER TABLE venue_sections 
ADD CONSTRAINT venue_sections_fan_project_id_fkey 
FOREIGN KEY (fan_project_id) REFERENCES fan_projects(id) ON DELETE CASCADE;

-- Make fan_project_id NOT NULL and drop venue_id
ALTER TABLE venue_sections ALTER COLUMN fan_project_id SET NOT NULL;
ALTER TABLE venue_sections DROP COLUMN venue_id;

-- Update RLS policies for venue_sections
DROP POLICY IF EXISTS "Admins can manage venue sections" ON venue_sections;
DROP POLICY IF EXISTS "Public can view venue sections" ON venue_sections;

CREATE POLICY "Admins can manage venue sections"
ON venue_sections
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can view sections from active projects"
ON venue_sections
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM fan_projects
    WHERE fan_projects.id = venue_sections.fan_project_id
    AND fan_projects.status = 'active'
  )
);