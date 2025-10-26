-- ============================================
-- SKILL EXCHANGE & BARTER SYSTEM
-- Database Schema for Supabase
-- ============================================

-- 1. Skill Exchange Profiles
CREATE TABLE IF NOT EXISTS skill_exchange_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  skills_offered TEXT[] DEFAULT '{}',
  skills_wanted TEXT[] DEFAULT '{}',
  interests TEXT[] DEFAULT '{}',
  experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  availability TEXT,
  online BOOLEAN DEFAULT false,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Skill Barter Proposals
CREATE TABLE IF NOT EXISTS skill_barter_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposer_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  skill_offered TEXT NOT NULL,
  skill_requested TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- 3. Skill Barter Records (Accepted Exchanges)
CREATE TABLE IF NOT EXISTS skill_barter_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES skill_barter_proposals(id) ON DELETE CASCADE,
  proposer_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  skill_offered TEXT NOT NULL,
  skill_requested TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  blockchain_tx_hash TEXT,
  nft_token_id TEXT,
  ipfs_hash TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  rating_by_proposer INTEGER CHECK (rating_by_proposer >= 1 AND rating_by_proposer <= 5),
  rating_by_recipient INTEGER CHECK (rating_by_recipient >= 1 AND rating_by_recipient <= 5),
  review_by_proposer TEXT,
  review_by_recipient TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skill Exchange Messages (Real-time Chat)
CREATE TABLE IF NOT EXISTS skill_exchange_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'barter-proposal', 'barter-accepted', 'system')),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Video Call Sessions
CREATE TABLE IF NOT EXISTS video_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  session_token TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended', 'missed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  barter_proposed BOOLEAN DEFAULT false,
  barter_proposal_id UUID REFERENCES skill_barter_proposals(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Skill Learning Progress (Track what users learned)
CREATE TABLE IF NOT EXISTS skill_learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  barter_record_id UUID REFERENCES skill_barter_records(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  learned_from_user_id TEXT,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  milestones JSONB DEFAULT '[]',
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX idx_skill_exchange_profiles_user_id ON skill_exchange_profiles(user_id);
CREATE INDEX idx_skill_exchange_profiles_online ON skill_exchange_profiles(online);
CREATE INDEX idx_skill_barter_proposals_proposer ON skill_barter_proposals(proposer_id);
CREATE INDEX idx_skill_barter_proposals_recipient ON skill_barter_proposals(recipient_id);
CREATE INDEX idx_skill_barter_proposals_status ON skill_barter_proposals(status);
CREATE INDEX idx_skill_barter_records_proposer ON skill_barter_records(proposer_id);
CREATE INDEX idx_skill_barter_records_recipient ON skill_barter_records(recipient_id);
CREATE INDEX idx_skill_barter_records_status ON skill_barter_records(status);
CREATE INDEX idx_skill_exchange_messages_match_id ON skill_exchange_messages(match_id);
CREATE INDEX idx_skill_exchange_messages_sender ON skill_exchange_messages(sender_id);
CREATE INDEX idx_video_call_sessions_initiator ON video_call_sessions(initiator_id);
CREATE INDEX idx_video_call_sessions_recipient ON video_call_sessions(recipient_id);
CREATE INDEX idx_skill_learning_progress_user ON skill_learning_progress(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE skill_exchange_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_barter_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_barter_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_exchange_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_learning_progress ENABLE ROW LEVEL SECURITY;

-- Skill Exchange Profiles Policies
CREATE POLICY "Users can view all profiles" ON skill_exchange_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON skill_exchange_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own profile" ON skill_exchange_profiles
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Barter Proposals Policies
CREATE POLICY "Users can view their proposals" ON skill_barter_proposals
  FOR SELECT USING (auth.uid()::text = proposer_id OR auth.uid()::text = recipient_id);

CREATE POLICY "Users can create proposals" ON skill_barter_proposals
  FOR INSERT WITH CHECK (auth.uid()::text = proposer_id);

CREATE POLICY "Recipients can update proposals" ON skill_barter_proposals
  FOR UPDATE USING (auth.uid()::text = recipient_id);

-- Barter Records Policies
CREATE POLICY "Users can view their barter records" ON skill_barter_records
  FOR SELECT USING (auth.uid()::text = proposer_id OR auth.uid()::text = recipient_id);

CREATE POLICY "System can insert barter records" ON skill_barter_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can update their records" ON skill_barter_records
  FOR UPDATE USING (auth.uid()::text = proposer_id OR auth.uid()::text = recipient_id);

-- Messages Policies
CREATE POLICY "Users can view messages in their chats" ON skill_exchange_messages
  FOR SELECT USING (auth.uid()::text = sender_id OR match_id LIKE '%' || auth.uid()::text || '%');

CREATE POLICY "Users can send messages" ON skill_exchange_messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Video Call Sessions Policies
CREATE POLICY "Users can view their call sessions" ON video_call_sessions
  FOR SELECT USING (auth.uid()::text = initiator_id OR auth.uid()::text = recipient_id);

CREATE POLICY "Users can create call sessions" ON video_call_sessions
  FOR INSERT WITH CHECK (auth.uid()::text = initiator_id);

CREATE POLICY "Participants can update call sessions" ON video_call_sessions
  FOR UPDATE USING (auth.uid()::text = initiator_id OR auth.uid()::text = recipient_id);

-- Learning Progress Policies
CREATE POLICY "Users can view their learning progress" ON skill_learning_progress
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their learning progress" ON skill_learning_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their learning progress" ON skill_learning_progress
  FOR UPDATE USING (auth.uid()::text = user_id);

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE skill_exchange_messages;

-- Enable realtime for online status
ALTER PUBLICATION supabase_realtime ADD TABLE skill_exchange_profiles;

-- Enable realtime for proposals
ALTER PUBLICATION supabase_realtime ADD TABLE skill_barter_proposals;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update online status
CREATE OR REPLACE FUNCTION update_online_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_online_status
  BEFORE UPDATE ON skill_exchange_profiles
  FOR EACH ROW
  WHEN (OLD.online IS DISTINCT FROM NEW.online)
  EXECUTE FUNCTION update_online_status();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_skill_exchange_profiles_updated_at
  BEFORE UPDATE ON skill_exchange_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_skill_barter_records_updated_at
  BEFORE UPDATE ON skill_barter_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_skill_learning_progress_updated_at
  BEFORE UPDATE ON skill_learning_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample skill exchange profile
-- INSERT INTO skill_exchange_profiles (user_id, name, bio, skills_offered, skills_wanted, interests, experience_level, availability, online)
-- VALUES 
--   ('user_123', 'John Doe', 'Full-stack developer passionate about teaching', 
--    ARRAY['React', 'Node.js', 'TypeScript'], 
--    ARRAY['UI/UX Design', 'Mobile Development'], 
--    ARRAY['Web Development', 'Open Source', 'Teaching'],
--    'advanced', 'Weekends', true);
