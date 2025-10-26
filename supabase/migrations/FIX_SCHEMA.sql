-- SIMPLE FIX: Drop and recreate tables

-- 1. DROP ALL TABLES
DROP TABLE IF EXISTS sync_status CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS github_connections CASCADE;
DROP TABLE IF EXISTS credentials CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS skills CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS skill_recommendations CASCADE;

-- 2. CREATE USERS TABLE (TEXT ID for Clerk)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  github_username TEXT,
  linkedin_url TEXT,
  wallet_address TEXT,
  professional_summary TEXT,
  career_level TEXT,
  key_strengths TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. CREATE SKILLS TABLE (TEXT user_id)
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  category TEXT,
  level TEXT,
  source TEXT,
  evidence TEXT[],
  evidence_ipfs TEXT,
  example_repos TEXT[],
  verified_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

-- 4. CREATE PROJECTS TABLE (TEXT user_id)
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  github_url TEXT,
  technologies TEXT[],
  stars INTEGER,
  forks INTEGER,
  is_featured BOOLEAN DEFAULT FALSE,
  ai_analysis TEXT,
  impact_statement TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- 5. CREATE OTHER TABLES (TEXT user_id)
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issuer TEXT,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  metadata_ipfs TEXT,
  blockchain_tx_hash TEXT,
  nft_token_id TEXT,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ipfs_hash TEXT NOT NULL,
  title TEXT,
  description TEXT,
  visibility TEXT DEFAULT 'private',
  nft_token_id INTEGER,
  blockchain_tx_hash TEXT,
  wallet_address TEXT,
  version INTEGER DEFAULT 1,
  auto_update_enabled BOOLEAN DEFAULT false,
  auto_update_interval_days INTEGER DEFAULT 90,
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  last_sync_at TIMESTAMP,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE github_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  connected_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, skill_name)
);

CREATE TABLE portfolio_update_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6. ADD INDEXES
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_sync_status_user_id ON sync_status(user_id);

-- 7. ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_update_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 8. ADD RLS POLICIES (Allow all operations for development)
CREATE POLICY "Users can manage their own data" ON users FOR ALL USING (true);
CREATE POLICY "Users can manage their own skills" ON skills FOR ALL USING (true);
CREATE POLICY "Users can manage their own projects" ON projects FOR ALL USING (true);
CREATE POLICY "Users can manage their own credentials" ON credentials FOR ALL USING (true);
CREATE POLICY "Users can manage their own portfolios" ON portfolios FOR ALL USING (true);
CREATE POLICY "Users can manage their own sync status" ON sync_status FOR ALL USING (true);
CREATE POLICY "Users can manage their own github connections" ON github_connections FOR ALL USING (true);
CREATE POLICY "Users can manage their own skill recommendations" ON skill_recommendations FOR ALL USING (true);
CREATE POLICY "Users can manage their own update requests" ON portfolio_update_requests FOR ALL USING (true);
CREATE POLICY "Users can manage their own notifications" ON notifications FOR ALL USING (true);
