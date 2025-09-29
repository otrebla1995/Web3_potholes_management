import L from 'leaflet'

// Status color mapping
export const STATUS_COLORS = {
  0: '#ea580c', // Reported - orange
  1: '#2563eb', // In Progress - blue
  2: '#16a34a', // Completed - green
  3: '#dc2626', // Rejected - red
} as const

// Status labels
export const STATUS_LABELS = {
  0: 'Reported',
  1: 'In Progress',
  2: 'Completed',
  3: 'Rejected',
} as const

// Tailwind color classes for status
export const STATUS_TEXT_COLORS = {
  0: 'text-orange-600',
  1: 'text-blue-600',
  2: 'text-green-600',
  3: 'text-red-600',
} as const

// Get status label
export function getStatusLabel(status: number): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || 'Unknown'
}

// Get status color class
export function getStatusColor(status: number): string {
  return STATUS_TEXT_COLORS[status as keyof typeof STATUS_TEXT_COLORS] || 'text-slate-600'
}

// Get marker icon based on status and priority - IMPROVED DESIGN
export function getMarkerIcon(status: number, priority: number): L.DivIcon {
  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#64748b'

  // Same size for all pins
  const size = 42

  // Better map pin design with drop shadow
  const svgIcon = `
    <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow-${status}-${priority}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <!-- Map pin shape -->
      <path 
        d="M16 2 C10 2 6 6 6 11 C6 16 16 28 16 28 C16 28 26 16 26 11 C26 6 22 2 16 2 Z" 
        fill="${color}" 
        stroke="white" 
        stroke-width="2"
        filter="url(#shadow-${status}-${priority})"
      />
      <!-- Inner circle -->
      <circle 
        cx="16" 
        cy="11" 
        r="5" 
        fill="white" 
        opacity="0.9"
      />
      <!-- Priority indicator - exclamation mark for high priority -->
      ${priority >= 90 ? `
        <text 
          x="16" 
          y="14" 
          text-anchor="middle" 
          fill="${color}" 
          font-size="8" 
          font-weight="bold"
        >!</text>
      ` : `
        <circle 
          cx="16" 
          cy="11" 
          r="2.5" 
          fill="${color}"
        />
      `}
    </svg>
  `

  return L.divIcon({
    html: svgIcon,
    className: 'custom-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

// Coordinate conversion utilities
export function coordinateToInt(coord: number): bigint {
  return BigInt(Math.round(coord * 1000000))
}

export function intToCoordinate(coord: bigint): number {
  return Number(coord) / 1000000
}

// Map configuration constants
export const DEFAULT_MAP_CENTER: [number, number] = [45.4642, 9.1900] // Milan
export const DEFAULT_ZOOM = 13
export const MAX_ZOOM = 18
export const MIN_ZOOM = 10