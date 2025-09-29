'use client'

import { useState } from 'react'
import { Popup } from 'react-leaflet'
import { PotholeReport, ReportStatus } from '@/types/report'
import { getStatusLabel, getStatusColor } from '@/lib/mapUtils'
import { ExternalLink, MapPin, X } from 'lucide-react'

interface MapPopupProps {
  report: PotholeReport
  userRole: 'municipal' | 'citizen'
  onStatusUpdate?: (reportId: number, newStatus: number, reason?: string) => void
}

export function MapPopup({ report, userRole, onStatusUpdate }: MapPopupProps) {
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  
  const statusLabel = getStatusLabel(report.status)
  const statusColor = getStatusColor(report.status)

  const openInGoogleMaps = () => {
    const lat = Number(report.latitude) / 1000000
    const lng = Number(report.longitude) / 1000000
    const url = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(url, '_blank')
  }

  const handleReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (rejectReason.trim()) {
      onStatusUpdate?.(report.id, ReportStatus.Rejected, rejectReason)
      setShowRejectInput(false)
      setRejectReason('')
    }
  }

  const handleShowRejectInput = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRejectInput(true)
  }

  const handleCancelReject = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowRejectInput(false)
    setRejectReason('')
  }

  const handleStatusUpdate = (e: React.MouseEvent, newStatus: number) => {
    e.stopPropagation()
    onStatusUpdate?.(report.id, newStatus)
  }

  return (
    <Popup closeButton={true} autoClose={false} closeOnClick={false}>
      <div className="p-2 min-w-[250px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-2">Report #{report.id}</h3>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-semibold">Status:</span>{' '}
            <span className={`font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          
          <div>
            <span className="font-semibold">Priority:</span> {report.priority}
          </div>
          
          <div>
            <span className="font-semibold">Duplicates:</span> {report.duplicateCount}
          </div>
          
          <div>
            <span className="font-semibold">Reported:</span>{' '}
            {new Date(report.reportedAt * 1000).toLocaleDateString()}
          </div>
          
          <div>
            <span className="font-semibold">Location:</span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-mono text-slate-600">
                {(Number(report.latitude) / 1000000).toFixed(6)}, {(Number(report.longitude) / 1000000).toFixed(6)}
              </span>
              <button
                onClick={openInGoogleMaps}
                className="text-blue-600 hover:text-blue-700 ml-2"
                title="Open in Google Maps"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {report.ipfsHash && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <span className="font-semibold">Description:</span>
              <p className="text-xs mt-1 text-slate-600">
                {report.ipfsHash.replace('description:', '')}
              </p>
            </div>
          )}

          {/* Municipal Actions */}
          {userRole === 'municipal' && onStatusUpdate && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
              {!showRejectInput ? (
                <>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Update Status:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {report.status === ReportStatus.Reported && (
                      <>
                        <button
                          onClick={(e) => handleStatusUpdate(e, ReportStatus.InProgress)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        >
                          Start Work
                        </button>
                        <button
                          onClick={handleShowRejectInput}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {report.status === ReportStatus.InProgress && (
                      <>
                        <button
                          onClick={(e) => handleStatusUpdate(e, ReportStatus.Completed)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={handleShowRejectInput}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700">Rejection Reason:</p>
                    <button
                      onClick={handleCancelReject}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                    className="w-full px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded transition-colors"
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Citizen Actions */}
          {userRole === 'citizen' && (
            <div className="mt-3 pt-3 border-t border-slate-200">
              <button
                onClick={openInGoogleMaps}
                className="w-full px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center justify-center space-x-2"
              >
                <MapPin className="h-4 w-4" />
                <span>Navigate Here</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </Popup>
  )
}