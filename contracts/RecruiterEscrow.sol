// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RecruiterEscrow
 * @dev Escrow system for recruiter applications and deposits
 * Prevents abuse by requiring deposits from recruiters
 */
contract RecruiterEscrow is ReentrancyGuard, Ownable {
    IERC20 public cusdToken;
    
    uint256 public constant RECRUITER_DEPOSIT = 10e18; // 10 cUSD
    uint256 public constant PLATFORM_FEE_PERCENTAGE = 5; // 5% fee
    
    enum ApplicationStatus {
        Pending,
        Approved,
        Rejected,
        Withdrawn
    }
    
    struct RecruiterApplication {
        address recruiter;
        uint256 depositAmount;
        ApplicationStatus status;
        uint256 appliedAt;
        uint256 approvedAt;
        string applicationURI; // IPFS metadata
        bool depositRefunded;
    }
    
    mapping(address => RecruiterApplication) public applications;
    mapping(address => bool) public approvedRecruiters;
    
    address[] public pendingApplications;
    address public admin;
    uint256 public totalDeposits;
    uint256 public platformFees;
    
    event ApplicationSubmitted(address indexed recruiter, uint256 depositAmount, string applicationURI);
    event ApplicationApproved(address indexed recruiter, uint256 timestamp);
    event ApplicationRejected(address indexed recruiter, string reason);
    event DepositRefunded(address indexed recruiter, uint256 amount);
    event PlatformFeeCollected(uint256 amount);
    
    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == owner(), "Only admin can call this");
        _;
    }
    
    modifier onlyApprovedRecruiter() {
        require(approvedRecruiters[msg.sender], "Recruiter not approved");
        _;
    }
    
    constructor(address _cusdToken, address _admin) Ownable(msg.sender) {
        cusdToken = IERC20(_cusdToken);
        admin = _admin;
    }
    
    /**
     * @dev Submit recruiter application with deposit
     */
    function submitApplication(string memory applicationURI) external nonReentrant {
        require(applications[msg.sender].recruiter == address(0), "Already applied");
        require(cusdToken.balanceOf(msg.sender) >= RECRUITER_DEPOSIT, "Insufficient balance");
        
        // Transfer deposit to contract
        require(
            cusdToken.transferFrom(msg.sender, address(this), RECRUITER_DEPOSIT),
            "Deposit transfer failed"
        );
        
        applications[msg.sender] = RecruiterApplication({
            recruiter: msg.sender,
            depositAmount: RECRUITER_DEPOSIT,
            status: ApplicationStatus.Pending,
            appliedAt: block.timestamp,
            approvedAt: 0,
            applicationURI: applicationURI,
            depositRefunded: false
        });
        
        pendingApplications.push(msg.sender);
        totalDeposits += RECRUITER_DEPOSIT;
        
        emit ApplicationSubmitted(msg.sender, RECRUITER_DEPOSIT, applicationURI);
    }
    
    /**
     * @dev Admin approves recruiter application
     */
    function approveApplication(address recruiter) external onlyAdmin nonReentrant {
        RecruiterApplication storage app = applications[recruiter];
        require(app.recruiter != address(0), "Application not found");
        require(app.status == ApplicationStatus.Pending, "Application not pending");
        
        app.status = ApplicationStatus.Approved;
        app.approvedAt = block.timestamp;
        approvedRecruiters[recruiter] = true;
        
        // Collect platform fee (5%)
        uint256 fee = (app.depositAmount * PLATFORM_FEE_PERCENTAGE) / 100;
        platformFees += fee;
        
        // Refund deposit minus fee
        uint256 refundAmount = app.depositAmount - fee;
        require(cusdToken.transfer(recruiter, refundAmount), "Refund failed");
        app.depositRefunded = true;
        totalDeposits -= app.depositAmount;
        
        emit ApplicationApproved(recruiter, block.timestamp);
        emit PlatformFeeCollected(fee);
    }
    
    /**
     * @dev Admin rejects recruiter application
     */
    function rejectApplication(address recruiter, string memory reason) external onlyAdmin nonReentrant {
        RecruiterApplication storage app = applications[recruiter];
        require(app.recruiter != address(0), "Application not found");
        require(app.status == ApplicationStatus.Pending, "Application not pending");
        
        app.status = ApplicationStatus.Rejected;
        
        // Refund full deposit
        require(cusdToken.transfer(recruiter, app.depositAmount), "Refund failed");
        app.depositRefunded = true;
        totalDeposits -= app.depositAmount;
        
        emit ApplicationRejected(recruiter, reason);
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
     * @dev Get application details
     */
    function getApplication(address recruiter) external view returns (RecruiterApplication memory) {
        return applications[recruiter];
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
