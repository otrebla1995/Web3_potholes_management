import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { hardhat } from 'wagmi/chains'

// This sets up wallet connections
export const config = getDefaultConfig({
  appName: 'My Potholes App',
  projectId: 'dummy-project-id', // We'll improve this later
  chains: [hardhat], // Only support local blockchain for now
  ssr: true,
})

// This maps blockchain networks to contract addresses
export const contractAddresses = {
  [hardhat.id]: process.env.NEXT_PUBLIC_POTHOLE_CONTRACT_ADDRESS as `0x${string}`,
} as const