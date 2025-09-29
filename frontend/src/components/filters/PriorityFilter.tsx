'use client'

import { Filter } from 'lucide-react'

interface PriorityFilterProps {
  priorityFilter: 'all' | 'high' | 'medium' | 'low'
  setPriorityFilter: (filter: 'all' | 'high' | 'medium' | 'low') => void
}

export function PriorityFilter({
  priorityFilter,
  setPriorityFilter,
}: PriorityFilterProps) {
  const priorityOptions = [
    { 
      key: 'all', 
      label: 'All Priorities', 
      color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
    },
    { 
      key: 'high', 
      label: 'High (≥90)', 
      color: 'bg-red-100 text-red-700 hover:bg-red-200' 
    },
    { 
      key: 'medium', 
      label: 'Medium (70-89)', 
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
    },
    { 
      key: 'low', 
      label: 'Low (<70)', 
      color: 'bg-green-100 text-green-700 hover:bg-green-200' 
    },
  ]

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Priority Level
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {priorityOptions.map((option) => {
          const isActive = priorityFilter === option.key
          return (
            <button
              key={option.key}
              onClick={() => setPriorityFilter(option.key as any)}
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