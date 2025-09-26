'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Building2, RefreshCw, BarChart3, Activity } from 'lucide-react'
import { useMunicipalActions } from '@/hooks/useMunicipalActions'
import { ReportsTable } from '@/components/municipal/ReportsTable'
import { StatusFilter } from '@/components/municipal/StatusFilter'

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
    totalReports,
    statusFilter,
    setStatusFilter,
    statusDistribution,
    refreshData,
    isPending,
    isConfirming,
    isLoadingReports,
  } = useMunicipalActions()

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'reports' as const, label: 'Manage Reports', icon: Building2 },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  ]

  const isLoading = isPending || isConfirming

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Municipal Operations</h1>
          </div>
          <p className="text-lg text-slate-600">
            Manage pothole reports and coordinate repairs
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
      <div className="flex flex-wrap justify-center space-x-1 bg-slate-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Status Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {statusDistribution.reported}
                </div>
                <div className="text-sm text-slate-600">New Reports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {statusDistribution.inProgress}
                </div>
                <div className="text-sm text-slate-600">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {statusDistribution.completed}
                </div>
                <div className="text-sm text-slate-600">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {statusDistribution.rejected}
                </div>
                <div className="text-sm text-slate-600">Rejected</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest reports requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-medium">Report #{report.id}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      {new Date(report.reportedAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600">
                    Status: {statusLabels[report.status]}
                  </div>
                </div>
              ))}
              {reports.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No reports available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Status Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Reports</CardTitle>
              <CardDescription>
                Filter by status to manage different stages of the repair process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusFilter
                activeFilter={statusFilter}
                onFilterChange={setStatusFilter}
                statusDistribution={statusDistribution}
                totalReports={totalReports}
              />
            </CardContent>
          </Card>

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
            <ReportsTable reports={reports} onStatusUpdate={refreshData} />
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Analytics</CardTitle>
              <CardDescription>Performance metrics and reporting statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Completion Rate</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Completed Reports:</span>
                      <span>{statusDistribution.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Reports:</span>
                      <span>{totalReports}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Success Rate:</span>
                      <span>
                        {totalReports > 0
                          ? Math.round((statusDistribution.completed / totalReports) * 100)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Response Time</h3>
                  <div className="text-center py-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {statusDistribution.inProgress > 0 ? 'Active' : 'Ready'}
                    </div>
                    <div className="text-sm text-slate-600">
                      {statusDistribution.inProgress} reports in progress
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}