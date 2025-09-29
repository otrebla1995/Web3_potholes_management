'use client'

import { ArrowUpDown, TrendingUp, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export type SortOption = 'date-desc' | 'date-asc' | 'priority-desc' | 'priority-asc' | 'duplicates-desc'

interface SortControlsProps {
  activeSortOption: SortOption
  onSortChange: (option: SortOption) => void
  className?: string
}

const sortOptions = [
  {
    value: 'priority-desc' as const,
    label: 'Priority: High to Low',
    icon: TrendingUp,
    description: 'Most urgent first'
  },
  {
    value: 'priority-asc' as const,
    label: 'Priority: Low to High',
    icon: TrendingUp,
    description: 'Least urgent first'
  },
  {
    value: 'date-desc' as const,
    label: 'Date: Newest First',
    icon: Calendar,
    description: 'Recent reports first'
  },
  {
    value: 'date-asc' as const,
    label: 'Date: Oldest First',
    icon: Calendar,
    description: 'Older reports first'
  },
  {
    value: 'duplicates-desc' as const,
    label: 'Most Duplicates',
    icon: Users,
    description: 'Community priority'
  },
]

export function SortControls({ activeSortOption, onSortChange, className = '' }: SortControlsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <ArrowUpDown className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Sort Reports By</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {sortOptions.map((option) => {
          const Icon = option.icon
          const isActive = activeSortOption === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`
                flex flex-col items-start p-4 rounded-lg border-2 transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 border-blue-500 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }
              `}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-600'}`} />
                <span className={`text-sm font-semibold ${isActive ? 'text-blue-900' : 'text-slate-900'}`}>
                  {option.label}
                </span>
              </div>
              <span className={`text-xs ${isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                {option.description}
              </span>
            </button>
          )
        })}
      </div>

      {/* Mobile dropdown alternative */}
      <div className="md:hidden">
        <select
          value={activeSortOption}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} - {option.description}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}