'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Shield, Users, Building2, Settings, Activity, TrendingUp, Map } from 'lucide-react'
import { useOwnerActions } from '@/hooks/useOwnerActions'
import { AddCitizenForm } from '@/components/forms/AddCitizenForm'
import { AddMunicipalForm } from '@/components/forms/AddMunicipalForm'
import { useCity } from '@/hooks/useCity'

type ActiveTab = 'overview' | 'citizens' | 'municipal' | 'settings'

export function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const { citizenCount, totalReports } = useOwnerActions()
  const { cityName } = useCity()

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'citizens' as const, label: 'Citizens', icon: Users },
    { id: 'municipal' as const, label: 'Municipal Staff', icon: Building2 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-slate-900">System Administration</h1>
        </div>
        <p className="text-lg text-slate-600">
          Manage users, authorities, and system settings
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
      {cityName && (
        <div className="text-center">
          <span className="inline-flex items-center text-sm text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
            <Map className="h-4 w-4 mr-1 text-slate-600" />
            {cityName}
          </span>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{citizenCount}</div>
                <div className="text-sm text-slate-600">Registered Citizens</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                <div className="text-sm text-slate-600">Municipal Staff</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">{totalReports}</div>
                <div className="text-sm text-slate-600">Total Reports</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-sm text-slate-600">System Uptime</div>
              </CardContent>
            </Card>
          </div>

          {/* System Health */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>System Health</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Contract Status:</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Network:</span>
                    <Badge className="bg-blue-100 text-blue-800">Localhost</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Last Activity:</span>
                    <Badge variant="outline">Just now</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="owner" 
                    onClick={() => setActiveTab('citizens')}
                    className="h-16 flex-col"
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs">Manage Citizens</span>
                  </Button>
                  <Button 
                    variant="municipal" 
                    onClick={() => setActiveTab('municipal')}
                    className="h-16 flex-col"
                  >
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="text-xs">Manage Staff</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Citizen Management</h2>
            <p className="text-slate-600">Add, remove, and manage registered citizens</p>
          </div>
          <AddCitizenForm />
        </div>
      )}

      {activeTab === 'municipal' && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Municipal Authority Management</h2>
            <p className="text-slate-600">Add and remove municipal staff members</p>
          </div>
          <AddMunicipalForm />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Settings panel coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}