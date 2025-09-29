'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapMarker } from './MapMarker'
import { MapPopup } from './MapPopup'
import { PotholeReport } from '@/types/report'

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface ReportsMapProps {
  reports: PotholeReport[]
  userRole?: 'municipal' | 'citizen'
  onMarkerClick?: (report: PotholeReport) => void
  onStatusUpdate?: (reportId: number, newStatus: number, reason?: string) => void
  centerCoordinates?: [number, number]
}

// Component to fit map bounds to markers
function FitBounds({ reports }: { reports: PotholeReport[] }) {
  const map = useMap()

  useEffect(() => {
    if (reports.length > 0) {
      const bounds = L.latLngBounds(
        reports.map(r => [Number(r.latitude) / 1000000, Number(r.longitude) / 1000000])
      )
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
    }
  }, [reports, map])

  return null
}

export function ReportsMap({ 
  reports, 
  userRole = 'citizen',
  onMarkerClick,
  onStatusUpdate,
  centerCoordinates = [45.4642, 9.1900], // Milan as default
}: ReportsMapProps) {
  
  // Calculate center from reports if not provided
  const mapCenter: [number, number] = reports.length > 0
    ? [
        reports.reduce((sum, r) => sum + Number(r.latitude) / 1000000, 0) / reports.length,
        reports.reduce((sum, r) => sum + Number(r.longitude) / 1000000, 0) / reports.length
      ]
    : centerCoordinates

  return (
    <div className="h-[600px] rounded-lg overflow-hidden border border-slate-200 relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <FitBounds reports={reports} />

        {reports.map((report) => (
          <MapMarker
            key={report.id}
            report={report}
            userRole={userRole}
            onMarkerClick={onMarkerClick}
            onStatusUpdate={onStatusUpdate}
          />
        ))}
      </MapContainer>
    </div>
  )
}