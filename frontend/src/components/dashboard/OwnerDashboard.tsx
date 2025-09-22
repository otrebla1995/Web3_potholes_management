'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Shield, Users, Building2, Settings, Plus, Trash2 } from 'lucide-react'

export function OwnerDashboard() {
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="owner" className="h-24 flex-col">
          <Plus className="h-6 w-6 mb-2" />
          <span>Add Citizen</span>
        </Button>
        <Button variant="municipal" className="h-24 flex-col">
          <Building2 className="h-6 w-6 mb-2" />
          <span>Add Municipal Authority</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col">
          <Settings className="h-6 w-6 mb-2" />
          <span>System Settings</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col">
          <Trash2 className="h-6 w-6 mb-2" />
          <span>Remove Users</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Citizens:</span>
                <Badge variant="secondary">Loading...</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Municipal Staff:</span>
                <Badge variant="secondary">Loading...</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Active Reports:</span>
                <Badge variant="secondary">Loading...</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">New citizen registered</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-slate-600">Municipal authority added</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-slate-600">New pothole reported</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Health</CardTitle>
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
                <span className="text-sm text-slate-600">Version:</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Citizen Management</span>
            </CardTitle>
            <CardDescription>
              Add, remove, and manage registered citizens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Enter wallet address..." 
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm"
                />
                <Button variant="owner" size="sm">Add</Button>
              </div>
              <div className="text-sm text-slate-500">
                Citizens can report potholes and earn rewards
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Municipal Authorities</span>
            </CardTitle>
            <CardDescription>
              Manage municipal staff and authorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Enter authority address..." 
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm"
                />
                <Button variant="municipal" size="sm">Add</Button>
              </div>
              <div className="text-sm text-slate-500">
                Authorities can update pothole status and manage repairs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}