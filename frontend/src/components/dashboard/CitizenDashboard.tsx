'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Users, MapPin, Plus, Award, History, Activity } from 'lucide-react'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { PotholeReportForm } from '@/components/forms/PotholeReportForm'
import { ReportsList } from '@/components/reports/ReportsList'

type ActiveTab = 'overview' | 'report' | 'history'

export function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const { totalReports, userReports } = useCitizenActions()

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'report' as const, label: 'Report Pothole', icon: Plus },
    { id: 'history' as const, label: 'My Reports', icon: History },
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Users className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-slate-900">Citizen Portal</h1>
        </div>
        <p className="text-lg text-slate-600">
          Report potholes and help improve your community
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center space-x-1 bg-slate-100 p-1 rounded-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
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
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="report" 
              className="h-24 flex-col"
              onClick={() => setActiveTab('report')}
            >
              <Plus className="h-6 w-6 mb-2" />
              <span>Report New Pothole</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col"
              onClick={() => setActiveTab('history')}
            >
              <History className="h-6 w-6 mb-2" />
              <span>View My Reports</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col">
              <MapPin className="h-6 w-6 mb-2" />
              <span>Area Map</span>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  <span>My Rewards</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-1">0 PBC</div>
                <div className="text-sm text-slate-600">Total earned tokens</div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reports submitted:</span>
                    <span className="font-medium">{userReports.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Confirmations:</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Reporting Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 text-xs font-bold">1</span>
                    </div>
                    <span>Get accurate GPS location</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 text-xs font-bold">2</span>
                    </div>
                    <span>Describe the pothole clearly</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-orange-600 text-xs font-bold">3</span>
                    </div>
                    <span>Submit and earn PBC tokens</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Community Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{totalReports}</div>
                    <div className="text-sm text-slate-600">Total community reports</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-slate-600">Repairs completed</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'report' && (
        <div className="max-w-2xl mx-auto">
          <PotholeReportForm />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="max-w-4xl mx-auto">
          <ReportsList />
        </div>
      )}
    </div>
  )
}