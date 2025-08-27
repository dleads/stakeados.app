// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title StakeadosCertificate
 * @dev Upgradeable NFT contract for Stakeados educational certificates
 * Features:
 * - ERC721 compliant with metadata storage
 * - Role-based access control
 * - Pausable functionality
 * - Upgradeable via UUPS proxy pattern
 * - Course completion tracking
 * - Batch minting capabilities
 */
contract StakeadosCertificate is 
    Initializable,
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC721EnumerableUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // Role definitions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Certificate data structure
    struct CertificateData {
        string courseId;
        string courseName;
        uint256 completionDate;
        uint256 score;
        string difficulty; // "basic", "intermediate", "advanced"
        bool isValid;
    }

    // State variables
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    
    // Mappings
    mapping(uint256 => CertificateData) public certificates;
    mapping(address => uint256[]) public userCertificates;
    mapping(string => mapping(address => bool)) public courseCompletions;
    
    // Events
    event CertificateMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string courseId,
        string courseName,
        uint256 score
    );
    
    event CertificateRevoked(uint256 indexed tokenId, string reason);
    event BaseURIUpdated(string newBaseURI);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract
     * @param name The name of the NFT collection
     * @param symbol The symbol of the NFT collection
     * @param baseURI The base URI for token metadata
     * @param admin The address that will have admin role
     */
    function initialize(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address admin
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _baseTokenURI = baseURI;
        _nextTokenId = 1;

        // Grant roles to admin
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
    }

    /**
     * @dev Mint a certificate NFT
     * @param to The address to mint the certificate to
     * @param courseId The unique identifier of the course
     * @param courseName The name of the course
     * @param score The score achieved (0-100)
     * @param difficulty The difficulty level of the course
     * @param tokenURI The metadata URI for this specific certificate
     */
    function mintCertificate(
        address to,
        string memory courseId,
        string memory courseName,
        uint256 score,
        string memory difficulty,
        string memory tokenURI
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(courseId).length > 0, "Course ID cannot be empty");
        require(bytes(courseName).length > 0, "Course name cannot be empty");
        require(score <= 100, "Score cannot exceed 100");
        require(!courseCompletions[courseId][to], "Certificate already exists for this course");

        uint256 tokenId = _nextTokenId++;
        
        // Store certificate data
        certificates[tokenId] = CertificateData({
            courseId: courseId,
            courseName: courseName,
            completionDate: block.timestamp,
            score: score,
            difficulty: difficulty,
            isValid: true
        });

        // Track user certificates and course completions
        userCertificates[to].push(tokenId);
        courseCompletions[courseId][to] = true;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit CertificateMinted(tokenId, to, courseId, courseName, score);
        
        return tokenId;
    }

    /**
     * @dev Batch mint certificates to multiple recipients
     * @param recipients Array of addresses to mint certificates to
     * @param courseId The course ID for all certificates
     * @param courseName The course name for all certificates
     * @param scores Array of scores for each recipient
     * @param difficulty The difficulty level
     * @param tokenURIs Array of metadata URIs
     */
    function batchMintCertificates(
        address[] memory recipients,
        string memory courseId,
        string memory courseName,
        uint256[] memory scores,
        string memory difficulty,
        string[] memory tokenURIs
    ) public onlyRole(MINTER_ROLE) whenNotPaused {
        require(recipients.length == scores.length, "Arrays length mismatch");
        require(recipients.length == tokenURIs.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty recipients array");

        for (uint256 i = 0; i < recipients.length; i++) {
            if (!courseCompletions[courseId][recipients[i]]) {
                mintCertificate(
                    recipients[i],
                    courseId,
                    courseName,
                    scores[i],
                    difficulty,
                    tokenURIs[i]
                );
            }
        }
    }

    /**
     * @dev Revoke a certificate (mark as invalid)
     * @param tokenId The token ID to revoke
     * @param reason The reason for revocation
     */
    function revokeCertificate(
        uint256 tokenId,
        string memory reason
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "Certificate does not exist");
        require(certificates[tokenId].isValid, "Certificate already revoked");

        certificates[tokenId].isValid = false;
        emit CertificateRevoked(tokenId, reason);
    }

    /**
     * @dev Get certificate data for a token ID
     * @param tokenId The token ID to query
     */
    function getCertificate(uint256 tokenId) public view returns (CertificateData memory) {
        require(_exists(tokenId), "Certificate does not exist");
        return certificates[tokenId];
    }

    /**
     * @dev Get all certificate token IDs for a user
     * @param user The address to query
     */
    function getUserCertificates(address user) public view returns (uint256[] memory) {
        return userCertificates[user];
    }

    /**
     * @dev Check if user has completed a specific course
     * @param courseId The course ID to check
     * @param user The user address to check
     */
    function hasCourseCompletion(string memory courseId, address user) public view returns (bool) {
        return courseCompletions[courseId][user];
    }

    /**
     * @dev Get the total number of certificates minted
     */
    function totalCertificates() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Update the base URI for metadata
     * @param newBaseURI The new base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Pause the contract
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721Upgradeable, ERC721EnumerableUpgradeable, AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Authorize upgrade (only upgrader role can upgrade)
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}