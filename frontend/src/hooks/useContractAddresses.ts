"use client"

import { useChainId, useReadContract } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'

export function useContractAddresses() {
  const chainId = useChainId()
  const registry = contractAddresses[chainId as keyof typeof contractAddresses] as `0x${string}` | undefined

  const { data: forwarderData, isLoading: isLoadingForwarder } = useReadContract({
    address: registry,
    abi: PotholesRegistryABI.abi,
    functionName: 'trustedForwarder',
    query: { enabled: Boolean(registry) },
  })

  const { data: tokenData, isLoading: isLoadingToken } = useReadContract({
    address: registry,
    abi: PotholesRegistryABI.abi,
    functionName: 'potholeToken',
    query: { enabled: Boolean(registry) },
  })

  return {
    chainId,
    registry,
    forwarder: forwarderData as `0x${string}` | undefined,
    token: tokenData as `0x${string}` | undefined,
    isLoading: isLoadingForwarder || isLoadingToken,
  }
}
