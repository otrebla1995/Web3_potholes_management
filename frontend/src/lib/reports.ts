import { parseAbiItem, PublicClient } from 'viem'
import { PotholeReport } from '@/types/report'
import { OverpassResult } from './overpass'

export function calculatePriority(
  report: {
    duplicateCount: number
    reportedAt: number
    status: number
  },
  locationData?: OverpassResult
): number {
  let score = 0

  // Base score: Status and age
  if (report.status === 0) score += 50 // Reported (not yet addressed)
  if (report.status === 1) score += 30 // In progress

  // Age factor: Older reports are more urgent
  if (report.status === 0) {
    const daysOld = (Date.now() / 1000 - report.reportedAt) / (60 * 60 * 24)
    score += Math.min(daysOld * 2, 40) // Max 40 points for age (20 days)
  }

  // Duplicate reports: Strong indicator of severity
  score += report.duplicateCount * 30

  // If location data is available, add contextual factors
  if (locationData) {
    // Road type: Higher classification = higher priority
    if (locationData.roadType) {
      const roadPriority: Record<string, number> = {
        motorway: 20,
        trunk: 18,
        primary: 16,
        secondary: 14,
        tertiary: 12,
        residential: 8,
        service: 4,
        unclassified: 6,
      }
      score += roadPriority[locationData.roadType] || 8
    }

    // Speed limit: Higher speed = more dangerous
    if (locationData.maxSpeed) {
      const speed = parseInt(locationData.maxSpeed)
      if (!isNaN(speed)) {
        if (speed >= 90) score += 15
        else if (speed >= 70) score += 12
        else if (speed >= 50) score += 9
        else if (speed >= 30) score += 6
        else score += 3
      }
    }

    // Number of lanes: More lanes = higher traffic volume
    if (locationData.lanes) {
      const lanes = parseInt(locationData.lanes)
      if (!isNaN(lanes)) {
        score += Math.min(lanes * 3, 12) // Max 12 points for 4+ lanes
      }
    }

    // Surface material: Poor surface = higher urgency
    if (locationData.surface) {
      const surfacePriority: Record<string, number> = {
        asphalt: 8,
        concrete: 6,
        paved: 7,
        cobblestone: 4,
        compacted: 3,
        gravel: 2,
        unpaved: 1,
        dirt: 1,
      }
      score += surfacePriority[locationData.surface] || 5
    }

    // Lighting: Poor lighting = higher danger at night
    if (locationData.lighting) {
      if (locationData.lighting === 'no') score += 8
      else if (locationData.lighting === 'limited') score += 5
      else if (locationData.lighting === 'yes') score += 2
    }

    // Nearby public transport: More users affected
    if (locationData.publicTransport && locationData.publicTransport.length > 0) {
      // Count only transport within 50m
      const nearbyTransport = locationData.publicTransport.filter(t => !t.distance || t.distance <= 50)
      score += Math.min(nearbyTransport.length * 8, 24) // Max 24 points for 3+ stops
    }

    // Nearby important buildings: Schools, hospitals, etc.
    if (locationData.buildings && locationData.buildings.length > 0) {
      const criticalBuildings = locationData.buildings.filter(b => {
        // Only count buildings within 100m
        if (b.distance && b.distance > 100) return false

        // Critical amenities get higher weight
        const criticalTypes = [
          'school', 'hospital', 'clinic', 'kindergarten', 'university',
          'fire_station', 'police', 'townhall', 'community_centre'
        ]
        return criticalTypes.includes(b.type)
      })

      const otherBuildings = locationData.buildings.filter(b => {
        if (b.distance && b.distance > 100) return false
        const criticalTypes = [
          'school', 'hospital', 'clinic', 'kindergarten', 'university',
          'fire_station', 'police', 'townhall', 'community_centre'
        ]
        return !criticalTypes.includes(b.type)
      })

      score += Math.min(criticalBuildings.length * 10, 30) // Max 30 points for critical
      score += Math.min(otherBuildings.length * 4, 12) // Max 12 points for others
    }
  }

  return Math.round(score)
}

// Algorithm explanation:
//
// The priority score is calculated using multiple weighted factors:
//
// 1. BASE FACTORS (max ~120 points without location data):
//    - Status: Reported = 50pts, In Progress = 30pts
//    - Age: +2pts per day for unaddressed reports (max 40pts after 20 days)
//    - Duplicates: +30pts per duplicate report (validates severity)
//
// 2. ROAD CHARACTERISTICS (max ~55 points):
//    - Road type: motorway(20) > trunk(18) > primary(16) > secondary(14) > tertiary(12) > residential(8)
//    - Speed limit: 90+km/h(15) > 70+km/h(12) > 50+km/h(9) > 30+km/h(6) > lower(3)
//    - Lanes: +3pts per lane (max 12pts for 4+ lanes, indicates traffic volume)
//    - Surface: asphalt(8) > paved(7) > concrete(6) > others (harder surfaces = more dangerous holes)
//    - Lighting: no lighting(8) > limited(5) > good(2) (poor lighting increases night danger)
//
// 3. PROXIMITY TO INFRASTRUCTURE (max ~66 points):
//    - Public transport (<50m): +8pts per stop (max 24pts, indicates high pedestrian/cyclist traffic)
//    - Critical buildings (<100m): +10pts each for schools/hospitals/etc (max 30pts, vulnerable populations)
//    - Other buildings (<100m): +4pts each (max 12pts, general foot traffic)
//
// Total possible range: 0-241 points (typical range: 50-180)
// The score helps municipal authorities prioritize repairs based on:
// - Safety risk (speed, road type, lighting)
// - Impact scope (traffic volume, nearby facilities, affected users)
// - Urgency (age, community validation via duplicates)

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

  // 2b) All rejections to get reasons
  const rejectionEvents = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event PotholeRejected(uint256 indexed reportId, address indexed rejectedBy, string reason)'),
    fromBlock: BigInt(0),
    toBlock: 'latest'
  })
  const rejectionReasonMap = new Map<number, string>()
  rejectionEvents.forEach(log => {
    rejectionReasonMap.set(Number(log.args.reportId), String(log.args.reason))
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
    const duplicateCount = duplicateCountMap.get(reportId) ?? 0

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
      rejectionReason: rejectionReasonMap.get(reportId),
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
  gridPrecision: number
) {
  const reportedEvents = await publicClient.getLogs({
    address: contractAddress,
    event: parseAbiItem('event PotholeReported(uint256 indexed reportId, address indexed reporter, int256 latitude, int256 longitude, string ipfsHash)'),
    fromBlock: BigInt(0),
    toBlock: 'latest'
  })

  const precision = gridPrecision || 1000
  const gridLat = Number(latInt) / precision
  const gridLng = Number(lngInt) / precision

  const match = reportedEvents.find(log => {
    const rLat = Number(log.args.latitude) / precision
    const rLng = Number(log.args.longitude) / precision
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
