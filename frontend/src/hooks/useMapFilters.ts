import { useState, useMemo } from 'react'
import { PotholeReport, StatusFilter, PriorityFilter, DateFilter } from '@/types/report'

interface UseMapFiltersProps {
  reports: PotholeReport[]
}

interface UseMapFiltersReturn {
  statusFilter: StatusFilter
  setStatusFilter: (filter: StatusFilter) => void
  priorityFilter: PriorityFilter
  setPriorityFilter: (filter: PriorityFilter) => void
  dateFilter: DateFilter
  setDateFilter: (filter: DateFilter) => void
  filteredReports: PotholeReport[]
}

export function useMapFilters({
  reports
}: UseMapFiltersProps): UseMapFiltersReturn {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  const filteredReports = useMemo(() => {
    let filtered = reports

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter === 'high') {
      filtered = filtered.filter(r => r.priority >= 90)
    } else if (priorityFilter === 'medium') {
      filtered = filtered.filter(r => r.priority >= 70 && r.priority < 90)
    } else if (priorityFilter === 'low') {
      filtered = filtered.filter(r => r.priority < 70)
    }

    // Apply date filter
    const now = Date.now() / 1000
    if (dateFilter === 'today') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      filtered = filtered.filter(r => r.reportedAt >= startOfDay.getTime() / 1000)
    } else if (dateFilter === 'week') {
      filtered = filtered.filter(r => r.reportedAt >= now - 7 * 24 * 60 * 60)
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(r => r.reportedAt >= now - 30 * 24 * 60 * 60)
    }

    return filtered
  }, [reports, statusFilter, priorityFilter, dateFilter])

  return {
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    dateFilter,
    setDateFilter,
    filteredReports,
  }
}