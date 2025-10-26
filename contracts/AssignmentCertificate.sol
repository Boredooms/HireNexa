// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AssignmentCertificate
 * @notice NFT certificates for completed assignments
 * @dev ERC-721 tokens with metadata stored on IPFS
 */
contract AssignmentCertificate is ERC721, ERC721URIStorage, Ownable {
    
    uint256 private _tokenIdCounter;
    
    // Certificate metadata
    struct CertificateData {
        uint256 tokenId;
        address recipient;
        uint256 submissionId;
        uint256 assignmentId;
        string assignmentTitle;
        string metadataURI;
        uint256 issuedAt;
        bool revoked;
    }
    
    // Mappings
    mapping(uint256 => CertificateData) public certificates;
    mapping(uint256 => uint256) public submissionToCertificate; // submissionId => tokenId
    mapping(address => uint256[]) public userCertificates;
    
    // Authorized minters (escrow contract)
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        uint256 indexed submissionId,
        string assignmentTitle
    );
    
    event CertificateRevoked(
        uint256 indexed tokenId,
        address indexed recipient,
        string reason
    );
    
    event MinterAuthorized(address indexed minter);
    event MinterRevoked(address indexed minter);
    
    constructor() ERC721("Assignment Certificate", "ACERT") Ownable(msg.sender) {}
    
    /**
     * @notice Mint a new certificate
     * @param recipient Certificate recipient
     * @param submissionId Submission ID
     * @param metadataURI IPFS hash of certificate metadata
     */
    function mintCertificate(
        address recipient,
        uint256 submissionId,
        string memory metadataURI
    ) external returns (uint256) {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "Not authorized to mint"
        );
        require(recipient != address(0), "Invalid recipient");
        require(
            submissionToCertificate[submissionId] == 0,
            "Certificate already minted"
        );
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // Mint NFT
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Store certificate data
        certificates[tokenId] = CertificateData({
            tokenId: tokenId,
            recipient: recipient,
            submissionId: submissionId,
            assignmentId: 0, // Set by backend
            assignmentTitle: "",
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            revoked: false
        });
        
        submissionToCertificate[submissionId] = tokenId;
        userCertificates[recipient].push(tokenId);
        
        emit CertificateMinted(tokenId, recipient, submissionId, "");
        
        return tokenId;
    }
    
    /**
     * @notice Mint certificate with full details
     */
    function mintCertificateWithDetails(
        address recipient,
        uint256 submissionId,
        uint256 assignmentId,
        string memory assignmentTitle,
        string memory metadataURI
    ) external returns (uint256) {
        require(
            authorizedMinters[msg.sender] || msg.sender == owner(),
            "Not authorized to mint"
        );
        require(recipient != address(0), "Invalid recipient");
        require(
            submissionToCertificate[submissionId] == 0,
            "Certificate already minted"
        );
        
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        
        // Mint NFT
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);
        
        // Store certificate data
        certificates[tokenId] = CertificateData({
            tokenId: tokenId,
            recipient: recipient,
            submissionId: submissionId,
            assignmentId: assignmentId,
            assignmentTitle: assignmentTitle,
            metadataURI: metadataURI,
            issuedAt: block.timestamp,
            revoked: false
        });
        
        submissionToCertificate[submissionId] = tokenId;
        userCertificates[recipient].push(tokenId);
        
        emit CertificateMinted(tokenId, recipient, submissionId, assignmentTitle);
        
        return tokenId;
    }
    
    /**
     * @notice Revoke a certificate
     * @param tokenId Token ID to revoke
     * @param reason Reason for revocation
     */
    function revokeCertificate(uint256 tokenId, string memory reason) external onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        require(!certificates[tokenId].revoked, "Already revoked");
        
        certificates[tokenId].revoked = true;
        
        emit CertificateRevoked(
            tokenId,
            certificates[tokenId].recipient,
            reason
        );
    }
    
    /**
     * @notice Authorize a minter (escrow contract)
     */
    function authorizeMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter");
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    /**
     * @notice Revoke minter authorization
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    
    /**
     * @notice Get all certificates for a user
     */
    function getUserCertificates(address user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userCertificates[user];
    }
    
    /**
     * @notice Get certificate details
     */
    function getCertificate(uint256 tokenId) 
        external 
        view 
        returns (CertificateData memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Certificate does not exist");
        return certificates[tokenId];
    }
    
    /**
     * @notice Check if certificate is valid (exists and not revoked)
     */
    function isValid(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0) && !certificates[tokenId].revoked;
    }
    
    /**
     * @notice Get total certificates minted
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @notice Override _update to prevent transfers of revoked certificates
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        if (from != address(0)) { // Not minting
            require(!certificates[tokenId].revoked, "Certificate revoked");
        }
        
        return super._update(to, tokenId, auth);
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
