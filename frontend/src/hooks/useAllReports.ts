import { useState, useEffect } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import { parseAbiItem } from 'viem'
import { PotholeReport } from '@/types/report'

export function useAllReports() {
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const [allReports, setAllReports] = useState<PotholeReport[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Convert coordinates
  const intToCoordinate = (coord: bigint): bigint => {
    return coord
  }

  // Calculate priority
  const calculatePriority = (report: {
    duplicateCount: number
    reportedAt: number
    status: number
  }): number => {
    let score = 0

    // Duplicates add 30 points each
    score += report.duplicateCount * 30

    // Age adds up to 40 points for old reports
    if (report.status === 0) { // Reported
      const daysOld = (Date.now() / 1000 - report.reportedAt) / (60 * 60 * 24)
      score += Math.min(daysOld * 2, 40)
    }

    // Status weights
    if (report.status === 0) score += 50 // Reported
    if (report.status === 1) score += 30 // In Progress

    return Math.round(score)
  }

  const fetchAllReports = async () => {
    if (!publicClient || !contractAddress) return

    setIsLoading(true)

    try {
      console.log('⚡ Fetching all reports via events...')

      // Step 1: Get all PotholeReported events
      const reportedEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      console.log(`📋 Found ${reportedEvents.length} reported events`)

      // Step 2: Get all status updates
      const statusUpdateEvents = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event PotholeStatusUpdated(uint256 indexed reportId, uint8 oldStatus, uint8 newStatus, address indexed updatedBy)'),
        fromBlock: BigInt(0),
        toBlock: 'latest'
      })

      const statusMap = new Map<number, number>()
      statusUpdateEvents.forEach(log => {
        statusMap.set(Number(log.args.reportId), Number(log.args.newStatus))
      })

      // Step 3: Get all duplicate events to build duplicate count
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
        
        const currentCount = duplicateCountMap.get(reportId) ?? 0
        if (count > currentCount) {
          duplicateCountMap.set(reportId, count)
        }
      })

      // Step 4: Process all reports
      const fetchedReports: PotholeReport[] = []

      for (const log of reportedEvents) {
        const reportId = Number(log.args.reportId)
        const reporter = log.args.reporter
        const latitude = log.args.latitude
        const longitude = log.args.longitude
        const ipfsHash = log.args.ipfsHash

        // Get block to extract timestamp
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
        const reportedAt = Number(block.timestamp)

        // Get current status (default to Reported if no updates)
        const status = statusMap.get(reportId) ?? 0

        // Get duplicate count
        const duplicateCount = duplicateCountMap.get(reportId) ?? 1

        const report: PotholeReport = {
          id: reportId,
          reporter: reporter!,
          ipfsHash: ipfsHash!,
          duplicateCount,
          latitude: intToCoordinate(latitude!),
          longitude: intToCoordinate(longitude!),
          reportedAt,
          status,
          priority: 0 // Placeholder
        }

        // Calculate priority
        report.priority = calculatePriority(report)

        fetchedReports.push(report)
      }

      console.log(`✅ Successfully fetched ${fetchedReports.length} reports`)

      setAllReports(fetchedReports)

    } catch (error) {
      console.error('❌ Error fetching all reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (publicClient && contractAddress) {
      fetchAllReports()
    }
  }, [publicClient, contractAddress])

  return {
    allReports,
    isLoading,
    refreshAllReports: fetchAllReports,
  }
}