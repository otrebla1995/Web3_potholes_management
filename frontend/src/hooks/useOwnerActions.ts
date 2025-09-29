'use client'

import { useEffect, useState } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi'
import { useChainId } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'
import { toast } from 'react-hot-toast'
import { getAuthorizedMunicipals } from '@/lib/municipals'

export function useOwnerActions() {
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const publicClient = usePublicClient()
  const [municipalCount, setMunicipalCount] = useState(0)

  // Write contract hook
  const { writeContract, isPending, data: hash, error } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read contract data
  const { data: citizenCount, refetch: refetchCitizenCount } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'citizenCount',
  })

  const { data: totalReports, refetch: refetchTotalReports } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'totalReports',
  })

  // Compute municipal count from events (since the contract stores a mapping without a counter)
  const fetchMunicipalCount = async () => {
    try {
      if (!publicClient || !contractAddress) return
      const list = await getAuthorizedMunicipals(publicClient, contractAddress as `0x${string}`)
      setMunicipalCount(list.length)
    } catch (e) {
      console.error('Failed to fetch municipal count', e)
    }
  }

  // Add single citizen
  const addCitizen = async (citizenAddress: string) => {
    if (!contractAddress) {
      toast.error('Contract not found')
      return
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'addCitizen',
        args: [citizenAddress as `0x${string}`],
      })
      
      toast.success('Adding citizen...')
    } catch (error: any) {
      console.error('Error adding citizen:', error)
      toast.error(error?.message || 'Failed to add citizen')
    }
  }

  // Add multiple citizens
  const addCitizensBatch = async (citizenAddresses: string[]) => {
    if (!contractAddress) {
      toast.error('Contract not found')
      return
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'addCitizensBatch',
        args: [citizenAddresses as `0x${string}`[]],
      })
      
      toast.success('Adding citizens...')
    } catch (error: any) {
      console.error('Error adding citizens:', error)
      toast.error(error?.message || 'Failed to add citizens')
    }
  }

  // Remove citizen
  const removeCitizen = async (citizenAddress: string) => {
    if (!contractAddress) {
      toast.error('Contract not found')
      return
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'removeCitizen',
        args: [citizenAddress as `0x${string}`],
      })
      
      toast.success('Removing citizen...')
    } catch (error: any) {
      console.error('Error removing citizen:', error)
      toast.error(error?.message || 'Failed to remove citizen')
    }
  }

  // Add municipal authority
  const addMunicipalAuthority = async (authorityAddress: string) => {
    if (!contractAddress) {
      toast.error('Contract not found')
      return
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'addMunicipalAuthority',
        args: [authorityAddress as `0x${string}`],
      })
      
      toast.success('Adding municipal authority...')
    } catch (error: any) {
      console.error('Error adding authority:', error)
      toast.error(error?.message || 'Failed to add authority')
    }
  }

  // Remove municipal authority
  const removeMunicipalAuthority = async (authorityAddress: string) => {
    if (!contractAddress) {
      toast.error('Contract not found')
      return
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'removeMunicipalAuthority',
        args: [authorityAddress as `0x${string}`],
      })
      
      toast.success('Removing municipal authority...')
    } catch (error: any) {
      console.error('Error removing authority:', error)
      toast.error(error?.message || 'Failed to remove authority')
    }
  }

  // Check if address is valid
  const isValidAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  // Refresh all data after successful transaction
  const refreshData = () => {
    refetchCitizenCount()
    refetchTotalReports()
    fetchMunicipalCount()
  }

  // Auto-refresh after successful transaction
  if (isSuccess) {
    setTimeout(refreshData, 1000)
  }

  // Initial load for municipal count and when network changes
  useEffect(() => {
    fetchMunicipalCount()
  }, [publicClient, contractAddress])

  return {
    // Actions
    addCitizen,
    addCitizensBatch,
    removeCitizen,
    addMunicipalAuthority,
    removeMunicipalAuthority,
    
    // State
    isPending,
    isConfirming,
    isSuccess,
    error,
    
    // Data
    citizenCount: citizenCount ? Number(citizenCount) : 0,
    totalReports: totalReports ? Number(totalReports) : 0,
  municipalCount,
    
    // Utilities
    isValidAddress,
    refreshData,
  }
}