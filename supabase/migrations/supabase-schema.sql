-- HireNexa Supabase Schema
-- Run this SQL in your Supabase dashboard to create all tables

-- Users table (linked to Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  github_username TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  category TEXT,
  level TEXT,
  source TEXT,
  evidence TEXT[],
  verified_at TIMESTAMP,
  revoked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  github_url TEXT,
  technologies TEXT[],
  stars INTEGER,
  forks INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credentials table (NFT credentials)
CREATE TABLE IF NOT EXISTS credentials (
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

-- Portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ipfs_hash TEXT NOT NULL,
  title TEXT,
  description TEXT,
  visibility TEXT DEFAULT 'private',
  last_sync_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- GitHub sync status
CREATE TABLE IF NOT EXISTS sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  last_sync_at TIMESTAMP,
  status TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_skills_user_id ON skills(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_sync_status_user_id ON sync_status(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only see their own data
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = clerk_id);

CREATE POLICY "Users can view their own skills" ON skills
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own credentials" ON credentials
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own portfolios" ON portfolios
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own sync status" ON sync_status
  FOR SELECT USING (user_id = auth.uid());
