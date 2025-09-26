'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  MapPin, 
  Calendar, 
  User, 
  Play, 
  CheckCircle, 
  XCircle, 
  MoreHorizontal,
  ExternalLink,
  MessageSquare
} from 'lucide-react'
import { 
  useMunicipalActions, 
  PotholeReport, 
  PotholeStatus, 
  statusLabels, 
  statusColors 
} from '@/hooks/useMunicipalActions'
import { RejectReportModal } from './RejectReportModal'

interface ReportsTableProps {
  reports: PotholeReport[]
  onStatusUpdate?: () => void
}

export function ReportsTable({ reports, onStatusUpdate }: ReportsTableProps) {
  const { markInProgress, markCompleted, isPending, isConfirming, intToCoordinate } = useMunicipalActions()
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)

  const handleStatusUpdate = async (reportId: number, action: () => Promise<void>) => {
    await action()
    onStatusUpdate?.()
  }

  const getStatusIcon = (status: PotholeStatus) => {
    switch (status) {
      case PotholeStatus.Reported:
        return <MapPin className="h-4 w-4" />
      case PotholeStatus.InProgress:
        return <Play className="h-4 w-4" />
      case PotholeStatus.Completed:
        return <CheckCircle className="h-4 w-4" />
      case PotholeStatus.Rejected:
        return <XCircle className="h-4 w-4" />
      default:
        return <MoreHorizontal className="h-4 w-4" />
    }
  }

  const isLoading = isPending || isConfirming

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 mb-2">No reports found</p>
          <p className="text-sm text-slate-400">Reports will appear here when citizens submit them</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pothole Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900">Report #{report.id}</span>
                      <Badge className={`${statusColors[report.status as PotholeStatus]} flex items-center space-x-1`}>
                        {getStatusIcon(report.status)}
                        <span>{statusLabels[report.status as PotholeStatus]}</span>
                      </Badge>
                    </div>
                    {report.duplicateCount > 0 && (
                      <Badge variant="outline" className="text-xs">
                        +{report.duplicateCount} duplicates
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    {new Date(report.reportedAt * 1000).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Location</div>
                    <div className="text-sm text-slate-600 flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {intToCoordinate(report.latitude).toFixed(6)}, {intToCoordinate(report.longitude).toFixed(6)}
                      </span>
                      <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">Reported By</div>
                    <div className="text-sm text-slate-600 flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span className="font-mono">{report.reporter.slice(0, 6)}...{report.reporter.slice(-4)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-slate-700 mb-1">Description</div>
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                    {report.ipfsHash.replace('description:', '')}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                  {report.status === PotholeStatus.Reported && (
                    <>
                      <Button
                        size="sm"
                        variant="municipal"
                        onClick={() => handleStatusUpdate(report.id, () => markInProgress(report.id))}
                        disabled={isLoading}
                        className="flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>Start Work</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedReport(report)
                          setShowRejectModal(true)
                        }}
                        disabled={isLoading}
                        className="flex items-center space-x-1"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}
                  
                  {report.status === PotholeStatus.InProgress && (
                    <>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleStatusUpdate(report.id, () => markCompleted(report.id))}
                        disabled={isLoading}
                        className="flex items-center space-x-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        <span>Mark Complete</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedReport(report)
                          setShowRejectModal(true)
                        }}
                        disabled={isLoading}
                        className="flex items-center space-x-1"
                      >
                        <XCircle className="h-3 w-3" />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}

                  {(report.status === PotholeStatus.Completed || report.status === PotholeStatus.Rejected) && (
                    <div className="text-sm text-slate-500 italic">
                      No actions available
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reject Report Modal */}
      {selectedReport && (
        <RejectReportModal
          report={selectedReport}
          isOpen={showRejectModal}
          onClose={() => {
            setShowRejectModal(false)
            setSelectedReport(null)
          }}
          onReject={(reason: any) => {
            // Handle rejection
            setShowRejectModal(false)
            setSelectedReport(null)
          }}
        />
      )}
    </>
  )
}