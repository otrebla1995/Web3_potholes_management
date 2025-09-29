'use client'

import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi'
import { useChainId, useAccount } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'
import { toast } from 'react-hot-toast'
import { parseAbiItem } from 'viem'

export interface PotholeReport {
  id: number
  latitude: bigint
  longitude: bigint
  ipfsHash: string
  duplicateCount: number
  reportedAt: number
  reporter: string
  status: number
  priority: number
}

export type SortOption = 'date-desc' | 'date-asc' | 'priority-desc' | 'priority-asc' | 'duplicates-desc'

export enum PotholeStatus {
  Reported = 0,
  InProgress = 1,
  Completed = 2,
  Rejected = 3
}

export const statusLabels = {
  [PotholeStatus.Reported]: 'Reported',
  [PotholeStatus.InProgress]: 'In Progress',
  [PotholeStatus.Completed]: 'Completed',
  [PotholeStatus.Rejected]: 'Rejected'
}

export const statusColors = {
  [PotholeStatus.Reported]: 'bg-orange-100 text-orange-800 border-orange-200',
  [PotholeStatus.InProgress]: 'bg-blue-100 text-blue-800 border-blue-200',
  [PotholeStatus.Completed]: 'bg-green-100 text-green-800 border-green-200',
  [PotholeStatus.Rejected]: 'bg-red-100 text-red-800 border-red-200'
}

export function useMunicipalActions() {
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const [reports, setReports] = useState<PotholeReport[]>([])
  const [filteredReports, setFilteredReports] = useState<PotholeReport[]>([])
  const [statusFilter, setStatusFilter] = useState<PotholeStatus | 'all'>('all')
  const [isLoadingReports, setIsLoadingReports] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('priority-desc')

  // Write contract hook
  const { writeContract, isPending, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read contract data
  const { data: totalReports, refetch: refetchTotalReports } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'totalReports',
  })

  const { data: nextReportId, refetch: refetchNextReportId } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'nextReportId',
  })

  // Convert coordinates
  const intToCoordinate = (coord: bigint): number => {
    return Number(coord) / 1000000
  }

  // Update pothole status
  const updateStatus = async (reportId: number, newStatus: PotholeStatus, reason?: string) => {
    if (!contractAddress || !address) {
      toast.error('Contract not found or wallet not connected')
      return
    }

    try {
      if (newStatus === PotholeStatus.Rejected && reason) {
        await writeContract({
          address: contractAddress,
          abi: PotholesRegistryABI.abi,
          functionName: 'rejectReport',
          args: [BigInt(reportId), reason],
        })
        toast.success(`Rejecting report #${reportId}...`)
      } else {
        await writeContract({
          address: contractAddress,
          abi: PotholesRegistryABI.abi,
          functionName: 'updateReportStatus',
          args: [BigInt(reportId), newStatus],
        })
        toast.success(`Updating report #${reportId} to ${statusLabels[newStatus]}...`)
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error?.message || 'Failed to update status')
    }
  }

  const markInProgress = async (reportId: number) => {
    await updateStatus(reportId, PotholeStatus.InProgress)
  }

  const markCompleted = async (reportId: number) => {
    await updateStatus(reportId, PotholeStatus.Completed)
  }

  const rejectReport = async (reportId: number, reason: string) => {
    if (!contractAddress || !reason.trim()) return

    try {
      await writeContract({
        address: contractAddress,
        abi: PotholesRegistryABI.abi,
        functionName: 'rejectReport',
        args: [reportId, reason],
      })
    } catch (error: any) {
      console.error('Error rejecting report:', error)
    }
  }

  // Added priority calculation
  const calculatePriority = (report: {
    duplicateCount: number
    reportedAt: number
    status: number
  }): number => {
    let score = 0

    // Duplicates add 30 points each
    score += report.duplicateCount * 30

    // Age adds up to 40 points for old reports
    if (report.status === PotholeStatus.Reported) {
      const daysOld = (Date.now() / 1000 - report.reportedAt) / (60 * 60 * 24)
      score += Math.min(daysOld * 2, 40)
    }

    // Status weights
    if (report.status === PotholeStatus.Reported) score += 50
    if (report.status === PotholeStatus.InProgress) score += 30

    return Math.round(score)
  }

  // Added sorting function
  const sortReports = (reportsToSort: PotholeReport[]): PotholeReport[] => {
    const sorted = [...reportsToSort]

    switch (sortOption) {
      case 'date-desc': return sorted.sort((a, b) => b.reportedAt - a.reportedAt)
      case 'date-asc': return sorted.sort((a, b) => a.reportedAt - b.reportedAt)
      case 'priority-desc': return sorted.sort((a, b) => b.priority - a.priority)
      case 'priority-asc': return sorted.sort((a, b) => a.priority - b.priority)
      case 'duplicates-desc': return sorted.sort((a, b) => b.duplicateCount - a.duplicateCount)
      default: return sorted
    }
  }

  // OPTIMIZED: Fetch reports using events
  const fetchAllReportsViaEvents = async () => {
    if (!publicClient || !contractAddress) return

    setIsLoadingReports(true)

    try {
      // Step 1: Get all PotholeReported events
      const reportedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      console.log(`📋 Found ${reportedEvents.length} PotholeReported events`)

      // Step 2: Get all status update events
      const statusUpdateEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event PotholeStatusUpdated(uint256 indexed reportId, uint8 oldStatus, uint8 newStatus, address indexed updatedBy)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      console.log(`📋 Found ${statusUpdateEvents.length} status update events`)

      // Step 3: Build status map (reportId -> latest status)
      const statusMap = new Map<number, number>()
      statusUpdateEvents.forEach(log => {
        const reportId = Number(log.args.reportId)
        const newStatus = Number(log.args.newStatus)
        statusMap.set(reportId, newStatus)
      })

      // Step 4: Get duplicate events for counts
      const duplicateEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event DuplicateReported(uint256 indexed originalReportId, address indexed duplicateReporter, uint256 newDuplicateCount, int256 latitude, int256 longitude, string ipfsHash)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      const duplicateCountMap = new Map<number, number>()
      duplicateEvents.forEach(log => {
        const reportId = Number(log.args.originalReportId)
        const count = Number(log.args.newDuplicateCount)

        // Only update if this count is higher than what we have
        const currentCount = duplicateCountMap.get(reportId) ?? 0
        if (count > currentCount) {
          duplicateCountMap.set(reportId, count)
        }
      })

      // Step 5: Build reports from events
      const fetchedReports: PotholeReport[] = []

      for (const log of reportedEvents) {
        const reportId = Number(log.args.reportId)
        const reporter = log.args.reporter as string
        const latitude = log.args.latitude as bigint
        const longitude = log.args.longitude as bigint
        const ipfsHash = log.args.ipfsHash as string

        // Get block info for timestamp
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
        const reportedAt = Number(block.timestamp)

        // Get current status (default to Reported if never updated)
        const status = statusMap.get(reportId) ?? PotholeStatus.Reported

        // Get duplicate count
        const duplicateCount = duplicateCountMap.get(reportId) ?? 0

        const report = {
          id: reportId,
          reporter,
          ipfsHash,
          duplicateCount,
          latitude,
          longitude,
          reportedAt,
          status,
          priority: 0 // Placeholder, will calculate next
        }

        // Calculate priority
        report.priority = calculatePriority(report)

        fetchedReports.push(report)
      }

      console.log(`Successfully fetched ${fetchedReports.length} reports via events`)

      // Sort by newest first
      // const sortedReports = fetchedReports.sort((a, b) => b.reportedAt - a.reportedAt)
      setReports(fetchedReports)

    } catch (error) {
      console.error('Error fetching reports via events:', error)
      toast.error('Failed to fetch reports')
    } finally {
      setIsLoadingReports(false)
    }
  }

  // Filter and sort reports
  useEffect(() => {
    let filtered = reports

    if (statusFilter !== 'all') {
      filtered = reports.filter(report => report.status === statusFilter)
    }

    const sorted = sortReports(filtered)
    setFilteredReports(sorted)

  }, [reports, statusFilter, sortOption])

  // Refresh data
  const refreshData = () => {
    refetchTotalReports()
    refetchNextReportId()
    fetchAllReportsViaEvents()
  }

  // Auto-refresh after transaction
  useEffect(() => {
    if (isSuccess) {
      setTimeout(refreshData, 2000)
      toast.success('Status updated successfully! 🎉')
    }
  }, [isSuccess])

  // Initial fetch
  useEffect(() => {
    if (publicClient && contractAddress) {
      fetchAllReportsViaEvents()
    }
  }, [publicClient, contractAddress])

  // Status distribution
  const getStatusDistribution = () => {
    return {
      reported: reports.filter(r => r.status === PotholeStatus.Reported).length,
      inProgress: reports.filter(r => r.status === PotholeStatus.InProgress).length,
      completed: reports.filter(r => r.status === PotholeStatus.Completed).length,
      rejected: reports.filter(r => r.status === PotholeStatus.Rejected).length,
    }
  }

  return {
    // Actions
    markInProgress,
    markCompleted,
    rejectReport,
    refreshData,

    // State
    isPending,
    isConfirming,
    isSuccess,
    isLoadingReports,

    // Sorting
    sortOption,
    setSortOption,

    // Data
    reports: filteredReports,
    allReports: reports,
    totalReports: totalReports ? Number(totalReports) : 0,
    statusFilter,
    setStatusFilter,
    statusDistribution: getStatusDistribution(),

    // Utilities
    intToCoordinate,
  }
}