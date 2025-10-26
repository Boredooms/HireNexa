-- Fix Row Level Security for assignments table
-- This allows authenticated users to insert/update/delete their own assignments
-- Note: users.id is already the Clerk ID (text), not a separate clerk_id column

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view all assignments" ON assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignments;

-- Enable RLS (if not already enabled)
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view active assignments
CREATE POLICY "Users can view all assignments"
ON assignments
FOR SELECT
USING (true);

-- Policy 2: Authenticated users can insert assignments
-- The employer_id should match their user ID (Clerk ID)
CREATE POLICY "Users can insert their own assignments"
ON assignments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND employer_id = auth.uid()::text
);

-- Policy 3: Users can update their own assignments
CREATE POLICY "Users can update their own assignments"
ON assignments
FOR UPDATE
USING (employer_id = auth.uid()::text)
WITH CHECK (employer_id = auth.uid()::text);

-- Policy 4: Users can delete their own assignments
CREATE POLICY "Users can delete their own assignments"
ON assignments
FOR DELETE
USING (employer_id = auth.uid()::text);

-- Also fix assignment_submissions table
DROP POLICY IF EXISTS "Users can view all submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Users can insert their own submissions" ON assignment_submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON assignment_submissions;

ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can view submissions
CREATE POLICY "Users can view all submissions"
ON assignment_submissions
FOR SELECT
USING (true);

-- Authenticated users can submit
CREATE POLICY "Users can insert their own submissions"
ON assignment_submissions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND candidate_id = auth.uid()::text
);

-- Users can update their own submissions
CREATE POLICY "Users can update their own submissions"
ON assignment_submissions
FOR UPDATE
USING (candidate_id = auth.uid()::text)
WITH CHECK (candidate_id = auth.uid()::text);
