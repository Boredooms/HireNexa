-- Fix existing barter proposals that have profile UUIDs instead of user IDs as recipient_id

-- Update recipient_id to use user_id from skill_exchange_profiles
UPDATE skill_barter_proposals
SET recipient_id = (
  SELECT user_id 
  FROM skill_exchange_profiles 
  WHERE skill_exchange_profiles.id = skill_barter_proposals.recipient_id::uuid
)
WHERE 
  -- Only update if recipient_id looks like a UUID (not a user_id)
  recipient_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND recipient_id NOT LIKE 'user_%';

-- Verify the fix
SELECT 
  id,
  proposer_id,
  recipient_id,
  status,
  CASE 
    WHEN recipient_id LIKE 'user_%' THEN '✅ Correct (user_id)'
    WHEN recipient_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '❌ Wrong (UUID)'
    ELSE '❓ Unknown format'
  END as recipient_id_status
FROM skill_barter_proposals
ORDER BY created_at DESC;
