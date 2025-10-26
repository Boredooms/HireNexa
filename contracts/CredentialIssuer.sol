// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CredentialIssuer
 * @dev NFT-based credential system on Celo
 * @notice Tamper-proof credentials with IPFS metadata
 */
contract CredentialIssuer is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    struct Credential {
        uint256 tokenId;
        address recipient;
        string credentialType;
        string metadataIpfs;
        uint256 issuedAt;
        bool revoked;
    }

    // tokenId => Credential
    mapping(uint256 => Credential) public credentials;
    
    // Authorized issuers (platform, institutions, etc.)
    mapping(address => bool) public authorizedIssuers;

    event CredentialIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        string credentialType,
        string metadataIpfs
    );
    
    event CredentialRevoked(uint256 indexed tokenId, address indexed revoker);
    
    event IssuerAuthorized(address indexed issuer, bool authorized);

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender] || msg.sender == owner(),
            "Not authorized issuer"
        );
        _;
    }

    constructor() ERC721("HireNexa Credential", "HNXC") Ownable(msg.sender) {
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @dev Issue a new credential NFT
     * @param _recipient Recipient address
     * @param _credentialType Type of credential
     * @param _metadataIpfs IPFS hash of credential metadata
     * @return tokenId The minted token ID
     */
    function issueCredential(
        address _recipient,
        string memory _credentialType,
        string memory _metadataIpfs
    ) external onlyAuthorizedIssuer returns (uint256) {
        require(_recipient != address(0), "Invalid recipient");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, _metadataIpfs);

        credentials[tokenId] = Credential({
            tokenId: tokenId,
            recipient: _recipient,
            credentialType: _credentialType,
            metadataIpfs: _metadataIpfs,
            issuedAt: block.timestamp,
            revoked: false
        });

        emit CredentialIssued(tokenId, _recipient, _credentialType, _metadataIpfs);

        return tokenId;
    }

    /**
     * @dev Revoke a credential
     * @param _tokenId Token ID to revoke
     */
    function revokeCredential(uint256 _tokenId) external onlyAuthorizedIssuer {
        require(_exists(_tokenId), "Token does not exist");
        require(!credentials[_tokenId].revoked, "Already revoked");

        credentials[_tokenId].revoked = true;

        emit CredentialRevoked(_tokenId, msg.sender);
    }

    /**
     * @dev Verify a credential
     * @param _tokenId Token ID to verify
     * @return valid Whether the credential is valid
     * @return owner Owner of the credential
     * @return metadataIpfs IPFS hash of metadata
     * @return issuedAt Timestamp when issued
     */
    function verifyCredential(uint256 _tokenId)
        external
        view
        returns (
            bool valid,
            address owner,
            string memory metadataIpfs,
            uint256 issuedAt
        )
    {
        if (!_exists(_tokenId)) {
            return (false, address(0), "", 0);
        }

        Credential memory cred = credentials[_tokenId];
        
        return (
            !cred.revoked,
            ownerOf(_tokenId),
            cred.metadataIpfs,
            cred.issuedAt
        );
    }

    /**
     * @dev Get all credentials for an address
     * @param _owner Owner address
     * @return Array of token IDs
     */
    function getCredentialsByOwner(address _owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 balance = balanceOf(_owner);
        uint256[] memory tokenIds = new uint256[](balance);
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_exists(i) && ownerOf(i) == _owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }

        return tokenIds;
    }

    /**
     * @dev Authorize/deauthorize an issuer
     * @param _issuer Issuer address
     * @param _authorized Authorization status
     */
    function setIssuerAuthorization(address _issuer, bool _authorized)
        external
        onlyOwner
    {
        authorizedIssuers[_issuer] = _authorized;
        emit IssuerAuthorized(_issuer, _authorized);
    }

    /**
     * @dev Check if token exists
     * @param _tokenId Token ID
     * @return Whether the token exists
     */
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _ownerOf(_tokenId) != address(0);
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
