-- DEBUG: Check what auth.uid() returns and what you're trying to insert
-- Run this in Supabase SQL Editor while logged in

-- 1. Check your current auth.uid()
SELECT auth.uid() as my_user_id;

-- 2. Check if you exist in users table
SELECT id, email, role, is_recruiter 
FROM users 
WHERE id = auth.uid()::text;

-- 3. Temporarily disable RLS to test (ONLY FOR DEBUGGING)
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it:
-- ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
