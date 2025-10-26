-- QUICK FIX: Allow authenticated users to insert assignments
-- Run this in Supabase SQL Editor

-- Drop existing policy if any
DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;

-- Create INSERT policy
CREATE POLICY "Users can insert their own assignments"
ON assignments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND employer_id = auth.uid()::text
);

-- Done! Try creating assignment again.
