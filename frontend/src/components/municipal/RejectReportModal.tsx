'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { XCircle, X } from 'lucide-react'
import { PotholeReport } from '@/hooks/useMunicipalActions'
import { useMunicipalActions } from '@/hooks/useMunicipalActions'

interface RejectReportModalProps {
  report: PotholeReport
  isOpen: boolean
  onClose: () => void
  onReject: (reason: string) => void
}

export function RejectReportModal({ report, isOpen, onClose, onReject }: RejectReportModalProps) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const { rejectReport, isPending, isConfirming } = useMunicipalActions()

  const predefinedReasons = [
    'Duplicate report',
    'Insufficient information',
    'Not a pothole',
    'Outside jurisdiction',
    'Already repaired',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const finalReason = reason === 'Other' ? customReason : reason
    
    if (!finalReason.trim()) {
      return
    }

    await rejectReport(report.id, finalReason)
    onReject(finalReason)
  }

  const isLoading = isPending || isConfirming

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Reject Report #{report.id}</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rejection Reason
              </label>
              <div className="space-y-2">
                {predefinedReasons.map((predefinedReason) => (
                  <label key={predefinedReason} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="reason"
                      value={predefinedReason}
                      checked={reason === predefinedReason}
                      onChange={(e) => setReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                      disabled={isLoading}
                    />
                    <span className="text-sm">{predefinedReason}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === 'Other' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Reason
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please specify the reason for rejection..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm h-20 focus:outline-none focus:ring-2 focus:ring-red-500"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isLoading || !reason || (reason === 'Other' && !customReason.trim())}
                className="flex-1"
              >
                {isLoading ? 'Rejecting...' : 'Reject Report'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}