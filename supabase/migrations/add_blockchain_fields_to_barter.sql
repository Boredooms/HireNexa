-- Add blockchain fields to skill_barter_proposals table
ALTER TABLE skill_barter_proposals
ADD COLUMN IF NOT EXISTS blockchain_barter_id BIGINT,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS acceptance_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS deposit_amount TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blockchain_barter_id ON skill_barter_proposals(blockchain_barter_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_tx_hash ON skill_barter_proposals(blockchain_tx_hash);

-- Also fix duration column type (should be INTEGER, not TEXT)
ALTER TABLE skill_barter_proposals
ALTER COLUMN duration TYPE INTEGER USING duration::integer;

COMMENT ON COLUMN skill_barter_proposals.blockchain_barter_id IS 'Barter ID from the blockchain smart contract';
COMMENT ON COLUMN skill_barter_proposals.blockchain_tx_hash IS 'Transaction hash of the blockchain proposal';
COMMENT ON COLUMN skill_barter_proposals.deposit_amount IS 'Deposit amount in CELO';
