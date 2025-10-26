-- Add UNIQUE constraints for upsert operations
-- This fixes the "42P10: no unique constraint matching ON CONFLICT" error

-- Add UNIQUE constraint to skills table
ALTER TABLE skills 
ADD CONSTRAINT skills_user_skill_unique UNIQUE (user_id, skill_name);

-- Add UNIQUE constraint to projects table
ALTER TABLE projects 
ADD CONSTRAINT projects_user_name_unique UNIQUE (user_id, name);

-- Add UNIQUE constraint to skill_recommendations table
ALTER TABLE skill_recommendations 
ADD CONSTRAINT skill_recommendations_user_skill_unique UNIQUE (user_id, skill_name);

-- Add UNIQUE constraint to sync_status table
ALTER TABLE sync_status 
ADD CONSTRAINT sync_status_user_source_unique UNIQUE (user_id, source);
