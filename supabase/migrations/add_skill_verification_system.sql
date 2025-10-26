-- =====================================================
-- SKILL VERIFICATION SYSTEM
-- =====================================================

-- Table: skill_submission_requests
-- Users submit skills they want verified by peer reviewers
CREATE TABLE IF NOT EXISTS public.skill_submission_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  skill_name text NOT NULL,
  skill_category text NOT NULL CHECK (skill_category = ANY (ARRAY['programming'::text, 'design'::text, 'blockchain'::text, 'data_science'::text, 'devops'::text, 'other'::text])),
  proficiency_level text NOT NULL CHECK (proficiency_level = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text])),
  
  -- Evidence
  description text NOT NULL CHECK (char_length(description) >= 100),
  github_repos text[], -- Array of GitHub repo URLs
  portfolio_links text[], -- Array of portfolio URLs
  certificates_ipfs text[], -- IPFS hashes of certificate images
  code_samples_ipfs text, -- IPFS hash of code samples
  
  -- Blockchain & Payment
  blockchain_request_id bigint, -- ID from smart contract
  blockchain_tx_hash text, -- Transaction hash
  payment_amount numeric DEFAULT 5.5, -- 5 cUSD for reviewer + 0.5 platform fee
  payment_status text DEFAULT 'pending'::text CHECK (payment_status = ANY (ARRAY['pending'::text, 'paid'::text, 'refunded'::text])),
  payment_tx_hash text,
  
  -- Verification Status
  status text DEFAULT 'pending_payment'::text CHECK (status = ANY (ARRAY['pending_payment'::text, 'awaiting_review'::text, 'under_review'::text, 'verified'::text, 'rejected'::text, 'disputed'::text])),
  assigned_reviewer_id text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  assigned_at timestamp with time zone,
  completed_at timestamp with time zone,
  
  CONSTRAINT skill_submission_requests_pkey PRIMARY KEY (id),
  CONSTRAINT skill_submission_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT skill_submission_requests_assigned_reviewer_id_fkey FOREIGN KEY (assigned_reviewer_id) REFERENCES public.users(id)
);

-- Table: skill_verification_reviews
-- Peer reviewers submit their verification results
CREATE TABLE IF NOT EXISTS public.skill_verification_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL,
  reviewer_id text NOT NULL,
  
  -- Review Results
  verified boolean NOT NULL,
  confidence_score integer NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  proficiency_assessment text CHECK (proficiency_assessment = ANY (ARRAY['beginner'::text, 'intermediate'::text, 'advanced'::text, 'expert'::text])),
  
  -- Detailed Feedback
  review_notes text NOT NULL CHECK (char_length(review_notes) >= 50),
  strengths text,
  areas_for_improvement text,
  evidence_quality_score integer CHECK (evidence_quality_score >= 0 AND evidence_quality_score <= 10),
  
  -- Blockchain & Payment
  blockchain_review_id bigint,
  blockchain_tx_hash text,
  reward_amount numeric DEFAULT 5, -- 5 cUSD reward
  reward_paid boolean DEFAULT false,
  reward_tx_hash text,
  
  -- Status
  status text DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'approved'::text, 'disputed'::text, 'payment_pending'::text, 'completed'::text])),
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  approved_at timestamp with time zone,
  paid_at timestamp with time zone,
  
  CONSTRAINT skill_verification_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT skill_verification_reviews_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.skill_submission_requests(id),
  CONSTRAINT skill_verification_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id)
);

-- Table: reviewer_earnings
-- Track earnings for each peer reviewer
CREATE TABLE IF NOT EXISTS public.reviewer_earnings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reviewer_id text NOT NULL,
  review_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'cUSD'::text,
  blockchain_tx_hash text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text])),
  created_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  
  CONSTRAINT reviewer_earnings_pkey PRIMARY KEY (id),
  CONSTRAINT reviewer_earnings_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id),
  CONSTRAINT reviewer_earnings_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.skill_verification_reviews(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_submissions_user_id ON public.skill_submission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_status ON public.skill_submission_requests(status);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_assigned_reviewer ON public.skill_submission_requests(assigned_reviewer_id);
CREATE INDEX IF NOT EXISTS idx_skill_reviews_submission_id ON public.skill_verification_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_skill_reviews_reviewer_id ON public.skill_verification_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_earnings_reviewer_id ON public.reviewer_earnings(reviewer_id);

-- Enable RLS
ALTER TABLE public.skill_submission_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_verification_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviewer_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_submission_requests
CREATE POLICY "Users can view own skill submissions" ON public.skill_submission_requests
  FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = assigned_reviewer_id);

CREATE POLICY "Users can insert own skill submissions" ON public.skill_submission_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own skill submissions" ON public.skill_submission_requests
  FOR UPDATE USING (auth.uid()::text = user_id);

-- RLS Policies for skill_verification_reviews
CREATE POLICY "Users can view related reviews" ON public.skill_verification_reviews
  FOR SELECT USING (
    auth.uid()::text = reviewer_id OR 
    EXISTS (SELECT 1 FROM public.skill_submission_requests WHERE id = submission_id AND user_id = auth.uid()::text)
  );

CREATE POLICY "Reviewers can insert reviews" ON public.skill_verification_reviews
  FOR INSERT WITH CHECK (true);

-- RLS Policies for reviewer_earnings
CREATE POLICY "Reviewers can view own earnings" ON public.reviewer_earnings
  FOR SELECT USING (auth.uid()::text = reviewer_id);

CREATE POLICY "System can insert earnings" ON public.reviewer_earnings
  FOR INSERT WITH CHECK (true);
