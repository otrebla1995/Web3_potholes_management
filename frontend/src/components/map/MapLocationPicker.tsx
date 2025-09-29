'use client'

import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { CityBounds } from '@/hooks/useCity'
let L: any
let LeafletReady = false
if (typeof window !== 'undefined') {
  // Dynamically require leaflet only on client
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  L = require('leaflet')
  // Fix default icon paths once
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
  LeafletReady = true
}

const RL = {
  MapContainer: LeafletReady ? require('react-leaflet').MapContainer : () => null,
  TileLayer: LeafletReady ? require('react-leaflet').TileLayer : () => null,
  Marker: LeafletReady ? require('react-leaflet').Marker : () => null,
  useMapEvents: LeafletReady ? require('react-leaflet').useMapEvents : (() => () => null),
  Polygon: LeafletReady ? require('react-leaflet').Polygon : () => null,
}

// Fix for default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapLocationPickerProps {
  latitude?: number | string
  longitude?: number | string
  onChange: (lat: number, lng: number) => void
  center?: [number, number]
  zoom?: number
  heightClassName?: string
  bounds?: CityBounds | null
  cityName?: string
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  RL.useMapEvents({
    click: (e: any) => {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export function MapLocationPicker({
  latitude,
  longitude,
  onChange,
  center = [45.4642, 9.19], // Milan default
  zoom = 13,
  heightClassName = 'h-80',
  bounds,
  cityName,
}: MapLocationPickerProps) {
  const hasSelection = useMemo(() => !!latitude && !!longitude, [latitude, longitude])

  const selectedPosition = useMemo<[number, number] | null>(() => {
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude
    const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude
    if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
      return [lat, lng]
    }
    return null
  }, [latitude, longitude])

  if (!LeafletReady) {
    return (
      <div className={`rounded-lg overflow-hidden border border-slate-200 ${heightClassName} flex items-center justify-center text-sm text-slate-500`}>
        Loading map...
      </div>
    )
  }

  return (
    <div className={`rounded-lg overflow-hidden border border-slate-200 ${heightClassName} relative`}>
      <RL.MapContainer
        center={selectedPosition ?? center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <RL.TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* City bounds polygon with animated stroke */}
        {bounds && (
          <RL.Polygon
            positions={[
              [bounds.minLat, bounds.minLng],
              [bounds.minLat, bounds.maxLng],
              [bounds.maxLat, bounds.maxLng],
              [bounds.maxLat, bounds.minLng],
            ] as [number, number][]}
            pathOptions={{
              color: '#2563eb', // blue-600
              weight: 2,
              dashArray: '8 10',
              fillOpacity: 0.06,
              fillColor: '#3b82f6', // blue-500
              className: 'city-bounds-animated',
            }}
          />
        )}

        <ClickHandler onPick={(lat, lng) => onChange(lat, lng)} />

        {selectedPosition && (
          <RL.Marker
            position={selectedPosition}
            draggable={true}
            eventHandlers={{
              dragend: (e: any) => {
                const m = e.target as any
                const p = m.getLatLng()
                onChange(p.lat, p.lng)
              },
            }}
          />
        )}
      </RL.MapContainer>

      {/* Bounds label */}
      {bounds && (
        <div className="absolute left-3 top-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow text-xs text-slate-700 border border-slate-200 animate-fadeIn">
          <span className="mr-1 inline-flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
          City bounds{cityName ? `: ${cityName}` : ''}
        </div>
      )}

      <div className="absolute left-3 bottom-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-md shadow text-xs text-slate-700 border border-slate-200">
        {selectedPosition ? (
          <span>
            Selected: {selectedPosition[0].toFixed(6)}, {selectedPosition[1].toFixed(6)}
          </span>
        ) : (
          <span>Click on the map to choose a location</span>
        )}
      </div>
    </div>
  )
}
