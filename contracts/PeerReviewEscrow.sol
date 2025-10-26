// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PeerReviewEscrow
 * @dev Escrow system for peer reviewers
 * Handles deposits, verification rewards, and reputation tracking
 */
contract PeerReviewEscrow is ReentrancyGuard, Ownable {
    IERC20 public cusdToken;
    
    uint256 public constant REVIEWER_DEPOSIT = 5e18; // 5 cUSD
    uint256 public constant VERIFICATION_REWARD = 5e18; // 5 cUSD per verification
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 10; // 10% fee
    
    enum ApplicationStatus {
        Pending,
        Approved,
        Rejected,
        Withdrawn
    }
    
    enum VerificationStatus {
        Pending,
        Completed,
        Disputed,
        Approved
    }
    
    struct ReviewerApplication {
        address reviewer;
        uint256 depositAmount;
        ApplicationStatus status;
        uint256 appliedAt;
        uint256 approvedAt;
        string applicationURI; // IPFS metadata
        bool depositLocked;
        uint256 totalEarned;
    }
    
    struct SkillVerification {
        uint256 verificationId;
        address reviewer;
        address skillOwner;
        string skillName;
        VerificationStatus status;
        uint8 confidenceScore; // 0-100
        string verificationURI; // IPFS evidence
        uint256 createdAt;
        uint256 completedAt;
        bool rewardPaid;
    }
    
    mapping(address => ReviewerApplication) public applications;
    mapping(address => bool) public approvedReviewers;
    mapping(uint256 => SkillVerification) public verifications;
    
    address[] public pendingApplications;
    address public admin;
    uint256 public verificationCounter;
    uint256 public totalDeposits;
    uint256 public platformFees;
    
    event ApplicationSubmitted(address indexed reviewer, uint256 depositAmount, string applicationURI);
    event ApplicationApproved(address indexed reviewer, uint256 timestamp);
    event ApplicationRejected(address indexed reviewer, string reason);
    event VerificationCreated(uint256 indexed verificationId, address indexed reviewer, address indexed skillOwner, string skillName);
    event VerificationCompleted(uint256 indexed verificationId, uint8 confidenceScore);
    event RewardPaid(uint256 indexed verificationId, address indexed reviewer, uint256 amount);
    event DepositRefunded(address indexed reviewer, uint256 amount);
    event PlatformFeeCollected(uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner(), "Only admin can call this");
        _;
    }
    
    modifier onlyApprovedReviewer() {
        require(approvedReviewers[msg.sender], "Reviewer not approved");
        _;
    }
    
    constructor(address _cusdToken, address _admin) Ownable(msg.sender) {
        cusdToken = IERC20(_cusdToken);
        admin = _admin;
        verificationCounter = 1;
    }
    
    /**
     * @dev Submit reviewer application with deposit
     */
    function submitApplication(string memory applicationURI) external nonReentrant {
        require(applications[msg.sender].reviewer == address(0), "Already applied");
        require(cusdToken.balanceOf(msg.sender) >= REVIEWER_DEPOSIT, "Insufficient balance");
        
        // Transfer deposit to contract
        require(
            cusdToken.transferFrom(msg.sender, address(this), REVIEWER_DEPOSIT),
            "Deposit transfer failed"
        );
        
        applications[msg.sender] = ReviewerApplication({
            reviewer: msg.sender,
            depositAmount: REVIEWER_DEPOSIT,
            status: ApplicationStatus.Pending,
            appliedAt: block.timestamp,
            approvedAt: 0,
            applicationURI: applicationURI,
            depositLocked: true,
            totalEarned: 0
        });
        
        pendingApplications.push(msg.sender);
        totalDeposits += REVIEWER_DEPOSIT;
        
        emit ApplicationSubmitted(msg.sender, REVIEWER_DEPOSIT, applicationURI);
    }
    
    /**
     * @dev Admin approves reviewer application
     */
    function approveApplication(address reviewer) external onlyAdmin nonReentrant {
        ReviewerApplication storage app = applications[reviewer];
        require(app.reviewer != address(0), "Application not found");
        require(app.status == ApplicationStatus.Pending, "Application not pending");
        
        app.status = ApplicationStatus.Approved;
        app.approvedAt = block.timestamp;
        approvedReviewers[reviewer] = true;
        
        // Deposit remains locked in contract for escrow
        emit ApplicationApproved(reviewer, block.timestamp);
    }
    
    /**
     * @dev Admin rejects reviewer application
     */
    function rejectApplication(address reviewer, string memory reason) external onlyAdmin nonReentrant {
        ReviewerApplication storage app = applications[reviewer];
        require(app.reviewer != address(0), "Application not found");
        require(app.status == ApplicationStatus.Pending, "Application not pending");
        
        app.status = ApplicationStatus.Rejected;
        
        // Refund full deposit
        require(cusdToken.transfer(reviewer, app.depositAmount), "Refund failed");
        app.depositLocked = false;
        totalDeposits -= app.depositAmount;
        
        emit ApplicationRejected(reviewer, reason);
    }
    
    /**
     * @dev Create a skill verification task
     */
    function createVerification(
        address skillOwner,
        string memory skillName,
        string memory verificationURI
    ) external onlyAdmin nonReentrant returns (uint256) {
        require(skillOwner != address(0), "Invalid skill owner");
        
        uint256 verificationId = verificationCounter++;
        
        verifications[verificationId] = SkillVerification({
            verificationId: verificationId,
            reviewer: address(0), // Will be assigned when reviewer accepts
            skillOwner: skillOwner,
            skillName: skillName,
            status: VerificationStatus.Pending,
            confidenceScore: 0,
            verificationURI: verificationURI,
            createdAt: block.timestamp,
            completedAt: 0,
            rewardPaid: false
        });
        
        emit VerificationCreated(verificationId, address(0), skillOwner, skillName);
        return verificationId;
    }
    
    /**
     * @dev Reviewer accepts and completes verification
     */
    function completeVerification(
        uint256 verificationId,
        uint8 confidenceScore,
        string memory resultURI
    ) external onlyApprovedReviewer nonReentrant {
        require(confidenceScore <= 100, "Invalid confidence score");
        SkillVerification storage verification = verifications[verificationId];
        require(verification.skillOwner != address(0), "Verification not found");
        require(verification.status == VerificationStatus.Pending, "Verification not pending");
        
        verification.reviewer = msg.sender;
        verification.confidenceScore = confidenceScore;
        verification.status = VerificationStatus.Completed;
        verification.completedAt = block.timestamp;
        verification.verificationURI = resultURI;
        
        // Calculate reward
        uint256 fee = (VERIFICATION_REWARD * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 reviewerReward = VERIFICATION_REWARD - fee;
        
        // Pay reviewer
        require(cusdToken.transfer(msg.sender, reviewerReward), "Reward payment failed");
        
        // Update reviewer earnings
        ReviewerApplication storage app = applications[msg.sender];
        app.totalEarned += reviewerReward;
        
        platformFees += fee;
        verification.rewardPaid = true;
        
        emit VerificationCompleted(verificationId, confidenceScore);
        emit RewardPaid(verificationId, msg.sender, reviewerReward);
        emit PlatformFeeCollected(fee);
    }
    
    /**
     * @dev Withdraw reviewer deposit (only after leaving platform)
     */
    function withdrawDeposit() external nonReentrant {
        ReviewerApplication storage app = applications[msg.sender];
        require(app.reviewer != address(0), "No application found");
        require(app.depositLocked, "Deposit already withdrawn");
        require(app.status == ApplicationStatus.Approved, "Application not approved");
        
        app.depositLocked = false;
        totalDeposits -= app.depositAmount;
        
        require(cusdToken.transfer(msg.sender, app.depositAmount), "Withdrawal failed");
        
        emit DepositRefunded(msg.sender, app.depositAmount);
    }
    
    /**
     * @dev Get pending applications count
     */
    function getPendingApplicationsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < pendingApplications.length; i++) {
            if (applications[pendingApplications[i]].status == ApplicationStatus.Pending) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Get verification details
     */
    function getVerification(uint256 verificationId) external view returns (SkillVerification memory) {
        return verifications[verificationId];
    }
    
    /**
     * @dev Get reviewer stats
     */
    function getReviewerStats(address reviewer) external view returns (
        uint256 totalEarned,
        uint256 depositAmount,
        bool isApproved,
        ApplicationStatus status
    ) {
        ReviewerApplication storage app = applications[reviewer];
        return (app.totalEarned, app.depositAmount, approvedReviewers[reviewer], app.status);
    }
    
    /**
     * @dev Withdraw platform fees (admin only)
     */
    function withdrawPlatformFees() external onlyAdmin nonReentrant {
        require(platformFees > 0, "No fees to withdraw");
        uint256 amount = platformFees;
        platformFees = 0;
        require(cusdToken.transfer(msg.sender, amount), "Withdrawal failed");
    }
    
    /**
     * @dev Update admin address
     */
    function setAdmin(address newAdmin) external onlyOwner {
        admin = newAdmin;
    }
}
