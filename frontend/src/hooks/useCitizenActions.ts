'use client'

import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { useChainId, useAccount } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'
import { toast } from 'react-hot-toast'
import { useState, useEffect } from 'react'

export interface PotholeReport {
  id: number
  latitude: bigint
  longitude: bigint
  ipfsHash: string
  duplicateCount: number
  reportedAt: number
  reporter: string
  status: number // 0: Reported, 1: InProgress, 2: Completed, 3: Rejected
}

export function useCitizenActions() {
  const { address } = useAccount()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const [userReports, setUserReports] = useState<PotholeReport[]>([])

  // Write contract hook
  const { writeContract, isPending, data: hash, error } = useWriteContract()

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Read contract data
  const { data: totalReports, refetch: refetchTotalReports } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'totalReports',
  })

  const { data: nextReportId } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'nextReportId',
  })

  // Convert coordinates to the format expected by the contract
  const coordinateToInt = (coord: number): bigint => {
    // Contract expects coordinates multiplied by 1e6 for precision
    return BigInt(Math.round(coord * 1000000))
  }

  const intToCoordinate = (coord: bigint): number => {
    return Number(coord) / 1000000
  }

  // Submit pothole report
  const submitReport = async (
    latitude: number,
    longitude: number,
    description: string,
    severity?: number
  ) => {
    if (!contractAddress) {
      toast.error('Contract not found')
      return
    }

    if (!address) {
      toast.error('Please connect your wallet')
      return
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      toast.error('Invalid latitude. Must be between -90 and 90')
      return
    }

    if (longitude < -180 || longitude > 180) {
      toast.error('Invalid longitude. Must be between -180 and 180')
      return
    }

    try {
      // For now, we'll use the description as IPFS hash
      // In a real app, you'd upload to IPFS first
      const ipfsHash = `description:${description}`

      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'submitReport',
        args: [
          coordinateToInt(latitude),
          coordinateToInt(longitude),
          ipfsHash
        ],
      })
      
      toast.success('Submitting pothole report...')
    } catch (error: any) {
      console.error('Error submitting report:', error)
      toast.error(error?.message || 'Failed to submit report')
    }
  }

  // Get current location using browser API
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      )
    })
  }

  // Fetch all reports (for demo purposes)
  const fetchAllReports = async () => {
    if (!contractAddress || !nextReportId) return

    try {
      const reports: PotholeReport[] = []
      const totalCount = Number(nextReportId) - 1

      // Fetch reports one by one (in production, you'd use a better method)
      for (let i = 1; i <= Math.min(totalCount, 10); i++) {
        try {
          // This is a simplified approach - in reality you'd use event logs or subgraph
          // For now, we'll just show placeholder data
        } catch (error) {
          console.error(`Error fetching report ${i}:`, error)
        }
      }

      setUserReports(reports)
    } catch (error) {
      console.error('Error fetching reports:', error)
    }
  }

  // Refresh data after successful transaction
  const refreshData = () => {
    refetchTotalReports()
    fetchAllReports()
  }

  // Auto-refresh after successful transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(refreshData, 2000)
      toast.success('Pothole report submitted successfully! 🎉')
    }
  }, [isSuccess])

  // Fetch reports on component mount
  useEffect(() => {
    if (contractAddress && nextReportId) {
      fetchAllReports()
    }
  }, [contractAddress, nextReportId])

  return {
    // Actions
    submitReport,
    getCurrentLocation,
    refreshData,
    
    // State
    isPending,
    isConfirming,
    isSuccess,
    error,
    
    // Data
    totalReports: totalReports ? Number(totalReports) : 0,
    userReports,
    
    // Utilities
    coordinateToInt,
    intToCoordinate,
  }
}