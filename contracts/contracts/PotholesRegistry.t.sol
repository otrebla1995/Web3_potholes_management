// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {PotholesRegistry} from "./PotholesRegistry.sol";
import {PotholesToken} from "./PotholesToken.sol";

contract PotholesRegistryTest is Test {
    PotholesRegistry public registry;
    PotholesToken public token;

    // Test addresses
    address public owner;
    address public citizen1;
    address public citizen2;
    address public citizen3;
    address public municipal1;
    address public municipal2;
    address public nonCitizen;

    // Test constants
    string constant CITY_NAME = "TestCity";
    uint256 constant INITIAL_TOKEN_SUPPLY = 1_000_000e18;
    
    // City bounds (using microdegrees: 1e-6 degrees)
    int256 constant CITY_MIN_LAT = 45_000_000; // 45.0 degrees
    int256 constant CITY_MAX_LAT = 46_000_000; // 46.0 degrees
    int256 constant CITY_MIN_LNG = 7_000_000;  // 7.0 degrees
    int256 constant CITY_MAX_LNG = 8_000_000;  // 8.0 degrees
    uint256 constant GRID_PRECISION = 1000;    // Grid precision for duplicate detection

    // Test coordinates within city bounds
    int256 constant VALID_LAT = 45_500_000;
    int256 constant VALID_LNG = 7_500_000;
    int256 constant VALID_LAT_2 = 45_600_000;
    int256 constant VALID_LNG_2 = 7_600_000;
    
    // Test coordinates outside city bounds
    int256 constant INVALID_LAT = 50_000_000; // Outside bounds
    int256 constant INVALID_LNG = 10_000_000; // Outside bounds

    string constant IPFS_HASH = "QmTest123456789";
    string constant IPFS_HASH_2 = "QmTest987654321";

    // Reward amounts
    uint256 constant ORIGINAL_REPORT_REWARD = 10e18;
    uint256 constant DUPLICATE_REPORTER_REWARD = 2e18;
    uint256 constant ORIGINAL_REPORT_FIXED_REWARD = 5e18;

    enum PotholeStatus {
        Reported,
        InProgress,
        Completed,
        Rejected
    }

    function setUp() public {
        // Create test addresses
        owner = makeAddr("owner");
        citizen1 = makeAddr("citizen1");
        citizen2 = makeAddr("citizen2");
        citizen3 = makeAddr("citizen3");
        municipal1 = makeAddr("municipal1");
        municipal2 = makeAddr("municipal2");
        nonCitizen = makeAddr("nonCitizen");

        vm.startPrank(owner);

        // Deploy PotholesToken
        token = new PotholesToken(owner, owner);

        // Deploy PotholesRegistry
        registry = new PotholesRegistry(
            CITY_NAME,
            address(token),
            address(0), // trusted forwarder - using zero address for tests
            owner,
            CITY_MIN_LAT,
            CITY_MAX_LAT,
            CITY_MIN_LNG,
            CITY_MAX_LNG,
            GRID_PRECISION
        );

        // Transfer token ownership to registry so it can mint rewards
        token.transferOwnership(address(registry));

        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_deployment() public view {
        assertEq(registry.cityName(), CITY_NAME);
        assertEq(address(registry.potholeToken()), address(token));
        assertEq(registry.owner(), owner);
        assertEq(registry.cityMinLat(), CITY_MIN_LAT);
        assertEq(registry.cityMaxLat(), CITY_MAX_LAT);
        assertEq(registry.cityMinLng(), CITY_MIN_LNG);
        assertEq(registry.cityMaxLng(), CITY_MAX_LNG);
        assertEq(registry.grid_precision(), GRID_PRECISION);
        assertEq(registry.nextReportId(), 1);
        assertEq(registry.citizenCount(), 0);
        assertEq(registry.totalReports(), 0);
    }

    function test_rewardSettings() public view {
        assertEq(registry.originalReportReward(), ORIGINAL_REPORT_REWARD);
        assertEq(registry.duplicateReporterReward(), DUPLICATE_REPORTER_REWARD);
        assertEq(registry.originalReportFixedReward(), ORIGINAL_REPORT_FIXED_REWARD);
    }

    /*//////////////////////////////////////////////////////////////
                         CITIZEN MANAGEMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_addCitizen() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit PotholesRegistry.CitizenRegistered(citizen1);
        registry.addCitizen(citizen1);

        assertTrue(registry.registeredCitizens(citizen1));
        assertEq(registry.citizenCount(), 1);
    }

    function test_addCitizen_alreadyRegistered() public {
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        
        vm.expectRevert("Citizen already registered");
        registry.addCitizen(citizen1);
        vm.stopPrank();
    }

    function test_addCitizen_onlyOwner() public {
        vm.prank(citizen1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", citizen1));
        registry.addCitizen(citizen2);
    }

    function test_addCitizensBatch() public {
        address[] memory citizens = new address[](3);
        citizens[0] = citizen1;
        citizens[1] = citizen2;
        citizens[2] = citizen3;

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit PotholesRegistry.CitizensBatchRegistered(citizens);
        registry.addCitizensBatch(citizens);

        assertTrue(registry.registeredCitizens(citizen1));
        assertTrue(registry.registeredCitizens(citizen2));
        assertTrue(registry.registeredCitizens(citizen3));
        assertEq(registry.citizenCount(), 3);
    }

    function test_addCitizensBatch_skipDuplicates() public {
        vm.startPrank(owner);
        registry.addCitizen(citizen1);

        address[] memory citizens = new address[](3);
        citizens[0] = citizen1; // Already registered
        citizens[1] = citizen2;
        citizens[2] = citizen3;

        registry.addCitizensBatch(citizens);

        assertTrue(registry.registeredCitizens(citizen1));
        assertTrue(registry.registeredCitizens(citizen2));
        assertTrue(registry.registeredCitizens(citizen3));
        assertEq(registry.citizenCount(), 3); // Should not double count citizen1
        vm.stopPrank();
    }

    function test_removeCitizen() public {
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        assertEq(registry.citizenCount(), 1);

        registry.removeCitizen(citizen1);
        assertFalse(registry.registeredCitizens(citizen1));
        assertEq(registry.citizenCount(), 0);
        vm.stopPrank();
    }

    function test_removeCitizen_notRegistered() public {
        vm.prank(owner);
        vm.expectRevert("Citizen not registered");
        registry.removeCitizen(citizen1);
    }

    // /*//////////////////////////////////////////////////////////////
    //                   MUNICIPAL AUTHORITY TESTS
    // //////////////////////////////////////////////////////////////*/

    function test_addMunicipalAuthority() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit PotholesRegistry.MunicipalAuthorityAdded(municipal1);
        registry.addMunicipalAuthority(municipal1);

        assertTrue(registry.authorizedMunicipals(municipal1));
    }

    function test_removeMunicipalAuthority() public {
        vm.startPrank(owner);
        registry.addMunicipalAuthority(municipal1);
        assertTrue(registry.authorizedMunicipals(municipal1));

        vm.expectEmit(true, false, false, false);
        emit PotholesRegistry.MunicipalAuthorityRemoved(municipal1);
        registry.removeMunicipalAuthority(municipal1);

        assertFalse(registry.authorizedMunicipals(municipal1));
        vm.stopPrank();
    }

    // /*//////////////////////////////////////////////////////////////
    //                        REPORTING TESTS
    // //////////////////////////////////////////////////////////////*/

    function test_submitReport() public {
        // Setup citizen
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // Submit report
        vm.prank(citizen1);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeReported(1, citizen1, VALID_LAT, VALID_LNG, IPFS_HASH);
        
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        assertEq(reportId, 1);

        // Verify report data
        PotholesRegistry.PotholeReport memory report = registry.getReport(1);
        assertEq(report.id, 1);
        assertEq(report.latitude, VALID_LAT);
        assertEq(report.longitude, VALID_LNG);
        assertEq(report.ipfsHash, IPFS_HASH);
        assertEq(report.duplicateCount, 0);
        assertEq(report.reporter, citizen1);
        assertEq(uint8(report.status), uint8(PotholeStatus.Reported));

        // Verify state updates
        assertEq(registry.totalReports(), 1);
        assertEq(registry.nextReportId(), 2);
        assertTrue(registry.hasUserReported(citizen1, 1));
    }

    function test_submitReport_notRegisteredCitizen() public {
        vm.prank(citizen1);
        vm.expectRevert("Not registered citizen");
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
    }

    function test_submitReport_outsideCityBounds() public {
        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.prank(citizen1);
        vm.expectRevert("Latitude outside city bounds");
        registry.submitReport(INVALID_LAT, VALID_LNG, IPFS_HASH);

        vm.prank(citizen1);
        vm.expectRevert("Longitude outside city bounds");
        registry.submitReport(VALID_LAT, INVALID_LNG, IPFS_HASH);
    }

    function test_submitReport_emptyIpfsHash() public {
        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.prank(citizen1);
        vm.expectRevert("IPFS hash required");
        registry.submitReport(VALID_LAT, VALID_LNG, "");
    }

    function test_submitReport_duplicateLocation() public {
        // Setup citizens
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        vm.stopPrank();

        // First report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        assertEq(reportId1, 1);

        // Second report at same location (should be treated as duplicate)
        vm.prank(citizen2);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.DuplicateReported(1, citizen2, 1, VALID_LAT, VALID_LNG, IPFS_HASH_2);
        
        uint256 reportId2 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);
        assertEq(reportId2, 1); // Should return original report ID

        // Verify duplicate count increased
        PotholesRegistry.PotholeReport memory report = registry.getReport(1);
        assertEq(report.duplicateCount, 1);
        
        // Verify both users are marked as having reported
        assertTrue(registry.hasUserReported(citizen1, 1));
        assertTrue(registry.hasUserReported(citizen2, 1));

        // Total reports should still be 1
        assertEq(registry.totalReports(), 1);
        assertEq(registry.nextReportId(), 2);
    }

    function test_submitReport_duplicateBysameCitizen() public {
        // Setup citizen
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // First report
        vm.prank(citizen1);
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Same citizen tries to report again at same location
        vm.prank(citizen1);
        vm.expectRevert("You already reported this pothole");
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);
    }

    function test_submitReport_differentLocations() public {
        // Setup citizen
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // First report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        assertEq(reportId1, 1);

        // Second report at different location
        vm.prank(citizen1);
        uint256 reportId2 = registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);
        assertEq(reportId2, 2);

        assertEq(registry.totalReports(), 2);
        assertEq(registry.nextReportId(), 3);
    }

    /*//////////////////////////////////////////////////////////////
                        STATUS UPDATE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_updateReportStatus() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Update status to InProgress
        vm.prank(municipal1);
        vm.expectEmit(true, false, false, true);
        emit PotholesRegistry.PotholeStatusUpdated(
            reportId,
            PotholesRegistry.PotholeStatus.Reported,
            PotholesRegistry.PotholeStatus.InProgress,
            municipal1
        );
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);

        // Verify status change
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(uint8(report.status), uint8(PotholeStatus.InProgress));

        // Verify citizen1 received original report reward
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD);
    }

    function test_updateReportStatus_toCompleted() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Update status to Completed
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);

        // Verify status change
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(uint8(report.status), uint8(PotholeStatus.Completed));

        // Verify citizen1 received completion reward
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_FIXED_REWARD);
    }

    function test_updateReportStatus_fromInProgressToCompleted() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Update to InProgress first
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD);

        // Then update to Completed
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);

        // Verify citizen1 received both rewards
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD + ORIGINAL_REPORT_FIXED_REWARD);
    }

    function test_updateReportStatus_notMunicipalAuthority() public {
        // Setup
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Try to update status without authority
        vm.prank(citizen2);
        vm.expectRevert("Not authorized municipal authority");
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
    }

    function test_updateReportStatus_invalidReportId() public {
        vm.startPrank(owner);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        vm.prank(municipal1);
        vm.expectRevert("Invalid report ID");
        registry.updateReportStatus(999, PotholesRegistry.PotholeStatus.InProgress);
    }

    function test_updateReportStatus_unchangedStatus() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Try to update to same status
        vm.prank(municipal1);
        vm.expectRevert("Status unchanged");
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Reported);
    }

    function test_submitReport_toCompletedLocation() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create initial report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Mark as completed
        vm.prank(municipal1);
        registry.updateReportStatus(reportId1, PotholesRegistry.PotholeStatus.Completed);

        // Submit new report to same location (should create new report)
        vm.prank(citizen2);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeReported(2, citizen2, VALID_LAT, VALID_LNG, IPFS_HASH_2);

        uint256 reportId2 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);

        // Should create new report, not duplicate
        assertEq(reportId2, 2);
        assertEq(registry.totalReports(), 2);

        // Verify new report has correct status
        PotholesRegistry.PotholeReport memory newReport = registry.getReport(reportId2);
        assertEq(uint8(newReport.status), uint8(PotholeStatus.Reported));
        assertEq(newReport.duplicateCount, 0);
        assertEq(newReport.reporter, citizen2);
    }

    function test_submitReport_toRejectedLocation() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create initial report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Mark as rejected
        vm.prank(municipal1);
        registry.rejectReport(reportId1, "Completed location - no longer needs new reports");

        // Submit new report to same location (should create new report)
        vm.prank(citizen2);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeReported(2, citizen2, VALID_LAT, VALID_LNG, IPFS_HASH_2);

        uint256 reportId2 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);

        // Should create new report, not duplicate
        assertEq(reportId2, 2);
        assertEq(registry.totalReports(), 2);

        // Verify new report has correct status
        PotholesRegistry.PotholeReport memory newReport = registry.getReport(reportId2);
        assertEq(uint8(newReport.status), uint8(PotholeStatus.Reported));
        assertEq(newReport.duplicateCount, 0);
        assertEq(newReport.reporter, citizen2);
    }

    function test_submitReport_toInProgressLocation() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create initial report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Mark as in progress
        vm.prank(municipal1);
        registry.updateReportStatus(reportId1, PotholesRegistry.PotholeStatus.InProgress);

        // Try to submit new report to same location (should revert)
        vm.prank(citizen2);
        vm.expectRevert("Cannot report location in progress");
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);

        // Verify total reports unchanged
        assertEq(registry.totalReports(), 1);
    }

    function test_updateReportStatus_cannotUpdateRejected() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Mark as rejected
        vm.prank(municipal1);
        registry.rejectReport(reportId, "Cannot update - already rejected");

        // Try to update rejected pothole (should revert)
        vm.prank(municipal1);
        vm.expectRevert("Cannot update rejected pothole");
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
    }

    function test_updateReportStatus_cannotUpdateCompleted() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Mark as completed
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);

        // Try to update completed pothole (should revert)
        vm.prank(municipal1);
        vm.expectRevert("Cannot update completed pothole");
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
    }

    function test_batchUpdateStatus() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create multiple reports
        vm.startPrank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        uint256 reportId2 = registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);
        vm.stopPrank();

        // Batch update
        uint256[] memory reportIds = new uint256[](2);
        reportIds[0] = reportId1;
        reportIds[1] = reportId2;

        vm.prank(municipal1);
        registry.batchUpdateStatus(reportIds, PotholesRegistry.PotholeStatus.InProgress);

        // Verify both reports updated
        assertEq(uint8(registry.getReport(reportId1).status), uint8(PotholeStatus.InProgress));
        assertEq(uint8(registry.getReport(reportId2).status), uint8(PotholeStatus.InProgress));

        // Verify rewards distributed
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD * 2);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_getReport() public {
        // Setup and create report
        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.prank(citizen1);
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Get report
        PotholesRegistry.PotholeReport memory report = registry.getReport(1);
        assertEq(report.id, 1);
        assertEq(report.latitude, VALID_LAT);
        assertEq(report.longitude, VALID_LNG);
        assertEq(report.ipfsHash, IPFS_HASH);
        assertEq(report.duplicateCount, 0);
        assertEq(report.reporter, citizen1);
        assertTrue(report.reportedAt > 0);
        assertEq(uint8(report.status), uint8(PotholeStatus.Reported));
    }

    function test_getReport_invalidId() public {
        vm.expectRevert("Invalid report ID");
        registry.getReport(999);
    }

    function test_getReportsBatch() public {
        // Setup and create reports
        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.startPrank(citizen1);
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);
        vm.stopPrank();

        // Get batch
        uint256[] memory reportIds = new uint256[](3);
        reportIds[0] = 1;
        reportIds[1] = 2;
        reportIds[2] = 999; // Invalid ID

        PotholesRegistry.PotholeReport[] memory reports = registry.getReportsBatch(reportIds);
        
        assertEq(reports.length, 3);
        assertEq(reports[0].id, 1);
        assertEq(reports[1].id, 2);
        assertEq(reports[2].id, 0); // Invalid ID returns empty struct
    }

    function test_getTotalReports() public {
        assertEq(registry.getTotalReports(), 0);

        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.prank(citizen1);
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        assertEq(registry.getTotalReports(), 1);
    }

    function test_getPriorityScore() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        assertEq(registry.getPriorityScore(reportId), 0);

        // Add duplicate
        vm.prank(citizen2);
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);

        assertEq(registry.getPriorityScore(reportId), 1);
    }

    function test_hasUserReported() public {
        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        assertTrue(registry.hasUserReported(citizen1, reportId));
        assertFalse(registry.hasUserReported(citizen2, reportId));
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_updateRewardSettings() public {
        uint256 newOriginalReward = 15e18;
        uint256 newDuplicateReward = 3e18;
        uint256 newFixedReward = 7e18;

        vm.prank(owner);
        vm.expectEmit(false, false, false, true);
        emit PotholesRegistry.RewardSettingsUpdated(newOriginalReward, newDuplicateReward, newFixedReward);
        registry.updateRewardSettings(newOriginalReward, newDuplicateReward, newFixedReward);

        assertEq(registry.originalReportReward(), newOriginalReward);
        assertEq(registry.duplicateReporterReward(), newDuplicateReward);
        assertEq(registry.originalReportFixedReward(), newFixedReward);
    }

    function test_updateRewardSettings_onlyOwner() public {
        vm.prank(citizen1);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", citizen1));
        registry.updateRewardSettings(15e18, 3e18, 7e18);
    }

    /*//////////////////////////////////////////////////////////////
                              EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_multipleReportsAndDuplicates() public {
        // Setup multiple citizens
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addCitizen(citizen3);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Citizen1 reports location A
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Citizen2 reports location B
        vm.prank(citizen2);
        uint256 reportId2 = registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);

        // Citizen3 reports location A (duplicate)
        vm.prank(citizen3);
        uint256 reportId3 = registry.submitReport(VALID_LAT, VALID_LNG, "QmDuplicate");

        assertEq(reportId1, 1);
        assertEq(reportId2, 2);
        assertEq(reportId3, 1); // Should return original report ID

        assertEq(registry.totalReports(), 2);
        assertEq(registry.getReport(1).duplicateCount, 1);
        assertEq(registry.getReport(2).duplicateCount, 0);

        // Mark first report as completed
        vm.prank(municipal1);
        registry.updateReportStatus(1, PotholesRegistry.PotholeStatus.Completed);

        // Verify citizen1 got completion reward
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_FIXED_REWARD);
    }

    /*//////////////////////////////////////////////////////////////
                        REPORT REJECTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_rejectReport() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        string memory reason = "Invalid pothole report - no visible damage";

        // Reject report
        vm.prank(municipal1);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeRejected(reportId, municipal1, reason);

        vm.expectEmit(true, false, false, true);
        emit PotholesRegistry.PotholeStatusUpdated(
            reportId,
            PotholesRegistry.PotholeStatus.Reported,
            PotholesRegistry.PotholeStatus.Rejected,
            municipal1
        );

        registry.rejectReport(reportId, reason);

        // Verify rejection
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(uint8(report.status), uint8(PotholeStatus.Rejected));

        // Verify no rewards were given
        assertEq(token.balanceOf(citizen1), 0);
    }

    function test_rejectReport_emptyReason() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Try to reject with empty reason
        vm.prank(municipal1);
        vm.expectRevert("Rejection reason required");
        registry.rejectReport(reportId, "");
    }

    function test_rejectReport_notMunicipalAuthority() public {
        // Setup
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Try to reject without authority
        vm.prank(citizen2);
        vm.expectRevert("Not authorized municipal authority");
        registry.rejectReport(reportId, "Some reason");
    }

    function test_rejectReport_invalidReportId() public {
        vm.prank(owner);
        registry.addMunicipalAuthority(municipal1);

        vm.prank(municipal1);
        vm.expectRevert("Invalid report ID");
        registry.rejectReport(999, "Some reason");
    }

    function test_rejectReport_alreadyRejected() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create and reject report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        vm.prank(municipal1);
        registry.rejectReport(reportId, "First rejection");

        // Try to reject again
        vm.prank(municipal1);
        vm.expectRevert("Status unchanged");
        registry.rejectReport(reportId, "Second rejection");
    }

    function test_rejectReport_alreadyCompleted() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create and complete report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);

        // Try to reject completed report
        vm.prank(municipal1);
        vm.expectRevert("Cannot update completed pothole");
        registry.rejectReport(reportId, "Trying to reject completed");
    }

    function test_rejectReport_fromInProgress() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report and set to in progress
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);

        // Verify citizen got progress reward
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD);

        // Reject the in-progress report
        vm.prank(municipal1);
        registry.rejectReport(reportId, "Work cannot be completed");

        // Verify rejection
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(uint8(report.status), uint8(PotholeStatus.Rejected));

        // Citizen should keep the progress reward (no clawback)
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD);
    }

    function test_rejectReport_withDuplicates() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addCitizen(citizen3);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create original report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Add duplicates
        vm.prank(citizen2);
        registry.submitReport(VALID_LAT, VALID_LNG, "QmDuplicate1");

        vm.prank(citizen3);
        registry.submitReport(VALID_LAT, VALID_LNG, "QmDuplicate2");

        // Verify duplicates were recorded
        assertEq(registry.getReport(reportId).duplicateCount, 2);

        // Reject the report
        vm.prank(municipal1);
        registry.rejectReport(reportId, "Location inspection shows no pothole");

        // Verify rejection
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(uint8(report.status), uint8(PotholeStatus.Rejected));
        assertEq(report.duplicateCount, 2); // Duplicate count should remain

        // No one should get rewards
        assertEq(token.balanceOf(citizen1), 0);
        assertEq(token.balanceOf(citizen2), 0);
        assertEq(token.balanceOf(citizen3), 0);
    }

    function test_submitReportAfterRejection() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create and reject report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        vm.prank(municipal1);
        registry.rejectReport(reportId1, "False alarm");

        // Submit new report at same location after rejection
        vm.prank(citizen2);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeReported(2, citizen2, VALID_LAT, VALID_LNG, IPFS_HASH_2);

        uint256 reportId2 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);

        // Should create new report, not duplicate
        assertEq(reportId2, 2);
        assertEq(registry.totalReports(), 2);

        // Verify new report has correct status
        PotholesRegistry.PotholeReport memory newReport = registry.getReport(reportId2);
        assertEq(uint8(newReport.status), uint8(PotholeStatus.Reported));
        assertEq(newReport.duplicateCount, 0);
        assertEq(newReport.reporter, citizen2);
    }

    function test_batchRejectReports() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create multiple reports
        vm.startPrank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        uint256 reportId2 = registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);
        vm.stopPrank();

        // Reject both reports individually (contract doesn't have batch reject)
        vm.startPrank(municipal1);
        registry.rejectReport(reportId1, "Location 1 - no pothole found");
        registry.rejectReport(reportId2, "Location 2 - minor crack only");
        vm.stopPrank();

        // Verify both reports rejected
        assertEq(uint8(registry.getReport(reportId1).status), uint8(PotholeStatus.Rejected));
        assertEq(uint8(registry.getReport(reportId2).status), uint8(PotholeStatus.Rejected));

        // No rewards distributed
        assertEq(token.balanceOf(citizen1), 0);
    }

    function test_rejectReport_longReason() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Create report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Long rejection reason
        string memory longReason = "After thorough inspection by our municipal engineering team, we have determined that the reported location does not contain a pothole that meets our criteria for repair. The surface imperfection appears to be minor wear and does not pose a safety hazard to vehicles or pedestrians. We appreciate the citizen's vigilance in reporting potential issues.";

        // Should work with long reason
        vm.prank(municipal1);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeRejected(reportId, municipal1, longReason);

        registry.rejectReport(reportId, longReason);

        // Verify rejection
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(uint8(report.status), uint8(PotholeStatus.Rejected));
    }

    function test_rejectReport_differentMunicipals() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal1);
        registry.addMunicipalAuthority(municipal2);
        vm.stopPrank();

        // Create two reports
        vm.startPrank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        vm.stopPrank();

        vm.prank(citizen2);
        uint256 reportId2 = registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);

        // Different municipals reject different reports
        vm.prank(municipal1);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeRejected(reportId1, municipal1, "Municipal1 rejection");
        registry.rejectReport(reportId1, "Municipal1 rejection");

        vm.prank(municipal2);
        vm.expectEmit(true, true, false, true);
        emit PotholesRegistry.PotholeRejected(reportId2, municipal2, "Municipal2 rejection");
        registry.rejectReport(reportId2, "Municipal2 rejection");

        // Verify both rejections
        assertEq(uint8(registry.getReport(reportId1).status), uint8(PotholeStatus.Rejected));
        assertEq(uint8(registry.getReport(reportId2).status), uint8(PotholeStatus.Rejected));
    }

    /*//////////////////////////////////////////////////////////////
                           INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_fullWorkflow() public {
        // Setup
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // 1. Citizen1 reports pothole
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);
        assertEq(token.balanceOf(citizen1), 0); // No reward yet

        // 2. Citizen2 reports duplicate
        vm.prank(citizen2);
        registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH_2);
        assertEq(registry.getReport(reportId).duplicateCount, 1);

        // 3. Municipal authority updates to InProgress
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD);

        // 4. Municipal authority completes the repair
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_REWARD + ORIGINAL_REPORT_FIXED_REWARD);

        // Verify final state
        PotholesRegistry.PotholeReport memory finalReport = registry.getReport(reportId);
        assertEq(uint8(finalReport.status), uint8(PotholeStatus.Completed));
        assertEq(finalReport.duplicateCount, 1);
    }

    /*//////////////////////////////////////////////////////////////
                         ADVANCED TESTS
    //////////////////////////////////////////////////////////////*/

    function test_gridPrecisionBoundary() public {
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        vm.stopPrank();

        // Two coordinates that should fall in the same grid cell
        int256 lat1 = 45_500_000;
        int256 lng1 = 7_500_000;
        int256 lat2 = 45_500_500; // 0.5 microdegree difference (within same grid cell)
        int256 lng2 = 7_500_500;

        // First report
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(lat1, lng1, IPFS_HASH);

        // Second report should be detected as duplicate due to grid precision
        vm.prank(citizen2);
        uint256 reportId2 = registry.submitReport(lat2, lng2, IPFS_HASH_2);

        // Should be treated as the same location
        assertEq(reportId1, reportId2);
        assertEq(registry.getReport(reportId1).duplicateCount, 1);
    }

    function test_rewardDistribution_multipleScenarios() public {
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addCitizen(citizen3);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Scenario 1: Report goes straight to completed
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        vm.prank(municipal1);
        registry.updateReportStatus(reportId1, PotholesRegistry.PotholeStatus.Completed);
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_FIXED_REWARD);

        // Scenario 2: Report goes through full cycle
        vm.prank(citizen2);
        uint256 reportId2 = registry.submitReport(VALID_LAT_2, VALID_LNG_2, IPFS_HASH_2);

        vm.prank(municipal1);
        registry.updateReportStatus(reportId2, PotholesRegistry.PotholeStatus.InProgress);
        assertEq(token.balanceOf(citizen2), ORIGINAL_REPORT_REWARD);

        vm.prank(municipal1);
        registry.updateReportStatus(reportId2, PotholesRegistry.PotholeStatus.Completed);
        assertEq(token.balanceOf(citizen2), ORIGINAL_REPORT_REWARD + ORIGINAL_REPORT_FIXED_REWARD);

        // Scenario 3: Report gets rejected
        vm.prank(citizen3);
        uint256 reportId3 = registry.submitReport(45_700_000, 7_700_000, "QmRejected");

        vm.prank(municipal1);
        registry.rejectReport(reportId3, "Invalid report - no pothole found");
        assertEq(token.balanceOf(citizen3), 0); // No rewards for rejected reports
    }

    function test_largeNumberOfReports() public {
        vm.prank(owner);
        registry.addCitizen(citizen1);

        uint256 numReports = 50;
        
        // Submit many reports
        vm.startPrank(citizen1);
        for (uint256 i = 0; i < numReports; i++) {
            // Use different coordinates for each report
            int256 lat = VALID_LAT + int256(i * 1000);
            int256 lng = VALID_LNG + int256(i * 1000);
            registry.submitReport(lat, lng, string(abi.encodePacked("QmHash", i)));
        }
        vm.stopPrank();

        assertEq(registry.totalReports(), numReports);
        assertEq(registry.nextReportId(), numReports + 1);
    }

    function test_boundaryCases_coordinates() public {
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // Test minimum boundary
        vm.prank(citizen1);
        uint256 reportId1 = registry.submitReport(CITY_MIN_LAT, CITY_MIN_LNG, "QmMinBoundary");
        assertTrue(reportId1 > 0);

        // Test maximum boundary
        vm.prank(citizen1);
        uint256 reportId2 = registry.submitReport(CITY_MAX_LAT, CITY_MAX_LNG, "QmMaxBoundary");
        assertTrue(reportId2 > 0);

        // Test just outside minimum boundary
        vm.prank(citizen1);
        vm.expectRevert("Latitude outside city bounds");
        registry.submitReport(CITY_MIN_LAT - 1, CITY_MIN_LNG, "QmOutsideMin");

        // Test just outside maximum boundary
        vm.prank(citizen1);
        vm.expectRevert("Longitude outside city bounds");
        registry.submitReport(CITY_MAX_LAT, CITY_MAX_LNG + 1, "QmOutsideMax");
    }

    /*//////////////////////////////////////////////////////////////
                           FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_submitReport_validCoordinates(int256 lat, int256 lng) public {
        // Bound the coordinates to valid city bounds using bound() instead of assume()
        lat = bound(lat, CITY_MIN_LAT, CITY_MAX_LAT);
        lng = bound(lng, CITY_MIN_LNG, CITY_MAX_LNG);

        vm.prank(owner);
        registry.addCitizen(citizen1);

        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(lat, lng, "QmFuzzHash");

        assertTrue(reportId > 0);

        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        assertEq(report.latitude, lat);
        assertEq(report.longitude, lng);
    }

    function testFuzz_rewardSettings(uint256 originalReward, uint256 duplicateReward, uint256 fixedReward) public {
        // Bound rewards to reasonable values (0 to 1000 tokens)
        originalReward = bound(originalReward, 0, 1000e18);
        duplicateReward = bound(duplicateReward, 0, 1000e18);
        fixedReward = bound(fixedReward, 0, 1000e18);

        vm.prank(owner);
        registry.updateRewardSettings(originalReward, duplicateReward, fixedReward);

        assertEq(registry.originalReportReward(), originalReward);
        assertEq(registry.duplicateReporterReward(), duplicateReward);
        assertEq(registry.originalReportFixedReward(), fixedReward);
    }

    function testFuzz_batchOperations(uint8 numCitizens) public {
        numCitizens = uint8(bound(numCitizens, 1, 50)); // Limit to reasonable batch size
        
        address[] memory citizens = new address[](numCitizens);
        for (uint8 i = 0; i < numCitizens; i++) {
            citizens[i] = makeAddr(string(abi.encodePacked("citizen", i)));
        }

        vm.prank(owner);
        registry.addCitizensBatch(citizens);

        assertEq(registry.citizenCount(), numCitizens);
        
        // Verify all citizens are registered
        for (uint8 i = 0; i < numCitizens; i++) {
            assertTrue(registry.registeredCitizens(citizens[i]));
        }
    }

    /*//////////////////////////////////////////////////////////////
                           INVARIANT TESTS
    //////////////////////////////////////////////////////////////*/

    function invariant_totalReportsConsistency() public view {
        // Total reports should always equal (nextReportId - 1)
        assertEq(registry.totalReports(), registry.nextReportId() - 1);
    }

    function invariant_citizenCountNonNegative() public view {
        // Citizen count should never be negative (though uint256 prevents this)
        assertTrue(registry.citizenCount() >= 0);
    }

    function invariant_reportIdIncreasing() public view {
        // Next report ID should always be at least 1
        assertTrue(registry.nextReportId() >= 1);
    }

    /*//////////////////////////////////////////////////////////////
                       INTEGRATION EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_complexDuplicateScenario() public {
        vm.startPrank(owner);
        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addCitizen(citizen3);
        registry.addMunicipalAuthority(municipal1);
        vm.stopPrank();

        // Original report
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(VALID_LAT, VALID_LNG, IPFS_HASH);

        // Multiple duplicates
        vm.prank(citizen2);
        registry.submitReport(VALID_LAT, VALID_LNG, "QmDuplicate1");
        
        vm.prank(citizen3);
        registry.submitReport(VALID_LAT, VALID_LNG, "QmDuplicate2");

        // Verify duplicate count
        assertEq(registry.getReport(reportId).duplicateCount, 2);

        // All users should be marked as having reported
        assertTrue(registry.hasUserReported(citizen1, reportId));
        assertTrue(registry.hasUserReported(citizen2, reportId));
        assertTrue(registry.hasUserReported(citizen3, reportId));

        // Priority score should reflect duplicates
        assertEq(registry.getPriorityScore(reportId), 2);

        // Update status and verify only original reporter gets rewards
        vm.prank(municipal1);
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);
        
        assertEq(token.balanceOf(citizen1), ORIGINAL_REPORT_FIXED_REWARD);
        assertEq(token.balanceOf(citizen2), 0);
        assertEq(token.balanceOf(citizen3), 0);
    }
}