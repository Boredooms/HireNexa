-- Fix role consistency: Ensure role field and boolean flags are synchronized
-- This migration fixes users where role='admin' but is_admin=false, etc.

-- Update users where role is 'admin' but is_admin is false
UPDATE public.users
SET 
  is_admin = true,
  is_recruiter = true  -- Admins should also have recruiter access
WHERE 
  role = 'admin' 
  AND (is_admin = false OR is_admin IS NULL);

-- Update users where role is 'recruiter' but is_recruiter is false
UPDATE public.users
SET 
  is_recruiter = true,
  is_admin = false  -- Recruiters are not admins unless role='admin'
WHERE 
  role = 'recruiter' 
  AND (is_recruiter = false OR is_recruiter IS NULL)
  AND role != 'admin';

-- Update users where role is 'verifier' 
UPDATE public.users
SET 
  is_admin = false,
  is_recruiter = false
WHERE 
  role = 'verifier' 
  AND (is_admin = true OR is_recruiter = true);

-- Update users where role is 'student'
UPDATE public.users
SET 
  is_admin = false,
  is_recruiter = false
WHERE 
  role = 'student' 
  AND (is_admin = true OR is_recruiter = true);

-- Update users where is_admin=true but role is not 'admin'
UPDATE public.users
SET 
  role = 'admin',
  is_recruiter = true
WHERE 
  is_admin = true 
  AND role != 'admin';

-- Update users where is_recruiter=true but role is 'student'
UPDATE public.users
SET 
  role = 'recruiter'
WHERE 
  is_recruiter = true 
  AND role = 'student';

-- Log the changes
DO $$
BEGIN
  RAISE NOTICE 'Role consistency fix completed. All users now have synchronized role and flag fields.';
END $$;
