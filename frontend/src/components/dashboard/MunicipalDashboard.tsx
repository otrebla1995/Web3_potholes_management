'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Building2, MapPin, CheckCircle, Clock, AlertTriangle, Wrench } from 'lucide-react'

export function MunicipalDashboard() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">Municipal Operations</h1>
        </div>
        <p className="text-lg text-slate-600">
          Manage pothole reports and coordinate repairs
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="municipal" className="h-20 flex-col">
          <CheckCircle className="h-5 w-5 mb-1" />
          <span className="text-sm">Mark Complete</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col">
          <Wrench className="h-5 w-5 mb-1" />
          <span className="text-sm">Start Repair</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col">
          <AlertTriangle className="h-5 w-5 mb-1" />
          <span className="text-sm">Reject Report</span>
        </Button>
        <Button variant="outline" className="h-20 flex-col">
          <MapPin className="h-5 w-5 mb-1" />
          <span className="text-sm">View Map</span>
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">0</div>
            <div className="text-sm text-slate-600">New Reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">0</div>
            <div className="text-sm text-slate-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">0</div>
            <div className="text-sm text-slate-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">0</div>
            <div className="text-sm text-slate-600">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Pothole Reports</CardTitle>
          <CardDescription>Latest reports requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p>No reports to display</p>
            <p className="text-sm">Reports will appear here once citizens start reporting potholes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}