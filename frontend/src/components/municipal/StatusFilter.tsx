'use client'

import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  PotholeStatus, 
  statusLabels, 
  statusColors 
} from '@/hooks/useMunicipalActions'
import { MapPin, Play, CheckCircle, XCircle, List } from 'lucide-react'

interface StatusFilterProps {
  activeFilter: PotholeStatus | 'all'
  onFilterChange: (filter: PotholeStatus | 'all') => void
  statusDistribution: {
    reported: number
    inProgress: number
    completed: number
    rejected: number
  }
  totalReports: number
}

export function StatusFilter({ 
  activeFilter, 
  onFilterChange, 
  statusDistribution, 
  totalReports 
}: StatusFilterProps) {
  const filterOptions = [
    { 
      key: 'all' as const, 
      label: 'All Reports', 
      count: totalReports, 
      icon: List,
      color: 'bg-slate-100 text-slate-800 border-slate-200'
    },
    { 
      key: PotholeStatus.Reported, 
      label: statusLabels[PotholeStatus.Reported], 
      count: statusDistribution.reported, 
      icon: MapPin,
      color: statusColors[PotholeStatus.Reported]
    },
    { 
      key: PotholeStatus.InProgress, 
      label: statusLabels[PotholeStatus.InProgress], 
      count: statusDistribution.inProgress, 
      icon: Play,
      color: statusColors[PotholeStatus.InProgress]
    },
    { 
      key: PotholeStatus.Completed, 
      label: statusLabels[PotholeStatus.Completed], 
      count: statusDistribution.completed, 
      icon: CheckCircle,
      color: statusColors[PotholeStatus.Completed]
    },
    { 
      key: PotholeStatus.Rejected, 
      label: statusLabels[PotholeStatus.Rejected], 
      count: statusDistribution.rejected, 
      icon: XCircle,
      color: statusColors[PotholeStatus.Rejected]
    }
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => {
        const Icon = option.icon
        const isActive = activeFilter === option.key

        return (
          <Button
            key={option.key}
            variant={isActive ? "default" : "outline"}
            onClick={() => onFilterChange(option.key)}
            className={`flex items-center space-x-2 ${
              isActive ? '' : 'hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{option.label}</span>
            <Badge 
              className={`${option.color} ml-1`}
              variant="outline"
            >
              {option.count}
            </Badge>
          </Button>
        )
      })}
    </div>
  )
}