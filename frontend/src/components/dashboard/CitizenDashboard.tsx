'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Users, Plus, History, Activity, TrendingUp } from 'lucide-react'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { PotholeReportForm } from '@/components/forms/PotholeReportForm'
import { ReportsList } from '@/components/reports/ReportsList'
import { ContributionStats } from '@/components/reports/ContributionStats'

type ActiveTab = 'overview' | 'report' | 'history'

export function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const { totalReports, userReports, duplicateReports } = useCitizenActions()

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
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Users className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Citizen Portal</h1>
        </div>
        <p className="text-lg text-slate-600">
          Report potholes, earn rewards, and help improve your community
        </p>
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
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
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

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <ContributionStats />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
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
                                  {isOriginal ? `Original Report #${report.id}` : `Confirmed Report #${report.id}`}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {new Date(report.reportedAt * 1000).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActiveTab('history')}
                            >
                              View
                            </Button>
                          </div>
                        )
                      })}
                  </div>
                  <Button
                    variant="link"
                    className="w-full mt-4"
                    onClick={() => setActiveTab('history')}
                  >
                    View All Reports →
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'report' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plus className="h-5 w-5" />
                <span>Report a Pothole</span>
              </CardTitle>
              <CardDescription>
                Help improve your community by reporting potholes. Earn rewards when they're fixed!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PotholeReportForm />
            </CardContent>
          </Card>
        )}

        {activeTab === 'history' && (
          <ReportsList />
        )}
      </div>

      {/* System Stats Footer */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{totalReports}</span> total potholes reported in the system
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Together, we're making our roads safer! 🚗✨
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}