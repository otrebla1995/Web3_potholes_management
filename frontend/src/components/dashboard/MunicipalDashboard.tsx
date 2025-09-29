'use client'

import { useState, Suspense, lazy } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building2, RefreshCw, BarChart3, Activity, AlertTriangle, MapPin, ArrowUpDown, Map } from 'lucide-react'
import { useMunicipalActions } from '@/hooks/useMunicipalActions'
import { useMapFilters } from '@/hooks/useMapFilters'
import { ReportsTable } from '@/components/municipal/ReportsTable'
import { MapFilters } from '@/components/filters/MapFilters'
import { ReportSearchBar } from '../filters/ReportSearchBar'
import { PotholeReport } from '@/types/report'
import { useCity } from '@/hooks/useCity'

// Lazy load the map component
const ReportsMap = lazy(() => import('@/components/map/ReportsMap').then(mod => ({ default: mod.ReportsMap })))

type ActiveTab = 'overview' | 'reports' | 'analytics' | 'map'
type SortOption = 'date-desc' | 'date-asc' | 'priority-desc' | 'priority-asc' | 'duplicates-desc'

const statusLabels: Record<string, string> = {
  reported: 'Reported',
  inProgress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

export function MunicipalDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports')
  const [searchedReport, setSearchedReport] = useState<PotholeReport | null>(null)
  const { cityName } = useCity()

  const {
    reports,
    allReports,
    totalReports,
    statusFilter,
    setStatusFilter,
    sortOption,
    setSortOption,
    statusDistribution,
    refreshData,
    isPending,
    isConfirming,
    isLoadingReports,
    markInProgress,
    markCompleted,
    rejectReport,
    intToCoordinate,
  } = useMunicipalActions()

  // Map filters hook
  const {
    statusFilter: mapStatusFilter,
    setStatusFilter: setMapStatusFilter,
    priorityFilter,
    setPriorityFilter,
    dateFilter,
    setDateFilter,
    filteredReports: filteredMapReports,
  } = useMapFilters({
    reports: allReports
  })

  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'priority-desc', label: 'Highest Priority' },
    { value: 'priority-asc', label: 'Lowest Priority' },
    { value: 'duplicates-desc', label: 'Most Duplicates' },
  ]

  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: Activity,
      description: 'System statistics and alerts'
    },
    {
      id: 'reports' as const,
      label: 'Manage Reports',
      icon: Building2,
      description: 'Review and process pothole reports'
    },
    {
      id: 'map' as const,
      label: 'Map View',
      icon: MapPin,
      description: 'Visualize reports on an interactive map'
    },
    {
      id: 'analytics' as const,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance metrics and insights'
    },
  ]

  const isLoading = isPending || isConfirming

  const highPriorityReports = allReports.filter(
    r => r.priority >= 90 && r.status === 0
  )

  const displayedReports = searchedReport ? [searchedReport] : reports
  const displayedMapReports = searchedReport
    ? filteredMapReports.filter(r => r.id === searchedReport.id)
    : filteredMapReports

  const getAverageResponseTime = () => {
    const completedReports = allReports.filter(r => r.status === 2)
    if (completedReports.length === 0) return 0

    const totalDays = completedReports.reduce((sum, r) => {
      const days = (Date.now() / 1000 - r.reportedAt) / 86400
      return sum + days
    }, 0)

    return Math.round((totalDays / completedReports.length) * 10) / 10
  }

  const getCompletionRate = () => {
    if (allReports.length === 0) return 0
    const completed = allReports.filter(r => r.status === 2).length
    return Math.round((completed / allReports.length) * 100)
  }

  const getTotalDuplicates = () => {
    return allReports.reduce((sum, r) => sum + (r.duplicateCount - 1), 0)
  }

  const handleReportSelect = (report: PotholeReport | null) => {
    setSearchedReport(report)
  }

  // Handle status update from map
  const handleMapStatusUpdate = async (reportId: number, newStatus: number, reason?: string) => {
    if (newStatus === 1) {
      await markInProgress(reportId)
    } else if (newStatus === 2) {
      await markCompleted(reportId)
    } else if (newStatus === 3 && reason) {
      await rejectReport(reportId, reason)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <span>Municipal Dashboard</span>
          </h1>
          <div className="text-slate-600 mt-2 flex items-center gap-3">
            <span>Manage and monitor pothole reports across the city</span>
            {cityName && (
              <span className="inline-flex items-center text-sm text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                <Map className="h-4 w-4 mr-1 text-slate-600" />
                {cityName}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Refreshing...' : 'Refresh Data'}</span>
        </Button>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-8">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                    transition-colors duration-200
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className={`mr-2 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">New Reports</p>
                      <p className="text-3xl font-bold text-orange-600 mt-1">
                        {statusDistribution.reported}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">In Progress</p>
                      <p className="text-3xl font-bold text-blue-600 mt-1">
                        {statusDistribution.inProgress}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600 mt-1">
                        {statusDistribution.completed}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-red-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Rejected</p>
                      <p className="text-3xl font-bold text-red-600 mt-1">
                        {statusDistribution.rejected}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-l-4 border-red-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>High Priority Reports</span>
                </CardTitle>
                <CardDescription>
                  Reports requiring immediate attention (Priority ≥ 90)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {highPriorityReports.length > 0 ? (
                  allReports.slice(0, 5).map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                    >
                      <div>
                        <span className="font-medium">Report #{report.id}</span>
                        <span className="text-sm text-slate-500 ml-2">
                          {new Date(report.reportedAt * 1000).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className="text-xs">
                          Priority: {report.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[['reported', 'inProgress', 'completed', 'rejected'][report.status]]}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No high priority reports
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <ReportSearchBar
                  reports={allReports}
                  onReportSelect={handleReportSelect}
                  placeholder="Search by Report ID... (e.g., 123)"
                />
              </CardContent>
            </Card>
            {/* Filters and Sorting */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Status Filter */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Filter:</span>
                  {[
                    { key: 'all', label: `All (${totalReports})`, color: '#475569' },
                    { key: 0, label: `Reported (${statusDistribution.reported})`, color: '#ea580c' },
                    { key: 1, label: `In Progress (${statusDistribution.inProgress})`, color: '#2563eb' },
                    { key: 2, label: `Completed (${statusDistribution.completed})`, color: '#16a34a' },
                    { key: 3, label: `Rejected (${statusDistribution.rejected})`, color: '#dc2626' },
                  ].map((option) => {
                    const isActive = statusFilter === option.key
                    return (
                      <button
                        key={option.key}
                        onClick={() => setStatusFilter(option.key as any)}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'ring-2 ring-offset-2' : ''
                          }`}
                        style={{
                          backgroundColor: isActive ? option.color : 'transparent',
                          color: isActive ? 'white' : option.color,
                          borderColor: option.color,
                          borderWidth: '1px',
                        }}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sort:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {isLoadingReports ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600">⚡ Loading reports via events...</p>
                    <p className="text-sm text-slate-400">
                      Fast even with 1000+ reports!
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ReportsTable
                reports={displayedReports}
                onMarkInProgress={markInProgress}
                onMarkCompleted={markCompleted}
                onReject={rejectReport}
                intToCoordinate={intToCoordinate}
                isPending={isPending}
                isConfirming={isConfirming}
              />
            )}
          </div>
        )}

        {/* Map View Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">

            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <ReportSearchBar
                  reports={allReports}
                  onReportSelect={handleReportSelect}
                  placeholder="Search by Report ID to locate on map..."
                />
              </CardContent>
            </Card>

            <MapFilters
              totalReports={totalReports}
              statusDistribution={statusDistribution}
              statusFilter={mapStatusFilter}
              setStatusFilter={setMapStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
            />

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">
                      Displaying {displayedMapReports.length} report{displayedMapReports.length !== 1 ? 's' : ''} on map
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>Reported</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Completed</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Rejected</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {isLoadingReports ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600">Loading map data...</p>
                  </div>
                </CardContent>
              </Card>
            ) : displayedMapReports.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports to display</h3>
                  <p className="text-slate-500">
                    Try adjusting your filters to see more reports
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Suspense fallback={
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-slate-600">Loading map...</p>
                    </div>
                  </CardContent>
                </Card>
              }>
                <ReportsMap
                  reports={displayedMapReports}
                  userRole="municipal"
                  onStatusUpdate={handleMapStatusUpdate}
                />
              </Suspense>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Overview</CardTitle>
                <CardDescription>Performance metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Status Distribution</h4>
                    <div className="space-y-3">
                      {Object.entries(statusDistribution).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-slate-700 capitalize">{status}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-600"
                                style={{
                                  width: allReports.length > 0
                                    ? `${(count / allReports.length) * 100}%`
                                    : '0%'
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold text-slate-900 w-8">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Key Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">Average Response Time</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {getAverageResponseTime()} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">Completion Rate</span>
                        <span className="text-sm font-semibold text-green-600">
                          {getCompletionRate()}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">Total Duplicates</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {getTotalDuplicates()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-sm text-slate-700">Total Reports</span>
                        <span className="text-sm font-semibold text-slate-900">
                          {allReports.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}