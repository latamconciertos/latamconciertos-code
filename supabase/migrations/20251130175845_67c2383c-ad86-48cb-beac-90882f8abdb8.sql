-- Add unique constraint to prevent duplicate participations
ALTER TABLE fan_project_participants 
ADD CONSTRAINT fan_project_participants_user_project_unique 
UNIQUE (user_id, fan_project_id);