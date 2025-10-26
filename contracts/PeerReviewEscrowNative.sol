// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PeerReviewEscrowNative
 * @dev Escrow system for peer reviewers using native CELO
 * Handles deposits, verification rewards, and reputation tracking
 */
contract PeerReviewEscrowNative is ReentrancyGuard, Ownable {
    
    uint256 public constant VERIFICATION_FEE = 0.01 ether; // 0.01 CELO
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 10; // 10% fee
    
    enum VerificationStatus {
        Pending,
        Completed,
        Disputed,
        Approved
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
        uint256 paidAmount;
    }
    
    mapping(uint256 => SkillVerification) public verifications;
    mapping(address => bool) public approvedReviewers;
    mapping(address => uint256) public reviewerEarnings;
    
    address public admin;
    uint256 public verificationCounter;
    uint256 public platformFees;
    
    event VerificationPaid(uint256 indexed verificationId, address indexed skillOwner, uint256 amount);
    event VerificationCreated(uint256 indexed verificationId, address indexed reviewer, address indexed skillOwner, string skillName);
    event VerificationCompleted(uint256 indexed verificationId, uint8 confidenceScore);
    event RewardPaid(uint256 indexed verificationId, address indexed reviewer, uint256 amount);
    event PlatformFeeCollected(uint256 amount);
    event ReviewerApproved(address indexed reviewer);
    event ReviewerRemoved(address indexed reviewer);
    
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner(), "Only admin can call this");
        _;
    }
    
    modifier onlyApprovedReviewer() {
        require(approvedReviewers[msg.sender], "Reviewer not approved");
        _;
    }
    
    constructor(address _admin) Ownable(msg.sender) {
        admin = _admin;
        verificationCounter = 1;
    }
    
    /**
     * @dev Skill owner pays for verification
     * The submissionId parameter is passed from frontend to track the skill submission
     */
    function payForVerification(uint256 /* submissionId */) external payable nonReentrant {
        require(msg.value == VERIFICATION_FEE, "Must pay exactly 0.01 CELO");
        
        uint256 verificationId = verificationCounter++;
        
        verifications[verificationId] = SkillVerification({
            verificationId: verificationId,
            reviewer: address(0), // Will be assigned when reviewer accepts
            skillOwner: msg.sender,
            skillName: "", // Will be updated from backend using submissionId
            status: VerificationStatus.Pending,
            confidenceScore: 0,
            verificationURI: "",
            createdAt: block.timestamp,
            completedAt: 0,
            rewardPaid: false,
            paidAmount: msg.value
        });
        
        emit VerificationPaid(verificationId, msg.sender, msg.value);
        emit VerificationCreated(verificationId, address(0), msg.sender, "");
        
        // Note: submissionId is used by backend to link verification to skill submission
    }
    
    /**
     * @dev Reviewer completes verification and gets paid
     */
    function completeVerification(
        uint256 verificationId,
        address reviewer,
        uint8 confidenceScore
    ) external onlyAdmin nonReentrant {
        require(confidenceScore <= 100, "Invalid confidence score");
        require(approvedReviewers[reviewer], "Reviewer not approved");
        
        SkillVerification storage verification = verifications[verificationId];
        require(verification.skillOwner != address(0), "Verification not found");
        require(verification.status == VerificationStatus.Pending, "Verification not pending");
        require(!verification.rewardPaid, "Reward already paid");
        
        verification.reviewer = reviewer;
        verification.confidenceScore = confidenceScore;
        verification.status = VerificationStatus.Completed;
        verification.completedAt = block.timestamp;
        
        // Calculate reward (90% to reviewer, 10% platform fee)
        uint256 fee = (verification.paidAmount * PLATFORM_FEE_PERCENTAGE) / 100;
        uint256 reviewerReward = verification.paidAmount - fee;
        
        // Pay reviewer
        (bool success, ) = payable(reviewer).call{value: reviewerReward}("");
        require(success, "Reward payment failed");
        
        // Update stats
        reviewerEarnings[reviewer] += reviewerReward;
        platformFees += fee;
        verification.rewardPaid = true;
        
        emit VerificationCompleted(verificationId, confidenceScore);
        emit RewardPaid(verificationId, reviewer, reviewerReward);
        emit PlatformFeeCollected(fee);
    }
    
    /**
     * @dev Admin approves a reviewer
     */
    function approveReviewer(address reviewer) external onlyAdmin {
        require(reviewer != address(0), "Invalid reviewer address");
        approvedReviewers[reviewer] = true;
        emit ReviewerApproved(reviewer);
    }
    
    /**
     * @dev Admin removes a reviewer
     */
    function removeReviewer(address reviewer) external onlyAdmin {
        approvedReviewers[reviewer] = false;
        emit ReviewerRemoved(reviewer);
    }
    
    /**
     * @dev Batch approve reviewers
     */
    function batchApproveReviewers(address[] calldata reviewers) external onlyAdmin {
        for (uint256 i = 0; i < reviewers.length; i++) {
            approvedReviewers[reviewers[i]] = true;
            emit ReviewerApproved(reviewers[i]);
        }
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
        bool isApproved
    ) {
        return (reviewerEarnings[reviewer], approvedReviewers[reviewer]);
    }
    
    /**
     * @dev Withdraw platform fees (admin only)
     */
    function withdrawPlatformFees() external onlyAdmin nonReentrant {
        require(platformFees > 0, "No fees to withdraw");
        uint256 amount = platformFees;
        platformFees = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Update admin address
     */
    function setAdmin(address newAdmin) external onlyOwner {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }
    
    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdrawal failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    // Receive function to accept CELO
    receive() external payable {}
}
