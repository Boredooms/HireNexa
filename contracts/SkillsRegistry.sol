// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SkillsRegistry
 * @dev Registry for skill attestations on Celo blockchain
 * @notice FREE to deploy on Alfajores testnet, minimal gas on mainnet
 */
contract SkillsRegistry {
    struct SkillAttestation {
        address user;
        string skill;
        uint8 confidence; // 0-100
        string evidenceIpfs;
        uint256 timestamp;
        address attestor;
        bool revoked;
    }

    // user address => skill attestations
    mapping(address => SkillAttestation[]) public userSkills;
    
    // Authorized attestors (platform, verified peers, etc.)
    mapping(address => bool) public authorizedAttestors;
    
    address public owner;

    event SkillAttested(
        address indexed user,
        string skill,
        uint8 confidence,
        string evidenceIpfs,
        address indexed attestor
    );
    
    event SkillRevoked(
        address indexed user,
        uint256 indexed attestationIndex,
        address indexed revoker
    );
    
    event AttestorAuthorized(address indexed attestor, bool authorized);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyAuthorized() {
        require(
            authorizedAttestors[msg.sender] || msg.sender == owner,
            "Not authorized"
        );
        _;
    }

    constructor() {
        owner = msg.sender;
        authorizedAttestors[msg.sender] = true;
    }

    /**
     * @dev Attest a skill for a user
     * @param _user User address
     * @param _skill Skill name
     * @param _confidence Confidence score (0-100)
     * @param _evidenceIpfs IPFS hash of evidence
     */
    function attestSkill(
        address _user,
        string memory _skill,
        uint8 _confidence,
        string memory _evidenceIpfs
    ) external onlyAuthorized {
        require(_confidence <= 100, "Invalid confidence");
        require(_user != address(0), "Invalid user");

        userSkills[_user].push(
            SkillAttestation({
                user: _user,
                skill: _skill,
                confidence: _confidence,
                evidenceIpfs: _evidenceIpfs,
                timestamp: block.timestamp,
                attestor: msg.sender,
                revoked: false
            })
        );

        emit SkillAttested(_user, _skill, _confidence, _evidenceIpfs, msg.sender);
    }

    /**
     * @dev Revoke a skill attestation
     * @param _user User address
     * @param _index Attestation index
     */
    function revokeSkill(address _user, uint256 _index) external onlyAuthorized {
        require(_index < userSkills[_user].length, "Invalid index");
        require(!userSkills[_user][_index].revoked, "Already revoked");

        userSkills[_user][_index].revoked = true;

        emit SkillRevoked(_user, _index, msg.sender);
    }

    /**
     * @dev Get all skills for a user
     * @param _user User address
     * @return Array of skill attestations
     */
    function getUserSkills(address _user)
        external
        view
        returns (SkillAttestation[] memory)
    {
        return userSkills[_user];
    }

    /**
     * @dev Get active (non-revoked) skills for a user
     * @param _user User address
     * @return Array of active skill attestations
     */
    function getActiveSkills(address _user)
        external
        view
        returns (SkillAttestation[] memory)
    {
        SkillAttestation[] memory allSkills = userSkills[_user];
        uint256 activeCount = 0;

        // Count active skills
        for (uint256 i = 0; i < allSkills.length; i++) {
            if (!allSkills[i].revoked) {
                activeCount++;
            }
        }

        // Create array of active skills
        SkillAttestation[] memory activeSkills = new SkillAttestation[](
            activeCount
        );
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < allSkills.length; i++) {
            if (!allSkills[i].revoked) {
                activeSkills[currentIndex] = allSkills[i];
                currentIndex++;
            }
        }

        return activeSkills;
    }

    /**
     * @dev Authorize/deauthorize an attestor
     * @param _attestor Attestor address
     * @param _authorized Authorization status
     */
    function setAttestorAuthorization(address _attestor, bool _authorized)
        external
        onlyOwner
    {
        authorizedAttestors[_attestor] = _authorized;
        emit AttestorAuthorized(_attestor, _authorized);
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid address");
        owner = _newOwner;
    }
}
