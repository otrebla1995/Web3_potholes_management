'use client'

import { Marker } from 'react-leaflet'
import { getMarkerIcon } from '@/lib/mapUtils'
import { MapPopup } from './MapPopup'
import { PotholeReport } from '@/types/report'

interface MapMarkerProps {
  report: PotholeReport
  userRole: 'municipal' | 'citizen'
  onMarkerClick?: (report: PotholeReport) => void
  onStatusUpdate?: (reportId: number, newStatus: number, reason?: string) => void
}

export function MapMarker({ 
  report, 
  userRole, 
  onMarkerClick,
  onStatusUpdate 
}: MapMarkerProps) {
  
  const handleClick = () => {
    if (onMarkerClick) {
      onMarkerClick(report)
    }
  }

  return (
    <Marker
      position={[Number(report.latitude) / 1000000, Number(report.longitude) / 1000000]}
      icon={getMarkerIcon(report.status, report.priority)}
      eventHandlers={{
        click: handleClick
      }}
    >
      <MapPopup
        report={report}
        userRole={userRole}
        onStatusUpdate={onStatusUpdate}
      />
    </Marker>
  )
}