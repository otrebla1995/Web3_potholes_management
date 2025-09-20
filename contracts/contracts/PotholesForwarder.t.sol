// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {PotholesForwarder} from "./PotholesForwarder.sol";
import {PotholesRegistry} from "./PotholesRegistry.sol";
import {PotholesToken} from "./PotholesToken.sol";
import {ERC2771Forwarder} from "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

contract PotholesForwarderTest is Test {
    PotholesForwarder public forwarder;
    PotholesRegistry public registry;
    PotholesToken public token;
    
    address public owner;
    address public citizen1;
    address public relayer;
    address public municipal1;
    
    // Test signing key (DO NOT use in production)
    uint256 private constant CITIZEN1_PRIVATE_KEY = 0x1234;
    
    function setUp() public {
        owner = makeAddr("owner");
        citizen1 = vm.addr(CITIZEN1_PRIVATE_KEY);
        relayer = makeAddr("relayer");
        municipal1 = makeAddr("municipal1");
        
        vm.startPrank(owner);
        
        // Deploy contracts
        forwarder = new PotholesForwarder("PotholesForwarder");
        token = new PotholesToken(owner, owner);
        registry = new PotholesRegistry(
            "TestCity",
            address(token),
            address(forwarder), // Pass forwarder as trusted forwarder
            address(owner),
            45_000_000, 46_000_000, // lat bounds
            7_000_000, 8_000_000,   // lng bounds
            1000 // grid precision
        );
        
        // Setup permissions
        token.transferOwnership(address(registry));
        
        vm.stopPrank();
    }
    
    function test_forwarderDeployment() public view {
        (, string memory name,,,,,) = forwarder.eip712Domain();
        assertEq(name, "PotholesForwarder");
    }
    
    function test_executeMetaTransaction() public {
        // Register citizen1 first
        vm.prank(owner);
        registry.addCitizen(citizen1);

        // Create meta-transaction for pothole reporting
        bytes memory data = abi.encodeWithSelector(
            PotholesRegistry.submitReport.selector,
            45_500_000, // lat
            7_500_000,  // lng
            "QmTestHash"
        );

        ERC2771Forwarder.ForwardRequestData memory request = ERC2771Forwarder.ForwardRequestData({
            from: citizen1,
            to: address(registry),
            value: 0,
            gas: 300000,
            deadline: uint48(block.timestamp + 1 hours),
            data: data,
            signature: ""
        });

        // Generate EIP712 signature
        bytes32 typeHash = keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)");
        uint256 nonce = forwarder.nonces(citizen1);

        bytes32 structHash = keccak256(abi.encode(
            typeHash,
            citizen1,
            address(registry),
            0,
            300000,
            nonce,
            uint48(block.timestamp + 1 hours),
            keccak256(data)
        ));

        (, string memory name, string memory version, uint256 chainId, address verifyingContract,,) = forwarder.eip712Domain();

        bytes32 domainSeparator = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256(bytes(name)),
            keccak256(bytes(version)),
            chainId,
            verifyingContract
        ));

        bytes32 digest = keccak256(abi.encodePacked(
            "\x19\x01",
            domainSeparator,
            structHash
        ));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(CITIZEN1_PRIVATE_KEY, digest);
        request.signature = abi.encodePacked(r, s, v);

        // Verify initial state
        assertEq(registry.getTotalReports(), 0);

        // Execute meta-transaction from relayer
        vm.prank(relayer);
        vm.expectEmit(true, true, false, true);
        emit PotholesForwarder.PotholeForwardedTransaction(citizen1, address(registry), nonce, true);

        forwarder.execute(request);

        // Verify pothole was reported
        assertEq(registry.getTotalReports(), 1);

        // Verify nonce was incremented
        assertEq(forwarder.nonces(citizen1), nonce + 1);

        // Verify the reporter was citizen1
        PotholesRegistry.PotholeReport memory report = registry.getReport(1);
        assertEq(report.reporter, citizen1);

        // Add a municipal user
        vm.prank(owner);
        registry.addMunicipalAuthority(municipal1);

        // Update status to InProgress
        vm.prank(municipal1);
        registry.updateReportStatus(1, PotholesRegistry.PotholeStatus.InProgress);

        // Verify citizen1 received tokens for reporting
        uint256 citizenBalance = token.balanceOf(citizen1);
        assertEq(citizenBalance, 10 * 10**18); // Assuming 10 tokens per report
    }
    
    function test_batchExecute() public {
        // Test batch meta-transactions
        // Implementation here...
    }
    
    function test_nonceIncrement() public {
        // Test nonce management
        // Implementation here...
    }
    
    function test_customEvents() public {
        // Test PotholeForwardedTransaction events
        // Implementation here...
    }
}