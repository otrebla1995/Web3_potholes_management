// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../contracts/PotholesToken.sol";

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract BasicPotholesTest is Test {
    
    PotholesToken public token;
    address public owner; 
    address public recipient;
    address public alice;           
    address public bob;             
    
    function setUp() public {
        owner = makeAddr("owner");
        recipient = makeAddr("recipient");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        
        vm.prank(owner);
        token = new PotholesToken(recipient, owner);
    
    }
    
    function testContractHasCorrectName() public view {
        
        string memory name = token.name();
        assertEq(name, "PotholesToken", "Token name should be PotholesToken");
    }
    
    function testContractHasCorrectSymbol() public view {
        string memory symbol = token.symbol();
        assertEq(symbol, "PBC", "Token symbol should be PBC");
    }
    
    function testInitialSupplyIsCorrect() public view {
        uint256 expectedSupply = 1000000 * 10**18; // 1 million tokens
        uint256 actualSupply = token.totalSupply();
        
        assertEq(actualSupply, expectedSupply, "Total supply should be 1 million tokens");
    }
    
    function testRecipientGetsInitialSupply() public view {
        uint256 recipientBalance = token.balanceOf(recipient);
        uint256 totalSupply = token.totalSupply();
        
        assertEq(recipientBalance, totalSupply, "Recipient should have all initial tokens");
    }

    function testVMCommands() public {
        
        vm.prank(recipient);
        token.transfer(alice, 1000 * 10**18); // This call comes from 'recipient'
        
        console.log("Alice's balance:", token.balanceOf(alice));
        
        vm.startPrank(owner);
        
        // These both come from owner
        token.pause();
        assertTrue(token.paused(), "Token should be paused");
        
        token.unpause();
        assertFalse(token.paused(), "Token should be unpaused");
        
        vm.stopPrank();
    }

    function testExpectedFailures() public {
        // vm.expectRevert() - expects the NEXT call to fail
        vm.prank(alice);
        vm.expectRevert();
        token.pause();
        
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", alice));
        token.mint(alice, 1000);
        
        // Test insufficient balance
        vm.prank(alice);
        vm.expectRevert();
        token.transfer(recipient, 100);
    }

    function testSimpleTransfer() public {

        uint256 recipientInitialBalance = token.balanceOf(recipient);
        uint256 aliceInitialBalance = token.balanceOf(alice);
        
        console.log("=== BEFORE TRANSFER ===");
        console.log("Recipient balance:", recipientInitialBalance);
        console.log("Alice balance:", aliceInitialBalance);
        
        uint256 transferAmount = 1000 * 10**18; // 1000 tokens
        
        vm.prank(recipient);
        token.transfer(alice, transferAmount);

        uint256 recipientFinalBalance = token.balanceOf(recipient);
        uint256 aliceFinalBalance = token.balanceOf(alice);
        
        console.log("=== AFTER TRANSFER ===");
        console.log("Recipient balance:", recipientFinalBalance);
        console.log("Alice balance:", aliceFinalBalance);
        
        assertEq(aliceFinalBalance, transferAmount, "Alice should receive the tokens");
        assertEq(recipientFinalBalance, recipientInitialBalance - transferAmount, "Recipient balance should decrease");
    }

    function testTransferEvent() public {
        uint256 amount = 1000 * 10**18;
        
        // vm.expectEmit(checkTopic1, checkTopic2, checkTopic3, checkData)
        // For Transfer event: Transfer(address indexed from, address indexed to, uint256 value)
        vm.expectEmit(true, true, false, true); // Check from, to, and amount
        emit IERC20.Transfer(recipient, alice, amount); // This is what we expect
        
        vm.prank(recipient);
        token.transfer(alice, amount);
        
        console.log("Transfer event was emitted correctly");
    }
    
    function testPauseEvent() public {
        // Expect the Paused event
        vm.expectEmit(false, false, false, true); // Only check the data (who paused)
        emit Pausable.Paused(owner);
        
        vm.prank(owner);
        token.pause();
        
        console.log("Pause event was emitted correctly");
    }
    
    function testApproveAndTransferFrom() public {
        // Give alice some tokens
        vm.prank(recipient);
        token.transfer(alice, 1000 * 10**18);
        
        uint256 approvalAmount = 500 * 10**18;
        
        // Alice approves Bob to spend her tokens
        vm.expectEmit(true, true, false, true);
        emit IERC20.Approval(alice, bob, approvalAmount);
        
        vm.prank(alice);
        token.approve(bob, approvalAmount);
        
        // Check allowance
        assertEq(token.allowance(alice, bob), approvalAmount, "Allowance should be set");
        
        // Bob transfers from Alice to himself
        uint256 transferAmount = 200 * 10**18;
        
        vm.expectEmit(true, true, false, true);
        emit IERC20.Transfer(alice, bob, transferAmount);
        
        vm.prank(bob);
        token.transferFrom(alice, bob, transferAmount);
        
        // Check balances and remaining allowance
        assertEq(token.balanceOf(bob), transferAmount, "Bob should receive tokens");
        assertEq(token.allowance(alice, bob), approvalAmount - transferAmount, "Allowance should decrease");
    }

    function testFuzzTransfer(uint256 amount) public {
        // vm.assume() filters out invalid inputs
        vm.assume(amount <= token.balanceOf(recipient)); // Amount must be <= available balance
        vm.assume(amount > 0); // Amount must be positive
        
        uint256 recipientBalanceBefore = token.balanceOf(recipient);
        uint256 aliceBalanceBefore = token.balanceOf(alice);
        
        vm.prank(recipient);
        token.transfer(alice, amount);
        
        assertEq(token.balanceOf(alice), aliceBalanceBefore + amount, "Alice balance should increase by amount");
        assertEq(token.balanceOf(recipient), recipientBalanceBefore - amount, "Recipient balance should decrease by amount");
        
        console.log("Fuzz test passed with amount:", amount);
    }

    function testPermit() public {
        uint256 privateKey = 0x1234;
        address signer = vm.addr(privateKey);
        
        // Give signer some tokens
        vm.prank(recipient);
        token.transfer(signer, 1000 * 10**18);
        
        uint256 value = 500 * 10**18;
        uint256 nonce = token.nonces(signer);
        uint256 deadline = block.timestamp + 1 hours;
        
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                signer,
                alice,
                value,
                nonce,
                deadline
            )
        );
        
        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                token.DOMAIN_SEPARATOR(),
                structHash
            )
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, hash);
        
        token.permit(signer, alice, value, deadline, v, r, s);
        
        assertEq(token.allowance(signer, alice), value);
        assertEq(token.nonces(signer), nonce + 1);
    }

}