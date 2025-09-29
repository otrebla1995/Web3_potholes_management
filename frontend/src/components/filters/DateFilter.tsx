'use client'

import { Calendar } from 'lucide-react'

interface DateFilterProps {
  dateFilter: 'all' | 'today' | 'week' | 'month'
  setDateFilter: (filter: 'all' | 'today' | 'week' | 'month') => void
}

export function DateFilter({
  dateFilter,
  setDateFilter,
}: DateFilterProps) {
  const dateOptions = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'month', label: 'Last 30 Days' },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Time Period
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {dateOptions.map((option) => {
          const isActive = dateFilter === option.key
          return (
            <button
              key={option.key}
              onClick={() => setDateFilter(option.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? 'ring-2 ring-offset-2 ring-blue-500 bg-purple-100 text-purple-700'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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