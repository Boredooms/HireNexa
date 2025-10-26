-- Add blockchain ID columns for assignments and submissions

-- Add blockchain_job_id to assignments table
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS blockchain_job_id integer,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash text,
ADD COLUMN IF NOT EXISTS blockchain_status text DEFAULT 'pending';

-- Add blockchain_submission_id to assignment_submissions table
ALTER TABLE public.assignment_submissions
ADD COLUMN IF NOT EXISTS blockchain_submission_id integer,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assignments_blockchain_job_id ON public.assignments(blockchain_job_id);
CREATE INDEX IF NOT EXISTS idx_submissions_blockchain_submission_id ON public.assignment_submissions(blockchain_submission_id);

-- Add comments
COMMENT ON COLUMN public.assignments.blockchain_job_id IS 'Assignment ID from the smart contract';
COMMENT ON COLUMN public.assignments.blockchain_tx_hash IS 'Transaction hash of assignment creation on blockchain';
COMMENT ON COLUMN public.assignments.blockchain_status IS 'Status of blockchain transaction: pending, confirmed, failed';

COMMENT ON COLUMN public.assignment_submissions.blockchain_submission_id IS 'Submission ID from the smart contract';
COMMENT ON COLUMN public.assignment_submissions.blockchain_tx_hash IS 'Transaction hash of submission on blockchain';
