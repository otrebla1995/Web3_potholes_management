'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Users, MapPin, Plus, Award, Camera, History } from 'lucide-react'

export function CitizenDashboard() {
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button variant="report" className="h-24 flex-col">
          <Plus className="h-6 w-6 mb-2" />
          <span>Report New Pothole</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col">
          <MapPin className="h-6 w-6 mb-2" />
          <span>View Area Map</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col">
          <History className="h-6 w-6 mb-2" />
          <span>My Reports</span>
        </Button>
      </div>

      {/* User Stats */}
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
                <span className="font-medium">0</span>
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
                <span>Take a clear photo of the pothole</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-xs font-bold">2</span>
                </div>
                <span>Get accurate GPS location</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-orange-600 text-xs font-bold">3</span>
                </div>
                <span>Submit report and earn PBC tokens</span>
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
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-slate-600">Total reports in your area</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-slate-600">Repairs completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Report</CardTitle>
          <CardDescription>Report a pothole in your area</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Location
                </label>
                <div className="flex space-x-2">
                  <input 
                    type="text" 
                    placeholder="Latitude" 
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm"
                  />
                  <input 
                    type="text" 
                    placeholder="Longitude" 
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-md text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea 
                  placeholder="Describe the pothole..." 
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm h-24"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Photo
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center">
                  <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Upload photo</p>
                </div>
              </div>
              <Button variant="report" className="w-full">
                Submit Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}