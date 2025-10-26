// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LightweightSkillEscrow
 * @dev Ultra gas-efficient escrow for skill exchange using native CELO
 * 
 * Features:
 * - Native CELO deposits (no ERC20 complexity)
 * - Minimal storage (lower gas costs)
 * - Simple check-ins (very cheap operations)
 * - Automatic distribution on completion
 * - No NFT minting (saves gas)
 * 
 * Perfect for testing with limited funds!
 */
contract LightweightSkillEscrow {
    
    // Minimal barter structure (optimized for gas)
    struct Barter {
        address teacher;
        address learner;
        uint256 depositAmount;      // Amount each person deposits
        uint256 startDate;           // When learner accepts
        uint256 duration;            // Duration in days
        uint8 teacherCheckIns;       // Count of teacher check-ins
        uint8 learnerCheckIns;       // Count of learner check-ins
        bool completed;              // If barter is completed
        bool disputed;               // If dispute raised
    }
    
    // Storage
    mapping(uint256 => Barter) public barters;
    uint256 public nextBarterId;
    address public owner;
    
    // Events
    event BarterProposed(uint256 indexed barterId, address indexed teacher, address indexed learner, uint256 depositAmount);
    event BarterAccepted(uint256 indexed barterId, uint256 startDate);
    event CheckInRecorded(uint256 indexed barterId, address indexed user, uint8 totalCheckIns);
    event BarterCompleted(uint256 indexed barterId, address teacher, address learner);
    event DisputeRaised(uint256 indexed barterId, address indexed raiser);
    event DisputeResolved(uint256 indexed barterId, address winner, uint256 amount);
    
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Propose a new skill barter with CELO deposit
     * @param _learner Address of the learner
     * @param _duration Duration in days
     */
    function proposeBarter(
        address _learner,
        uint256 _duration
    ) external payable returns (uint256) {
        require(_learner != address(0), "Invalid learner");
        require(_learner != msg.sender, "Cannot barter with yourself");
        require(msg.value >= 0.01 ether, "Minimum 0.01 CELO deposit");
        require(_duration >= 7 && _duration <= 365, "Duration must be 7-365 days");
        
        uint256 barterId = nextBarterId++;
        
        barters[barterId] = Barter({
            teacher: msg.sender,
            learner: _learner,
            depositAmount: msg.value,
            startDate: 0,
            duration: _duration,
            teacherCheckIns: 0,
            learnerCheckIns: 0,
            completed: false,
            disputed: false
        });
        
        emit BarterProposed(barterId, msg.sender, _learner, msg.value);
        return barterId;
    }
    
    /**
     * @dev Accept a barter proposal with matching deposit
     * @param _barterId ID of the barter to accept
     */
    function acceptBarter(uint256 _barterId) external payable {
        Barter storage barter = barters[_barterId];
        
        require(msg.sender == barter.learner, "Only learner can accept");
        require(barter.startDate == 0, "Already accepted");
        require(msg.value == barter.depositAmount, "Must match deposit amount");
        
        barter.startDate = block.timestamp;
        
        emit BarterAccepted(_barterId, block.timestamp);
    }
    
    /**
     * @dev Record a daily check-in (very cheap operation!)
     * @param _barterId ID of the barter
     */
    function checkIn(uint256 _barterId) external {
        Barter storage barter = barters[_barterId];
        
        require(barter.startDate > 0, "Barter not started");
        require(!barter.completed, "Barter already completed");
        require(
            msg.sender == barter.teacher || msg.sender == barter.learner,
            "Not a participant"
        );
        
        if (msg.sender == barter.teacher) {
            barter.teacherCheckIns++;
            emit CheckInRecorded(_barterId, msg.sender, barter.teacherCheckIns);
        } else {
            barter.learnerCheckIns++;
            emit CheckInRecorded(_barterId, msg.sender, barter.learnerCheckIns);
        }
    }
    
    /**
     * @dev Complete barter and distribute funds
     * @param _barterId ID of the barter
     */
    function completeBarter(uint256 _barterId) external {
        Barter storage barter = barters[_barterId];
        
        require(!barter.completed, "Already completed");
        require(!barter.disputed, "Barter is disputed");
        require(barter.startDate > 0, "Not started");
        require(
            msg.sender == barter.teacher || msg.sender == barter.learner,
            "Not a participant"
        );
        
        // Check if duration has passed
        require(
            block.timestamp >= barter.startDate + (barter.duration * 1 days),
            "Duration not complete"
        );
        
        // Check participation (80% required)
        uint256 requiredCheckIns = (barter.duration * 80) / 100;
        require(
            barter.teacherCheckIns >= requiredCheckIns,
            "Teacher insufficient check-ins"
        );
        require(
            barter.learnerCheckIns >= requiredCheckIns,
            "Learner insufficient check-ins"
        );
        
        barter.completed = true;
        
        // Distribute funds equally (both get their deposits back)
        uint256 totalAmount = barter.depositAmount * 2;
        uint256 halfAmount = totalAmount / 2;
        
        payable(barter.teacher).transfer(halfAmount);
        payable(barter.learner).transfer(halfAmount);
        
        emit BarterCompleted(_barterId, barter.teacher, barter.learner);
    }
    
    /**
     * @dev Raise a dispute
     * @param _barterId ID of the barter
     */
    function raiseDispute(uint256 _barterId) external {
        Barter storage barter = barters[_barterId];
        
        require(barter.startDate > 0, "Not started");
        require(!barter.completed, "Already completed");
        require(
            msg.sender == barter.teacher || msg.sender == barter.learner,
            "Not a participant"
        );
        
        barter.disputed = true;
        
        emit DisputeRaised(_barterId, msg.sender);
    }
    
    /**
     * @dev Resolve dispute (owner only)
     * @param _barterId ID of the barter
     * @param _winner Address of the winner (gets all funds)
     */
    function resolveDispute(uint256 _barterId, address _winner) external {
        require(msg.sender == owner, "Only owner");
        
        Barter storage barter = barters[_barterId];
        require(barter.disputed, "Not disputed");
        require(!barter.completed, "Already completed");
        require(
            _winner == barter.teacher || _winner == barter.learner,
            "Winner must be a participant"
        );
        
        barter.completed = true;
        barter.disputed = false;
        
        uint256 totalAmount = barter.depositAmount * 2;
        payable(_winner).transfer(totalAmount);
        
        emit DisputeResolved(_barterId, _winner, totalAmount);
    }
    
    /**
     * @dev Get barter details
     * @param _barterId ID of the barter
     */
    function getBarterDetails(uint256 _barterId) external view returns (
        address teacher,
        address learner,
        uint256 depositAmount,
        uint256 startDate,
        uint256 duration,
        uint8 teacherCheckIns,
        uint8 learnerCheckIns,
        bool completed,
        bool disputed
    ) {
        Barter storage barter = barters[_barterId];
        return (
            barter.teacher,
            barter.learner,
            barter.depositAmount,
            barter.startDate,
            barter.duration,
            barter.teacherCheckIns,
            barter.learnerCheckIns,
            barter.completed,
            barter.disputed
        );
    }
    
    /**
     * @dev Get participation rate
     * @param _barterId ID of the barter
     */
    function getParticipationRate(uint256 _barterId) external view returns (
        uint256 teacherRate,
        uint256 learnerRate
    ) {
        Barter storage barter = barters[_barterId];
        
        if (barter.duration == 0) return (0, 0);
        
        teacherRate = (uint256(barter.teacherCheckIns) * 100) / barter.duration;
        learnerRate = (uint256(barter.learnerCheckIns) * 100) / barter.duration;
        
        return (teacherRate, learnerRate);
    }
    
    /**
     * @dev Check if barter can be completed
     * @param _barterId ID of the barter
     */
    function canComplete(uint256 _barterId) external view returns (bool) {
        Barter storage barter = barters[_barterId];
        
        if (barter.completed || barter.disputed || barter.startDate == 0) {
            return false;
        }
        
        // Check duration
        if (block.timestamp < barter.startDate + (barter.duration * 1 days)) {
            return false;
        }
        
        // Check participation
        uint256 requiredCheckIns = (barter.duration * 80) / 100;
        if (barter.teacherCheckIns < requiredCheckIns || barter.learnerCheckIns < requiredCheckIns) {
            return false;
        }
        
        return true;
    }
}
