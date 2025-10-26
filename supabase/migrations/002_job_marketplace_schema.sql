-- =====================================================
-- JOB MARKETPLACE & SKILL VERIFICATION SCHEMA
-- HireNexa Phase 2: Complete Recruitment Platform
-- =====================================================

-- =====================================================
-- 1. JOBS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Job Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT,
  remote_type TEXT CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  
  -- Compensation
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  payment_in_cusd BOOLEAN DEFAULT false,
  
  -- Requirements
  required_skills TEXT[] NOT NULL,
  required_skill_levels JSONB, -- {skill: level}
  min_experience_years INTEGER,
  education_level TEXT,
  
  -- Blockchain
  blockchain_job_id INTEGER, -- On-chain job ID
  blockchain_tx_hash TEXT,
  escrow_amount DECIMAL(18, 6), -- cUSD amount in escrow
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'closed', 'filled')),
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  filled_at TIMESTAMP WITH TIME ZONE,
  
  -- Indexes
  CONSTRAINT jobs_title_length CHECK (char_length(title) >= 10),
  CONSTRAINT jobs_description_length CHECK (char_length(description) >= 50)
);

-- Indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_required_skills ON jobs USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(
  to_tsvector('english', title || ' ' || description || ' ' || company_name)
);

-- =====================================================
-- 2. APPLICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Application Data
  cover_letter TEXT,
  portfolio_url TEXT,
  resume_ipfs TEXT, -- IPFS hash of resume
  expected_salary INTEGER,
  available_from DATE,
  
  -- AI Matching
  ai_match_score INTEGER CHECK (ai_match_score >= 0 AND ai_match_score <= 100),
  ai_match_reasons TEXT[],
  skill_match_percentage INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'interviewing', 'offered', 'accepted', 'rejected', 'withdrawn')),
  employer_viewed BOOLEAN DEFAULT false,
  employer_notes TEXT,
  
  -- Blockchain
  blockchain_tx_hash TEXT,
  
  -- Timestamps
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(job_id, candidate_id), -- One application per job per candidate
  CONSTRAINT applications_cover_letter_length CHECK (char_length(cover_letter) >= 50)
);

-- Indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_ai_match_score ON applications(ai_match_score DESC);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at DESC);

-- =====================================================
-- 3. JOB MATCHES TABLE (AI-Generated)
-- =====================================================
CREATE TABLE IF NOT EXISTS job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Matching Scores
  overall_match_score INTEGER CHECK (overall_match_score >= 0 AND overall_match_score <= 100),
  skill_match_score INTEGER,
  experience_match_score INTEGER,
  location_match_score INTEGER,
  
  -- Detailed Analysis
  matched_skills TEXT[],
  missing_skills TEXT[],
  match_reasons TEXT[],
  ai_recommendation TEXT,
  
  -- Status
  notified BOOLEAN DEFAULT false,
  viewed BOOLEAN DEFAULT false,
  applied BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(job_id, candidate_id)
);

-- Indexes for job_matches table
CREATE INDEX IF NOT EXISTS idx_job_matches_job_id ON job_matches(job_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_candidate_id ON job_matches(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_matches_overall_score ON job_matches(overall_match_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_matches_notified ON job_matches(notified);
CREATE INDEX IF NOT EXISTS idx_job_matches_created_at ON job_matches(created_at DESC);

-- =====================================================
-- 4. SKILL VERIFICATIONS TABLE (Peer Review)
-- =====================================================
CREATE TABLE IF NOT EXISTS skill_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  verifier_id TEXT NOT NULL REFERENCES users(id),
  
  -- Verification Data
  verified BOOLEAN NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  verification_notes TEXT,
  evidence_reviewed TEXT[], -- IPFS hashes
  
  -- Blockchain
  blockchain_tx_hash TEXT,
  blockchain_attestation_id INTEGER,
  
  -- Payment
  payment_amount DECIMAL(18, 6), -- cUSD paid to verifier
  payment_tx_hash TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'disputed', 'revoked')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT skill_verifications_not_self CHECK (user_id != verifier_id),
  CONSTRAINT skill_verifications_notes_length CHECK (char_length(verification_notes) >= 20)
);

-- Indexes for skill_verifications table
CREATE INDEX IF NOT EXISTS idx_skill_verifications_skill_id ON skill_verifications(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_user_id ON skill_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_verifier_id ON skill_verifications(verifier_id);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_status ON skill_verifications(status);
CREATE INDEX IF NOT EXISTS idx_skill_verifications_created_at ON skill_verifications(created_at DESC);

-- =====================================================
-- 5. VERIFIER REPUTATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS verifier_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reputation Scores
  overall_score INTEGER DEFAULT 0 CHECK (overall_score >= 0 AND overall_score <= 100),
  accuracy_score INTEGER DEFAULT 0,
  response_time_score INTEGER DEFAULT 0,
  thoroughness_score INTEGER DEFAULT 0,
  
  -- Statistics
  total_verifications INTEGER DEFAULT 0,
  successful_verifications INTEGER DEFAULT 0,
  disputed_verifications INTEGER DEFAULT 0,
  average_verification_time INTEGER, -- in seconds
  
  -- Earnings
  total_earned_cusd DECIMAL(18, 6) DEFAULT 0,
  
  -- Status
  is_authorized BOOLEAN DEFAULT false,
  is_suspended BOOLEAN DEFAULT false,
  suspension_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_verification_at TIMESTAMP WITH TIME ZONE
);

-- Index for verifier_reputation table
CREATE INDEX IF NOT EXISTS idx_verifier_reputation_verifier_id ON verifier_reputation(verifier_id);
CREATE INDEX IF NOT EXISTS idx_verifier_reputation_overall_score ON verifier_reputation(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_verifier_reputation_is_authorized ON verifier_reputation(is_authorized);

-- =====================================================
-- 6. MESSAGES TABLE (Chat)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id TEXT NOT NULL REFERENCES users(id),
  receiver_id TEXT NOT NULL REFERENCES users(id),
  
  -- Message Data
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_ipfs TEXT, -- IPFS hash if file
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT messages_text_length CHECK (char_length(message_text) >= 1 AND char_length(message_text) <= 5000)
);

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read);

-- =====================================================
-- 7. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Notification Data
  type TEXT NOT NULL CHECK (type IN (
    'job_match', 'application_status', 'skill_verification', 
    'message', 'blockchain_confirmation', 'portfolio_update',
    'new_application', 'interview_request'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Related Entities
  related_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  related_application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  related_user_id TEXT REFERENCES users(id),
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- 8. PHONE MAPPINGS TABLE (Social Connect)
-- =====================================================
CREATE TABLE IF NOT EXISTS phone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Phone Data (Encrypted)
  phone_hash TEXT NOT NULL UNIQUE, -- Keccak256 hash of phone number
  encrypted_phone TEXT NOT NULL, -- AES-256-GCM encrypted phone
  
  -- Wallet Mapping
  wallet_address TEXT NOT NULL,
  
  -- Verification
  verified BOOLEAN DEFAULT false,
  verification_code_hash TEXT,
  verification_attempts INTEGER DEFAULT 0,
  last_verification_attempt TIMESTAMP WITH TIME ZONE,
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for phone_mappings table
CREATE INDEX IF NOT EXISTS idx_phone_mappings_user_id ON phone_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_mappings_phone_hash ON phone_mappings(phone_hash);
CREATE INDEX IF NOT EXISTS idx_phone_mappings_wallet_address ON phone_mappings(wallet_address);

-- =====================================================
-- 9. PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Payment Details
  payer_id TEXT NOT NULL REFERENCES users(id),
  payee_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(18, 6) NOT NULL,
  currency TEXT DEFAULT 'cUSD',
  
  -- Payment Type
  payment_type TEXT NOT NULL CHECK (payment_type IN (
    'job_escrow', 'skill_verification', 'milestone', 'refund'
  )),
  
  -- Related Entities
  related_job_id UUID REFERENCES jobs(id),
  related_application_id UUID REFERENCES applications(id),
  related_verification_id UUID REFERENCES skill_verifications(id),
  
  -- Blockchain
  blockchain_tx_hash TEXT NOT NULL,
  blockchain_status TEXT DEFAULT 'pending' CHECK (blockchain_status IN ('pending', 'confirmed', 'failed')),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_payer_id ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_payee_id ON payments(payee_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- =====================================================
-- 10. REALTIME EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS realtime_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Event Data
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  
  -- Status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for realtime_events table
CREATE INDEX IF NOT EXISTS idx_realtime_events_user_id ON realtime_events(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_events_event_type ON realtime_events(event_type);
CREATE INDEX IF NOT EXISTS idx_realtime_events_processed ON realtime_events(processed);
CREATE INDEX IF NOT EXISTS idx_realtime_events_created_at ON realtime_events(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifier_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE phone_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_events ENABLE ROW LEVEL SECURITY;

-- Jobs: Employers can manage their jobs, everyone can view active jobs
CREATE POLICY "Employers can insert their own jobs" ON jobs
  FOR INSERT WITH CHECK (auth.uid()::text = employer_id);

CREATE POLICY "Employers can update their own jobs" ON jobs
  FOR UPDATE USING (auth.uid()::text = employer_id);

CREATE POLICY "Employers can delete their own jobs" ON jobs
  FOR DELETE USING (auth.uid()::text = employer_id);

CREATE POLICY "Everyone can view active jobs" ON jobs
  FOR SELECT USING (status = 'active' OR auth.uid()::text = employer_id);

-- Applications: Candidates can manage their applications, employers can view
CREATE POLICY "Candidates can insert their own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid()::text = candidate_id);

CREATE POLICY "Candidates can update their own applications" ON applications
  FOR UPDATE USING (auth.uid()::text = candidate_id);

CREATE POLICY "Candidates can view their own applications" ON applications
  FOR SELECT USING (
    auth.uid()::text = candidate_id OR 
    auth.uid()::text IN (SELECT employer_id FROM jobs WHERE id = job_id)
  );

-- Job Matches: Users can view their own matches
CREATE POLICY "Users can view their own job matches" ON job_matches
  FOR SELECT USING (auth.uid()::text = candidate_id);

CREATE POLICY "Users can update their own job matches" ON job_matches
  FOR UPDATE USING (auth.uid()::text = candidate_id);

-- Skill Verifications: Users and verifiers can view relevant verifications
CREATE POLICY "Users can view their skill verifications" ON skill_verifications
  FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = verifier_id);

CREATE POLICY "Verifiers can insert verifications" ON skill_verifications
  FOR INSERT WITH CHECK (auth.uid()::text = verifier_id);

-- Messages: Users can view and send their own messages
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Notifications: Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Phone Mappings: Users can view and manage their own phone mapping
CREATE POLICY "Users can view their own phone mapping" ON phone_mappings
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own phone mapping" ON phone_mappings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Payments: Users can view their own payments
CREATE POLICY "Users can view their payments" ON payments
  FOR SELECT USING (auth.uid()::text = payer_id OR auth.uid()::text = payee_id);

-- Realtime Events: Users can view their own events
CREATE POLICY "Users can view their own events" ON realtime_events
  FOR SELECT USING (auth.uid()::text = user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_verifier_reputation_updated_at BEFORE UPDATE ON verifier_reputation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Increment applications_count on jobs
CREATE OR REPLACE FUNCTION increment_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_applications_count AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION increment_job_applications_count();

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_status_created_at ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_job_status ON applications(job_id, status);
CREATE INDEX IF NOT EXISTS idx_job_matches_candidate_score ON job_matches(candidate_id, overall_match_score DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE jobs IS 'Job postings from employers';
COMMENT ON TABLE applications IS 'Job applications from candidates';
COMMENT ON TABLE job_matches IS 'AI-generated job matches for candidates';
COMMENT ON TABLE skill_verifications IS 'Peer verifications of user skills';
COMMENT ON TABLE verifier_reputation IS 'Reputation scores for skill verifiers';
COMMENT ON TABLE messages IS 'Chat messages between users';
COMMENT ON TABLE notifications IS 'Real-time notifications for users';
COMMENT ON TABLE phone_mappings IS 'Social Connect phone to wallet mappings';
COMMENT ON TABLE payments IS 'Blockchain payments in cUSD';
COMMENT ON TABLE realtime_events IS 'Real-time event tracking';
