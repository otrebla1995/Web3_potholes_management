'use client'

import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import { useChainId } from 'wagmi'
import { USER_ROLES, type UserRole } from '@/lib/utils'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'

export function useUserRole(): {
  role: UserRole
  isLoading: boolean
  address?: string
} {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]

  // Check if user is the owner
  const { data: owner, isLoading: ownerLoading } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'owner',
    query: { enabled: isConnected && !!address && !!contractAddress }
  })

  // Check if user is a municipal authority
  const { data: isMunicipal, isLoading: municipalLoading } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'authorizedMunicipals',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address && !!contractAddress }
  })

  // Check if user is a registered citizen
  const { data: isCitizen, isLoading: citizenLoading } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'registeredCitizens',
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address && !!contractAddress }
  })

  const isLoading = ownerLoading || municipalLoading || citizenLoading

  if (!isConnected || !address || !contractAddress) {
    return { role: USER_ROLES.UNAUTHORIZED, isLoading: false }
  }

  if (isLoading) {
    return { role: USER_ROLES.UNAUTHORIZED, isLoading: true, address }
  }

  // Determine role based on contract checks
  if (owner && address.toLowerCase() === (owner as string).toLowerCase()) {
    return { role: USER_ROLES.OWNER, isLoading: false, address }
  }
  
  if (isMunicipal) {
    return { role: USER_ROLES.MUNICIPAL, isLoading: false, address }
  }
  
  if (isCitizen) {
    return { role: USER_ROLES.CITIZEN, isLoading: false, address }
  }

  return { role: USER_ROLES.UNAUTHORIZED, isLoading: false, address }
}