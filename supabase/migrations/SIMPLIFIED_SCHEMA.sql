-- SIMPLIFIED SCHEMA FIX
-- This makes users.id = Clerk ID (simpler, less error-prone)

-- Step 1: Drop the confusing clerk_id column
ALTER TABLE users DROP COLUMN IF EXISTS clerk_id;

-- Step 2: Now users.id IS the Clerk ID
-- No need for separate clerk_id column!

-- Step 3: Update RLS policy to use id instead of clerk_id
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id);

-- Step 4: Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_summary TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS career_level TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS key_strengths TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address TEXT;

-- Step 5: Add missing columns to skills table
ALTER TABLE skills ADD COLUMN IF NOT EXISTS example_repos TEXT[];
ALTER TABLE skills ADD COLUMN IF NOT EXISTS ai_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS ai_generated_code BOOLEAN DEFAULT FALSE;

-- Step 6: Add missing columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ai_analysis TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS impact_statement TEXT;

-- Step 7: Add skill_recommendations table
CREATE TABLE IF NOT EXISTS skill_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  reason TEXT,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE INDEX IF NOT EXISTS idx_skill_recommendations_user_id ON skill_recommendations(user_id);

-- Step 8: Add metadata column to sync_status
ALTER TABLE sync_status ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Step 9: Make sync_status user_id + source unique
ALTER TABLE sync_status ADD CONSTRAINT IF NOT EXISTS sync_status_user_source_unique UNIQUE(user_id, source);

-- RESULT:
-- ✅ users.id = Clerk ID (primary key)
-- ✅ skills.user_id = Clerk ID (foreign key)
-- ✅ projects.user_id = Clerk ID (foreign key)
-- ✅ No more confusion!
