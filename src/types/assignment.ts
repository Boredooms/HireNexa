/**
 * Assignment Platform Types
 * Transformed from job marketplace to micro-task assignment system
 */

export type AssignmentType = 
  | 'bug_fix' 
  | 'feature_implementation' 
  | 'code_review' 
  | 'documentation' 
  | 'testing'

export type DifficultyLevel = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced' 
  | 'expert'

export type AssignmentStatus = 
  | 'draft' 
  | 'active' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled'

export type SubmissionStatus = 
  | 'pending' 
  | 'reviewing' 
  | 'approved' 
  | 'rejected' 
  | 'revision_requested'

export interface Assignment {
  id: string
  employer_id: string
  title: string
  description: string
  company_name: string
  company_logo_url?: string
  
  // Assignment-specific fields
  assignment_type: AssignmentType
  difficulty_level: DifficultyLevel
  estimated_hours: number
  
  // GitHub integration
  github_repo_url?: string
  github_issue_url?: string
  
  // Skills & requirements
  required_skills: string[]
  required_skill_levels?: Record<string, string>
  min_experience_years?: number
  
  // Rewards
  reward_amount: number
  reward_currency: string // 'CELO'
  
  // Submission limits
  max_submissions: number
  current_submissions: number
  
  // Verification
  auto_verify: boolean
  verification_criteria?: VerificationCriteria
  
  // Blockchain
  blockchain_job_id?: number
  blockchain_tx_hash?: string
  escrow_amount?: number
  
  // Winner
  winner_id?: string
  winner_selected_at?: string
  
  // Certificate
  certificate_minted: boolean
  certificate_nft_id?: string
  
  // Status & metadata
  status: AssignmentStatus
  applications_count: number
  views_count: number
  created_at: string
  updated_at: string
  expires_at?: string
  filled_at?: string
}

export interface VerificationCriteria {
  min_files_changed?: number
  max_files_changed?: number
  requires_tests?: boolean
  requires_documentation?: boolean
  min_code_quality_score?: number
  custom_checks?: string[]
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  candidate_id: string
  
  // GitHub PR details
  github_pr_url: string
  github_commit_hash?: string
  submission_notes?: string
  code_diff_ipfs?: string
  
  // AI Verification
  ai_verification_score?: number
  ai_verification_report?: AIVerificationReport
  github_checks_passed: boolean
  github_checks_data?: any
  
  // Manual review
  manual_review_required: boolean
  reviewer_id?: string
  review_status: SubmissionStatus
  review_notes?: string
  
  // Winner & rewards
  is_winner: boolean
  reward_paid: boolean
  reward_tx_hash?: string
  
  // Certificate
  certificate_minted: boolean
  certificate_nft_id?: string
  certificate_ipfs?: string
  
  // Timestamps
  submitted_at: string
  reviewed_at?: string
  approved_at?: string
}

export interface AIVerificationReport {
  overall_score: number
  passed: boolean
  checks: {
    pr_merged: boolean
    tests_passed: boolean
    code_quality: boolean
    meets_requirements: boolean
    no_conflicts: boolean
    proper_commits: boolean
  }
  details: {
    files_changed: number
    commits_count: number
    additions: number
    deletions: number
    code_quality_issues?: string[]
    suggestions?: string[]
  }
  timestamp: string
}

export interface AssignmentMatch {
  id: string
  assignment_id: string
  candidate_id: string
  overall_match_score: number
  skill_match_score: number
  experience_match_score: number
  matched_skills: string[]
  missing_skills: string[]
  match_reasons: string[]
  ai_recommendation?: string
  notified: boolean
  viewed: boolean
  applied: boolean
  dismissed: boolean
  created_at: string
  notified_at?: string
  viewed_at?: string
}

export interface Certificate {
  id: string
  user_id: string
  certificate_type: 'assignment_completion' | 'skill_verification' | 'course_completion' | 'achievement'
  title: string
  description?: string
  issuer_id: string
  issuer_name: string
  related_assignment_id?: string
  related_submission_id?: string
  nft_token_id?: string
  nft_contract_address?: string
  blockchain_tx_hash?: string
  metadata_ipfs?: string
  image_ipfs?: string
  issued_at: string
  expires_at?: string
  revoked: boolean
  revoked_at?: string
  revocation_reason?: string
}

export interface RecruiterPermissions {
  id: string
  user_id: string
  company_name: string
  can_post_assignments: boolean
  can_review_submissions: boolean
  can_issue_certificates: boolean
  can_make_payments: boolean
  max_assignment_reward: number
  is_verified: boolean
  is_suspended: boolean
  suspension_reason?: string
  created_at: string
  updated_at: string
}

export interface AdminAction {
  id: string
  admin_id: string
  action_type: 'user_suspend' | 'user_activate' | 'assignment_approve' | 'assignment_reject' | 'payment_override' | 'certificate_revoke' | 'dispute_resolve'
  target_type: 'user' | 'assignment' | 'submission' | 'payment' | 'certificate'
  target_id: string
  reason: string
  metadata?: any
  created_at: string
}

// Form types
export interface CreateAssignmentForm {
  title: string
  description: string
  assignment_type: AssignmentType
  difficulty_level: DifficultyLevel
  estimated_hours: number
  required_skills: string[]
  reward_amount: number
  github_repo_url?: string
  github_issue_url?: string
  max_submissions: number
  auto_verify: boolean
  verification_criteria?: VerificationCriteria
  expires_at?: string
}

export interface SubmitAssignmentForm {
  assignment_id: string
  github_pr_url: string
  submission_notes?: string
}

export interface ReviewSubmissionForm {
  submission_id: string
  review_status: SubmissionStatus
  review_notes?: string
  is_winner?: boolean
}
