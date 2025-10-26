// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SkillBarterEscrow
 * @dev Smart contract for skill exchange with escrow, milestones, and automatic payments
 * Features:
 * - Escrow system (both parties deposit tokens)
 * - Daily/milestone check-ins
 * - Automatic token distribution on completion
 * - Dispute resolution
 * - NFT certificate on successful completion
 */
contract SkillBarterEscrow is ERC721, Ownable, ReentrancyGuard {
    
    // Token used for payments (cUSD on Celo)
    IERC20 public paymentToken;
    
    // Counter for barter IDs
    uint256 private _barterIdCounter;
    
    // Counter for NFT token IDs
    uint256 private _tokenIdCounter;
    
    // Barter status enum
    enum BarterStatus {
        Proposed,
        Active,
        Completed,
        Disputed,
        Cancelled
    }
    
    // Milestone struct
    struct Milestone {
        string description;
        uint256 dueDate;
        bool teacherCompleted;
        bool learnerCompleted;
        bool verified;
        string teacherProof; // IPFS hash
        string learnerProof; // IPFS hash
    }
    
    // Barter agreement struct
    struct BarterAgreement {
        uint256 id;
        address teacher;
        address learner;
        string skillOffered;
        string skillRequested;
        uint256 duration; // in days
        uint256 teacherDeposit;
        uint256 learnerDeposit;
        uint256 startDate;
        uint256 endDate;
        BarterStatus status;
        uint256 completedMilestones;
        uint256 totalMilestones;
        bool teacherWithdrawn;
        bool learnerWithdrawn;
    }
    
    // Daily check-in struct
    struct DailyCheckIn {
        uint256 date;
        bool teacherCheckedIn;
        bool learnerCheckedIn;
        string teacherNote;
        string learnerNote;
        uint256 teacherRating; // 1-5
        uint256 learnerRating; // 1-5
    }
    
    // Mappings
    mapping(uint256 => BarterAgreement) public barters;
    mapping(uint256 => Milestone[]) public milestones;
    mapping(uint256 => mapping(uint256 => DailyCheckIn)) public dailyCheckIns; // barterId => day => checkIn
    mapping(uint256 => uint256) public barterToNFT; // barterId => tokenId
    
    // Events
    event BarterProposed(uint256 indexed barterId, address indexed teacher, address indexed learner);
    event BarterAccepted(uint256 indexed barterId, uint256 startDate);
    event DepositMade(uint256 indexed barterId, address indexed user, uint256 amount);
    event MilestoneCompleted(uint256 indexed barterId, uint256 milestoneIndex);
    event DailyCheckInRecorded(uint256 indexed barterId, uint256 day, address indexed user);
    event BarterCompleted(uint256 indexed barterId, uint256 nftTokenId);
    event TokensDistributed(uint256 indexed barterId, address indexed teacher, address indexed learner);
    event DisputeRaised(uint256 indexed barterId, address indexed raiser);
    event DisputeResolved(uint256 indexed barterId, address winner);
    
    constructor(address _paymentToken) ERC721("SkillBarterCertificate", "SBC") Ownable(msg.sender) {
        paymentToken = IERC20(_paymentToken);
    }
    
    /**
     * @dev Propose a new skill barter
     */
    function proposeBarter(
        address _learner,
        string memory _skillOffered,
        string memory _skillRequested,
        uint256 _duration,
        uint256 _teacherDeposit,
        uint256 _learnerDeposit,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestoneDueDates
    ) external returns (uint256) {
        require(_learner != address(0), "Invalid learner address");
        require(_learner != msg.sender, "Cannot barter with yourself");
        require(_duration > 0, "Duration must be positive");
        require(_milestoneDescriptions.length == _milestoneDueDates.length, "Milestone arrays mismatch");
        require(_milestoneDescriptions.length > 0, "Must have at least one milestone");
        
        uint256 barterId = _barterIdCounter++;
        
        BarterAgreement storage barter = barters[barterId];
        barter.id = barterId;
        barter.teacher = msg.sender;
        barter.learner = _learner;
        barter.skillOffered = _skillOffered;
        barter.skillRequested = _skillRequested;
        barter.duration = _duration;
        barter.teacherDeposit = _teacherDeposit;
        barter.learnerDeposit = _learnerDeposit;
        barter.status = BarterStatus.Proposed;
        barter.totalMilestones = _milestoneDescriptions.length;
        
        // Create milestones
        for (uint256 i = 0; i < _milestoneDescriptions.length; i++) {
            milestones[barterId].push(Milestone({
                description: _milestoneDescriptions[i],
                dueDate: _milestoneDueDates[i],
                teacherCompleted: false,
                learnerCompleted: false,
                verified: false,
                teacherProof: "",
                learnerProof: ""
            }));
        }
        
        emit BarterProposed(barterId, msg.sender, _learner);
        return barterId;
    }
    
    /**
     * @dev Accept a barter proposal and make deposits
     */
    function acceptBarter(uint256 _barterId) external nonReentrant {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Proposed, "Barter not in proposed state");
        require(msg.sender == barter.learner, "Only learner can accept");
        
        // Transfer deposits from both parties
        require(
            paymentToken.transferFrom(barter.teacher, address(this), barter.teacherDeposit),
            "Teacher deposit failed"
        );
        require(
            paymentToken.transferFrom(barter.learner, address(this), barter.learnerDeposit),
            "Learner deposit failed"
        );
        
        barter.status = BarterStatus.Active;
        barter.startDate = block.timestamp;
        barter.endDate = block.timestamp + (barter.duration * 1 days);
        
        emit BarterAccepted(_barterId, barter.startDate);
        emit DepositMade(_barterId, barter.teacher, barter.teacherDeposit);
        emit DepositMade(_barterId, barter.learner, barter.learnerDeposit);
    }
    
    /**
     * @dev Record daily check-in
     */
    function recordDailyCheckIn(
        uint256 _barterId,
        string memory _note,
        uint256 _rating
    ) external {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Active, "Barter not active");
        require(msg.sender == barter.teacher || msg.sender == barter.learner, "Not a participant");
        require(_rating >= 1 && _rating <= 5, "Rating must be 1-5");
        
        uint256 currentDay = (block.timestamp - barter.startDate) / 1 days;
        require(currentDay < barter.duration, "Barter period ended");
        
        DailyCheckIn storage checkIn = dailyCheckIns[_barterId][currentDay];
        checkIn.date = block.timestamp;
        
        if (msg.sender == barter.teacher) {
            require(!checkIn.teacherCheckedIn, "Already checked in today");
            checkIn.teacherCheckedIn = true;
            checkIn.teacherNote = _note;
            checkIn.teacherRating = _rating;
        } else {
            require(!checkIn.learnerCheckedIn, "Already checked in today");
            checkIn.learnerCheckedIn = true;
            checkIn.learnerNote = _note;
            checkIn.learnerRating = _rating;
        }
        
        emit DailyCheckInRecorded(_barterId, currentDay, msg.sender);
    }
    
    /**
     * @dev Submit milestone completion proof
     */
    function submitMilestoneProof(
        uint256 _barterId,
        uint256 _milestoneIndex,
        string memory _proofHash
    ) external {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Active, "Barter not active");
        require(msg.sender == barter.teacher || msg.sender == barter.learner, "Not a participant");
        require(_milestoneIndex < milestones[_barterId].length, "Invalid milestone");
        
        Milestone storage milestone = milestones[_barterId][_milestoneIndex];
        require(!milestone.verified, "Milestone already verified");
        
        if (msg.sender == barter.teacher) {
            require(!milestone.teacherCompleted, "Already submitted");
            milestone.teacherCompleted = true;
            milestone.teacherProof = _proofHash;
        } else {
            require(!milestone.learnerCompleted, "Already submitted");
            milestone.learnerCompleted = true;
            milestone.learnerProof = _proofHash;
        }
        
        // Auto-verify if both submitted
        if (milestone.teacherCompleted && milestone.learnerCompleted) {
            milestone.verified = true;
            barter.completedMilestones++;
            emit MilestoneCompleted(_barterId, _milestoneIndex);
        }
    }
    
    /**
     * @dev Complete barter and mint NFT certificate
     */
    function completeBarter(uint256 _barterId) external nonReentrant {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Active, "Barter not active");
        require(
            msg.sender == barter.teacher || msg.sender == barter.learner,
            "Not a participant"
        );
        
        // Check if all milestones completed
        require(
            barter.completedMilestones == barter.totalMilestones,
            "Not all milestones completed"
        );
        
        // Check if duration passed
        require(block.timestamp >= barter.endDate, "Duration not completed");
        
        // Check daily participation (at least 80% check-ins)
        uint256 requiredCheckIns = (barter.duration * 80) / 100;
        uint256 teacherCheckIns = 0;
        uint256 learnerCheckIns = 0;
        
        for (uint256 i = 0; i < barter.duration; i++) {
            if (dailyCheckIns[_barterId][i].teacherCheckedIn) teacherCheckIns++;
            if (dailyCheckIns[_barterId][i].learnerCheckedIn) learnerCheckIns++;
        }
        
        require(
            teacherCheckIns >= requiredCheckIns && learnerCheckIns >= requiredCheckIns,
            "Insufficient daily check-ins"
        );
        
        barter.status = BarterStatus.Completed;
        
        // Mint NFT certificate for both parties
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(barter.teacher, tokenId);
        _safeMint(barter.learner, tokenId + 1);
        _tokenIdCounter++;
        
        barterToNFT[_barterId] = tokenId;
        
        emit BarterCompleted(_barterId, tokenId);
    }
    
    /**
     * @dev Withdraw tokens after successful completion
     */
    function withdrawTokens(uint256 _barterId) external nonReentrant {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Completed, "Barter not completed");
        require(
            msg.sender == barter.teacher || msg.sender == barter.learner,
            "Not a participant"
        );
        
        if (msg.sender == barter.teacher) {
            require(!barter.teacherWithdrawn, "Already withdrawn");
            barter.teacherWithdrawn = true;
            
            // Teacher gets their deposit back + learner's deposit as reward
            uint256 amount = barter.teacherDeposit + barter.learnerDeposit;
            require(paymentToken.transfer(barter.teacher, amount), "Transfer failed");
            
            emit TokensDistributed(_barterId, barter.teacher, barter.learner);
        } else {
            require(!barter.learnerWithdrawn, "Already withdrawn");
            barter.learnerWithdrawn = true;
            
            // Learner gets their deposit back + teacher's deposit as reward
            uint256 amount = barter.learnerDeposit + barter.teacherDeposit;
            require(paymentToken.transfer(barter.learner, amount), "Transfer failed");
            
            emit TokensDistributed(_barterId, barter.teacher, barter.learner);
        }
    }
    
    /**
     * @dev Raise a dispute
     */
    function raiseDispute(uint256 _barterId) external {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Active, "Barter not active");
        require(
            msg.sender == barter.teacher || msg.sender == barter.learner,
            "Not a participant"
        );
        
        barter.status = BarterStatus.Disputed;
        emit DisputeRaised(_barterId, msg.sender);
    }
    
    /**
     * @dev Resolve dispute (only owner/admin)
     */
    function resolveDispute(
        uint256 _barterId,
        address _winner,
        uint256 _teacherAmount,
        uint256 _learnerAmount
    ) external onlyOwner {
        BarterAgreement storage barter = barters[_barterId];
        require(barter.status == BarterStatus.Disputed, "Not in dispute");
        require(
            _winner == barter.teacher || _winner == barter.learner,
            "Invalid winner"
        );
        
        barter.status = BarterStatus.Cancelled;
        
        // Distribute tokens according to admin decision
        if (_teacherAmount > 0) {
            require(paymentToken.transfer(barter.teacher, _teacherAmount), "Teacher transfer failed");
        }
        if (_learnerAmount > 0) {
            require(paymentToken.transfer(barter.learner, _learnerAmount), "Learner transfer failed");
        }
        
        emit DisputeResolved(_barterId, _winner);
    }
    
    /**
     * @dev Get barter details
     */
    function getBarterDetails(uint256 _barterId) external view returns (
        address teacher,
        address learner,
        string memory skillOffered,
        string memory skillRequested,
        uint256 duration,
        BarterStatus status,
        uint256 completedMilestones,
        uint256 totalMilestones
    ) {
        BarterAgreement storage barter = barters[_barterId];
        return (
            barter.teacher,
            barter.learner,
            barter.skillOffered,
            barter.skillRequested,
            barter.duration,
            barter.status,
            barter.completedMilestones,
            barter.totalMilestones
        );
    }
    
    /**
     * @dev Get milestone details
     */
    function getMilestone(uint256 _barterId, uint256 _index) external view returns (
        string memory description,
        uint256 dueDate,
        bool teacherCompleted,
        bool learnerCompleted,
        bool verified
    ) {
        Milestone storage milestone = milestones[_barterId][_index];
        return (
            milestone.description,
            milestone.dueDate,
            milestone.teacherCompleted,
            milestone.learnerCompleted,
            milestone.verified
        );
    }
    
    /**
     * @dev Get daily check-in details
     */
    function getDailyCheckIn(uint256 _barterId, uint256 _day) external view returns (
        bool teacherCheckedIn,
        bool learnerCheckedIn,
        string memory teacherNote,
        string memory learnerNote,
        uint256 teacherRating,
        uint256 learnerRating
    ) {
        DailyCheckIn storage checkIn = dailyCheckIns[_barterId][_day];
        return (
            checkIn.teacherCheckedIn,
            checkIn.learnerCheckedIn,
            checkIn.teacherNote,
            checkIn.learnerNote,
            checkIn.teacherRating,
            checkIn.learnerRating
        );
    }
    
    /**
     * @dev Calculate participation rate
     */
    function getParticipationRate(uint256 _barterId) external view returns (
        uint256 teacherRate,
        uint256 learnerRate
    ) {
        BarterAgreement storage barter = barters[_barterId];
        uint256 teacherCheckIns = 0;
        uint256 learnerCheckIns = 0;
        
        uint256 daysPassed = (block.timestamp - barter.startDate) / 1 days;
        if (daysPassed > barter.duration) daysPassed = barter.duration;
        
        for (uint256 i = 0; i < daysPassed; i++) {
            if (dailyCheckIns[_barterId][i].teacherCheckedIn) teacherCheckIns++;
            if (dailyCheckIns[_barterId][i].learnerCheckedIn) learnerCheckIns++;
        }
        
        teacherRate = daysPassed > 0 ? (teacherCheckIns * 100) / daysPassed : 0;
        learnerRate = daysPassed > 0 ? (learnerCheckIns * 100) / daysPassed : 0;
        
        return (teacherRate, learnerRate);
    }
}
