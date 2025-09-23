'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { MapPin, Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const statusConfig = {
  0: { label: 'Reported', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  1: { label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock },
  2: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  3: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
}

export function ReportsList() {
  const { userReports, totalReports } = useCitizenActions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Recent Reports</span>
        </CardTitle>
        <CardDescription>
          {totalReports > 0 
            ? `${totalReports} total reports in the system` 
            : 'No reports yet - be the first to report a pothole!'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userReports.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-2">No reports to display</p>
            <p className="text-sm text-slate-400">
              Your submitted reports will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userReports.map((report) => {
              const status = statusConfig[report.status as keyof typeof statusConfig]
              const StatusIcon = status.icon
              
              return (
                <div key={report.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-900">Report #{report.id}</span>
                      <Badge className={status.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {status.label}
                      </Badge>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(report.reportedAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Location:</span>
                      <div className="text-slate-600">
                        {Number(report.latitude) / 1000000}, {Number(report.longitude) / 1000000}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Duplicates:</span>
                      <span className="text-slate-600 ml-2">{report.duplicateCount}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <span className="font-medium text-slate-700">Description:</span>
                    <p className="text-slate-600 text-sm mt-1">
                      {report.ipfsHash.replace('description:', '')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}