'use client'

import { Filter } from 'lucide-react'
import { StatusDistribution } from '@/types/report'

interface StatusFilterProps {
  totalReports: number
  statusDistribution: StatusDistribution
  statusFilter: number | 'all'
  setStatusFilter: (filter: number | 'all') => void
}

export function StatusFilter({
  totalReports,
  statusDistribution,
  statusFilter,
  setStatusFilter,
}: StatusFilterProps) {
  const statusOptions = [
    { 
      key: 'all', 
      label: `All (${totalReports})`, 
      color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
    },
    { 
      key: 0, 
      label: `Reported (${statusDistribution.reported})`, 
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
    },
    { 
      key: 1, 
      label: `In Progress (${statusDistribution.inProgress})`, 
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
    },
    { 
      key: 2, 
      label: `Completed (${statusDistribution.completed})`, 
      color: 'bg-green-100 text-green-700 hover:bg-green-200' 
    },
    { 
      key: 3, 
      label: `Rejected (${statusDistribution.rejected})`, 
      color: 'bg-red-100 text-red-700 hover:bg-red-200' 
    },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Status Filter
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((option) => {
          const isActive = statusFilter === option.key
          return (
            <button
              key={option.key}
              onClick={() => setStatusFilter(option.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'ring-2 ring-offset-2 ring-blue-500 ' + option.color
                  : option.color
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}