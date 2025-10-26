-- ============================================
-- TEST USERS FOR SKILL EXCHANGE MATCHING
-- Run this in Supabase SQL Editor
-- ============================================

-- Test User 1: Sarah (UI/UX Designer) - Perfect Match!
INSERT INTO skill_exchange_profiles (
  user_id,
  name,
  avatar_url,
  bio,
  skills_offered,
  skills_wanted,
  interests,
  experience_level,
  availability,
  online,
  last_active,
  created_at,
  updated_at
) VALUES (
  'test_user_sarah_001',
  'Sarah Johnson',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
  'UI/UX Designer passionate about creating beautiful interfaces. Looking to learn React and TypeScript!',
  ARRAY['UI/UX Design', 'Figma', 'Adobe XD', 'Prototyping', 'User Research'],
  ARRAY['React', 'TypeScript', 'Next.js'],
  ARRAY['Web Development', 'Design Systems', 'Teaching'],
  'intermediate',
  'Weekends and evenings',
  true,
  NOW(),
  NOW(),
  NOW()
);

-- Test User 2: Mike (DevOps Engineer) - Good Match
INSERT INTO skill_exchange_profiles (
  user_id,
  name,
  avatar_url,
  bio,
  skills_offered,
  skills_wanted,
  interests,
  experience_level,
  availability,
  online,
  last_active,
  created_at,
  updated_at
) VALUES (
  'test_user_mike_002',
  'Mike Chen',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
  'DevOps engineer with 5 years experience. Want to learn Python for automation!',
  ARRAY['DevOps', 'Kubernetes', 'Docker', 'CI/CD', 'AWS'],
  ARRAY['Python', 'Machine Learning', 'Data Science'],
  ARRAY['Cloud Computing', 'Automation'],
  'advanced',
  'Flexible schedule',
  false,
  NOW() - INTERVAL '2 hours',
  NOW(),
  NOW()
);

-- Test User 3: Emma (Mobile Developer) - Medium Match
INSERT INTO skill_exchange_profiles (
  user_id,
  name,
  avatar_url,
  bio,
  skills_offered,
  skills_wanted,
  interests,
  experience_level,
  availability,
  online,
  last_active,
  created_at,
  updated_at
) VALUES (
  'test_user_emma_003',
  'Emma Rodriguez',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  'Mobile app developer specializing in React Native. Want to expand to web development!',
  ARRAY['React Native', 'Mobile Development', 'iOS', 'Android', 'Flutter'],
  ARRAY['Next.js', 'Node.js', 'PostgreSQL'],
  ARRAY['Mobile Apps', 'Full-stack development'],
  'intermediate',
  'Weekdays after 6pm',
  true,
  NOW(),
  NOW(),
  NOW()
);

-- Test User 4: Alex (Backend Developer) - Low Match
INSERT INTO skill_exchange_profiles (
  user_id,
  name,
  avatar_url,
  bio,
  skills_offered,
  skills_wanted,
  interests,
  experience_level,
  availability,
  online,
  last_active,
  created_at,
  updated_at
) VALUES (
  'test_user_alex_004',
  'Alex Kumar',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  'Backend developer focused on Java and Spring Boot. Looking to learn Go!',
  ARRAY['Java', 'Spring Boot', 'Microservices', 'MySQL', 'Redis'],
  ARRAY['Go', 'Rust', 'System Design'],
  ARRAY['Backend Development', 'Scalability'],
  'advanced',
  'Weekends only',
  false,
  NOW() - INTERVAL '1 day',
  NOW(),
  NOW()
);

-- Test User 5: Lisa (Data Scientist) - Good Match
INSERT INTO skill_exchange_profiles (
  user_id,
  name,
  avatar_url,
  bio,
  skills_offered,
  skills_wanted,
  interests,
  experience_level,
  availability,
  online,
  last_active,
  created_at,
  updated_at
) VALUES (
  'test_user_lisa_005',
  'Lisa Wang',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
  'Data Scientist with ML expertise. Want to learn web development to build ML dashboards!',
  ARRAY['Machine Learning', 'Data Science', 'Python', 'TensorFlow', 'Pandas'],
  ARRAY['React', 'TypeScript', 'Data Visualization'],
  ARRAY['AI', 'Web Development', 'Teaching'],
  'expert',
  'Very flexible',
  true,
  NOW(),
  NOW(),
  NOW()
);

-- ============================================
-- VERIFY INSERTION
-- ============================================

-- Check if users were inserted
SELECT 
  name,
  experience_level,
  online,
  array_length(skills_offered, 1) as skills_offered_count,
  array_length(skills_wanted, 1) as skills_wanted_count
FROM skill_exchange_profiles
WHERE user_id LIKE 'test_user_%'
ORDER BY created_at DESC;

-- ============================================
-- EXPECTED MATCH SCORES WITH YOUR PROFILE
-- ============================================

/*
Your Profile:
- Skills Offered: 18 skills (Python, TypeScript, React, Next.js, etc.)
- Skills Wanted: (Add UI/UX, Mobile Dev, DevOps for better matches)

Expected Matches:
1. Sarah Johnson: 95% ⭐⭐⭐
   - You want UI/UX → She offers ✅
   - She wants React, TypeScript, Next.js → You offer ✅✅✅
   - Mutual exchange ✅
   - Common interest: Web Development ✅

2. Lisa Wang: 85% ⭐⭐⭐
   - She wants React, TypeScript → You offer ✅✅
   - You both have Python ✅
   - Common interest: Teaching ✅

3. Emma Rodriguez: 70% ⭐⭐
   - She wants Next.js, Node.js → You offer ✅✅
   - Partial mutual exchange ✅

4. Mike Chen: 60% ⭐
   - He wants Python → You offer ✅
   - You want DevOps → He offers ✅
   - Mutual exchange ✅

5. Alex Kumar: 20% 
   - Minimal overlap
   - Different tech stacks
*/

-- ============================================
-- CLEANUP (Run this to remove test users)
-- ============================================

-- DELETE FROM skill_exchange_profiles WHERE user_id LIKE 'test_user_%';
