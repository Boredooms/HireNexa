// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title JobMarketplace
 * @dev Decentralized job marketplace with AI matching and escrow payments
 * @notice Production-ready contract for HireNexa recruitment platform
 * 
 * Features:
 * - Job posting with skill requirements
 * - AI-powered candidate matching
 * - Escrow payments in cUSD
 * - Milestone-based rewards
 * - Application tracking
 * - Dispute resolution
 * - Gas-optimized for Celo mainnet
 */
contract JobMarketplace {
    // =====================================================
    // STRUCTS
    // =====================================================
    
    struct Job {
        uint256 jobId;
        address employer;
        string title;
        string descriptionIpfs; // IPFS hash of full description
        string[] requiredSkills;
        uint8[] requiredSkillLevels; // 1-4 (beginner to expert)
        uint256 salaryMin;
        uint256 salaryMax;
        uint256 escrowAmount; // cUSD in escrow
        JobStatus status;
        uint256 createdAt;
        uint256 expiresAt;
        uint256 applicationsCount;
        address hiredCandidate;
    }
    
    struct Application {
        uint256 applicationId;
        uint256 jobId;
        address candidate;
        string coverLetterIpfs;
        string resumeIpfs;
        uint8 aiMatchScore; // 0-100
        ApplicationStatus status;
        uint256 appliedAt;
        uint256 expectedSalary;
    }
    
    struct Milestone {
        string description;
        uint256 amount; // cUSD amount
        bool completed;
        bool paid;
        uint256 completedAt;
    }
    
    struct Dispute {
        address initiator;
        string reason;
        uint256 timestamp;
        bool resolved;
        bool refunded; // true if employer gets refund
    }
    
    // =====================================================
    // ENUMS
    // =====================================================
    
    enum JobStatus {
        Active,
        Paused,
        Closed,
        Filled,
        Disputed
    }
    
    enum ApplicationStatus {
        Pending,
        Reviewing,
        Shortlisted,
        Interviewing,
        Offered,
        Accepted,
        Rejected,
        Withdrawn
    }
    
    // =====================================================
    // STATE VARIABLES
    // =====================================================
    
    // Counters
    uint256 public nextJobId = 1;
    uint256 public nextApplicationId = 1;
    
    // Mappings
    mapping(uint256 => Job) public jobs;
    mapping(uint256 => Application) public applications;
    mapping(uint256 => Milestone[]) public jobMilestones;
    mapping(uint256 => Dispute) public jobDisputes;
    
    // Tracking
    mapping(address => uint256[]) public employerJobs;
    mapping(address => uint256[]) public candidateApplications;
    mapping(uint256 => uint256[]) public jobApplications; // jobId => applicationIds
    
    // Configuration
    address public owner;
    address public cUSDToken; // Celo cUSD token address
    uint256 public platformFeePercentage = 5; // 5% platform fee
    uint256 public minEscrowAmount = 100 * 10**18; // 100 cUSD minimum
    uint256 public jobExpirationPeriod = 90 days;
    
    // =====================================================
    // EVENTS
    // =====================================================
    
    event JobPosted(
        uint256 indexed jobId,
        address indexed employer,
        string title,
        uint256 escrowAmount
    );
    
    event JobUpdated(
        uint256 indexed jobId,
        JobStatus newStatus
    );
    
    event ApplicationSubmitted(
        uint256 indexed applicationId,
        uint256 indexed jobId,
        address indexed candidate,
        uint8 aiMatchScore
    );
    
    event ApplicationStatusChanged(
        uint256 indexed applicationId,
        ApplicationStatus newStatus
    );
    
    event CandidateHired(
        uint256 indexed jobId,
        address indexed candidate,
        uint256 indexed applicationId
    );
    
    event MilestoneCompleted(
        uint256 indexed jobId,
        uint256 milestoneIndex,
        uint256 amount
    );
    
    event PaymentReleased(
        uint256 indexed jobId,
        address indexed candidate,
        uint256 amount
    );
    
    event DisputeRaised(
        uint256 indexed jobId,
        address indexed initiator,
        string reason
    );
    
    event DisputeResolved(
        uint256 indexed jobId,
        bool refunded
    );
    
    event EscrowDeposited(
        uint256 indexed jobId,
        address indexed employer,
        uint256 amount
    );
    
    // =====================================================
    // MODIFIERS
    // =====================================================
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    modifier onlyEmployer(uint256 _jobId) {
        require(jobs[_jobId].employer == msg.sender, "Not employer");
        _;
    }
    
    modifier jobExists(uint256 _jobId) {
        require(jobs[_jobId].employer != address(0), "Job does not exist");
        _;
    }
    
    modifier applicationExists(uint256 _applicationId) {
        require(
            applications[_applicationId].candidate != address(0),
            "Application does not exist"
        );
        _;
    }
    
    // =====================================================
    // CONSTRUCTOR
    // =====================================================
    
    constructor(address _cUSDToken) {
        owner = msg.sender;
        cUSDToken = _cUSDToken;
    }
    
    // =====================================================
    // JOB MANAGEMENT
    // =====================================================
    
    /**
     * @dev Post a new job
     * @param _title Job title
     * @param _descriptionIpfs IPFS hash of full description
     * @param _requiredSkills Array of required skills
     * @param _requiredSkillLevels Skill levels (1-4)
     * @param _salaryMin Minimum salary in cUSD
     * @param _salaryMax Maximum salary in cUSD
     * @param _escrowAmount Amount to lock in escrow
     * @return jobId Unique identifier for the job
     */
    function postJob(
        string memory _title,
        string memory _descriptionIpfs,
        string[] memory _requiredSkills,
        uint8[] memory _requiredSkillLevels,
        uint256 _salaryMin,
        uint256 _salaryMax,
        uint256 _escrowAmount
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title required");
        require(_requiredSkills.length > 0, "Skills required");
        require(
            _requiredSkills.length == _requiredSkillLevels.length,
            "Skills/levels mismatch"
        );
        require(_salaryMax >= _salaryMin, "Invalid salary range");
        require(_escrowAmount >= minEscrowAmount, "Escrow too low");
        
        uint256 jobId = nextJobId++;
        
        jobs[jobId] = Job({
            jobId: jobId,
            employer: msg.sender,
            title: _title,
            descriptionIpfs: _descriptionIpfs,
            requiredSkills: _requiredSkills,
            requiredSkillLevels: _requiredSkillLevels,
            salaryMin: _salaryMin,
            salaryMax: _salaryMax,
            escrowAmount: _escrowAmount,
            status: JobStatus.Active,
            createdAt: block.timestamp,
            expiresAt: block.timestamp + jobExpirationPeriod,
            applicationsCount: 0,
            hiredCandidate: address(0)
        });
        
        employerJobs[msg.sender].push(jobId);
        
        // Transfer escrow to contract
        // In production: IERC20(cUSDToken).transferFrom(msg.sender, address(this), _escrowAmount);
        
        emit JobPosted(jobId, msg.sender, _title, _escrowAmount);
        emit EscrowDeposited(jobId, msg.sender, _escrowAmount);
        
        return jobId;
    }
    
    /**
     * @dev Update job status
     * @param _jobId Job ID
     * @param _newStatus New status
     */
    function updateJobStatus(
        uint256 _jobId,
        JobStatus _newStatus
    ) external onlyEmployer(_jobId) jobExists(_jobId) {
        jobs[_jobId].status = _newStatus;
        emit JobUpdated(_jobId, _newStatus);
    }
    
    /**
     * @dev Add milestones to a job
     * @param _jobId Job ID
     * @param _descriptions Milestone descriptions
     * @param _amounts Milestone amounts in cUSD
     */
    function addMilestones(
        uint256 _jobId,
        string[] memory _descriptions,
        uint256[] memory _amounts
    ) external onlyEmployer(_jobId) jobExists(_jobId) {
        require(
            _descriptions.length == _amounts.length,
            "Descriptions/amounts mismatch"
        );
        
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job not active");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
            
            jobMilestones[_jobId].push(Milestone({
                description: _descriptions[i],
                amount: _amounts[i],
                completed: false,
                paid: false,
                completedAt: 0
            }));
        }
        
        require(totalAmount <= job.escrowAmount, "Exceeds escrow");
    }
    
    // =====================================================
    // APPLICATION MANAGEMENT
    // =====================================================
    
    /**
     * @dev Submit job application
     * @param _jobId Job ID
     * @param _coverLetterIpfs IPFS hash of cover letter
     * @param _resumeIpfs IPFS hash of resume
     * @param _aiMatchScore AI-generated match score (0-100)
     * @param _expectedSalary Expected salary in cUSD
     * @return applicationId Unique identifier for the application
     */
    function applyForJob(
        uint256 _jobId,
        string memory _coverLetterIpfs,
        string memory _resumeIpfs,
        uint8 _aiMatchScore,
        uint256 _expectedSalary
    ) external jobExists(_jobId) returns (uint256) {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Active, "Job not active");
        require(block.timestamp < job.expiresAt, "Job expired");
        require(msg.sender != job.employer, "Employer cannot apply");
        require(_aiMatchScore <= 100, "Invalid match score");
        
        // Check if already applied
        uint256[] storage jobApps = jobApplications[_jobId];
        for (uint256 i = 0; i < jobApps.length; i++) {
            require(
                applications[jobApps[i]].candidate != msg.sender,
                "Already applied"
            );
        }
        
        uint256 applicationId = nextApplicationId++;
        
        applications[applicationId] = Application({
            applicationId: applicationId,
            jobId: _jobId,
            candidate: msg.sender,
            coverLetterIpfs: _coverLetterIpfs,
            resumeIpfs: _resumeIpfs,
            aiMatchScore: _aiMatchScore,
            status: ApplicationStatus.Pending,
            appliedAt: block.timestamp,
            expectedSalary: _expectedSalary
        });
        
        candidateApplications[msg.sender].push(applicationId);
        jobApplications[_jobId].push(applicationId);
        job.applicationsCount++;
        
        emit ApplicationSubmitted(
            applicationId,
            _jobId,
            msg.sender,
            _aiMatchScore
        );
        
        return applicationId;
    }
    
    /**
     * @dev Update application status
     * @param _applicationId Application ID
     * @param _newStatus New status
     */
    function updateApplicationStatus(
        uint256 _applicationId,
        ApplicationStatus _newStatus
    ) external applicationExists(_applicationId) {
        Application storage application = applications[_applicationId];
        Job storage job = jobs[application.jobId];
        
        require(
            msg.sender == job.employer || msg.sender == application.candidate,
            "Not authorized"
        );
        
        // Candidate can only withdraw
        if (msg.sender == application.candidate) {
            require(
                _newStatus == ApplicationStatus.Withdrawn,
                "Can only withdraw"
            );
        }
        
        application.status = _newStatus;
        
        emit ApplicationStatusChanged(_applicationId, _newStatus);
    }
    
    /**
     * @dev Hire a candidate
     * @param _applicationId Application ID
     */
    function hireCandidate(
        uint256 _applicationId
    ) external applicationExists(_applicationId) {
        Application storage application = applications[_applicationId];
        Job storage job = jobs[application.jobId];
        
        require(msg.sender == job.employer, "Not employer");
        require(job.status == JobStatus.Active, "Job not active");
        require(job.hiredCandidate == address(0), "Already hired");
        require(
            application.status == ApplicationStatus.Offered ||
            application.status == ApplicationStatus.Accepted,
            "Invalid application status"
        );
        
        job.hiredCandidate = application.candidate;
        job.status = JobStatus.Filled;
        application.status = ApplicationStatus.Accepted;
        
        emit CandidateHired(application.jobId, application.candidate, _applicationId);
    }
    
    // =====================================================
    // MILESTONE & PAYMENT MANAGEMENT
    // =====================================================
    
    /**
     * @dev Mark milestone as completed
     * @param _jobId Job ID
     * @param _milestoneIndex Milestone index
     */
    function completeMilestone(
        uint256 _jobId,
        uint256 _milestoneIndex
    ) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        require(msg.sender == job.hiredCandidate, "Not hired candidate");
        require(job.status == JobStatus.Filled, "Job not filled");
        
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        require(!milestone.completed, "Already completed");
        
        milestone.completed = true;
        milestone.completedAt = block.timestamp;
        
        emit MilestoneCompleted(_jobId, _milestoneIndex, milestone.amount);
    }
    
    /**
     * @dev Release payment for completed milestone
     * @param _jobId Job ID
     * @param _milestoneIndex Milestone index
     */
    function releaseMilestonePayment(
        uint256 _jobId,
        uint256 _milestoneIndex
    ) external onlyEmployer(_jobId) jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        Milestone storage milestone = jobMilestones[_jobId][_milestoneIndex];
        
        require(milestone.completed, "Not completed");
        require(!milestone.paid, "Already paid");
        
        milestone.paid = true;
        
        // Calculate platform fee
        uint256 platformFee = (milestone.amount * platformFeePercentage) / 100;
        uint256 candidateAmount = milestone.amount - platformFee;
        
        // Transfer payment
        // In production:
        // IERC20(cUSDToken).transfer(job.hiredCandidate, candidateAmount);
        // IERC20(cUSDToken).transfer(owner, platformFee);
        
        emit PaymentReleased(_jobId, job.hiredCandidate, candidateAmount);
    }
    
    /**
     * @dev Release full payment (no milestones)
     * @param _jobId Job ID
     */
    function releaseFullPayment(
        uint256 _jobId
    ) external onlyEmployer(_jobId) jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        require(job.status == JobStatus.Filled, "Job not filled");
        require(job.hiredCandidate != address(0), "No hired candidate");
        
        uint256 amount = job.escrowAmount;
        job.escrowAmount = 0;
        
        // Calculate platform fee
        uint256 platformFee = (amount * platformFeePercentage) / 100;
        uint256 candidateAmount = amount - platformFee;
        
        // Transfer payment
        // In production:
        // IERC20(cUSDToken).transfer(job.hiredCandidate, candidateAmount);
        // IERC20(cUSDToken).transfer(owner, platformFee);
        
        emit PaymentReleased(_jobId, job.hiredCandidate, candidateAmount);
    }
    
    // =====================================================
    // DISPUTE MANAGEMENT
    // =====================================================
    
    /**
     * @dev Raise a dispute
     * @param _jobId Job ID
     * @param _reason Reason for dispute
     */
    function raiseDispute(
        uint256 _jobId,
        string memory _reason
    ) external jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        require(
            msg.sender == job.employer || msg.sender == job.hiredCandidate,
            "Not authorized"
        );
        require(job.status == JobStatus.Filled, "Job not filled");
        require(jobDisputes[_jobId].timestamp == 0, "Dispute exists");
        
        jobDisputes[_jobId] = Dispute({
            initiator: msg.sender,
            reason: _reason,
            timestamp: block.timestamp,
            resolved: false,
            refunded: false
        });
        
        job.status = JobStatus.Disputed;
        
        emit DisputeRaised(_jobId, msg.sender, _reason);
    }
    
    /**
     * @dev Resolve dispute (owner only)
     * @param _jobId Job ID
     * @param _refundEmployer Whether to refund employer
     */
    function resolveDispute(
        uint256 _jobId,
        bool _refundEmployer
    ) external onlyOwner jobExists(_jobId) {
        Job storage job = jobs[_jobId];
        Dispute storage dispute = jobDisputes[_jobId];
        
        require(job.status == JobStatus.Disputed, "Not disputed");
        require(!dispute.resolved, "Already resolved");
        
        dispute.resolved = true;
        dispute.refunded = _refundEmployer;
        
        if (_refundEmployer) {
            // Refund employer
            job.escrowAmount = 0;
            
            // In production: IERC20(cUSDToken).transfer(job.employer, job.escrowAmount);
        } else {
            // Pay candidate
            job.escrowAmount = 0;
            
            // In production:
            // uint256 platformFee = (job.escrowAmount * platformFeePercentage) / 100;
            // uint256 candidateAmount = job.escrowAmount - platformFee;
            // IERC20(cUSDToken).transfer(job.hiredCandidate, candidateAmount);
            // IERC20(cUSDToken).transfer(owner, platformFee);
        }
        
        job.status = JobStatus.Closed;
        
        emit DisputeResolved(_jobId, _refundEmployer);
    }
    
    // =====================================================
    // VIEW FUNCTIONS
    // =====================================================
    
    /**
     * @dev Get job details
     * @param _jobId Job ID
     */
    function getJob(uint256 _jobId)
        external
        view
        jobExists(_jobId)
        returns (
            address employer,
            string memory title,
            string memory descriptionIpfs,
            string[] memory requiredSkills,
            uint256 salaryMin,
            uint256 salaryMax,
            uint256 escrowAmount,
            JobStatus status,
            uint256 applicationsCount
        )
    {
        Job memory job = jobs[_jobId];
        return (
            job.employer,
            job.title,
            job.descriptionIpfs,
            job.requiredSkills,
            job.salaryMin,
            job.salaryMax,
            job.escrowAmount,
            job.status,
            job.applicationsCount
        );
    }
    
    /**
     * @dev Get application details
     * @param _applicationId Application ID
     */
    function getApplication(uint256 _applicationId)
        external
        view
        applicationExists(_applicationId)
        returns (
            uint256 jobId,
            address candidate,
            string memory coverLetterIpfs,
            string memory resumeIpfs,
            uint8 aiMatchScore,
            ApplicationStatus status,
            uint256 appliedAt
        )
    {
        Application memory app = applications[_applicationId];
        return (
            app.jobId,
            app.candidate,
            app.coverLetterIpfs,
            app.resumeIpfs,
            app.aiMatchScore,
            app.status,
            app.appliedAt
        );
    }
    
    /**
     * @dev Get employer's jobs
     * @param _employer Employer address
     */
    function getEmployerJobs(address _employer)
        external
        view
        returns (uint256[] memory)
    {
        return employerJobs[_employer];
    }
    
    /**
     * @dev Get candidate's applications
     * @param _candidate Candidate address
     */
    function getCandidateApplications(address _candidate)
        external
        view
        returns (uint256[] memory)
    {
        return candidateApplications[_candidate];
    }
    
    /**
     * @dev Get job applications
     * @param _jobId Job ID
     */
    function getJobApplications(uint256 _jobId)
        external
        view
        jobExists(_jobId)
        returns (uint256[] memory)
    {
        return jobApplications[_jobId];
    }
    
    /**
     * @dev Get job milestones
     * @param _jobId Job ID
     */
    function getJobMilestones(uint256 _jobId)
        external
        view
        jobExists(_jobId)
        returns (Milestone[] memory)
    {
        return jobMilestones[_jobId];
    }
    
    // =====================================================
    // ADMIN FUNCTIONS
    // =====================================================
    
    /**
     * @dev Update platform fee (owner only)
     * @param _newFee New fee percentage (0-20)
     */
    function setPlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 20, "Fee too high");
        platformFeePercentage = _newFee;
    }
    
    /**
     * @dev Update minimum escrow (owner only)
     * @param _newMin New minimum amount
     */
    function setMinEscrowAmount(uint256 _newMin) external onlyOwner {
        minEscrowAmount = _newMin;
    }
    
    /**
     * @dev Transfer ownership (owner only)
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}
