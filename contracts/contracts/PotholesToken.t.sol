// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {PotholesToken} from "./PotholesToken.sol";

contract PotholesTokenTest is Test {
    PotholesToken public token;

    address public owner;
    address public recipient;
    address public user1;
    address public user2;
    address public nonOwner;

    uint256 constant INITIAL_SUPPLY = 1_000_000e18;
    string constant TOKEN_NAME = "PotholesToken";
    string constant TOKEN_SYMBOL = "PBC";

    function setUp() public {
        owner = makeAddr("owner");
        recipient = makeAddr("recipient");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        nonOwner = makeAddr("nonOwner");

        vm.prank(owner);
        token = new PotholesToken(recipient, owner);
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_deployment() public view {
        assertEq(token.name(), TOKEN_NAME);
        assertEq(token.symbol(), TOKEN_SYMBOL);
        assertEq(token.decimals(), 18);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
        assertEq(token.balanceOf(recipient), INITIAL_SUPPLY);
        assertEq(token.owner(), owner);
    }

    function test_initialSupplyMinted() public view {
        assertEq(token.balanceOf(recipient), INITIAL_SUPPLY);
        assertEq(token.totalSupply(), INITIAL_SUPPLY);
    }

    /*//////////////////////////////////////////////////////////////
                            OWNERSHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ownership() public view {
        assertEq(token.owner(), owner);
    }

    function test_transferOwnership() public {
        vm.prank(owner);
        token.transferOwnership(user1);
        
        assertEq(token.owner(), user1);
    }

    function test_transferOwnership_onlyOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        token.transferOwnership(user1);
    }

    /*//////////////////////////////////////////////////////////////
                            MINTING TESTS
    //////////////////////////////////////////////////////////////*/

    function test_mint() public {
        uint256 mintAmount = 1000e18;
        uint256 initialBalance = token.balanceOf(user1);
        uint256 initialSupply = token.totalSupply();

        vm.prank(owner);
        token.mint(user1, mintAmount);

        assertEq(token.balanceOf(user1), initialBalance + mintAmount);
        assertEq(token.totalSupply(), initialSupply + mintAmount);
    }

    function test_mint_onlyOwner() public {
        uint256 mintAmount = 1000e18;

        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        token.mint(user1, mintAmount);
    }

    function test_mint_zeroAmount() public {
        uint256 initialBalance = token.balanceOf(user1);
        uint256 initialSupply = token.totalSupply();

        vm.prank(owner);
        token.mint(user1, 0);

        assertEq(token.balanceOf(user1), initialBalance);
        assertEq(token.totalSupply(), initialSupply);
    }

    function test_mint_toZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSignature("ERC20InvalidReceiver(address)", address(0)));
        token.mint(address(0), 1000e18);
    }

    function test_mint_multipleRecipients() public {
        uint256 mintAmount = 1000e18;

        vm.startPrank(owner);
        token.mint(user1, mintAmount);
        token.mint(user2, mintAmount * 2);
        vm.stopPrank();

        assertEq(token.balanceOf(user1), mintAmount);
        assertEq(token.balanceOf(user2), mintAmount * 2);
        assertEq(token.totalSupply(), INITIAL_SUPPLY + mintAmount * 3);
    }

    /*//////////////////////////////////////////////////////////////
                            PAUSABLE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_pause() public {
        vm.prank(owner);
        token.pause();

        assertTrue(token.paused());
    }

    function test_pause_onlyOwner() public {
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        token.pause();
    }

    function test_unpause() public {
        vm.startPrank(owner);
        token.pause();
        assertTrue(token.paused());

        token.unpause();
        assertFalse(token.paused());
        vm.stopPrank();
    }

    function test_unpause_onlyOwner() public {
        vm.prank(owner);
        token.pause();

        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        token.unpause();
    }

    function test_transferWhenPaused() public {
        uint256 transferAmount = 1000e18;

        vm.prank(owner);
        token.pause();

        vm.prank(recipient);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.transfer(user1, transferAmount);
    }

    function test_mintWhenPaused() public {
        uint256 mintAmount = 1000e18;

        vm.startPrank(owner);
        token.pause();

        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.mint(user1, mintAmount);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                            TRANSFER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_transfer() public {
        uint256 transferAmount = 1000e18;
        uint256 initialBalance = token.balanceOf(recipient);

        vm.prank(recipient);
        bool success = token.transfer(user1, transferAmount);

        assertTrue(success);
        assertEq(token.balanceOf(recipient), initialBalance - transferAmount);
        assertEq(token.balanceOf(user1), transferAmount);
    }

    function test_transferFrom() public {
        uint256 transferAmount = 1000e18;

        vm.prank(recipient);
        token.approve(user1, transferAmount);

        vm.prank(user1);
        bool success = token.transferFrom(recipient, user2, transferAmount);

        assertTrue(success);
        assertEq(token.balanceOf(recipient), INITIAL_SUPPLY - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);
        assertEq(token.allowance(recipient, user1), 0);
    }

    function test_approve() public {
        uint256 approvalAmount = 1000e18;

        vm.prank(recipient);
        bool success = token.approve(user1, approvalAmount);

        assertTrue(success);
        assertEq(token.allowance(recipient, user1), approvalAmount);
    }

    /*//////////////////////////////////////////////////////////////
                            PERMIT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_permit() public {
        uint256 privateKey = 0x123;
        address holder = vm.addr(privateKey);
        
        // Give holder some tokens
        vm.prank(owner);
        token.mint(holder, 1000e18);

        uint256 value = 100e18;
        uint256 deadline = block.timestamp + 3600;
        uint256 nonce = token.nonces(holder);

        // Create permit signature
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                holder,
                user1,
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

        // Execute permit
        token.permit(holder, user1, value, deadline, v, r, s);

        assertEq(token.allowance(holder, user1), value);
        assertEq(token.nonces(holder), nonce + 1);
    }

    function test_permit_expired() public {
        uint256 privateKey = 0x123;
        address holder = vm.addr(privateKey);
        
        uint256 value = 100e18;
        uint256 deadline = block.timestamp - 1; // Expired
        uint256 nonce = token.nonces(holder);

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                holder,
                user1,
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

        vm.expectRevert(abi.encodeWithSignature("ERC2612ExpiredSignature(uint256)", deadline));
        token.permit(holder, user1, value, deadline, v, r, s);
    }

    /*//////////////////////////////////////////////////////////////
                            FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_mint(address to, uint256 amount) public {
        vm.assume(to != address(0));
        amount = bound(amount, 0, type(uint256).max - token.totalSupply());

        uint256 initialBalance = token.balanceOf(to);
        uint256 initialSupply = token.totalSupply();

        vm.prank(owner);
        token.mint(to, amount);

        assertEq(token.balanceOf(to), initialBalance + amount);
        assertEq(token.totalSupply(), initialSupply + amount);
    }

    function testFuzz_transfer(uint256 amount) public {
        amount = bound(amount, 0, token.balanceOf(recipient));

        uint256 initialRecipientBalance = token.balanceOf(recipient);
        uint256 initialUser1Balance = token.balanceOf(user1);

        vm.prank(recipient);
        token.transfer(user1, amount);

        assertEq(token.balanceOf(recipient), initialRecipientBalance - amount);
        assertEq(token.balanceOf(user1), initialUser1Balance + amount);
    }

    /*//////////////////////////////////////////////////////////////
                           INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_fullWorkflow() public {
        uint256 mintAmount = 5000e18;
        uint256 transferAmount = 1000e18;
        uint256 approvalAmount = 2000e18;

        // 1. Owner mints tokens to user1
        vm.prank(owner);
        token.mint(user1, mintAmount);
        assertEq(token.balanceOf(user1), mintAmount);

        // 2. User1 transfers some tokens to user2
        vm.prank(user1);
        token.transfer(user2, transferAmount);
        assertEq(token.balanceOf(user1), mintAmount - transferAmount);
        assertEq(token.balanceOf(user2), transferAmount);

        // 3. User1 approves user2 to spend tokens
        vm.prank(user1);
        token.approve(user2, approvalAmount);
        assertEq(token.allowance(user1, user2), approvalAmount);

        // 4. User2 transfers from user1 to recipient
        vm.prank(user2);
        token.transferFrom(user1, recipient, approvalAmount);
        assertEq(token.balanceOf(user1), mintAmount - transferAmount - approvalAmount);
        assertEq(token.balanceOf(recipient), INITIAL_SUPPLY + approvalAmount);

        // 5. Owner pauses the contract
        vm.prank(owner);
        token.pause();

        // 6. Transfers should fail when paused
        vm.prank(user2);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        token.transfer(user1, 100e18);

        // 7. Owner unpauses
        vm.prank(owner);
        token.unpause();

        // 8. Transfers should work again
        vm.prank(user2);
        token.transfer(user1, 100e18);
        assertEq(token.balanceOf(user2), transferAmount - 100e18);
        assertEq(token.balanceOf(user1), mintAmount - transferAmount - approvalAmount + 100e18);
    }

    /*//////////////////////////////////////////////////////////////
                           EDGE CASES
    //////////////////////////////////////////////////////////////*/

    function test_transferEntireBalance() public {
        uint256 entireBalance = token.balanceOf(recipient);

        vm.prank(recipient);
        token.transfer(user1, entireBalance);

        assertEq(token.balanceOf(recipient), 0);
        assertEq(token.balanceOf(user1), entireBalance);
    }

    function test_transferMoreThanBalance() public {
        uint256 balance = token.balanceOf(recipient);
        uint256 transferAmount = balance + 1;

        vm.prank(recipient);
        vm.expectRevert(abi.encodeWithSignature("ERC20InsufficientBalance(address,uint256,uint256)", recipient, balance, transferAmount));
        token.transfer(user1, transferAmount);
    }

    function test_transferFromMoreThanAllowance() public {
        uint256 approvalAmount = 1000e18;
        uint256 transferAmount = approvalAmount + 1;

        vm.prank(recipient);
        token.approve(user1, approvalAmount);

        vm.prank(user1);
        vm.expectRevert(abi.encodeWithSignature("ERC20InsufficientAllowance(address,uint256,uint256)", user1, approvalAmount, transferAmount));
        token.transferFrom(recipient, user2, transferAmount);
    }

    function test_approveZeroAllowance() public {
        vm.prank(recipient);
        token.approve(user1, 1000e18);
        assertEq(token.allowance(recipient, user1), 1000e18);

        vm.prank(recipient);
        token.approve(user1, 0);
        assertEq(token.allowance(recipient, user1), 0);
    }

    function test_selfTransfer() public {
        uint256 initialBalance = token.balanceOf(recipient);
        uint256 transferAmount = 1000e18;

        vm.prank(recipient);
        token.transfer(recipient, transferAmount);

        assertEq(token.balanceOf(recipient), initialBalance);
    }

    function test_zeroTransfer() public {
        uint256 initialBalance1 = token.balanceOf(recipient);
        uint256 initialBalance2 = token.balanceOf(user1);

        vm.prank(recipient);
        bool success = token.transfer(user1, 0);

        assertTrue(success);
        assertEq(token.balanceOf(recipient), initialBalance1);
        assertEq(token.balanceOf(user1), initialBalance2);
    }

    /*//////////////////////////////////////////////////////////////
                           EVENTS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_mintEmitsTransferEvent() public {
        uint256 mintAmount = 1000e18;

        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit IERC20.Transfer(address(0), user1, mintAmount);
        token.mint(user1, mintAmount);
    }

    function test_transferEmitsEvent() public {
        uint256 transferAmount = 1000e18;

        vm.prank(recipient);
        vm.expectEmit(true, true, false, true);
        emit IERC20.Transfer(recipient, user1, transferAmount);
        token.transfer(user1, transferAmount);
    }

    function test_approvalEmitsEvent() public {
        uint256 approvalAmount = 1000e18;

        vm.prank(recipient);
        vm.expectEmit(true, true, false, true);
        emit IERC20.Approval(recipient, user1, approvalAmount);
        token.approve(user1, approvalAmount);
    }

    function test_pauseEmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(false, false, false, false);
        emit Pausable.Paused(owner);
        token.pause();
    }

    function test_unpauseEmitsEvent() public {
        vm.prank(owner);
        token.pause();

        vm.prank(owner);
        vm.expectEmit(false, false, false, false);
        emit Pausable.Unpaused(owner);
        token.unpause();
    }

    /*//////////////////////////////////////////////////////////////
                           DOMAIN SEPARATOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_domainSeparator() public view {
        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        assertTrue(domainSeparator != bytes32(0));
    }

    function test_nonces() public view {
        assertEq(token.nonces(user1), 0);
        assertEq(token.nonces(recipient), 0);
    }

    /*//////////////////////////////////////////////////////////////
                           SUPPLY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_totalSupplyAfterMints() public {
        uint256 initialSupply = token.totalSupply();
        uint256 mintAmount1 = 1000e18;
        uint256 mintAmount2 = 2000e18;

        vm.startPrank(owner);
        token.mint(user1, mintAmount1);
        token.mint(user2, mintAmount2);
        vm.stopPrank();

        assertEq(token.totalSupply(), initialSupply + mintAmount1 + mintAmount2);
    }

    function test_balanceOfNonExistentAccount() public {
        address nonExistent = makeAddr("nonExistent");
        assertEq(token.balanceOf(nonExistent), 0);
    }

    function test_allowanceNonExistentAccounts() public {
        address nonExistent1 = makeAddr("nonExistent1");
        address nonExistent2 = makeAddr("nonExistent2");
        assertEq(token.allowance(nonExistent1, nonExistent2), 0);
    }

    /*//////////////////////////////////////////////////////////////
                           HELPER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function mintTokensToUser(address user, uint256 amount) internal {
        vm.prank(owner);
        token.mint(user, amount);
    }

    function pauseToken() internal {
        vm.prank(owner);
        token.pause();
    }

    function unpauseToken() internal {
        vm.prank(owner);
        token.unpause();
    }
}

// Additional interface imports that might be needed
interface IERC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface Pausable {
    event Paused(address account);
    event Unpaused(address account);
}