import { createPublicClient, createWalletClient, http, getContract } from 'viem';
import { localhost } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Parameters {
  PotholesDeploymentModule: {
    parameters: {
      cityMinLat: number;
      cityMaxLat: number;
      cityMinLng: number;
      cityMaxLng: number;
      initialCitizens: string[];
      municipalAuthority1: string;
    };
  };
}

interface DeployedAddresses {
  [key: string]: string;
}

const REGISTRY_ABI = [
  {
    inputs: [
      { name: "latitude", type: "int256" },
      { name: "longitude", type: "int256" },
      { name: "ipfsHash", type: "string" }
    ],
    name: "submitReport",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "reportId", type: "uint256" },
      { name: "newStatus", type: "uint8" }
    ],
    name: "updateReportStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { name: "reportId", type: "uint256" },
      { name: "reason", type: "string" }
    ],
    name: "rejectReport",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "getTotalReports",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

// PotholeStatus enum: Reported = 0, InProgress = 1, Completed = 2, Rejected = 3
enum PotholeStatus {
  Reported = 0,
  InProgress = 1,
  Completed = 2,
  Rejected = 3
}

function findParametersFile(): string {
  const ignitionDir = path.join(__dirname, '../ignition/parameters');
  const files = fs.readdirSync(ignitionDir);
  const paramFile = files.find(file => file.endsWith('_localhost.json'));

  if (!paramFile) {
    throw new Error('No localhost parameters file found in ignition/parameters/');
  }

  return path.join(ignitionDir, paramFile);
}

function findDeployedAddressesFile(): string {
  const deploymentsDir = path.join(__dirname, '../ignition/deployments');
  const chainDirs = fs.readdirSync(deploymentsDir).filter(dir =>
    fs.statSync(path.join(deploymentsDir, dir)).isDirectory()
  );

  for (const chainDir of chainDirs) {
    const addressesFile = path.join(deploymentsDir, chainDir, 'deployed_addresses.json');
    if (fs.existsSync(addressesFile)) {
      return addressesFile;
    }
  }

  throw new Error('No deployed_addresses.json file found in any deployment directory');
}

function findRegistryAddress(deployedAddresses: DeployedAddresses): string {
  const registryKey = Object.keys(deployedAddresses).find(key =>
    key.includes('PotholesRegistry')
  );

  if (!registryKey) {
    throw new Error('PotholesRegistry contract address not found in deployed addresses');
  }

  return deployedAddresses[registryKey];
}

// Generate random coordinates within city bounds
function generateRandomCoordinates(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number
): { latitude: bigint; longitude: bigint } {
  // Convert bounds to integers (microdegrees)
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;

  const randomLat = minLat + Math.floor(Math.random() * latRange);
  const randomLng = minLng + Math.floor(Math.random() * lngRange);

  return {
    latitude: BigInt(randomLat),
    longitude: BigInt(randomLng)
  };
}

// Generate mock IPFS hash
function generateMockIpfsHash(): string {
  const randomStr = Math.random().toString(36).substring(2, 15) +
                    Math.random().toString(36).substring(2, 15);
  return `Qm${randomStr}`;
}

// Hardhat test accounts private keys
const HARDHAT_ACCOUNTS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
  "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
  "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
  "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
];

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("Populating test reports on localhost blockchain...\n");

  // Load parameters and deployed addresses
  const parametersPath = findParametersFile();
  const parameters: Parameters = JSON.parse(fs.readFileSync(parametersPath, "utf8"));

  const deployedAddressesPath = findDeployedAddressesFile();
  const deployedAddresses: DeployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  const registryAddress = findRegistryAddress(deployedAddresses);

  const { cityMinLat, cityMaxLat, cityMinLng, cityMaxLng, initialCitizens, municipalAuthority1 } =
    parameters.PotholesDeploymentModule.parameters;

  console.log(`Registry contract: ${registryAddress}`);
  console.log(`City bounds: Lat[${cityMinLat}, ${cityMaxLat}], Lng[${cityMinLng}, ${cityMaxLng}]`);
  console.log(`Citizens to populate: ${initialCitizens.length}\n`);

  const localhostChain = { ...localhost, id: 31337 };

  const publicClient = createPublicClient({
    chain: localhostChain,
    transport: http('http://127.0.0.1:8545')
  });

  // Municipal authority account (for updating statuses)
  const municipalAccount = privateKeyToAccount(HARDHAT_ACCOUNTS[1] as `0x${string}`);
  const municipalWalletClient = createWalletClient({
    account: municipalAccount,
    chain: localhostChain,
    transport: http('http://127.0.0.1:8545')
  });

  const municipalRegistry = getContract({
    address: registryAddress as `0x${string}`,
    abi: REGISTRY_ABI,
    client: { public: publicClient, wallet: municipalWalletClient }
  });

  // Create reports for each citizen
  let totalReportsCreated = 0;
  const reportIds: number[] = [];

  for (let i = 0; i < initialCitizens.length; i++) {
    const citizenAddress = initialCitizens[i];
    const citizenPrivateKey = HARDHAT_ACCOUNTS[i + 2]; // Offset by 2 (owner and municipal)

    if (!citizenPrivateKey) {
      console.log(`⚠ Skipping citizen ${citizenAddress} - no private key available`);
      continue;
    }

    console.log(`\n📍 Creating reports for citizen ${i + 1}/${initialCitizens.length}: ${citizenAddress}`);

    const citizenAccount = privateKeyToAccount(citizenPrivateKey as `0x${string}`);
    const citizenWalletClient = createWalletClient({
      account: citizenAccount,
      chain: localhostChain,
      transport: http('http://127.0.0.1:8545')
    });

    const citizenRegistry = getContract({
      address: registryAddress as `0x${string}`,
      abi: REGISTRY_ABI,
      client: { public: publicClient, wallet: citizenWalletClient }
    });

    // Create 10 reports per citizen
    for (let j = 0; j < 10; j++) {
      const coords = generateRandomCoordinates(cityMinLat, cityMaxLat, cityMinLng, cityMaxLng);
      const ipfsHash = generateMockIpfsHash();

      try {
        const hash = await citizenRegistry.write.submitReport([
          coords.latitude,
          coords.longitude,
          ipfsHash
        ]);

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Extract report ID from logs (it's returned from submitReport)
        const currentTotal = await citizenRegistry.read.getTotalReports() as bigint;
        const reportId = Number(currentTotal);
        reportIds.push(reportId);

        console.log(`  ✓ Report ${j + 1}/10 created (ID: ${reportId})`);
        totalReportsCreated++;

        // Small delay to avoid overwhelming the node
        await sleep(100);

      } catch (error: any) {
        console.error(`  ✗ Failed to create report ${j + 1}: ${error.message}`);
      }
    }
  }

  console.log(`\n✓ Created ${totalReportsCreated} total reports`);

  // Now update statuses to create a diverse mix
  console.log(`\n📊 Updating report statuses to create diverse dataset...\n`);

  const numReports = reportIds.length;

  // Calculate distribution (roughly):
  // - 30% InProgress
  // - 20% Rejected
  // - 10% Completed
  // - 40% remain Reported

  const numInProgress = Math.floor(numReports * 0.3);
  const numRejected = Math.floor(numReports * 0.2);
  const numCompleted = Math.floor(numReports * 0.1);

  console.log(`Target distribution:`);
  console.log(`  - InProgress: ${numInProgress} reports`);
  console.log(`  - Rejected: ${numRejected} reports`);
  console.log(`  - Completed: ${numCompleted} reports`);
  console.log(`  - Reported: ${numReports - numInProgress - numRejected - numCompleted} reports\n`);

  // Shuffle report IDs to randomize which ones get updated
  const shuffledReportIds = [...reportIds].sort(() => Math.random() - 0.5);

  let idx = 0;

  // Set some to InProgress
  for (let i = 0; i < numInProgress && idx < shuffledReportIds.length; i++, idx++) {
    const reportId = shuffledReportIds[idx];
    try {
      const hash = await municipalRegistry.write.updateReportStatus([
        BigInt(reportId),
        PotholeStatus.InProgress
      ]);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Report ${reportId} → InProgress`);
      await sleep(100);
    } catch (error: any) {
      console.error(`  ✗ Failed to update report ${reportId}: ${error.message}`);
    }
  }

  // Set some to Rejected
  const rejectionReasons = [
    "Duplicate report",
    "Not a pothole - normal road wear",
    "Private property",
    "Already fixed",
    "Invalid location"
  ];

  for (let i = 0; i < numRejected && idx < shuffledReportIds.length; i++, idx++) {
    const reportId = shuffledReportIds[idx];
    const reason = rejectionReasons[Math.floor(Math.random() * rejectionReasons.length)];
    try {
      const hash = await municipalRegistry.write.rejectReport([
        BigInt(reportId),
        reason
      ]);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Report ${reportId} → Rejected ("${reason}")`);
      await sleep(100);
    } catch (error: any) {
      console.error(`  ✗ Failed to reject report ${reportId}: ${error.message}`);
    }
  }

  // Set some to Completed (these must first be set to InProgress, then to Completed)
  for (let i = 0; i < numCompleted && idx < shuffledReportIds.length; i++, idx++) {
    const reportId = shuffledReportIds[idx];
    try {
      // First set to InProgress
      let hash = await municipalRegistry.write.updateReportStatus([
        BigInt(reportId),
        PotholeStatus.InProgress
      ]);
      await publicClient.waitForTransactionReceipt({ hash });
      await sleep(100);

      // Then set to Completed
      hash = await municipalRegistry.write.updateReportStatus([
        BigInt(reportId),
        PotholeStatus.Completed
      ]);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Report ${reportId} → Completed`);
      await sleep(100);
    } catch (error: any) {
      console.error(`  ✗ Failed to complete report ${reportId}: ${error.message}`);
    }
  }

  console.log(`\n✅ Test data population completed!`);
  console.log(`Total reports in system: ${totalReportsCreated}`);
  console.log(`\nYou can now view this data in the frontend application.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });