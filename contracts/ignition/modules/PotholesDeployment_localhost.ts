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

  return {
    potholesToken,
    potholesForwarder,
    potholesRegistry
  };
});