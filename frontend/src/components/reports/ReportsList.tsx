'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { MapPin, Clock, CheckCircle, AlertTriangle, XCircle, Users, Award, Copy, ExternalLink } from 'lucide-react'

const statusConfig = {
  0: { label: 'Reported', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  1: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  2: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  3: { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
}

export function ReportsList() {
  const { userReports, duplicateReports, totalReports, intToCoordinate } = useCitizenActions()

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
  }

  const copyLocation = (lat: number, lng: number) => {
    navigator.clipboard.writeText(`${lat}, ${lng}`)
  }

  return (
    <div className="space-y-6">
      {/* Original Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>My Original Reports</span>
            <Badge variant="outline" className="ml-2">
              {userReports.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Potholes you were the first to report
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userReports.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No original reports yet</p>
              <p className="text-sm text-slate-400">
                Be the first to report a pothole and earn rewards!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {userReports.map((report) => {
                const status = statusConfig[report.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                const lat = intToCoordinate(report.latitude)
                const lng = intToCoordinate(report.longitude)
                
                return (
                  <div key={report.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          #{report.id}
                        </Badge>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        {report.duplicateCount > 1 && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Users className="h-3 w-3 mr-1" />
                            {report.duplicateCount} reporters
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-slate-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(report.reportedAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Location</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-700 font-mono">
                            {lat.toFixed(6)}, {lng.toFixed(6)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => copyLocation(lat, lng)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => openInMaps(lat, lng)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Potential Reward</div>
                        <div className="flex items-center space-x-1">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-slate-700 font-semibold">
                            {report.status === 2 ? '15 PBC Earned! 🎉' : 'Up to 15 PBC'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {report.ipfsHash && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-xs font-medium text-slate-500 mb-1">Description</div>
                        <p className="text-sm text-slate-600">
                          {report.ipfsHash.replace('description:', '')}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Reports Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span>My Duplicate Reports</span>
            <Badge variant="outline" className="ml-2">
              {duplicateReports.length}
            </Badge>
          </CardTitle>
          <CardDescription>
            Potholes you helped confirm by reporting duplicates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicateReports.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 mb-2">No duplicate reports yet</p>
              <p className="text-sm text-slate-400">
                Confirm existing reports to help prioritize repairs
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicateReports.map((report) => {
                const status = statusConfig[report.status as keyof typeof statusConfig]
                const StatusIcon = status.icon
                const lat = intToCoordinate(report.latitude)
                const lng = intToCoordinate(report.longitude)
                
                return (
                  <div key={`dup-${report.id}`} className="border border-purple-100 rounded-lg p-4 bg-purple-50/30 hover:border-purple-200 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                          <Copy className="h-3 w-3 mr-1" />
                          Duplicate of #{report.id}
                        </Badge>
                        <Badge className={status.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>
                      <span className="text-sm text-slate-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(report.reportedAt * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Location</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-700 font-mono">
                            {lat.toFixed(6)}, {lng.toFixed(6)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => copyLocation(lat, lng)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0"
                            onClick={() => openInMaps(lat, lng)}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-1">Confirmation</div>
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-4 w-4 text-purple-500" />
                          <span className="text-sm text-purple-700 font-medium">
                            Helped confirm this issue
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-purple-100">
                      <div className="text-xs text-purple-600 flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>Total {report.duplicateCount} citizens reported this pothole</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">{userReports.length}</div>
              <div className="text-sm text-slate-600">Original Reports</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">{duplicateReports.length}</div>
              <div className="text-sm text-slate-600">Confirmed Reports</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{totalReports}</div>
              <div className="text-sm text-slate-600">Total in System</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}