import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

/**
 * Potholes Management System Deployment Module
 * 
 * This module deploys the complete potholes management system:
 * 1. PotholesToken (ERC20 token for rewards)
 * 2. PotholesForwarder (ERC2771 forwarder for meta-transactions)
 * 3. PotholesRegistry (main registry contract)
 * 
 */
export default buildModule("PotholesDeploymentModule", (m) => {
  
  // Account that will receive initial token supply and own the contracts
  const deployer = m.getAccount(0);
  
  // Token configuration
  const INITIAL_TOKEN_RECIPIENT = m.getParameter("initialTokenRecipient", deployer);
  const TOKEN_OWNER = m.getParameter("tokenOwner", deployer);
  
  // City configuration (Torino by default - coordinates in microdegrees)
  const CITY_NAME = m.getParameter("cityName", "Torino");
  const CITY_MIN_LAT = m.getParameter("cityMinLat", 45_015_700); // 45.0157°N
  const CITY_MAX_LAT = m.getParameter("cityMaxLat", 45_131_700); // 45.1317°N
  const CITY_MIN_LNG = m.getParameter("cityMinLng", 7_589_000);  // 7.5890°E
  const CITY_MAX_LNG = m.getParameter("cityMaxLng", 7_759_600);  // 7.7596°E
  const GRID_PRECISION = m.getParameter("gridPrecision", 100);  // ~10m grid cells (0.0001 degrees) at equator / 7-8m in Torino
  
  // Registry owner
  const REGISTRY_OWNER = m.getParameter("registryOwner", deployer);

  // 1. Deploy PotholesToken (ERC20 token for rewards)
  const potholesToken = m.contract("PotholesToken", [
    INITIAL_TOKEN_RECIPIENT,
    TOKEN_OWNER
  ]);

  // 2. Deploy PotholesForwarder (ERC2771 forwarder for gasless transactions)
  const potholesForwarder = m.contract("PotholesForwarder", [
    "PotholesForwarder" // Forwarder name
  ]);

  // 3. Deploy PotholesRegistry (main registry contract)
  const potholesRegistry = m.contract("PotholesRegistry", [
    CITY_NAME,
    potholesToken,
    potholesForwarder, // trusted forwarder
    REGISTRY_OWNER,
    CITY_MIN_LAT,
    CITY_MAX_LAT,
    CITY_MIN_LNG,
    CITY_MAX_LNG,
    GRID_PRECISION
  ]);

  // Transfer token ownership to registry so it can mint rewards
  m.call(potholesToken, "transferOwnership", [potholesRegistry]);

  // const municipalAuthority1 = m.getParameter("municipalAuthority1", "0x0000000000000000000000000000000000000000");
  // if (municipalAuthority1 !== "0x0000000000000000000000000000000000000000") {
  //   m.call(potholesRegistry, "addMunicipalAuthority", [municipalAuthority1]);
  // }

  // const initialCitizens = m.getParameter("initialCitizens", []);
  // if (initialCitizens.length > 0) {
  //   m.call(potholesRegistry, "addCitizensBatch", [initialCitizens]);
  // }

  return {
    potholesToken,
    potholesForwarder,
    potholesRegistry,
  };
});

/**
 * =============================================================================
 * DEPLOYMENT GUIDE
 * =============================================================================
 *
 * 4. DEPLOYMENT WITH CUSTOM PARAMETERS:
 * Create a parameters file (e.g., `ignition/parameters/milano.json`):
 * ```json
 * {
 *   "PotholesDeploymentModule": {
 *     "cityName": "Milano",
 *     "cityMinLat": 41800000,
 *     "cityMaxLat": 41900000,
 *     "cityMinLng": 9100000,
 *     "cityMaxLng": 9200000,
 *     "gridPrecision": 1000,
 *     "municipalAuthority1": "0x742E86F2A79c8aE5b5C6C8D57b866F9C02E04A59",
 *     "initialCitizens": ["0x1234...", "0x5678..."]
 *   }
 * }
 * ```
 * 
 * Then deploy with:
 * ```bash
 * npx hardhat ignition deploy ignition/modules/PotholesDeployment.ts \
 *   --parameters ignition/parameters/milano.json
 * ```
 *
 * =============================================================================
 * POST-DEPLOYMENT VERIFICATION
 * =============================================================================
 * 
 * After deployment, verify the contracts are properly configured:
 * 
 * 1. Check token ownership:
 * ```bash
 * npx hardhat console --network <your-network>
 * const token = await ethers.getContractAt("PotholesToken", "<token-address>");
 * await token.owner(); // Should return registry address
 * ```
 * 
 * 2. Check registry configuration:
 * ```bash
 * const registry = await ethers.getContractAt("PotholesRegistry", "<registry-address>");
 * await registry.cityName(); // Should return your city name
 * await registry.potholeToken(); // Should return token address
 * ```
 * 
 * 3. Test forwarder setup:
 * ```bash
 * const forwarder = await ethers.getContractAt("PotholesForwarder", "<forwarder-address>");
 * await forwarder.isTrustedForwarder("<forwarder-address>"); // Should return true
 * ```
 */