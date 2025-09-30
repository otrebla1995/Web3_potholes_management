// File: frontend/src/components/municipal/EnhancedReportsTable.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { 
  MapPin, 
  Calendar, 
  User, 
  ExternalLink, 
  CheckCircle, 
  Play, 
  XCircle,
  TrendingUp,
  Users,
  AlertTriangle
} from 'lucide-react'
import { PotholeStatus, statusLabels, statusColors } from '@/hooks/useMunicipalActions'
import { RejectReportModal } from './RejectReportModal'
import { ReportDetailsModal } from './ReportDetailsModal'
import { PotholeReport } from '@/types/report'

interface EnhancedReportsTableProps {
  reports: PotholeReport[]
  onMarkInProgress: (reportId: number) => void
  onMarkCompleted: (reportId: number) => void
  onReject: (reportId: number, reason: string) => void
  intToCoordinate: (coord: bigint) => number
  isPending: boolean
  isConfirming: boolean
}

export function ReportsTable({
  reports,
  onMarkInProgress,
  onMarkCompleted,
  onReject,
  intToCoordinate,
  isPending,
  isConfirming
}: EnhancedReportsTableProps) {
  const [rejectingReport, setRejectingReport] = useState<PotholeReport | null>(null)
  const [selectedReport, setSelectedReport] = useState<PotholeReport | null>(null)
  
  const isLoading = isPending || isConfirming

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-300'
    if (priority >= 70) return 'bg-orange-100 text-orange-800 border-orange-300'
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-green-100 text-green-800 border-green-300'
  }

  const getPriorityLabel = (priority: number) => {
    if (priority >= 90) return 'Critical'
    if (priority >= 70) return 'High'
    if (priority >= 50) return 'Medium'
    return 'Low'
  }

  const getPriorityIcon = (priority: number) => {
    if (priority >= 90) return AlertTriangle
    if (priority >= 70) return TrendingUp
    return CheckCircle
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <MapPin className="h-16 w-16 text-slate-300" />
            <div>
              <p className="text-lg font-medium text-slate-600">No reports found</p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {reports.map((report) => {
          const PriorityIcon = getPriorityIcon(report.priority)
          
          return (
            <Card
              key={report.id}
              className="border-2 border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedReport(report)}
            >
              <CardContent className="p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    {/* Priority Badge */}
                    <div className="flex flex-col items-center">
                      <div className={`text-2xl font-bold px-4 py-2 rounded-lg border-2 ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <PriorityIcon className="h-3 w-3 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600">
                          {getPriorityLabel(report.priority)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Report Info */}
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">
                        Report #{report.id}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusColors[report.status as PotholeStatus]}>
                          {statusLabels[report.status as PotholeStatus]}
                        </Badge>
                        {report.duplicateCount > 0 && (
                          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                            <Users className="h-3 w-3 mr-1" />
                            +{report.duplicateCount} duplicates
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    {report.status === PotholeStatus.Reported && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMarkInProgress(report.id)
                        }}
                        disabled={isLoading}
                        className="flex items-center space-x-2"
                      >
                        <Play className="h-4 w-4" />
                        <span>Start Work</span>
                      </Button>
                    )}
                    {report.status === PotholeStatus.InProgress && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onMarkCompleted(report.id)
                        }}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Complete</span>
                      </Button>
                    )}
                    {report.status !== PotholeStatus.Completed && report.status !== PotholeStatus.Rejected && (
                      <Button
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setRejectingReport(report)
                        }}
                        disabled={isLoading}
                        className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 rounded-lg p-4">
                  <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Reported</span>
                    </div>
                    <div className="text-sm text-slate-900">
                      {new Date(report.reportedAt * 1000).toLocaleDateString()}
                      <span className="text-slate-600 ml-2">
                        ({Math.floor((Date.now() / 1000 - report.reportedAt) / 86400)} days ago)
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-1">
                      <MapPin className="h-4 w-4" />
                      <span>Location</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-900 font-mono">
                        {intToCoordinate(report.latitude).toFixed(6)}, {intToCoordinate(report.longitude).toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps?q=${intToCoordinate(report.latitude)},${intToCoordinate(report.longitude)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-1">
                      <User className="h-4 w-4" />
                      <span>Reporter</span>
                    </div>
                    <div className="text-sm text-slate-900 font-mono">
                      {report.reporter.slice(0, 6)}...{report.reporter.slice(-4)}
                    </div>
                  </div>

                  {/* Description or Rejection Reason */}
                  <div className="md:col-span-2">
                    <div className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-1">
                      <span>{report.status === PotholeStatus.Rejected ? 'Rejection Reason' : 'Description'}</span>
                    </div>
                    <div className="text-sm text-slate-900">
                      {report.status === PotholeStatus.Rejected
                        ? (report.rejectionReason || '—')
                        : (report.ipfsHash?.replace('description:', '') || '—')}
                    </div>
                  </div>
                </div>

                {/* Priority Explanation for High Priority Items */}
                {report.priority >= 70 && report.status === PotholeStatus.Reported && (
                  <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-amber-900 mb-1">
                          High Priority Report
                        </p>
                        <p className="text-sm text-amber-800">
                          This report has been flagged as high priority due to:
                          {report.duplicateCount > 0 && (
                            <span className="block">• {report.duplicateCount} duplicate report{report.duplicateCount !== 1 ? 's' : ''} from the community</span>
                          )}
                          <span className="block">
                            • Pending for {Math.floor((Date.now() / 1000 - report.reportedAt) / 86400)} days
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <ReportDetailsModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          intToCoordinate={intToCoordinate}
        />
      )}

      {/* Reject Modal */}
      {rejectingReport && (
        <RejectReportModal
          report={rejectingReport}
          isOpen={!!rejectingReport}
          onClose={() => setRejectingReport(null)}
          onReject={(reason) => {
            onReject(rejectingReport.id, reason)
            setRejectingReport(null)
          }}
        />
      )}
    </>
  )
}