// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssignmentEscrow
 * @notice Escrow contract for assignment rewards with completion verification
 * @dev Handles CELO token deposits, completion verification, and reward distribution
 */
contract AssignmentEscrow is ReentrancyGuard, Ownable {
    
    // CELO token (native token on Celo)
    IERC20 public immutable celoToken;
    
    // Certificate NFT contract
    address public certificateContract;
    
    // Assignment struct
    struct Assignment {
        uint256 assignmentId;
        address recruiter;
        string title;
        string metadataURI; // IPFS hash
        uint256 rewardAmount;
        uint256 maxSubmissions;
        uint256 currentSubmissions;
        bool autoVerify;
        AssignmentStatus status;
        uint256 createdAt;
        uint256 expiresAt;
    }
    
    // Submission struct
    struct Submission {
        uint256 submissionId;
        uint256 assignmentId;
        address candidate;
        string githubPRUrl;
        string submissionURI; // IPFS hash
        uint256 aiVerificationScore;
        bool githubChecksPassed;
        SubmissionStatus status;
        uint256 submittedAt;
        uint256 reviewedAt;
    }
    
    enum AssignmentStatus {
        Active,
        InProgress,
        Completed,
        Cancelled,
        Expired
    }
    
    enum SubmissionStatus {
        Pending,
        Reviewing,
        Approved,
        Rejected,
        Paid
    }
    
    // State variables
    uint256 public assignmentCounter;
    uint256 public submissionCounter;
    
    mapping(uint256 => Assignment) public assignments;
    mapping(uint256 => Submission) public submissions;
    mapping(uint256 => uint256[]) public assignmentSubmissions; // assignmentId => submissionIds
    mapping(address => uint256) public recruiterDeposits;
    
    // Platform fee (2%)
    uint256 public platformFeePercent = 2;
    uint256 public collectedFees;
    
    // Events
    event AssignmentCreated(
        uint256 indexed assignmentId,
        address indexed recruiter,
        uint256 rewardAmount,
        string title
    );
    
    event SubmissionCreated(
        uint256 indexed submissionId,
        uint256 indexed assignmentId,
        address indexed candidate,
        string githubPRUrl
    );
    
    event SubmissionReviewed(
        uint256 indexed submissionId,
        SubmissionStatus status,
        address reviewer
    );
    
    event RewardPaid(
        uint256 indexed submissionId,
        address indexed candidate,
        uint256 amount
    );
    
    event CertificateMinted(
        uint256 indexed submissionId,
        address indexed candidate,
        uint256 tokenId
    );
    
    event AssignmentCancelled(
        uint256 indexed assignmentId,
        address indexed recruiter
    );
    
    constructor(address _celoToken) Ownable(msg.sender) {
        celoToken = IERC20(_celoToken);
    }
    
    /**
     * @notice Create a new assignment with escrow deposit
     * @param title Assignment title
     * @param metadataURI IPFS hash of assignment details
     * @param rewardAmount Reward in CELO tokens
     * @param maxSubmissions Maximum number of submissions
     * @param autoVerify Enable auto-verification
     * @param expiresAt Expiration timestamp
     */
    function createAssignment(
        string memory title,
        string memory metadataURI,
        uint256 rewardAmount,
        uint256 maxSubmissions,
        bool autoVerify,
        uint256 expiresAt
    ) external payable nonReentrant returns (uint256) {
        require(rewardAmount > 0, "Reward must be > 0");
        require(maxSubmissions > 0, "Max submissions must be > 0");
        require(expiresAt > block.timestamp, "Invalid expiration");
        
        // Calculate total escrow (reward * max submissions)
        uint256 totalEscrow = rewardAmount * maxSubmissions;
        
        // Require exact escrow amount sent as native CELO
        require(msg.value == totalEscrow, "Incorrect escrow amount sent");
        
        assignmentCounter++;
        
        assignments[assignmentCounter] = Assignment({
            assignmentId: assignmentCounter,
            recruiter: msg.sender,
            title: title,
            metadataURI: metadataURI,
            rewardAmount: rewardAmount,
            maxSubmissions: maxSubmissions,
            currentSubmissions: 0,
            autoVerify: autoVerify,
            status: AssignmentStatus.Active,
            createdAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        recruiterDeposits[msg.sender] += totalEscrow;
        
        emit AssignmentCreated(assignmentCounter, msg.sender, rewardAmount, title);
        
        return assignmentCounter;
    }
    
    /**
     * @notice Submit a solution for an assignment
     * @param assignmentId Assignment ID
     * @param githubPRUrl GitHub Pull Request URL
     * @param submissionURI IPFS hash of submission details
     */
    function submitSolution(
        uint256 assignmentId,
        string memory githubPRUrl,
        string memory submissionURI
    ) external nonReentrant returns (uint256) {
        Assignment storage assignment = assignments[assignmentId];
        
        require(assignment.status == AssignmentStatus.Active, "Assignment not active");
        require(assignment.currentSubmissions < assignment.maxSubmissions, "Max submissions reached");
        require(block.timestamp < assignment.expiresAt, "Assignment expired");
        
        submissionCounter++;
        
        submissions[submissionCounter] = Submission({
            submissionId: submissionCounter,
            assignmentId: assignmentId,
            candidate: msg.sender,
            githubPRUrl: githubPRUrl,
            submissionURI: submissionURI,
            aiVerificationScore: 0,
            githubChecksPassed: false,
            status: SubmissionStatus.Pending,
            submittedAt: block.timestamp,
            reviewedAt: 0
        });
        
        assignmentSubmissions[assignmentId].push(submissionCounter);
        assignment.currentSubmissions++;
        
        if (assignment.currentSubmissions == 1) {
            assignment.status = AssignmentStatus.InProgress;
        }
        
        emit SubmissionCreated(submissionCounter, assignmentId, msg.sender, githubPRUrl);
        
        return submissionCounter;
    }
    
    /**
     * @notice Update submission verification results (called by backend)
     * @param submissionId Submission ID
     * @param aiScore AI verification score (0-100)
     * @param githubPassed GitHub checks passed
     */
    function updateVerification(
        uint256 submissionId,
        uint256 aiScore,
        bool githubPassed
    ) external {
        Submission storage submission = submissions[submissionId];
        Assignment storage assignment = assignments[submission.assignmentId];
        
        require(
            msg.sender == assignment.recruiter || msg.sender == owner(),
            "Not authorized"
        );
        require(submission.status == SubmissionStatus.Pending, "Invalid status");
        
        submission.aiVerificationScore = aiScore;
        submission.githubChecksPassed = githubPassed;
        submission.status = SubmissionStatus.Reviewing;
        
        // Auto-approve if enabled and score >= 90
        if (assignment.autoVerify && aiScore >= 90 && githubPassed) {
            _approveSubmission(submissionId);
        }
    }
    
    /**
     * @notice Approve a submission (recruiter or auto)
     * @param submissionId Submission ID
     */
    function approveSubmission(uint256 submissionId) external {
        Submission storage submission = submissions[submissionId];
        Assignment storage assignment = assignments[submission.assignmentId];
        
        require(
            msg.sender == assignment.recruiter || msg.sender == owner(),
            "Not authorized"
        );
        require(
            submission.status == SubmissionStatus.Reviewing,
            "Invalid status"
        );
        
        _approveSubmission(submissionId);
    }
    
    /**
     * @notice Internal function to approve submission
     */
    function _approveSubmission(uint256 submissionId) internal {
        Submission storage submission = submissions[submissionId];
        Assignment storage assignment = assignments[submission.assignmentId];
        
        submission.status = SubmissionStatus.Approved;
        submission.reviewedAt = block.timestamp;
        
        emit SubmissionReviewed(submissionId, SubmissionStatus.Approved, msg.sender);
        
        // Pay reward automatically
        _payReward(submissionId);
    }
    
    /**
     * @notice Reject a submission
     * @param submissionId Submission ID
     */
    function rejectSubmission(uint256 submissionId) external {
        Submission storage submission = submissions[submissionId];
        Assignment storage assignment = assignments[submission.assignmentId];
        
        require(
            msg.sender == assignment.recruiter || msg.sender == owner(),
            "Not authorized"
        );
        require(
            submission.status == SubmissionStatus.Reviewing,
            "Invalid status"
        );
        
        submission.status = SubmissionStatus.Rejected;
        submission.reviewedAt = block.timestamp;
        
        emit SubmissionReviewed(submissionId, SubmissionStatus.Rejected, msg.sender);
    }
    
    /**
     * @notice Pay reward to candidate
     */
    function _payReward(uint256 submissionId) internal {
        Submission storage submission = submissions[submissionId];
        Assignment storage assignment = assignments[submission.assignmentId];
        
        require(submission.status == SubmissionStatus.Approved, "Not approved");
        
        uint256 rewardAmount = assignment.rewardAmount;
        uint256 platformFee = (rewardAmount * platformFeePercent) / 100;
        uint256 candidateReward = rewardAmount - platformFee;
        
        // Update state
        submission.status = SubmissionStatus.Paid;
        recruiterDeposits[assignment.recruiter] -= rewardAmount;
        collectedFees += platformFee;
        
        // Transfer native CELO reward to candidate
        (bool success, ) = payable(submission.candidate).call{value: candidateReward}("");
        require(success, "Transfer failed");
        
        emit RewardPaid(submissionId, submission.candidate, candidateReward);
        
        // Mark assignment as completed if this was the only submission
        if (assignment.maxSubmissions == 1) {
            assignment.status = AssignmentStatus.Completed;
        }
    }
    
    /**
     * @notice Mint certificate NFT for approved submission
     * @param submissionId Submission ID
     */
    function mintCertificate(uint256 submissionId) external nonReentrant {
        require(certificateContract != address(0), "Certificate contract not set");
        
        Submission storage submission = submissions[submissionId];
        require(submission.status == SubmissionStatus.Paid, "Not paid yet");
        
        // Call certificate contract to mint NFT
        (bool success, bytes memory data) = certificateContract.call(
            abi.encodeWithSignature(
                "mintCertificate(address,uint256,string)",
                submission.candidate,
                submissionId,
                submission.submissionURI
            )
        );
        
        require(success, "Certificate minting failed");
        
        uint256 tokenId = abi.decode(data, (uint256));
        
        emit CertificateMinted(submissionId, submission.candidate, tokenId);
    }
    
    /**
     * @notice Cancel assignment and refund escrow
     * @param assignmentId Assignment ID
     */
    function cancelAssignment(uint256 assignmentId) external nonReentrant {
        Assignment storage assignment = assignments[assignmentId];
        
        require(msg.sender == assignment.recruiter, "Not recruiter");
        require(
            assignment.status == AssignmentStatus.Active,
            "Cannot cancel"
        );
        require(assignment.currentSubmissions == 0, "Has submissions");
        
        assignment.status = AssignmentStatus.Cancelled;
        
        // Calculate refund
        uint256 refundAmount = assignment.rewardAmount * assignment.maxSubmissions;
        recruiterDeposits[msg.sender] -= refundAmount;
        
        // Refund escrow
        require(
            celoToken.transfer(msg.sender, refundAmount),
            "Refund failed"
        );
        
        emit AssignmentCancelled(assignmentId, msg.sender);
    }
    
    /**
     * @notice Withdraw unused escrow after expiration
     * @param assignmentId Assignment ID
     */
    function withdrawUnusedEscrow(uint256 assignmentId) external nonReentrant {
        Assignment storage assignment = assignments[assignmentId];
        
        require(msg.sender == assignment.recruiter, "Not recruiter");
        require(block.timestamp > assignment.expiresAt, "Not expired");
        require(
            assignment.status == AssignmentStatus.Active ||
            assignment.status == AssignmentStatus.InProgress,
            "Invalid status"
        );
        
        assignment.status = AssignmentStatus.Expired;
        
        // Calculate unused escrow
        uint256 usedSubmissions = assignment.currentSubmissions;
        uint256 unusedSubmissions = assignment.maxSubmissions - usedSubmissions;
        uint256 refundAmount = assignment.rewardAmount * unusedSubmissions;
        
        if (refundAmount > 0) {
            recruiterDeposits[msg.sender] -= refundAmount;
            
            require(
                celoToken.transfer(msg.sender, refundAmount),
                "Refund failed"
            );
        }
    }
    
    /**
     * @notice Set certificate contract address
     */
    function setCertificateContract(address _certificateContract) external onlyOwner {
        certificateContract = _certificateContract;
    }
    
    /**
     * @notice Update platform fee
     */
    function setPlatformFee(uint256 _feePercent) external onlyOwner {
        require(_feePercent <= 10, "Fee too high");
        platformFeePercent = _feePercent;
    }
    
    /**
     * @notice Withdraw collected fees
     */
    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        
        require(
            celoToken.transfer(owner(), amount),
            "Transfer failed"
        );
    }
    
    /**
     * @notice Get assignment submissions
     */
    function getAssignmentSubmissions(uint256 assignmentId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return assignmentSubmissions[assignmentId];
    }
    
    /**
     * @notice Get assignment details
     */
    function getAssignment(uint256 assignmentId) 
        external 
        view 
        returns (Assignment memory) 
    {
        return assignments[assignmentId];
    }
    
    /**
     * @notice Get submission details
     */
    function getSubmission(uint256 submissionId) 
        external 
        view 
        returns (Submission memory) 
    {
        return submissions[submissionId];
    }
}
