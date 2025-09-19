// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "./PotholesRegistry.sol";

contract MockPotholesToken {
    function mint(address to, uint256 amount) external {}
}

contract PotholesGasReporter is Test {
    PotholesRegistry public registry;
    MockPotholesToken public token;

    address public owner;
    address public citizen1;
    address public citizen2;
    address public municipal;

    int256 constant CITY_MIN_LAT = 41_800_000; // 41.8 degrees (Milano area)
    int256 constant CITY_MAX_LAT = 41_900_000; // 41.9 degrees
    int256 constant CITY_MIN_LNG = 9_100_000;  // 9.1 degrees
    int256 constant CITY_MAX_LNG = 9_200_000;  // 9.2 degrees
    uint256 constant GRID_PRECISION = 1000;   // ~100 meter precision

    int256 constant TEST_LAT = 41_850_000;
    int256 constant TEST_LNG = 9_150_000;

    function setUp() public {
        owner = address(this);
        citizen1 = makeAddr("citizen1");
        citizen2 = makeAddr("citizen2");
        municipal = makeAddr("municipal");

        token = new MockPotholesToken();

        registry = new PotholesRegistry(
            "Milano",
            address(token),
            address(0), // No trusted forwarder for testing
            owner,
            CITY_MIN_LAT,
            CITY_MAX_LAT,
            CITY_MIN_LNG,
            CITY_MAX_LNG,
            GRID_PRECISION
        );

        registry.addCitizen(citizen1);
        registry.addCitizen(citizen2);
        registry.addMunicipalAuthority(municipal);
    }

    function testGas_AddCitizen() public {
        address newCitizen = makeAddr("newCitizen");

        uint256 gasBefore = gasleft();
        registry.addCitizen(newCitizen);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: addCitizen ===");
        console.log("Gas used:", gasUsed);
        console.log("Description: Adding a new citizen to the registry");
        console.log("");
    }

    function testGas_AddCitizensBatch() public {
        address[] memory citizens = new address[](5);
        for (uint256 i = 0; i < 5; i++) {
            citizens[i] = makeAddr(string(abi.encodePacked("citizen", i)));
        }

        uint256 gasBefore = gasleft();
        registry.addCitizensBatch(citizens);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: addCitizensBatch ===");
        console.log("Gas used:", gasUsed);
        console.log("Citizens added:", citizens.length);
        console.log("Gas per citizen:", gasUsed / citizens.length);
        console.log("Description: Batch adding 5 citizens");
        console.log("");
    }

    function testGas_AddCitizensBatch_Large() public {
        address[] memory citizens = new address[](50);
        for (uint256 i = 0; i < 50; i++) {
            citizens[i] = makeAddr(string(abi.encodePacked("largeCitizen", i)));
        }

        uint256 gasBefore = gasleft();
        registry.addCitizensBatch(citizens);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: addCitizensBatch (Large) ===");
        console.log("Gas used:", gasUsed);
        console.log("Citizens added:", citizens.length);
        console.log("Gas per citizen:", gasUsed / citizens.length);
        console.log("Description: Batch adding 50 citizens");
        console.log("");
    }

    function testGas_SubmitReport_NewReport() public {
        vm.startPrank(citizen1);

        uint256 gasBefore = gasleft();
        uint256 reportId = registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash1");
        uint256 gasUsed = gasBefore - gasleft();

        vm.stopPrank();

        console.log("=== GAS ANALYSIS: submitReport (New Report) ===");
        console.log("Gas used:", gasUsed);
        console.log("Report ID:", reportId);
        console.log("Description: Submitting a new unique pothole report");
        console.log("");
    }

    function testGas_SubmitReport_DuplicateReport() public {
        vm.startPrank(citizen1);
        registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash1");
        vm.stopPrank();

        vm.startPrank(citizen2);
        uint256 gasBefore = gasleft();
        uint256 reportId = registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash2");
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console.log("=== GAS ANALYSIS: submitReport (Duplicate Report) ===");
        console.log("Gas used:", gasUsed);
        console.log("Report ID:", reportId);
        console.log("Description: Submitting a duplicate report at same location");
        console.log("");
    }

    function testGas_UpdateReportStatus() public {
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash1");

        vm.startPrank(municipal);
        uint256 gasBefore = gasleft();
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console.log("=== GAS ANALYSIS: updateReportStatus ===");
        console.log("Gas used:", gasUsed);
        console.log("Status changed to: InProgress");
        console.log("Description: Municipal updating single report status");
        console.log("");
    }

    function testGas_BatchUpdateStatus() public {
        uint256[] memory reportIds = new uint256[](5);

        for (uint256 i = 0; i < 5; i++) {
            vm.prank(citizen1);
            reportIds[i] = registry.submitReport(
                TEST_LAT + int256(i * 1000),
                TEST_LNG + int256(i * 1000),
                string(abi.encodePacked("QmTestHash", i))
            );
        }

        vm.startPrank(municipal);
        uint256 gasBefore = gasleft();
        registry.batchUpdateStatus(reportIds, PotholesRegistry.PotholeStatus.InProgress);
        uint256 gasUsed = gasBefore - gasleft();
        vm.stopPrank();

        console.log("=== GAS ANALYSIS: batchUpdateStatus ===");
        console.log("Gas used:", gasUsed);
        console.log("Reports updated:", reportIds.length);
        console.log("Gas per report:", gasUsed / reportIds.length);
        console.log("Description: Batch updating 5 reports to InProgress");
        console.log("");
    }

    function testGas_GetReport() public {
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash1");

        uint256 gasBefore = gasleft();
        PotholesRegistry.PotholeReport memory report = registry.getReport(reportId);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: getReport ===");
        console.log("Gas used:", gasUsed);
        console.log("Report ID retrieved:", report.id);
        console.log("Description: Reading a single report");
        console.log("");
    }

    function testGas_GetReportsBatch() public {
        uint256[] memory reportIds = new uint256[](10);

        for (uint256 i = 0; i < 10; i++) {
            vm.prank(citizen1);
            reportIds[i] = registry.submitReport(
                TEST_LAT + int256(i * 1000),
                TEST_LNG + int256(i * 1000),
                string(abi.encodePacked("QmTestHash", i))
            );
        }

        uint256 gasBefore = gasleft();
        PotholesRegistry.PotholeReport[] memory reports = registry.getReportsBatch(reportIds);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: getReportsBatch ===");
        console.log("Gas used:", gasUsed);
        console.log("Reports retrieved:", reports.length);
        console.log("Gas per report:", gasUsed / reports.length);
        console.log("Description: Batch reading 10 reports");
        console.log("");
    }

    function testGas_UpdateRewardSettings() public {
        uint256 gasBefore = gasleft();
        registry.updateRewardSettings(15 * 10**18, 3 * 10**18, 7 * 10**18);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: updateRewardSettings ===");
        console.log("Gas used:", gasUsed);
        console.log("Description: Updating reward settings");
        console.log("");
    }

    function testGas_AddMunicipalAuthority() public {
        address newMunicipal = makeAddr("newMunicipal");

        uint256 gasBefore = gasleft();
        registry.addMunicipalAuthority(newMunicipal);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: addMunicipalAuthority ===");
        console.log("Gas used:", gasUsed);
        console.log("Description: Adding a new municipal authority");
        console.log("");
    }

    function testGas_RemoveCitizen() public {
        address citizenToRemove = makeAddr("citizenToRemove");
        registry.addCitizen(citizenToRemove);

        uint256 gasBefore = gasleft();
        registry.removeCitizen(citizenToRemove);
        uint256 gasUsed = gasBefore - gasleft();

        console.log("=== GAS ANALYSIS: removeCitizen ===");
        console.log("Gas used:", gasUsed);
        console.log("Description: Removing a citizen from registry");
        console.log("");
    }

    function testGas_CompleteWorkflow() public {
        console.log("=== GAS ANALYSIS: Complete Workflow ===");

        // Step 1: Submit report
        vm.startPrank(citizen1);
        uint256 gasBefore = gasleft();
        uint256 reportId = registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash1");
        uint256 gasStep1 = gasBefore - gasleft();
        vm.stopPrank();

        // Step 2: Add duplicate report
        vm.startPrank(citizen2);
        gasBefore = gasleft();
        registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash2");
        uint256 gasStep2 = gasBefore - gasleft();
        vm.stopPrank();

        // Step 3: Update to InProgress
        vm.startPrank(municipal);
        gasBefore = gasleft();
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.InProgress);
        uint256 gasStep3 = gasBefore - gasleft();
        vm.stopPrank();

        // Step 4: Complete the report
        vm.startPrank(municipal);
        gasBefore = gasleft();
        registry.updateReportStatus(reportId, PotholesRegistry.PotholeStatus.Completed);
        uint256 gasStep4 = gasBefore - gasleft();
        vm.stopPrank();

        uint256 totalGas = gasStep1 + gasStep2 + gasStep3 + gasStep4;

        console.log("Step 1 - Original Report:", gasStep1);
        console.log("Step 2 - Duplicate Report:", gasStep2);
        console.log("Step 3 - Set InProgress:", gasStep3);
        console.log("Step 4 - Set Completed:", gasStep4);
        console.log("Total Gas for Complete Workflow:", totalGas);
        console.log("Description: Full lifecycle of a pothole report");
        console.log("");
    }

    function testGas_MultipleReportsAtDifferentLocations() public {
        console.log("=== GAS ANALYSIS: Multiple Reports at Different Locations ===");

        uint256 totalGas = 0;
        uint256 numReports = 20;

        vm.startPrank(citizen1);
        for (uint256 i = 0; i < numReports; i++) {
            uint256 gasBefore = gasleft();
            registry.submitReport(
                TEST_LAT + int256(i * 2000),
                TEST_LNG + int256(i * 2000),
                string(abi.encodePacked("QmTestHash", i))
            );
            uint256 gasUsed = gasBefore - gasleft();
            totalGas += gasUsed;
        }
        vm.stopPrank();

        console.log("Total reports:", numReports);
        console.log("Total gas used:", totalGas);
        console.log("Average gas per report:", totalGas / numReports);
        console.log("Description: Creating 20 unique reports");
        console.log("");
    }

    function testGas_ViewFunctions() public {
        vm.prank(citizen1);
        uint256 reportId = registry.submitReport(TEST_LAT, TEST_LNG, "QmTestHash1");

        console.log("=== GAS ANALYSIS: View Functions ===");

        uint256 gasBefore = gasleft();
        registry.getTotalReports();
        uint256 gasUsed1 = gasBefore - gasleft();

        gasBefore = gasleft();
        registry.getPriorityScore(reportId);
        uint256 gasUsed2 = gasBefore - gasleft();

        gasBefore = gasleft();
        registry.hasUserReported(citizen1, reportId);
        uint256 gasUsed3 = gasBefore - gasleft();

        console.log("getTotalReports():", gasUsed1);
        console.log("getPriorityScore():", gasUsed2);
        console.log("hasUserReported():", gasUsed3);
        console.log("Description: Gas costs of view functions");
        console.log("");
    }
}