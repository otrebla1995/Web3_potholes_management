import { parseAbiItem, PublicClient } from 'viem'
import { PotholeReport } from '@/types/report'

export function calculatePriority(report: {
  duplicateCount: number
  reportedAt: number
  status: number
}): number {
  let score = 0
  score += report.duplicateCount * 30
  if (report.status === 0) {
    const daysOld = (Date.now() / 1000 - report.reportedAt) / (60 * 60 * 24)
    score += Math.min(daysOld * 2, 40)
  }
  if (report.status === 0) score += 50
  if (report.status === 1) score += 30
  return Math.round(score)
}

export async function getAllReportsFromEvents(
  publicClient: PublicClient,
  contractAddress: `0x${string}`
): Promise<PotholeReport[]> {
  // 1) All PotholeReported
  const reportedEvents = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
    fromBlock: BigInt(0),
    toBlock: 'latest'
  })

  // 2) All status updates
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

  // 3) All duplicates
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
    const current = duplicateCountMap.get(reportId) ?? 0
    if (count > current) duplicateCountMap.set(reportId, count)
  })

  // 4) Build reports
  const fetchedReports: PotholeReport[] = []
  for (const log of reportedEvents) {
    const reportId = Number(log.args.reportId)
    const reporter = log.args.reporter!
    const latitude = log.args.latitude!
    const longitude = log.args.longitude!
    const ipfsHash = log.args.ipfsHash!

    const block = await publicClient.getBlock({ blockNumber: log.blockNumber })
    const reportedAt = Number(block.timestamp)
    const status = statusMap.get(reportId) ?? 0
    const duplicateCount = duplicateCountMap.get(reportId) ?? 1

    const report: PotholeReport = {
      id: reportId,
      reporter,
      ipfsHash,
      duplicateCount,
      latitude,
      longitude,
      reportedAt,
      status,
      priority: 0,
    }
    report.priority = calculatePriority(report)
    fetchedReports.push(report)
  }

  return fetchedReports
}

export async function getReportAtLocation(
  publicClient: PublicClient,
  contractAddress: `0x${string}`,
  latInt: bigint,
  lngInt: bigint,
  gridPrecision = process.env.NEXT_PUBLIC_GRID_PRECISION ? parseInt(process.env.NEXT_PUBLIC_GRID_PRECISION) : 1000
) {
  const reportedEvents = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
    fromBlock: BigInt(0),
    toBlock: 'latest'
  })

  const gridLat = Number(latInt) / gridPrecision
  const gridLng = Number(lngInt) / gridPrecision

  const match = reportedEvents.find(log => {
    const rLat = Number(log.args.latitude) / gridPrecision
    const rLng = Number(log.args.longitude) / gridPrecision
    return Math.floor(rLat) === Math.floor(gridLat) && Math.floor(rLng) === Math.floor(gridLng)
  })

  if (!match) return null

  const reportId = Number(match.args.reportId)
  const statusEvents = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event PotholeStatusUpdated(uint256 indexed reportId, uint8 oldStatus, uint8 newStatus, address indexed updatedBy)'),
    args: { reportId: BigInt(reportId) },
    fromBlock: BigInt(0),
    toBlock: 'latest'
  })

  const latestStatus = statusEvents.length > 0
    ? Number(statusEvents[statusEvents.length - 1].args.newStatus)
    : 0

  return { reportId, latestStatus }
}
