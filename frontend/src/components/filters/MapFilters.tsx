'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { StatusFilter } from '@/components/filters/StatusFilter'
import { PriorityFilter } from '@/components/filters/PriorityFilter'
import { DateFilter } from '@/components/filters/DateFilter'
import { StatusDistribution } from '@/types/report'

interface MapFiltersProps {
  totalReports: number
  statusDistribution: StatusDistribution
  statusFilter: number | 'all'
  setStatusFilter: (filter: number | 'all') => void
  priorityFilter: 'all' | 'high' | 'medium' | 'low'
  setPriorityFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void
  dateFilter: 'all' | 'today' | 'week' | 'month'
  setDateFilter: (filter: 'all' | 'today' | 'week' | 'month') => void
}

export function MapFilters({
  totalReports,
  statusDistribution,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  dateFilter,
  setDateFilter,
}: MapFiltersProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Status Filter */}
          <StatusFilter
            totalReports={totalReports}
            statusDistribution={statusDistribution}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          {/* Priority Filter */}
          <PriorityFilter
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
          />

          {/* Date Filter */}
          <DateFilter
            dateFilter={dateFilter}
            setDateFilter={setDateFilter}
          />
        </div>
      </CardContent>
    </Card>
  )
}