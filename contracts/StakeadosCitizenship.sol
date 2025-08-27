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
 * @title StakeadosCitizenship
 * @dev Upgradeable NFT contract for Stakeados citizenship tokens
 * Features:
 * - ERC721 compliant with metadata storage
 * - Role-based access control
 * - Points-based eligibility verification
 * - Genesis holder special features
 * - Upgradeable via UUPS proxy pattern
 * - One citizenship per address
 * - Web3 requirements verification
 * - Automatic tier upgrades
 * - Special Genesis privileges
 */
contract StakeadosCitizenship is 
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
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    // Citizenship data structure
    struct CitizenshipData {
        uint256 mintDate;
        uint256 pointsAtMint;
        bool isGenesis;
        string tier; // "bronze", "silver", "gold", "genesis"
        bool isActive;
        uint256 lastTierUpdate;
        uint256 web3Score; // Combined score from ETH balance + transactions
    }

    // Web3 requirements structure
    struct Web3Requirements {
        uint256 minEthBalance; // in wei
        uint256 minTransactions;
        bool requiresWeb3; // Whether Web3 requirements are enforced
    }

    // State variables
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    uint256 public pointsRequirement;
    Web3Requirements public web3Requirements;
    
    // Mappings
    mapping(uint256 => CitizenshipData) public citizenships;
    mapping(address => uint256) public citizenTokens; // One token per citizen
    mapping(address => bool) public hasCitizenship;
    mapping(string => uint256) public tierCounts; // Count of each tier
    
    // Events
    event CitizenshipMinted(
        uint256 indexed tokenId,
        address indexed citizen,
        uint256 points,
        string tier,
        bool isGenesis
    );
    
    event CitizenshipRevoked(uint256 indexed tokenId, string reason);
    event TierUpgraded(uint256 indexed tokenId, string oldTier, string newTier);
    event PointsRequirementUpdated(uint256 newRequirement);
    event Web3RequirementsUpdated(uint256 minEthBalance, uint256 minTransactions);
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
     * @param initialPointsRequirement Initial points required for citizenship
     */
    function initialize(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address admin,
        uint256 initialPointsRequirement
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _baseTokenURI = baseURI;
        _nextTokenId = 1;
        pointsRequirement = initialPointsRequirement;
        
        // Set default Web3 requirements
        web3Requirements = Web3Requirements({
            minEthBalance: 0.001 ether,
            minTransactions: 2,
            requiresWeb3: true
        });

        // Grant roles to admin
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(VERIFIER_ROLE, admin);
    }

    /**
     * @dev Mint a citizenship NFT
     * @param to The address to mint the citizenship to
     * @param points The points the user has at mint time
     * @param isGenesis Whether this is a genesis citizenship
     * @param tokenURI The metadata URI for this citizenship
     */
    function mintCitizenship(
        address to,
        uint256 points,
        bool isGenesis,
        uint256 ethBalance,
        uint256 transactionCount,
        string memory tokenURI
    ) public onlyRole(MINTER_ROLE) whenNotPaused returns (uint256) {
        require(to != address(0), "Cannot mint to zero address");
        require(!hasCitizenship[to], "Address already has citizenship");
        require(points >= pointsRequirement || isGenesis, "Insufficient points for citizenship");
        
        // Verify Web3 requirements (unless Genesis)
        if (!isGenesis && web3Requirements.requiresWeb3) {
            require(ethBalance >= web3Requirements.minEthBalance, "Insufficient ETH balance");
            require(transactionCount >= web3Requirements.minTransactions, "Insufficient transaction count");
        }

        uint256 tokenId = _nextTokenId++;
        
        // Determine tier based on points and genesis status
        uint256 web3Score = _calculateWeb3Score(ethBalance, transactionCount);
        string memory tier = _determineTier(points, isGenesis, web3Score);
        
        // Store citizenship data
        citizenships[tokenId] = CitizenshipData({
            mintDate: block.timestamp,
            pointsAtMint: points,
            isGenesis: isGenesis,
            tier: tier,
            isActive: true,
            lastTierUpdate: block.timestamp,
            web3Score: web3Score
        });

        // Track citizenship
        citizenTokens[to] = tokenId;
        hasCitizenship[to] = true;
        tierCounts[tier]++;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit CitizenshipMinted(tokenId, to, points, tier, isGenesis);
        
        return tokenId;
    }

    /**
     * @dev Calculate Web3 score based on ETH balance and transaction count
     * @param ethBalance The ETH balance in wei
     * @param transactionCount The number of transactions
     */
    function _calculateWeb3Score(uint256 ethBalance, uint256 transactionCount) internal view returns (uint256) {
        uint256 balanceScore = (ethBalance * 100) / web3Requirements.minEthBalance;
        uint256 txScore = (transactionCount * 100) / web3Requirements.minTransactions;
        return (balanceScore + txScore) / 2; // Average of both scores
    }

    /**
     * @dev Determine citizenship tier based on points and genesis status
     * @param points The points amount
     * @param isGenesis Whether this is genesis citizenship
     * @param web3Score The Web3 activity score
     */
    function _determineTier(uint256 points, bool isGenesis, uint256 web3Score) internal pure returns (string memory) {
        if (isGenesis) {
            return "genesis";
        } else if (points >= 1000 && web3Score >= 150) {
            return "gold";
        } else if (points >= 500 && web3Score >= 100) {
            return "silver";
        } else {
            return "bronze";
        }
    }

    /**
     * @dev Upgrade citizenship tier based on new points and Web3 activity
     * @param tokenId The token ID to upgrade
     * @param newPoints The updated points amount
     * @param ethBalance The current ETH balance
     * @param transactionCount The current transaction count
     */
    function upgradeCitizenshipTier(
        uint256 tokenId,
        uint256 newPoints,
        uint256 ethBalance,
        uint256 transactionCount
    ) public onlyRole(MINTER_ROLE) {
        require(_exists(tokenId), "Citizenship does not exist");
        require(citizenships[tokenId].isActive, "Citizenship is not active");
        
        CitizenshipData storage citizenship = citizenships[tokenId];
        string memory oldTier = citizenship.tier;
        
        // Calculate new Web3 score and tier
        uint256 newWeb3Score = _calculateWeb3Score(ethBalance, transactionCount);
        string memory newTier = _determineTier(newPoints, citizenship.isGenesis, newWeb3Score);
        
        // Only upgrade, never downgrade
        if (_compareTiers(newTier, oldTier) > 0) {
            // Update tier counts
            tierCounts[oldTier]--;
            tierCounts[newTier]++;
            
            // Update citizenship data
            citizenship.tier = newTier;
            citizenship.lastTierUpdate = block.timestamp;
            citizenship.web3Score = newWeb3Score;
            
            // Update token URI for new tier
            string memory newTokenURI = string(abi.encodePacked(_baseURI(), newTier, "/", _toString(tokenId), ".json"));
            _setTokenURI(tokenId, newTokenURI);
            
            emit TierUpgraded(tokenId, oldTier, newTier);
        }
    }
    
    /**
     * @dev Compare tier levels (returns 1 if tier1 > tier2, -1 if tier1 < tier2, 0 if equal)
     */
    function _compareTiers(string memory tier1, string memory tier2) internal pure returns (int8) {
        uint8 level1 = _getTierLevel(tier1);
        uint8 level2 = _getTierLevel(tier2);
        
        if (level1 > level2) return 1;
        if (level1 < level2) return -1;
        return 0;
    }
    
    /**
     * @dev Get numeric level for tier comparison
     */
    function _getTierLevel(string memory tier) internal pure returns (uint8) {
        bytes32 tierHash = keccak256(abi.encodePacked(tier));
        if (tierHash == keccak256(abi.encodePacked("genesis"))) return 4;
        if (tierHash == keccak256(abi.encodePacked("gold"))) return 3;
        if (tierHash == keccak256(abi.encodePacked("silver"))) return 2;
        if (tierHash == keccak256(abi.encodePacked("bronze"))) return 1;
        return 0;
    }

    /**
     * @dev Revoke a citizenship (mark as inactive)
     * @param tokenId The token ID to revoke
     * @param reason The reason for revocation
     */
    function revokeCitizenship(
        uint256 tokenId,
        string memory reason
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(tokenId), "Citizenship does not exist");
        require(citizenships[tokenId].isActive, "Citizenship already revoked");

        address owner = ownerOf(tokenId);
        string memory tier = citizenships[tokenId].tier;
        
        citizenships[tokenId].isActive = false;
        hasCitizenship[owner] = false;
        tierCounts[tier]--;
        
        emit CitizenshipRevoked(tokenId, reason);
    }

    /**
     * @dev Check if address meets Web3 requirements for citizenship
     * @param ethBalance The ETH balance to check (in wei)
     * @param transactionCount The transaction count to check
     */
    function meetsWeb3Requirements(uint256 ethBalance, uint256 transactionCount) public view returns (bool) {
        if (!web3Requirements.requiresWeb3) return true;
        return ethBalance >= web3Requirements.minEthBalance && transactionCount >= web3Requirements.minTransactions;
    }

    /**
     * @dev Get citizenship data for a token ID
     * @param tokenId The token ID to query
     */
    function getCitizenship(uint256 tokenId) public view returns (CitizenshipData memory) {
        require(_exists(tokenId), "Citizenship does not exist");
        return citizenships[tokenId];
    }

    /**
     * @dev Get tier statistics
     */
    function getTierStats() public view returns (uint256 bronze, uint256 silver, uint256 gold, uint256 genesis) {
        return (tierCounts["bronze"], tierCounts["silver"], tierCounts["gold"], tierCounts["genesis"]);
    }

    /**
     * @dev Get citizenship token ID for an address
     * @param citizen The address to query
     */
    function getCitizenshipToken(address citizen) public view returns (uint256) {
        require(hasCitizenship[citizen], "Address does not have citizenship");
        return citizenTokens[citizen];
    }

    /**
     * @dev Check if address is eligible for citizenship
     * @param points The points amount to check
     * @param isGenesis Whether to check for genesis eligibility
     * @param ethBalance The ETH balance to check
     * @param transactionCount The transaction count to check
     */
    function isEligibleForCitizenship(
        uint256 points, 
        bool isGenesis,
        uint256 ethBalance,
        uint256 transactionCount
    ) public view returns (bool) {
        bool hasEnoughPoints = points >= pointsRequirement || isGenesis;
        bool meetsWeb3Reqs = isGenesis || meetsWeb3Requirements(ethBalance, transactionCount);
        return hasEnoughPoints && meetsWeb3Reqs;
    }

    /**
     * @dev Update Web3 requirements
     * @param minEthBalance New minimum ETH balance requirement
     * @param minTransactions New minimum transaction count requirement
     * @param requiresWeb3 Whether to enforce Web3 requirements
     */
    function setWeb3Requirements(
        uint256 minEthBalance,
        uint256 minTransactions,
        bool requiresWeb3
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        web3Requirements.minEthBalance = minEthBalance;
        web3Requirements.minTransactions = minTransactions;
        web3Requirements.requiresWeb3 = requiresWeb3;
        
        emit Web3RequirementsUpdated(minEthBalance, minTransactions);
    }

    /**
     * @dev Get the total number of citizenships minted
     */
    function totalCitizenships() public view returns (uint256) {
        return _nextTokenId - 1;
    }

    /**
     * @dev Get the number of active citizenships
     */
    function activeCitizenships() public view returns (uint256) {
        uint256 active = 0;
        for (uint256 i = 1; i < _nextTokenId; i++) {
            if (_exists(i) && citizenships[i].isActive) {
                active++;
            }
        }
        return active;
    }

    /**
     * @dev Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    /**
     * @dev Update points requirement for citizenship
     * @param newRequirement The new points requirement
     */
    function setPointsRequirement(uint256 newRequirement) public onlyRole(DEFAULT_ADMIN_ROLE) {
        pointsRequirement = newRequirement;
        emit PointsRequirementUpdated(newRequirement);
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
     * @dev Override to prevent transfers (soulbound)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable, ERC721EnumerableUpgradeable) whenNotPaused {
        require(from == address(0) || to == address(0), "Citizenship tokens are non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
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