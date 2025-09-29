'use client'

import { useState, useMemo, Suspense, lazy } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Plus, History, Activity, MapPin, Map } from 'lucide-react'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { useMapFilters } from '@/hooks/useMapFilters'
import { useAllReports } from '@/hooks/useAllReports'
import { PotholeReportForm } from '@/components/forms/PotholeReportForm'
import { ReportsList } from '@/components/reports/ReportsList'
import { ContributionStats } from '@/components/reports/ContributionStats'
import { MapFilters } from '@/components/filters/MapFilters'
import { ReportSearchBar } from '@/components/filters/ReportSearchBar'
import { PotholeReport } from '@/types/report'
import { useCity } from '@/hooks/useCity'

// Lazy load the map component
const ReportsMap = lazy(() => import('@/components/map/ReportsMap').then(mod => ({ default: mod.ReportsMap })))

type ActiveTab = 'overview' | 'report' | 'history' | 'map'

export function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const [showAllReports, setShowAllReports] = useState(false)
  const [searchedReport, setSearchedReport] = useState<PotholeReport | null>(null)

  const { 
    totalReports, 
    userReports, 
    duplicateReports,
    intToCoordinate 
  } = useCitizenActions()

  // Fetch all reports for "Show All" mode
  const { allReports, isLoading: isLoadingAllReports } = useAllReports()

  // Combine user reports and duplicates for map (memoized to keep stable reference)
  const myReports = useMemo(() => (
    [...userReports, ...duplicateReports].map(r => ({
      ...r,
      priority: 0,
    }))
  ), [userReports, duplicateReports])

  const reportsToShow = useMemo(() => (
    showAllReports ? allReports : myReports
  ), [showAllReports, allReports, myReports])

  // Map filters hook
  const {
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    filteredReports: filteredMapReports,
  } = useMapFilters({
    reports: reportsToShow
  })

  const tabs = [
    { 
      id: 'overview' as const, 
      label: 'Overview', 
      icon: Activity,
      description: 'Your contribution stats and impact'
    },
    { 
      id: 'report' as const, 
      label: 'Report Pothole', 
      icon: Plus,
      description: 'Submit a new pothole report'
    },
    { 
      id: 'history' as const, 
      label: 'My Reports', 
      icon: History,
      description: 'View your reports and confirmations',
      badge: userReports.length + duplicateReports.length
    },
    { 
      id: 'map' as const, 
      label: 'Map View', 
      icon: MapPin,
      description: 'Visualize your reports on a map'
    },
  ]

  // Calculate status distribution
  const getStatusDistribution = () => {
    return {
      reported: myReports.filter(r => r.status === 0).length,
      inProgress: myReports.filter(r => r.status === 1).length,
      completed: myReports.filter(r => r.status === 2).length,
      rejected: myReports.filter(r => r.status === 3).length,
    }
  }

  const statusDistribution = useMemo(() => getStatusDistribution(), [myReports])

  const { cityName, center, bounds } = useCity()

  // Handle report selection from search
  const handleReportSelect = (report: PotholeReport | null) => {
    setSearchedReport(report)
  }

  // Get reports to display based on search
  const displayedMapReports = searchedReport 
    ? filteredMapReports.filter(r => r.id === searchedReport.id)
    : filteredMapReports

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header (aligned with MunicipalDashboard) */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <span>Citizen Portal</span>
          </h1>
          <div className="text-slate-600 mt-2 flex items-center gap-3">
            <span>Report potholes, earn rewards, and help improve your community</span>
            {cityName && (
              <span className="inline-flex items-center text-sm text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                <Map className="h-4 w-4 mr-1 text-slate-600" />
                {cityName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation (underline style like MunicipalDashboard) */}
      <div className="mb-2">
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
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
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
      <div className="animate-fadeIn">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ContributionStats />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>
                  What would you like to do today?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => setActiveTab('report')}
                    className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-8 w-8" />
                    <span>Report New Pothole</span>
                  </Button>
                  <Button
                    onClick={() => setActiveTab('history')}
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center space-y-2 border-2 hover:bg-slate-50"
                  >
                    <History className="h-8 w-8" />
                    <span>View My Reports</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity Preview */}
            {(userReports.length > 0 || duplicateReports.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest contributions to the community
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...userReports, ...duplicateReports]
                      .sort((a, b) => b.reportedAt - a.reportedAt)
                      .slice(0, 3)
                      .map((report, idx) => {
                        const isOriginal = userReports.some(r => r.id === report.id)
                        return (
                          <div 
                            key={`preview-${report.id}-${idx}`}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`h-2 w-2 rounded-full ${
                                isOriginal ? 'bg-blue-500' : 'bg-purple-500'
                              }`} />
                              <div>
                                <p className="text-sm font-medium text-slate-900">
                                  {isOriginal ? 'Original Report' : 'Confirmation'} #{report.id}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(report.reportedAt * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => setActiveTab('history')}
                              variant="ghost"
                              size="sm"
                            >
                              View
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Report Tab */}
        {activeTab === 'report' && (
          <Card>
            <CardHeader>
              <CardTitle>Report a Pothole</CardTitle>
              <CardDescription>
                Help improve your community by reporting potholes. Earn rewards for each report!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PotholeReportForm />
            </CardContent>
          </Card>
        )}

        {/* History Tab */}
        {activeTab === 'history' && <ReportsList />}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Toggle to show all reports */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Map View</h3>
                    <p className="text-xs text-slate-600 mt-1">
                      {showAllReports 
                        ? 'Showing all community reports' 
                        : 'Showing only your reports'}
                    </p>
                  </div>
                  <Button
                    onClick={() => setShowAllReports(!showAllReports)}
                    variant={showAllReports ? 'default' : 'outline'}
                    size="sm"
                  >
                    {showAllReports ? 'Show My Reports Only' : 'Show All Reports'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Bar */}
            <Card>
              <CardContent className="p-4">
                <ReportSearchBar
                  reports={myReports}
                  onReportSelect={handleReportSelect}
                  placeholder="Search your reports by ID..."
                />
              </CardContent>
            </Card>

            {/* Filters */}
            <MapFilters
              totalReports={myReports.length}
              statusDistribution={statusDistribution}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
            />

            {/* Map Legend */}
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

            {/* Map */}
            {isLoadingAllReports && showAllReports ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="text-slate-600">Loading all reports...</p>
                    <p className="text-sm text-slate-400">
                      This may take a moment for large datasets
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : myReports.length === 0 && !showAllReports ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports yet</h3>
                  <p className="text-slate-500 mb-4">
                    Start reporting potholes to see them on the map
                  </p>
                  <Button onClick={() => setActiveTab('report')}>
                    Report Your First Pothole
                  </Button>
                </CardContent>
              </Card>
            ) : displayedMapReports.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MapPin className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports match your filters</h3>
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
                  userRole="citizen"
                />
              </Suspense>
            )}
          </div>
        )}
      </div>
    </div>
  )
}