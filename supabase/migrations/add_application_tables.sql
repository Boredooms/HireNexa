-- Add recruiter applications table
CREATE TABLE IF NOT EXISTS public.recruiter_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  company_name text NOT NULL,
  company_website text,
  company_description text,
  years_hiring_experience integer NOT NULL,
  linkedin_profile text,
  company_logo_url text,
  verification_documents_ipfs text,
  why_join_platform text NOT NULL CHECK (char_length(why_join_platform) >= 50),
  expected_monthly_postings integer,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text])),
  admin_notes text,
  rejection_reason text,
  applied_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by text,
  blockchain_tx_hash text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recruiter_applications_pkey PRIMARY KEY (id),
  CONSTRAINT recruiter_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT recruiter_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);

-- Add peer reviewer applications table
CREATE TABLE IF NOT EXISTS public.peer_reviewer_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  expertise_areas text[] NOT NULL,
  years_experience integer NOT NULL,
  github_profile text,
  linkedin_profile text,
  portfolio_url text,
  why_verify_skills text NOT NULL CHECK (char_length(why_verify_skills) >= 50),
  verification_credentials_ipfs text,
  previous_verification_experience text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text])),
  admin_notes text,
  rejection_reason text,
  applied_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  reviewed_by text,
  blockchain_tx_hash text,
  deposit_amount numeric DEFAULT 5,
  deposit_currency text DEFAULT 'cUSD'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT peer_reviewer_applications_pkey PRIMARY KEY (id),
  CONSTRAINT peer_reviewer_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT peer_reviewer_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_recruiter_applications_status ON public.recruiter_applications(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_applications_user_id ON public.recruiter_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviewer_applications_status ON public.peer_reviewer_applications(status);
CREATE INDEX IF NOT EXISTS idx_peer_reviewer_applications_user_id ON public.peer_reviewer_applications(user_id);

-- Add RLS policies
ALTER TABLE public.recruiter_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_reviewer_applications ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own applications
CREATE POLICY "Users can view own recruiter applications" ON public.recruiter_applications
  FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Users can view own peer reviewer applications" ON public.peer_reviewer_applications
  FOR SELECT USING (auth.uid()::text = user_id OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin'
  ));

-- RLS: Users can insert their own applications (bypassed with service role)
CREATE POLICY "Users can insert own recruiter applications" ON public.recruiter_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert own peer reviewer applications" ON public.peer_reviewer_applications
  FOR INSERT WITH CHECK (true);

-- RLS: Only admins can update applications
CREATE POLICY "Only admins can update recruiter applications" ON public.recruiter_applications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin'
  ));

CREATE POLICY "Only admins can update peer reviewer applications" ON public.peer_reviewer_applications
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin'
  ));
