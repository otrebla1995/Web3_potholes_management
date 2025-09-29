'use client'

import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Users, AlertCircle, CheckCircle } from 'lucide-react'

interface DuplicateAlertProps {
  isDuplicate: boolean
  existingReportId?: number
  duplicateCount?: number
}

export function DuplicateAlert({ 
  isDuplicate, 
  existingReportId, 
  duplicateCount = 1 
}: DuplicateAlertProps) {
  if (!isDuplicate) return null

  return (
    <Alert className="border-2 border-purple-200 bg-purple-50">
      <Users className="h-4 w-4 text-purple-600" />
      <AlertDescription>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-purple-900">
                This pothole has already been reported!
              </p>
              <p className="text-sm text-purple-700 mt-1">
                Report #{existingReportId} • {duplicateCount} {duplicateCount === 1 ? 'report' : 'reports'} so far
              </p>
            </div>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Will Confirm
            </Badge>
          </div>
          
          <div className="bg-purple-100/50 rounded-lg p-3 mt-2">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-purple-800">
                <p className="font-medium mb-1">What happens when you submit?</p>
                <ul className="space-y-1 text-purple-700">
                  <li>✅ Your report confirms the existing issue</li>
                  <li>📈 Increases priority for municipal authorities</li>
                  <li>🤝 Helps the community get faster repairs</li>
                  <li>⚠️ No duplicate rewards (original reporter gets rewarded)</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-purple-600 italic">
            Your confirmation still helps! The more reports, the higher the priority.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}