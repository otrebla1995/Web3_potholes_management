// Shared type definitions for reports

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
  // Present only if the report was rejected and we captured the reason from events
  rejectionReason?: string
}

export interface StatusDistribution {
  reported: number
  inProgress: number
  completed: number
  rejected: number
}

export type StatusFilter = number | 'all'
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low'
export type DateFilter = 'all' | 'today' | 'week' | 'month'

export interface MapFiltersState {
  statusFilter: StatusFilter
  priorityFilter: PriorityFilter
  dateFilter: DateFilter
}

export enum ReportStatus {
  Reported = 0,
  InProgress = 1,
  Completed = 2,
  Rejected = 3
}