'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi'
import { useChainId, useAccount } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'
import { toast } from 'react-hot-toast'
import { parseAbiItem } from 'viem'
import { useCity } from '@/hooks/useCity'

export interface PotholeReport {
  id: number
  latitude: bigint
  longitude: bigint
  ipfsHash: string
  duplicateCount: number
  reportedAt: number
  reporter: string
  status: number
}

export function useCitizenActions() {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const [userReports, setUserReports] = useState<PotholeReport[]>([])
  const [duplicateReports, setDuplicateReports] = useState<PotholeReport[]>([])
  const { gridPrecision } = useCity()

  // Write contract hook
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

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

  // Convert coordinates
  const coordinateToInt = (coord: number): bigint => {
    return BigInt(Math.round(coord * 1000000))
  }

  const intToCoordinate = (coord: bigint): number => {
    return Number(coord) / 1000000
  }

  // Check if user has already reported at this location
  const hasUserReportedAtLocation = (latitude: number, longitude: number): boolean => {
    const latInt = coordinateToInt(latitude)
    const lngInt = coordinateToInt(longitude)

    return userReports.some(report => {

      // check the grid cell is the same
      const precision = BigInt(gridPrecision ?? 1000) // fallback to 0.001 degrees ~ 100m in microdegrees
      const latCell = latInt / precision
      const lngCell = lngInt / precision
      const reportLatCell = report.latitude / precision
      const reportLngCell = report.longitude / precision

      if (latCell === reportLatCell && lngCell === reportLngCell) {
        return true
      }

      return false
    })
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
      const latInt = coordinateToInt(latitude)
      const lngInt = coordinateToInt(longitude)
      const ipfsHash = `description:${description}`

      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'submitReport',
        args: [latInt, lngInt, ipfsHash]
      })

      toast.success('Submitting pothole report...')
    } catch (error: any) {
      console.error('Error submitting report:', error)
      toast.error(error?.message || 'Failed to submit report')
    }
  }

  // Get current location
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

  // Fetch user's original reports AND duplicates
  const fetchUserReports = async () => {
    if (!publicClient || !contractAddress || !address) return

    try {
      console.log('⚡ Fetching user reports and duplicates...')

      // 1. Get original reports where user is the reporter
      const reportedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
        args: {
          reporter: address
        },
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      console.log(`📋 Found ${reportedEvents.length} original reports by user`)

      // 2. Get duplicate reports where user is the duplicate reporter
      const duplicateEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event DuplicateReported(uint256 indexed originalReportId, address indexed duplicateReporter, uint256 newDuplicateCount, int256 latitude, int256 longitude, string ipfsHash)'),
        args: {
          duplicateReporter: address
        },
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      console.log(`📋 Found ${duplicateEvents.length} duplicate reports by user`)

      // 3. Get all report IDs (both original and duplicates)
      const originalReportIds = reportedEvents.map(log => Number(log.args.reportId))
      const duplicateReportIds = duplicateEvents.map(log => Number(log.args.originalReportId))
      const allReportIds = [...new Set([...originalReportIds, ...duplicateReportIds])]

      // 4. Get status updates for all reports
      const statusUpdateEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event PotholeStatusUpdated(uint256 indexed reportId, uint8 oldStatus, uint8 newStatus, address indexed updatedBy)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      const statusMap = new Map<number, number>()
      statusUpdateEvents.forEach(log => {
        const reportId = Number(log.args.reportId)
        if (allReportIds.includes(reportId)) {
          statusMap.set(reportId, Number(log.args.newStatus))
        }
      })

      // 5. Get ALL duplicate events to build duplicate count map
      const allDuplicateEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event DuplicateReported(uint256 indexed originalReportId, address indexed duplicateReporter, uint256 newDuplicateCount, int256 latitude, int256 longitude, string ipfsHash)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      const duplicateCountMap = new Map<number, number>()
      allDuplicateEvents.forEach(log => {
        const reportId = Number(log.args.originalReportId)
        const count = Number(log.args.newDuplicateCount)
        
        const currentCount = duplicateCountMap.get(reportId) ?? 0
        if (count > currentCount) {
          duplicateCountMap.set(reportId, count)
        }
      })

      // 6. Build original reports
      const originalReports: PotholeReport[] = []
      for (const log of reportedEvents) {
        const reportId = Number(log.args.reportId)
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })

        originalReports.push({
          id: reportId,
          latitude: log.args.latitude as bigint,
          longitude: log.args.longitude as bigint,
          ipfsHash: log.args.ipfsHash as string,
          duplicateCount: duplicateCountMap.get(reportId) ?? 1,
          reportedAt: Number(block.timestamp),
          reporter: log.args.reporter as string,
          status: statusMap.get(reportId) ?? 0
        })
      }

      // 7. Build duplicate reports (with full report data)
      const duplicates: PotholeReport[] = []
      for (const log of duplicateEvents) {
        const reportId = Number(log.args.originalReportId)
        
        // Get the original report block for timestamp
        const originalReportEvent = await publicClient.getLogs({
          address: contractAddress,
          event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
          args: {
            reportId: BigInt(reportId)
          },
          fromBlock: BigInt(0),
          toBlock: 'latest'
        })

        if (originalReportEvent.length > 0) {
          const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
          
          duplicates.push({
            id: reportId,
            latitude: log.args.latitude as bigint,
            longitude: log.args.longitude as bigint,
            ipfsHash: log.args.ipfsHash as string,
            duplicateCount: duplicateCountMap.get(reportId) ?? 1,
            reportedAt: Number(block.timestamp), // When user reported the duplicate
            reporter: originalReportEvent[0].args.reporter as string, // Original reporter
            status: statusMap.get(reportId) ?? 0
          })
        }
      }

      setUserReports(originalReports.sort((a, b) => b.reportedAt - a.reportedAt))
      setDuplicateReports(duplicates.sort((a, b) => b.reportedAt - a.reportedAt))
      
      console.log(`✅ Fetched ${originalReports.length} original + ${duplicates.length} duplicate reports`)

    } catch (error) {
      console.error('Error fetching user reports:', error)
      toast.error('Failed to fetch reports')
    }
  }
  
  // Refresh data
  const refreshData = () => {
    refetchTotalReports()
    fetchUserReports()
  }

  // Auto-refresh after successful transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(refreshData, 2000)
      toast.success('Pothole report submitted successfully! 🎉')
    }
  }, [isSuccess])

  // Initial fetch
  useEffect(() => {
    if (publicClient && contractAddress && address) {
      fetchUserReports()
    }
  }, [publicClient, contractAddress, address])

  return {
    // Actions
    submitReport,
    getCurrentLocation,
    refreshData,

    // Validation
    hasUserReportedAtLocation,

    // State
    isPending,
    isConfirming,
    isSuccess,

    // Data
    totalReports: totalReports ? Number(totalReports) : 0,
    userReports,
    duplicateReports,

    // Utilities
    coordinateToInt,
    intToCoordinate,
  }
}