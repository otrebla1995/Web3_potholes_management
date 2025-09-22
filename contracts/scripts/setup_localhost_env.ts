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
      networkName: string;
      chainId: number;
      initialTokenRecipient: string;
      tokenOwner: string;
      registryOwner: string;
      cityName: string;
      cityMinLat: number;
      cityMaxLat: number;
      cityMinLng: number;
      cityMaxLng: number;
      gridPrecision: number;
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
    inputs: [{ name: "authority", type: "address" }],
    name: "addMunicipalAuthority",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "citizens", type: "address[]" }],
    name: "addCitizensBatch",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "citizen", type: "address" }],
    name: "addCitizen",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "authorizedMunicipals",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "registeredCitizens",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "citizenCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
] as const;

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

async function main() {
  console.log("Setting up localhost environment...");

  // Dynamically find parameters file
  const parametersPath = findParametersFile();
  console.log(`Using parameters file: ${parametersPath}`);
  const parameters: Parameters = JSON.parse(fs.readFileSync(parametersPath, "utf8"));

  // Dynamically find deployed addresses file
  const deployedAddressesPath = findDeployedAddressesFile();
  console.log(`Using deployed addresses file: ${deployedAddressesPath}`);
  const deployedAddresses: DeployedAddresses = JSON.parse(fs.readFileSync(deployedAddressesPath, "utf8"));

  // Find registry address
  const registryAddress = findRegistryAddress(deployedAddresses);

  // Setup viem clients with proper chainId
  const localhostChain = {
    ...localhost,
    id: 31337
  };

  const publicClient = createPublicClient({
    chain: localhostChain,
    transport: http('http://127.0.0.1:8545')
  });

  // Use the first Hardhat test account (registry owner)
  const HARDHAT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const account = privateKeyToAccount(HARDHAT_PRIVATE_KEY);

  const walletClient = createWalletClient({
    account,
    chain: localhostChain,
    transport: http('http://127.0.0.1:8545')
  });

  // Get contract instance
  const registry = getContract({
    address: registryAddress as `0x${string}`,
    abi: REGISTRY_ABI,
    client: { public: publicClient, wallet: walletClient }
  });

  // Get parameters
  const { initialCitizens, municipalAuthority1 } = parameters.PotholesDeploymentModule.parameters;

  console.log(`Registry contract at: ${registryAddress}`);
  console.log(`Adding municipal authority: ${municipalAuthority1}`);
  console.log(`Adding ${initialCitizens.length} citizens`);

  // Add municipal authority
  try {
    const hash = await registry.write.addMunicipalAuthority([municipalAuthority1 as `0x${string}`]);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✓ Municipal authority added: ${municipalAuthority1}`);
  } catch (error: any) {
    if (error.message.includes('already') || error.message.includes('revert')) {
      console.log(`✓ Municipal authority already exists: ${municipalAuthority1}`);
    } else {
      console.error(`✗ Failed to add municipal authority: ${error.message}`);
    }
  }

  // Add citizens in batch
  try {
    const citizensAddresses = initialCitizens as `0x${string}`[];
    const hash = await registry.write.addCitizensBatch([citizensAddresses]);
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✓ Citizens batch added successfully`);

    for (const citizen of initialCitizens) {
      console.log(`  - ${citizen}`);
    }
  } catch (error: any) {
    console.error(`✗ Failed to add citizens batch: ${error.message}`);

    // Fallback: add citizens individually
    console.log("Trying to add citizens individually...");
    for (const citizen of initialCitizens) {
      try {
        const hash = await registry.write.addCitizen([citizen as `0x${string}`]);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`✓ Citizen added: ${citizen}`);
      } catch (error: any) {
        if (error.message.includes("already registered") || error.message.includes('revert')) {
          console.log(`✓ Citizen already registered: ${citizen}`);
        } else {
          console.error(`✗ Failed to add citizen ${citizen}: ${error.message}`);
        }
      }
    }
  }

  // Verify setup
  console.log("\nVerifying setup...");

  // Check municipal authority
  const isAuthorized = await registry.read.authorizedMunicipals([municipalAuthority1 as `0x${string}`]);
  console.log(`Municipal authority ${municipalAuthority1} authorized: ${isAuthorized}`);

  // Check citizens
  for (const citizen of initialCitizens) {
    const isRegistered = await registry.read.registeredCitizens([citizen as `0x${string}`]);
    console.log(`Citizen ${citizen} registered: ${isRegistered}`);
  }

  // Get citizen count
  const citizenCount = await registry.read.citizenCount();
  console.log(`Total registered citizens: ${citizenCount}`);

  console.log("\n✓ Localhost environment setup completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });