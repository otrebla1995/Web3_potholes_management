'use client'

import { useState, useEffect } from 'react'
import { Search, X, MapPin } from 'lucide-react'
import { PotholeReport } from '@/types/report'

interface ReportSearchBarProps {
  reports: PotholeReport[]
  onReportSelect: (report: PotholeReport | null) => void
  placeholder?: string
}

export function ReportSearchBar({
  reports,
  onReportSelect,
  placeholder = "Search by Report ID..."
}: ReportSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredReports, setFilteredReports] = useState<PotholeReport[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (searchQuery.trim()) {
      // Remove # from search query for filtering
      const cleanQuery = searchQuery.replace('#', '')
      const filtered = reports.filter(report =>
        report.id.toString().includes(cleanQuery)
      )
      setFilteredReports(filtered.slice(0, 5)) // Show max 5 results
      setShowDropdown(true)
    } else {
      setFilteredReports([])
      setShowDropdown(false)
    }
  }, [searchQuery, reports])

  const handleSelectReport = (report: PotholeReport) => {
    setSearchQuery(`#${report.id}`)
    setShowDropdown(false)
    onReportSelect(report)
  }

  const handleClear = () => {
    setSearchQuery('')
    setShowDropdown(false)
    onReportSelect(null)
  }

  // Clear selection when reports prop changes (e.g., tab change)
  useEffect(() => {
    handleClear()
  }, [reports])

  const getStatusColor = (status: number) => {
    const colors = {
      0: 'bg-orange-100 text-orange-700',
      1: 'bg-blue-100 text-blue-700',
      2: 'bg-green-100 text-green-700',
      3: 'bg-red-100 text-red-700',
    }
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700'
  }

  const getStatusLabel = (status: number) => {
    const labels = {
      0: 'Reported',
      1: 'In Progress',
      2: 'Completed',
      3: 'Rejected',
    }
    return labels[status as keyof typeof labels] || 'Unknown'
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowDropdown(true)}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && filteredReports.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200 max-h-80 overflow-y-auto">
          <div className="py-2">
            {filteredReports.map((report) => (
              <button
                key={report.id}
                onClick={() => handleSelectReport(report)}
                className="w-full px-4 py-3 hover:bg-slate-50 flex items-start space-x-3 transition-colors text-left"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-slate-900">Report #{report.id}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                      {getStatusLabel(report.status)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5">
                    <div>
                      Priority: <span className="font-medium">{report.priority}</span> | 
                      Duplicates: <span className="font-medium">{report.duplicateCount}</span>
                    </div>
                    <div>
                      {new Date(report.reportedAt * 1000).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {showDropdown && searchQuery && filteredReports.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-slate-200">
          <div className="px-4 py-6 text-center text-sm text-slate-500">
            No reports found with ID "{searchQuery}"
          </div>
        </div>
      )}
    </div>
  )
}