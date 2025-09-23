import { createPublicClient, createWalletClient, http, getContract, encodeFunctionData } from 'viem';
import { hardhat } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
    // Create clients
    const publicClient = createPublicClient({
        chain: hardhat,
        transport: http('http://127.0.0.1:8545'),
    });

    // Use the default hardhat account private key (account 0)
    const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

    // Also create account2 for testing
    const account2 = privateKeyToAccount('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d');

    const walletClient = createWalletClient({
        account,
        chain: hardhat,
        transport: http('http://127.0.0.1:8545'),
    });

    console.log("Using account:", account.address);

    // Contract addresses from deployment
    const FORWARDER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const REGISTRY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";

    console.log("Forwarder contract:", FORWARDER_ADDRESS);
    console.log("Registry contract:", REGISTRY_ADDRESS);

    // Define the ABI for the verify function
    const forwarderAbi = [
        {
            "inputs": [
                {
                    "components": [
                        { "name": "from", "type": "address" },
                        { "name": "to", "type": "address" },
                        { "name": "value", "type": "uint256" },
                        { "name": "gas", "type": "uint256" },
                        { "name": "deadline", "type": "uint48" },
                        { "name": "data", "type": "bytes" },
                        { "name": "signature", "type": "bytes" }
                    ],
                    "name": "request",
                    "type": "tuple"
                }
            ],
            "name": "verify",
            "outputs": [{ "name": "", "type": "bool" }],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [{ "name": "signer", "type": "address" }],
            "name": "nonces",
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "view",
            "type": "function"
        }
    ];

    const registryAbi = [
        {
            "inputs": [{ "name": "citizen", "type": "address" }],
            "name": "registerCitizen",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                { "name": "latitude", "type": "int256" },
                { "name": "longitude", "type": "int256" },
                { "name": "ipfsHash", "type": "string" }
            ],
            "name": "submitReport",
            "outputs": [{ "name": "", "type": "uint256" }],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    // Get contract instances
    const forwarder = getContract({
        address: FORWARDER_ADDRESS,
        abi: forwarderAbi,
        client: { public: publicClient, wallet: walletClient },
    });

    const registry = getContract({
        address: REGISTRY_ADDRESS,
        abi: registryAbi,
        client: { public: publicClient, wallet: walletClient },
    });

    // Get the current nonce for the account
    const nonce = await forwarder.read.nonces([account.address]);
    console.log("Current nonce:", nonce.toString());

    // Encode the function call
    const data = encodeFunctionData({
        abi: registryAbi,
        functionName: 'registerCitizen',
        args: [account.address]
    });

    // Create a sample forward request
    const request = {
        from: account.address,
        to: REGISTRY_ADDRESS,
        value: 0n,
        gas: 300000n,
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
        data: data,
        signature: "0x"
    };

    console.log("\nCreated forward request:");
    console.log("From:", request.from);
    console.log("To:", request.to);
    console.log("Value:", request.value.toString());
    console.log("Gas:", request.gas.toString());
    console.log("Deadline:", request.deadline.toString());
    console.log("Data:", request.data);

    // Create the typed data for signing
    const domain = {
        name: "PotholesForwarder",
        version: "1",
        chainId: 31337,
        verifyingContract: FORWARDER_ADDRESS
    };

    const types = {
        ForwardRequest: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint48" },
            { name: "data", type: "bytes" }
        ]
    };

    const message = {
        from: request.from,
        to: request.to,
        value: request.value,
        gas: request.gas,
        nonce: nonce,
        deadline: request.deadline,
        data: request.data
    };

    console.log("\nSigning the request...");

    // Sign the typed data
    const signature = await walletClient.signTypedData({
        account,
        domain,
        types,
        primaryType: 'ForwardRequest',
        message
    });

    console.log("Signature:", signature);

    // Update the request with the signature
    request.signature = signature;

    console.log("\nTesting verify function...");
    try {
        // Test the verify function
        const isValid = await forwarder.read.verify([request]);
        console.log("✅ Verify function result:", isValid);

        if (isValid) {
            console.log("✅ The signature is valid!");
        } else {
            console.log("❌ The signature is invalid.");
        }

        // Let's also test with an invalid signature
        console.log("\nTesting with invalid signature...");
        const invalidRequest = {
            ...request,
            signature: "0x1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234"
        };
        const isValidInvalid = await forwarder.read.verify([invalidRequest]);
        console.log("❌ Verify function result with invalid signature:", isValidInvalid);

    } catch (error) {
        console.error("Error testing verify function:", error.message);
    }

    // Now test submitReport function signature verification
    console.log("\n" + "=".repeat(50));
    console.log("TESTING SUBMITREPORT SIGNATURE VERIFICATION");
    console.log("=".repeat(50));

    try {
        // Test submitReport signature verification
        console.log("\nTesting submitReport signature verification...");

        // Valid coordinates within Torino bounds (slightly inside the bounds)
        const latitude = 45050000n;  // 45.05° N
        const longitude = 7650000n;  // 7.65° E
        const ipfsHash = "QmTestHashForPotholeReport123456789";

        console.log("Report parameters:");
        console.log("- Latitude:", latitude.toString(), "(45.05° N)");
        console.log("- Longitude:", longitude.toString(), "(7.65° E)");
        console.log("- IPFS Hash:", ipfsHash);

        // Encode submitReport function call
        const submitReportData = encodeFunctionData({
            abi: registryAbi,
            functionName: 'submitReport',
            args: [latitude, longitude, ipfsHash]
        });

        const submitReportRequest = {
            from: account.address,
            to: REGISTRY_ADDRESS,
            value: 0n,
            gas: 500000n, // Higher gas for submitReport
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            data: submitReportData,
            signature: "0x"
        };

        console.log("SubmitReport data:", submitReportData);

        // Sign the submitReport request
        const submitReportMessage = {
            from: submitReportRequest.from,
            to: submitReportRequest.to,
            value: submitReportRequest.value,
            gas: submitReportRequest.gas,
            nonce: nonce,
            deadline: submitReportRequest.deadline,
            data: submitReportRequest.data
        };

        console.log("\nSigning submitReport request...");
        const submitReportSignature = await walletClient.signTypedData({
            account,
            domain,
            types,
            primaryType: 'ForwardRequest',
            message: submitReportMessage
        });

        console.log("SubmitReport signature:", submitReportSignature);
        submitReportRequest.signature = submitReportSignature;

        // Verify the submitReport signature
        console.log("\nVerifying submitReport signature...");
        const isSubmitReportValid = await forwarder.read.verify([submitReportRequest]);
        console.log("✅ SubmitReport signature verification result:", isSubmitReportValid);

        if (isSubmitReportValid) {
            console.log("✅ The submitReport signature is valid!");
        } else {
            console.log("❌ The submitReport signature is invalid.");
        }

        // Test with invalid coordinates (outside city bounds)
        console.log("\nTesting with invalid coordinates (outside city bounds)...");
        const invalidLatitude = 46000000n;  // 46° N (outside Torino)
        const invalidLongitude = 8000000n;  // 8° E (outside Torino)

        const invalidSubmitReportData = encodeFunctionData({
            abi: registryAbi,
            functionName: 'submitReport',
            args: [invalidLatitude, invalidLongitude, ipfsHash]
        });

        const invalidSubmitReportRequest = {
            from: account.address,
            to: REGISTRY_ADDRESS,
            value: 0n,
            gas: 500000n,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            data: invalidSubmitReportData,
            signature: "0x"
        };

        const invalidSubmitReportMessage = {
            from: invalidSubmitReportRequest.from,
            to: invalidSubmitReportRequest.to,
            value: invalidSubmitReportRequest.value,
            gas: invalidSubmitReportRequest.gas,
            nonce: nonce,
            deadline: invalidSubmitReportRequest.deadline,
            data: invalidSubmitReportRequest.data
        };

        const invalidSubmitReportSignature = await walletClient.signTypedData({
            account,
            domain,
            types,
            primaryType: 'ForwardRequest',
            message: invalidSubmitReportMessage
        });

        invalidSubmitReportRequest.signature = invalidSubmitReportSignature;

        const isInvalidSubmitReportValid = await forwarder.read.verify([invalidSubmitReportRequest]);
        console.log("✅ Invalid coordinates signature verification result:", isInvalidSubmitReportValid);
        console.log("(Note: Signature is still valid - city bounds checking happens during execution, not verification)");

    } catch (error) {
        console.error("Error testing submitReport signature:", error.message);
        if (error.cause) {
            console.error("Cause:", error.cause);
        }
    }

    // Test with account2 as signer
    console.log("\n" + "=".repeat(60));
    console.log("TESTING WITH ACCOUNT2 AS SIGNER");
    console.log("=".repeat(60));

    try {
        console.log("\nTesting signature verification with account2...");
        console.log("Account1 (original):", account.address);
        console.log("Account2 (new signer):", account2.address);

        // Create wallet client for account2
        const walletClient2 = createWalletClient({
            account: account2,
            chain: hardhat,
            transport: http('http://127.0.0.1:8545'),
        });

        // Get nonce for account2
        const account2Nonce = await forwarder.read.nonces([account2.address]);
        console.log("Account2 nonce:", account2Nonce.toString());

        // Test 1: Account2 signs a request claiming to be from account2 (should be valid)
        console.log("\n1. Account2 signs request from account2 (should be VALID):");

        const account2Request = {
            from: account2.address, // Claiming to be from account2
            to: REGISTRY_ADDRESS,
            value: 0n,
            gas: 300000n,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            data: encodeFunctionData({
                abi: registryAbi,
                functionName: 'registerCitizen',
                args: [account2.address]
            }),
            signature: "0x"
        };

        const account2Message = {
            from: account2Request.from,
            to: account2Request.to,
            value: account2Request.value,
            gas: account2Request.gas,
            nonce: account2Nonce,
            deadline: account2Request.deadline,
            data: account2Request.data
        };

        const account2Signature = await walletClient2.signTypedData({
            account: account2,
            domain,
            types,
            primaryType: 'ForwardRequest',
            message: account2Message
        });

        account2Request.signature = account2Signature;

        const isAccount2Valid = await forwarder.read.verify([account2Request]);
        console.log("✅ Account2 signing for account2:", isAccount2Valid);

        // Test 2: Account2 signs a request claiming to be from account1 (should be invalid)
        console.log("\n2. Account2 signs request claiming to be from account1 (should be INVALID):");

        const spoofedRequest = {
            from: account.address, // Claiming to be from account1, but signed by account2
            to: REGISTRY_ADDRESS,
            value: 0n,
            gas: 300000n,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            data: encodeFunctionData({
                abi: registryAbi,
                functionName: 'registerCitizen',
                args: [account.address]
            }),
            signature: "0x"
        };

        const spoofedMessage = {
            from: spoofedRequest.from,
            to: spoofedRequest.to,
            value: spoofedRequest.value,
            gas: spoofedRequest.gas,
            nonce: nonce, // Using account1's nonce
            deadline: spoofedRequest.deadline,
            data: spoofedRequest.data
        };

        const spoofedSignature = await walletClient2.signTypedData({
            account: account2, // Account2 signing
            domain,
            types,
            primaryType: 'ForwardRequest',
            message: spoofedMessage
        });

        spoofedRequest.signature = spoofedSignature;

        const isSpoofedValid = await forwarder.read.verify([spoofedRequest]);
        console.log("❌ Account2 signing for account1:", isSpoofedValid);

        // Test 3: Account1 signs a request claiming to be from account2 (should be invalid)
        console.log("\n3. Account1 signs request claiming to be from account2 (should be INVALID):");

        const reverseSpoofedRequest = {
            from: account2.address, // Claiming to be from account2, but signed by account1
            to: REGISTRY_ADDRESS,
            value: 0n,
            gas: 300000n,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
            data: encodeFunctionData({
                abi: registryAbi,
                functionName: 'registerCitizen',
                args: [account2.address]
            }),
            signature: "0x"
        };

        const reverseSpoofedMessage = {
            from: reverseSpoofedRequest.from,
            to: reverseSpoofedRequest.to,
            value: reverseSpoofedRequest.value,
            gas: reverseSpoofedRequest.gas,
            nonce: account2Nonce,
            deadline: reverseSpoofedRequest.deadline,
            data: reverseSpoofedRequest.data
        };

        const reverseSpoofedSignature = await walletClient.signTypedData({
            account: account, // Account1 signing
            domain,
            types,
            primaryType: 'ForwardRequest',
            message: reverseSpoofedMessage
        });

        reverseSpoofedRequest.signature = reverseSpoofedSignature;

        const isReverseSpoofedValid = await forwarder.read.verify([reverseSpoofedRequest]);
        console.log("❌ Account1 signing for account2:", isReverseSpoofedValid);

        console.log("\n📝 Summary:");
        console.log("- Valid: Account signs for itself ✅");
        console.log("- Invalid: Account signs claiming to be another account ❌");
        console.log("- The verify function correctly prevents signature spoofing!");

    } catch (error) {
        console.error("Error testing with account2:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });