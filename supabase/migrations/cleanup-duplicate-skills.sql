-- 🧹 Clean up duplicate skills for user
-- Run this in Supabase SQL Editor

-- 1. Check current skills count
SELECT 
  user_id,
  COUNT(*) as total_skills,
  COUNT(DISTINCT skill_name) as unique_skills
FROM skills
WHERE user_id = 'user_34EyMVjZgjQIwSHOWEoaIsfhw7t'
GROUP BY user_id;

-- 2. See duplicate skill names
SELECT 
  skill_name,
  COUNT(*) as count
FROM skills
WHERE user_id = 'user_34EyMVjZgjQIwSHOWEoaIsfhw7t'
GROUP BY skill_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. DELETE ALL SKILLS for this user (to start fresh)
DELETE FROM skills
WHERE user_id = 'user_34EyMVjZgjQIwSHOWEoaIsfhw7t';

-- 4. Verify deletion
SELECT COUNT(*) as remaining_skills
FROM skills
WHERE user_id = 'user_34EyMVjZgjQIwSHOWEoaIsfhw7t';

-- Expected: 0 skills remaining
-- Then sync GitHub again - will create ~20-25 unique skills with deduplication!
