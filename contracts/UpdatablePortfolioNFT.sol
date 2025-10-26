// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title UpdatablePortfolioNFT
 * @dev Portfolio NFT that can be updated every 3-6 months with new skills
 * - Encrypted metadata on IPFS
 * - Owner-controlled sharing permissions
 * - Auto-update mechanism with time locks
 */
contract UpdatablePortfolioNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // Portfolio metadata structure
    struct Portfolio {
        string encryptedIpfsHash;  // Encrypted IPFS hash
        uint256 lastUpdated;       // Timestamp of last update
        uint256 nextUpdateAllowed; // Timestamp when next update is allowed
        address owner;             // Portfolio owner
        bool isActive;             // Portfolio status
        uint256 version;           // Portfolio version number
    }

    // Sharing permissions structure
    struct SharingPermission {
        address sharedWith;        // Address that can view
        uint256 expiresAt;         // Permission expiry timestamp
        bool canView;              // View permission
        string encryptionKey;      // Encrypted decryption key for this viewer
    }

    // Mappings
    mapping(uint256 => Portfolio) public portfolios;
    mapping(uint256 => SharingPermission[]) public sharingPermissions;
    mapping(address => uint256[]) public userPortfolios;
    
    // Constants
    uint256 public constant MIN_UPDATE_INTERVAL = 90 days;  // 3 months
    uint256 public constant MAX_UPDATE_INTERVAL = 180 days; // 6 months
    uint256 public constant DEFAULT_SHARING_DURATION = 30 days;

    // Events
    event PortfolioMinted(
        uint256 indexed tokenId,
        address indexed owner,
        string encryptedIpfsHash,
        string encryptionType,
        uint256 timestamp
    );

    event PortfolioUpdated(
        uint256 indexed tokenId,
        string newEncryptedIpfsHash,
        string encryptionType,
        uint256 version,
        uint256 timestamp
    );

    event SharingPermissionGranted(
        uint256 indexed tokenId,
        address indexed sharedWith,
        uint256 expiresAt
    );

    event SharingPermissionRevoked(
        uint256 indexed tokenId,
        address indexed revokedFrom
    );

    constructor() ERC721("HireNexa Portfolio", "HNXP") Ownable(msg.sender) {}

    /**
     * @dev Base URI for computing {tokenURI}
     * Using Pinata gateway for better compatibility with explorers
     */
    function _baseURI() internal pure override returns (string memory) {
        return "https://gateway.pinata.cloud/ipfs/";
    }

    /**
     * @dev Override tokenURI to return gateway URL for explorer compatibility
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        string memory storedURI = portfolios[tokenId].encryptedIpfsHash;
        
        // If stored URI already starts with https://, return as is
        bytes memory uriBytes = bytes(storedURI);
        if (uriBytes.length > 8 && 
            uriBytes[0] == 'h' && uriBytes[1] == 't' && uriBytes[2] == 't' && 
            uriBytes[3] == 'p' && uriBytes[4] == 's') {
            return storedURI;
        }
        
        // If starts with ipfs://, extract the hash
        string memory ipfsHash = storedURI;
        if (uriBytes.length > 7 && 
            uriBytes[0] == 'i' && uriBytes[1] == 'p' && uriBytes[2] == 'f' && 
            uriBytes[3] == 's' && uriBytes[4] == ':' && uriBytes[5] == '/' && uriBytes[6] == '/') {
            // Extract hash after ipfs://
            bytes memory hashBytes = new bytes(uriBytes.length - 7);
            for (uint i = 0; i < hashBytes.length; i++) {
                hashBytes[i] = uriBytes[i + 7];
            }
            ipfsHash = string(hashBytes);
        }
        
        // Return full gateway URL
        return string(abi.encodePacked(_baseURI(), ipfsHash));
    }

    /**
     * @dev Mint a new portfolio NFT
     * @param to Address to mint to
     * @param encryptedIpfsHash Encrypted IPFS hash containing portfolio data
     */
    function mintPortfolio(
        address to,
        string memory encryptedIpfsHash
    ) public returns (uint256) {
        uint256 newTokenId = ++_nextTokenId;

        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, encryptedIpfsHash);

        portfolios[newTokenId] = Portfolio({
            encryptedIpfsHash: encryptedIpfsHash,
            lastUpdated: block.timestamp,
            nextUpdateAllowed: block.timestamp + MIN_UPDATE_INTERVAL,
            owner: to,
            isActive: true,
            version: 1
        });

        userPortfolios[to].push(newTokenId);

        emit PortfolioMinted(
            newTokenId, 
            to, 
            encryptedIpfsHash, 
            "AES-256-GCM", 
            block.timestamp
        );

        return newTokenId;
    }

    /**
     * @dev Update portfolio with new skills (only after 3 months)
     * @param tokenId Token ID to update
     * @param newEncryptedIpfsHash New encrypted IPFS hash
     */
    function updatePortfolio(
        uint256 tokenId,
        string memory newEncryptedIpfsHash
    ) public {
        require(_ownerOf(tokenId) == msg.sender, "Not portfolio owner");
        require(portfolios[tokenId].isActive, "Portfolio not active");
        require(
            block.timestamp >= portfolios[tokenId].nextUpdateAllowed,
            "Update not allowed yet - must wait 3 months"
        );

        Portfolio storage portfolio = portfolios[tokenId];
        portfolio.encryptedIpfsHash = newEncryptedIpfsHash;
        portfolio.lastUpdated = block.timestamp;
        portfolio.nextUpdateAllowed = block.timestamp + MIN_UPDATE_INTERVAL;
        portfolio.version++;

        _setTokenURI(tokenId, newEncryptedIpfsHash);

        emit PortfolioUpdated(
            tokenId,
            newEncryptedIpfsHash,
            "AES-256-GCM",
            portfolio.version,
            block.timestamp
        );
    }

    /**
     * @dev Grant sharing permission to another address
     * @param tokenId Token ID to share
     * @param sharedWith Address to share with
     * @param duration Duration of sharing permission (in seconds)
     * @param encryptedKey Encrypted decryption key for the viewer
     */
    function grantSharingPermission(
        uint256 tokenId,
        address sharedWith,
        uint256 duration,
        string memory encryptedKey
    ) public {
        require(_ownerOf(tokenId) == msg.sender, "Not portfolio owner");
        require(sharedWith != address(0), "Invalid address");
        require(duration > 0 && duration <= 365 days, "Invalid duration");

        uint256 expiresAt = block.timestamp + duration;

        sharingPermissions[tokenId].push(SharingPermission({
            sharedWith: sharedWith,
            expiresAt: expiresAt,
            canView: true,
            encryptionKey: encryptedKey
        }));

        emit SharingPermissionGranted(tokenId, sharedWith, expiresAt);
    }

    /**
     * @dev Revoke sharing permission
     * @param tokenId Token ID
     * @param revokeFrom Address to revoke from
     */
    function revokeSharingPermission(
        uint256 tokenId,
        address revokeFrom
    ) public {
        require(_ownerOf(tokenId) == msg.sender, "Not portfolio owner");

        SharingPermission[] storage permissions = sharingPermissions[tokenId];
        for (uint256 i = 0; i < permissions.length; i++) {
            if (permissions[i].sharedWith == revokeFrom) {
                permissions[i].canView = false;
                emit SharingPermissionRevoked(tokenId, revokeFrom);
            }
        }
    }

    /**
     * @dev Check if address has permission to view portfolio
     * @param tokenId Token ID
     * @param viewer Address to check
     */
    function canViewPortfolio(
        uint256 tokenId,
        address viewer
    ) public view returns (bool, string memory) {
        // Owner can always view
        if (_ownerOf(tokenId) == viewer) {
            return (true, portfolios[tokenId].encryptedIpfsHash);
        }

        // Check sharing permissions
        SharingPermission[] memory permissions = sharingPermissions[tokenId];
        for (uint256 i = 0; i < permissions.length; i++) {
            if (
                permissions[i].sharedWith == viewer &&
                permissions[i].canView &&
                block.timestamp < permissions[i].expiresAt
            ) {
                return (true, permissions[i].encryptionKey);
            }
        }

        return (false, "");
    }

    /**
     * @dev Get portfolio details
     * @param tokenId Token ID
     */
    function getPortfolio(uint256 tokenId)
        public
        view
        returns (
            string memory encryptedIpfsHash,
            uint256 lastUpdated,
            uint256 nextUpdateAllowed,
            address portfolioOwner,
            bool isActive,
            uint256 version
        )
    {
        Portfolio memory portfolio = portfolios[tokenId];
        return (
            portfolio.encryptedIpfsHash,
            portfolio.lastUpdated,
            portfolio.nextUpdateAllowed,
            portfolio.owner,
            portfolio.isActive,
            portfolio.version
        );
    }

    /**
     * @dev Get all portfolios owned by an address
     * @param owner Address to check
     */
    function getPortfoliosByOwner(address owner)
        public
        view
        returns (uint256[] memory)
    {
        return userPortfolios[owner];
    }

    /**
     * @dev Check if portfolio can be updated
     * @param tokenId Token ID
     */
    function canUpdatePortfolio(uint256 tokenId)
        public
        view
        returns (bool, uint256)
    {
        Portfolio memory portfolio = portfolios[tokenId];
        bool canUpdate = block.timestamp >= portfolio.nextUpdateAllowed;
        uint256 timeRemaining = canUpdate
            ? 0
            : portfolio.nextUpdateAllowed - block.timestamp;
        return (canUpdate, timeRemaining);
    }

    /**
     * @dev Get sharing permissions for a portfolio
     * @param tokenId Token ID
     */
    function getSharingPermissions(uint256 tokenId)
        public
        view
        returns (SharingPermission[] memory)
    {
        return sharingPermissions[tokenId];
    }

    /**
     * @dev Deactivate portfolio (emergency)
     * @param tokenId Token ID
     */
    function deactivatePortfolio(uint256 tokenId) public {
        require(_ownerOf(tokenId) == msg.sender, "Not portfolio owner");
        portfolios[tokenId].isActive = false;
    }

    /**
     * @dev Reactivate portfolio
     * @param tokenId Token ID
     */
    function reactivatePortfolio(uint256 tokenId) public {
        require(_ownerOf(tokenId) == msg.sender, "Not portfolio owner");
        portfolios[tokenId].isActive = true;
    }
}
