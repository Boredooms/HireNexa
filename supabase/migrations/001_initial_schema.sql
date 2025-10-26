-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone_hash TEXT, -- ODIS hashed phone number
  wallet_address TEXT UNIQUE,
  github_username TEXT,
  linkedin_id TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Portfolios table
CREATE TABLE portfolios (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  ipfs_hash TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public portfolios are viewable by everyone"
  ON portfolios FOR SELECT
  USING (visibility = 'public');

CREATE POLICY "Users can manage own portfolios"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id);

-- Skill attestations table
CREATE TABLE skill_attestations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  evidence_ipfs TEXT,
  source TEXT CHECK (source IN ('github', 'linkedin', 'peer', 'challenge', 'manual')),
  verified_at TIMESTAMPTZ DEFAULT now(),
  tx_hash TEXT, -- Celo transaction hash
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE skill_attestations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skill attestations are viewable by everyone"
  ON skill_attestations FOR SELECT
  USING (NOT revoked);

CREATE POLICY "Users can view own revoked attestations"
  ON skill_attestations FOR SELECT
  USING (auth.uid() = user_id);

-- Jobs table
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recruiter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  required_skills TEXT[],
  preferred_skills TEXT[],
  location TEXT,
  remote BOOLEAN DEFAULT false,
  salary_min INTEGER,
  salary_max INTEGER,
  currency TEXT DEFAULT 'USD',
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Open jobs are viewable by everyone"
  ON jobs FOR SELECT
  USING (status = 'open');

CREATE POLICY "Recruiters can manage own jobs"
  ON jobs FOR ALL
  USING (auth.uid() = recruiter_id);

-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  portfolio_id UUID REFERENCES portfolios(id),
  cover_letter TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'accepted')),
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view own applications"
  ON applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Recruiters can view applications for own jobs"
  ON applications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT recruiter_id FROM jobs WHERE id = applications.job_id
    )
  );

CREATE POLICY "Users can create applications"
  ON applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id);

-- Credentials table (NFT metadata)
CREATE TABLE credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  token_id INTEGER,
  credential_type TEXT NOT NULL,
  metadata_ipfs TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ
);

ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Credentials are viewable by everyone"
  ON credentials FOR SELECT
  USING (NOT revoked);

-- Projects table (from GitHub/portfolio)
CREATE TABLE projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  github_url TEXT,
  technologies TEXT[],
  stars INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects are viewable by everyone"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- Sync status table (track GitHub/LinkedIn syncs)
CREATE TABLE sync_status (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source TEXT CHECK (source IN ('github', 'linkedin')),
  last_sync_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('success', 'failed', 'in_progress')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, source)
);

ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync status"
  ON sync_status FOR SELECT
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_skill_attestations_user_id ON skill_attestations(user_id);
CREATE INDEX idx_skill_attestations_skill_name ON skill_attestations(skill_name);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_recruiter_id ON jobs(recruiter_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_applicant_id ON applications(applicant_id);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
