'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building2, RefreshCw, BarChart3, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import { useMunicipalActions } from '@/hooks/useMunicipalActions'
import { ReportsTable } from '@/components/municipal/ReportsTable'

type ActiveTab = 'overview' | 'reports' | 'analytics'

// Map status codes to display labels
const statusLabels: Record<string, string> = {
  reported: 'Reported',
  inProgress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected',
}

export function MunicipalDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('reports')

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
      id: 'analytics' as const,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Performance metrics and insights'
    },
  ]

  const isLoading = isPending || isConfirming

  // Get high priority reports (priority >= 90)
  const highPriorityReports = allReports.filter(
    r => r.priority >= 90 && r.status === 0 // 0 = Reported
  )

  // Calculate average response time (for completed reports)
  const getAverageResponseTime = () => {
    const completedReports = allReports.filter(r => r.status === 2) // 2 = Completed
    if (completedReports.length === 0) return 0
    
    const totalDays = completedReports.reduce((sum, r) => {
      const days = (Date.now() / 1000 - r.reportedAt) / 86400
      return sum + days
    }, 0)
    
    return Math.round((totalDays / completedReports.length) * 10) / 10
  }

  // Get completion rate
  const getCompletionRate = () => {
    if (allReports.length === 0) return 0
    return Math.round((statusDistribution.completed / allReports.length) * 100)
  }

  // Get total duplicates
  const getTotalDuplicates = () => {
    return allReports.reduce((sum, r) => sum + r.duplicateCount, 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <Building2 className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-slate-900">Municipal Operations</h1>
            </div>
            <p className="text-lg text-slate-600">
              Manage and prioritize pothole repairs efficiently
            </p>
          </div>
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex flex-col items-start p-4 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                    <span className="font-semibold">{tab.label}</span>
                  </div>
                  <p className={`text-xs ${
                    isActive ? 'text-blue-100' : 'text-slate-500'
                  }`}>
                    {tab.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-orange-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Reported</p>
                      <p className="text-3xl font-bold text-orange-600 mt-1">
                        {statusDistribution.reported}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
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

            {/* High Priority Alerts */}
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
                  <div className="space-y-3">
                    {highPriorityReports.slice(0, 5).map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge className="bg-red-600 text-white px-3 py-1">
                            Priority: {report.priority}
                          </Badge>
                          <div>
                            <p className="font-semibold text-slate-900">Report #{report.id}</p>
                            <p className="text-sm text-slate-600">
                              {report.duplicateCount} duplicate{report.duplicateCount !== 1 ? 's' : ''} •{' '}
                              {Math.floor((Date.now() / 1000 - report.reportedAt) / 86400)} days old
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setActiveTab('reports')}
                          variant="default"
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No high-priority reports at this time</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest reports requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {allReports.length > 0 ? (
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
                    No reports available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Minimal Chips Style Filter & Sort */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Status Pills */}
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
                        className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isActive
                            ? 'text-white shadow-lg scale-105'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        style={isActive ? {
                          backgroundColor: option.color
                        } : {}}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>

                {/* Sort Pills */}
                {setSortOption && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sort:</span>
                    {[
                      { key: 'priority-desc', label: '🔥 Priority' },
                      { key: 'date-desc', label: '📅 Recent' },
                      { key: 'duplicates-desc', label: '👥 Popular' },
                      { key: 'date-asc', label: '⏰ Oldest' },
                    ].map((option) => {
                      const isActive = sortOption === option.key
                      return (
                        <button
                          key={option.key}
                          onClick={() => setSortOption(option.key as any)}
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-purple-600 text-white shadow-lg scale-105'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reports Table */}
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
                reports={reports}
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
                  {/* Status Distribution */}
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

                  {/* Key Metrics */}
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