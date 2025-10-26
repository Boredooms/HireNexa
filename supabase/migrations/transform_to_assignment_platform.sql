-- ============================================
-- TRANSFORM JOBS TO ASSIGNMENTS PLATFORM
-- ============================================
-- This migration transforms the traditional job marketplace
-- into a micro-task/assignment platform for students

-- 1. Rename 'jobs' table to 'assignments'
ALTER TABLE public.jobs RENAME TO assignments;

-- 2. Add assignment-specific columns
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS assignment_type text CHECK (assignment_type = ANY (ARRAY['bug_fix'::text, 'feature_implementation'::text, 'code_review'::text, 'documentation'::text, 'testing'::text])),
ADD COLUMN IF NOT EXISTS github_repo_url text,
ADD COLUMN IF NOT EXISTS github_issue_url text,
ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text])),
ADD COLUMN IF NOT EXISTS estimated_hours integer,
ADD COLUMN IF NOT EXISTS reward_amount numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_currency text DEFAULT 'CELO'::text,
ADD COLUMN IF NOT EXISTS max_submissions integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_submissions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_verify boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_criteria jsonb,
ADD COLUMN IF NOT EXISTS winner_id text,
ADD COLUMN IF NOT EXISTS winner_selected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS certificate_minted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS certificate_nft_id text;

-- 3. Modify existing columns for assignment context
ALTER TABLE public.assignments
ALTER COLUMN employment_type DROP NOT NULL;

ALTER TABLE public.assignments
ALTER COLUMN employment_type SET DEFAULT 'contract'::text;

-- Drop old constraints
ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS jobs_title_check;

ALTER TABLE public.assignments
DROP CONSTRAINT IF EXISTS jobs_description_check;

-- Add new constraints
ALTER TABLE public.assignments
ADD CONSTRAINT assignments_title_check CHECK (char_length(title) >= 5);

ALTER TABLE public.assignments
ADD CONSTRAINT assignments_description_check CHECK (char_length(description) >= 20);

-- 4. Update foreign key references
ALTER TABLE public.applications
DROP CONSTRAINT IF EXISTS applications_job_id_fkey,
ADD CONSTRAINT applications_assignment_id_fkey FOREIGN KEY (job_id) REFERENCES public.assignments(id);

ALTER TABLE public.job_matches RENAME TO assignment_matches;
ALTER TABLE public.assignment_matches
DROP CONSTRAINT IF EXISTS job_matches_job_id_fkey,
ADD CONSTRAINT assignment_matches_assignment_id_fkey FOREIGN KEY (job_id) REFERENCES public.assignments(id);

-- Rename job_id column to assignment_id in related tables
ALTER TABLE public.applications RENAME COLUMN job_id TO assignment_id;
ALTER TABLE public.assignment_matches RENAME COLUMN job_id TO assignment_id;
ALTER TABLE public.payments RENAME COLUMN related_job_id TO related_assignment_id;

-- 5. Add submission tracking table
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  candidate_id text NOT NULL,
  github_pr_url text NOT NULL,
  github_commit_hash text,
  submission_notes text,
  code_diff_ipfs text,
  ai_verification_score integer CHECK (ai_verification_score >= 0 AND ai_verification_score <= 100),
  ai_verification_report jsonb,
  github_checks_passed boolean DEFAULT false,
  github_checks_data jsonb,
  manual_review_required boolean DEFAULT true,
  reviewer_id text,
  review_status text DEFAULT 'pending'::text CHECK (review_status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text, 'revision_requested'::text])),
  review_notes text,
  is_winner boolean DEFAULT false,
  reward_paid boolean DEFAULT false,
  reward_tx_hash text,
  certificate_minted boolean DEFAULT false,
  certificate_nft_id text,
  certificate_ipfs text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  approved_at timestamp with time zone,
  CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT assignment_submissions_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.users(id),
  CONSTRAINT assignment_submissions_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id)
);

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_assignment_type ON public.assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_difficulty_level ON public.assignments(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_candidate_id ON public.assignment_submissions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_review_status ON public.assignment_submissions(review_status);

-- 7. Update payments table for assignment context
ALTER TABLE public.payments
DROP CONSTRAINT IF EXISTS payments_payment_type_check,
ADD CONSTRAINT payments_payment_type_check CHECK (payment_type = ANY (ARRAY['assignment_reward'::text, 'skill_verification'::text, 'milestone'::text, 'refund'::text, 'peer_review'::text]));

-- 8. Add admin tracking table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id text NOT NULL,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['user_suspend'::text, 'user_activate'::text, 'assignment_approve'::text, 'assignment_reject'::text, 'payment_override'::text, 'certificate_revoke'::text, 'dispute_resolve'::text])),
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['user'::text, 'assignment'::text, 'submission'::text, 'payment'::text, 'certificate'::text])),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_actions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id)
);

-- 9. Add recruiter permissions table
CREATE TABLE IF NOT EXISTS public.recruiter_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  company_name text NOT NULL,
  can_post_assignments boolean DEFAULT true,
  can_review_submissions boolean DEFAULT true,
  can_issue_certificates boolean DEFAULT true,
  can_make_payments boolean DEFAULT true,
  max_assignment_reward numeric DEFAULT 100,
  is_verified boolean DEFAULT false,
  is_suspended boolean DEFAULT false,
  suspension_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recruiter_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT recruiter_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- 10. Update skill_verifications for Celo Sepolia
ALTER TABLE public.skill_verifications
ALTER COLUMN payment_amount TYPE numeric USING payment_amount::numeric,
ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'CELO'::text,
ADD COLUMN IF NOT EXISTS network text DEFAULT 'celo-sepolia'::text;

-- 11. Add certificate tracking
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  certificate_type text NOT NULL CHECK (certificate_type = ANY (ARRAY['assignment_completion'::text, 'skill_verification'::text, 'course_completion'::text, 'achievement'::text])),
  title text NOT NULL,
  description text,
  issuer_id text NOT NULL,
  issuer_name text NOT NULL,
  related_assignment_id uuid,
  related_submission_id uuid,
  nft_token_id text,
  nft_contract_address text,
  blockchain_tx_hash text,
  metadata_ipfs text,
  image_ipfs text,
  issued_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  revoked boolean DEFAULT false,
  revoked_at timestamp with time zone,
  revocation_reason text,
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT certificates_issuer_id_fkey FOREIGN KEY (issuer_id) REFERENCES public.users(id),
  CONSTRAINT certificates_related_assignment_id_fkey FOREIGN KEY (related_assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT certificates_related_submission_id_fkey FOREIGN KEY (related_submission_id) REFERENCES public.assignment_submissions(id)
);

-- 12. Add real-time notification triggers
CREATE OR REPLACE FUNCTION notify_new_assignment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  SELECT 
    am.candidate_id,
    'new_assignment_match',
    'New Assignment Match! 🎯',
    'A new assignment matches your skills: ' || NEW.title,
    jsonb_build_object(
      'assignment_id', NEW.id,
      'match_score', am.overall_match_score,
      'reward_amount', NEW.reward_amount
    )
  FROM public.assignment_matches am
  WHERE am.assignment_id = NEW.id
    AND am.overall_match_score >= 70
    AND am.notified = false;
  
  UPDATE public.assignment_matches
  SET notified = true, notified_at = now()
  WHERE assignment_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_new_assignment
AFTER INSERT ON public.assignments
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION notify_new_assignment();

-- 13. Add submission notification trigger
CREATE OR REPLACE FUNCTION notify_submission_events()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify recruiter of new submission
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT 
      a.employer_id,
      'new_submission',
      'New Assignment Submission 📝',
      'A candidate submitted a solution for: ' || a.title,
      jsonb_build_object(
        'submission_id', NEW.id,
        'assignment_id', NEW.assignment_id,
        'candidate_id', NEW.candidate_id
      )
    FROM public.assignments a
    WHERE a.id = NEW.assignment_id;
  END IF;
  
  -- Notify candidate of review status change
  IF TG_OP = 'UPDATE' AND OLD.review_status != NEW.review_status THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      NEW.candidate_id,
      'submission_status_update',
      CASE NEW.review_status
        WHEN 'approved' THEN 'Submission Approved! 🎉'
        WHEN 'rejected' THEN 'Submission Reviewed'
        WHEN 'revision_requested' THEN 'Revision Requested 🔄'
        ELSE 'Submission Status Updated'
      END,
      CASE NEW.review_status
        WHEN 'approved' THEN 'Congratulations! Your submission has been approved.'
        WHEN 'rejected' THEN 'Your submission has been reviewed. Check feedback for details.'
        WHEN 'revision_requested' THEN 'Please review the feedback and resubmit.'
        ELSE 'Your submission status has been updated.'
      END,
      jsonb_build_object(
        'submission_id', NEW.id,
        'assignment_id', NEW.assignment_id,
        'review_status', NEW.review_status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notify_submission_events
AFTER INSERT OR UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION notify_submission_events();

-- 14. Add user roles
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'recruiter'::text, 'admin'::text, 'verifier'::text])),
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_recruiter boolean DEFAULT false;

-- 15. Create view for admin dashboard
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.users WHERE role = 'student') as total_students,
  (SELECT COUNT(*) FROM public.users WHERE role = 'recruiter') as total_recruiters,
  (SELECT COUNT(*) FROM public.assignments) as total_assignments,
  (SELECT COUNT(*) FROM public.assignments WHERE status = 'active') as active_assignments,
  (SELECT COUNT(*) FROM public.assignment_submissions) as total_submissions,
  (SELECT COUNT(*) FROM public.assignment_submissions WHERE review_status = 'pending') as pending_reviews,
  (SELECT COUNT(*) FROM public.certificates) as total_certificates,
  (SELECT COALESCE(SUM(reward_amount), 0) FROM public.assignments WHERE status = 'filled') as total_rewards_paid,
  (SELECT COUNT(*) FROM public.notifications WHERE read = false) as unread_notifications;

-- 16. Add comments for documentation
COMMENT ON TABLE public.assignments IS 'Micro-tasks and assignments posted by companies for students';
COMMENT ON TABLE public.assignment_submissions IS 'Student submissions for assignments with GitHub integration';
COMMENT ON TABLE public.certificates IS 'NFT certificates issued for completed assignments and verified skills';
COMMENT ON TABLE public.admin_actions IS 'Audit log of all admin actions';
COMMENT ON TABLE public.recruiter_permissions IS 'Permissions and limits for recruiter accounts';

-- 17. Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON public.assignments TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON public.assignment_submissions TO authenticated;
-- GRANT SELECT ON public.certificates TO authenticated;
-- GRANT ALL ON public.admin_actions TO admin_role;

COMMIT;
