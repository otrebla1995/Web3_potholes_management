// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";

/*
 *
 * struct ForwardRequestData {
 *     address from;
 *     address to;
 *     uint256 value;
 *     uint256 gas;
 *     uint48 deadline;
 *     bytes data;
 *     bytes signature;
 * }
 */

contract PotholesForwarder is ERC2771Forwarder {
    
    // Events for monitoring
    event PotholeForwardedTransaction(
        address indexed from,
        address indexed to,
        uint256 nonce,
        bool success
    );

    /**
     * @dev Constructor that initializes the ERC2771Forwarder with a name
     * @param name The name of the forwarder
     */
    constructor(string memory name) ERC2771Forwarder(name) {
        // ERC2771Forwarder handles all the core functionality
        // Just add custom events for pothole-specific monitoring
    }

    /**
     * @dev Override to add custom events for pothole reporting system
     */
    function execute(ForwardRequestData calldata request)
        public
        payable
        override
    {
        // Get the nonce before execution for our event
        uint256 currentNonce = nonces(request.from);

        // Call parent execute function
        super.execute(request);

        // Emit custom event for pothole system monitoring (assume success if no revert)
        emit PotholeForwardedTransaction(
            request.from,
            request.to,
            currentNonce,
            true
        );
    }

    /**
     * @dev Override batch execute to add monitoring
     */
    function executeBatch(
        ForwardRequestData[] calldata requests,
        address payable refundReceiver
    ) public payable override {
        // Execute the batch
        super.executeBatch(requests, refundReceiver);

        // Emit events for each request in the batch (assume success if no revert)
        for (uint256 i = 0; i < requests.length; i++) {
            emit PotholeForwardedTransaction(
                requests[i].from,
                requests[i].to,
                nonces(requests[i].from) - 1, // Nonce was already incremented
                true
            );
        }
    }
}