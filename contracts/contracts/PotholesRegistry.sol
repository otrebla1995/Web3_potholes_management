// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPotholesToken {
    function mint(address to, uint256 amount) external;
}

contract PotholesRegistry is ERC2771Context, Ownable, ReentrancyGuard {
    // Structs
    struct PotholeReport {
        uint256 id;
        int256 latitude;
        int256 longitude;
        string ipfsHash;
        uint256 duplicateCount;
        uint256 reportedAt;
        address reporter;
        PotholeStatus status;
    }

    enum PotholeStatus {
        Reported,
        InProgress, 
        Completed,
        Rejected
    }

    // State variables
    IPotholesToken public immutable potholeToken;
    string public cityName;
    
    uint256 public nextReportId = 1;
    uint256 public constant DUPLICATE_RADIUS = 10; // 10 meters
    
    // Rewards (in wei, considering token decimals)
    uint256 public originalReportReward = 10 * 10**18; // 10 PBC
    uint256 public duplicateReporterReward = 2 * 10**18; // 2 PBC  
    uint256 public originalReportFixedReward = 5 * 10**18; // 1 PBC bonus to original reporter
    
    // Storage mappings
    mapping(uint256 => PotholeReport) public reports;
    mapping(bytes32 => uint256) public locationToReportId; // Location hash → report ID
    mapping(address => bool) public registeredCitizens;
    mapping(address => mapping(uint256 => bool)) public userReportedLocation; // user → reportId → hasReported
    mapping(address => bool) public authorizedMunicipals; // Municipal authorities
    
    uint256 public citizenCount;
    uint256 public totalReports;
    
    // Events
    event CitizenRegistered(address indexed citizen);
    event CitizensBatchRegistered(address[] citizens);
    event MunicipalAuthorityAdded(address indexed authority);
    event MunicipalAuthorityRemoved(address indexed authority);
    
    event PotholeReported(
        uint256 indexed reportId,
        address indexed reporter,
        int256 latitude,
        int256 longitude,
        string ipfsHash
    );
    
    event DuplicateReported(
        uint256 indexed originalReportId,
        address indexed duplicateReporter,
        uint256 newDuplicateCount,
        int256 latitude,
        int256 longitude,
        string ipfsHash
    );
    
    event PotholeStatusUpdated(
        uint256 indexed reportId,
        PotholeStatus oldStatus,
        PotholeStatus newStatus,
        address indexed updatedBy
    );
    
    event RewardSettingsUpdated(
        uint256 originalReportReward,
        uint256 duplicateReporterReward,
        uint256 duplicateOriginalBonus
    );

    // Modifiers
    modifier onlyRegisteredCitizen() {
        require(registeredCitizens[_msgSender()], "Not registered citizen");
        _;
    }
    
    modifier onlyMunicipalAuthority() {
        require(authorizedMunicipals[_msgSender()], "Not authorized municipal authority");
        _;
    }
    
    modifier validReportId(uint256 reportId) {
        require(reportId > 0 && reportId < nextReportId, "Invalid report ID");
        _;
    }

    // Constructor
    constructor(
        string memory _cityName,
        address _potholeToken,
        address _trustedForwarder,
        address _initialOwner
    ) ERC2771Context(_trustedForwarder) Ownable(_initialOwner) {
        cityName = _cityName;
        potholeToken = IPotholesToken(_potholeToken);
    }

    // Citizen Management Functions
    function addCitizen(address citizen) external onlyOwner {
        require(!registeredCitizens[citizen], "Citizen already registered");
        registeredCitizens[citizen] = true;
        citizenCount++;
        emit CitizenRegistered(citizen);
    }
    
    function addCitizensBatch(address[] calldata citizens) external onlyOwner {
        for (uint256 i = 0; i < citizens.length; i++) {
            if (!registeredCitizens[citizens[i]]) {
                registeredCitizens[citizens[i]] = true;
                citizenCount++;
            }
        }
        emit CitizensBatchRegistered(citizens);
    }
    
    function removeCitizen(address citizen) external onlyOwner {
        require(registeredCitizens[citizen], "Citizen not registered");
        registeredCitizens[citizen] = false;
        citizenCount--;
    }

    // Municipal Authority Management
    function addMunicipalAuthority(address authority) external onlyOwner {
        authorizedMunicipals[authority] = true;
        emit MunicipalAuthorityAdded(authority);
    }
    
    function removeMunicipalAuthority(address authority) external onlyOwner {
        authorizedMunicipals[authority] = false;
        emit MunicipalAuthorityRemoved(authority);
    }

    // Core Reporting Functions
    function submitReport(
        int256 latitude,
        int256 longitude,
        string calldata ipfsHash
    ) external onlyRegisteredCitizen nonReentrant returns (uint256) {
        require(bytes(ipfsHash).length > 0, "IPFS hash required");
        
        bytes32 locationHash = _getLocationHash(latitude, longitude, DUPLICATE_RADIUS);
        uint256 existingReportId = locationToReportId[locationHash];
        
        if (existingReportId != 0) {
            // This is a duplicate report
            require(!userReportedLocation[_msgSender()][existingReportId], 
                    "You already reported this pothole");
            
            // Mark user as having reported this location
            userReportedLocation[_msgSender()][existingReportId] = true;
            
            // Increment duplicate counter
            reports[existingReportId].duplicateCount++;
            
            // Emit duplicate event (no storage of duplicate data)
            emit DuplicateReported(
                existingReportId,
                _msgSender(),
                reports[existingReportId].duplicateCount,
                latitude,
                longitude,
                ipfsHash
            );
            
            // Reward both reporters
            // if (duplicateReporterReward > 0) {
            //     potholeToken.mint(_msgSender(), duplicateReporterReward);
            // }
            
            return existingReportId;
            
        } else {
            // New unique report
            uint256 reportId = nextReportId++;
            
            reports[reportId] = PotholeReport({
                id: reportId,
                latitude: latitude,
                longitude: longitude,
                ipfsHash: ipfsHash,
                duplicateCount: 1,
                reportedAt: block.timestamp,
                reporter: _msgSender(),
                status: PotholeStatus.Reported
            });
            
            // Store location mapping
            locationToReportId[locationHash] = reportId;
            
            // Mark user as having reported this location
            userReportedLocation[_msgSender()][reportId] = true;
            
            totalReports++;
            
            emit PotholeReported(reportId, _msgSender(), latitude, longitude, ipfsHash);
            
            // Reward original reporter
            // if (originalReportReward > 0) {
            //     potholeToken.mint(_msgSender(), originalReportReward);
            // }
            
            return reportId;
        }
    }

    // Municipal Management Functions
    function updateReportStatus(
        uint256 reportId, 
        PotholeStatus newStatus
    ) external onlyMunicipalAuthority validReportId(reportId) {
        PotholeStatus oldStatus = reports[reportId].status;
        require(oldStatus != newStatus, "Status unchanged");
        
        reports[reportId].status = newStatus;

        if(newStatus == PotholeStatus.InProgress) {
            // Reward original reporter once in progress
            if (originalReportReward > 0) {
                potholeToken.mint(reports[reportId].reporter, originalReportReward);
            }
        }
        if(newStatus == PotholeStatus.Completed) {
            // Reward original reporter once completed
            if (originalReportFixedReward > 0) {
                potholeToken.mint(reports[reportId].reporter, originalReportFixedReward);
            }
        }
        
        emit PotholeStatusUpdated(reportId, oldStatus, newStatus, _msgSender());
    }
    
    function batchUpdateStatus(
        uint256[] calldata reportIds,
        PotholeStatus newStatus
    ) external onlyMunicipalAuthority {
        for (uint256 i = 0; i < reportIds.length; i++) {
            uint256 reportId = reportIds[i];
            if (reportId > 0 && reportId < nextReportId && reports[reportId].status != newStatus) {
                this.updateReportStatus(reportId, newStatus);
            }
        }
    }

    // View Functions
    function getReport(uint256 reportId) 
        external view validReportId(reportId) 
        returns (PotholeReport memory) {
        return reports[reportId];
    }

    function getReportsBatch(
        uint256[] calldata reportIds
    ) external view returns (PotholeReport[] memory) {
        PotholeReport[] memory result = new PotholeReport[](reportIds.length);
        
        for (uint256 i = 0; i < reportIds.length; i++) {
            if (reportIds[i] > 0 && reportIds[i] < nextReportId) {
                result[i] = reports[reportIds[i]];
            }
            // Invalid IDs return empty struct (default values)
        }
        
        return result;
    }
    
    function getTotalReports() external view returns (uint256) {
        return nextReportId - 1;
    }
    
    function getPriorityScore(uint256 reportId) 
        external view validReportId(reportId) 
        returns (uint256) {
        return reports[reportId].duplicateCount;
    }
    
    function hasUserReported(address user, uint256 reportId) 
        external view returns (bool) {
        return userReportedLocation[user][reportId];
    }

    // Internal Functions
    function _getLocationHash(int256 lat, int256 lng, uint256 radiusMeters) 
        internal pure returns (bytes32) {
        // Convert radius to coordinate precision
        // Approximately 1111 units per meter in coordinate degrees (simplified)
        int256 gridSize = int256(radiusMeters * 1111);
        
        // Create grid coordinates
        int256 gridLat = lat / gridSize;
        int256 gridLng = lng / gridSize;
        
        return keccak256(abi.encodePacked(gridLat, gridLng));
    }

    // Admin Functions
    function updateRewardSettings(
        uint256 _originalReportReward,
        uint256 _duplicateReporterReward,
        uint256 _originalReportFixedReward
    ) external onlyOwner {
        originalReportReward = _originalReportReward;
        duplicateReporterReward = _duplicateReporterReward;
        originalReportFixedReward = _originalReportFixedReward;
        
        emit RewardSettingsUpdated(
            _originalReportReward,
            _duplicateReporterReward,
            _originalReportFixedReward
        );
    }
    
    // Emergency Functions
    function pause() external onlyOwner {
        // Could add pausable functionality if needed
        // For now, just owner can manage critical functions
    }
    
    // Context override for ERC2771
    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }
    
    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}