'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { X, MapPin, Calendar, User, ExternalLink, Building, Package, AlertTriangle, TrendingUp, CheckCircle, Users, Navigation, Route, Gauge, Lightbulb, Bus } from 'lucide-react'
import { PotholeReport } from '@/types/report'
import { statusLabels, statusColors, PotholeStatus } from '@/hooks/useMunicipalActions'
import dynamic from 'next/dynamic'
import { queryLocationData, type OverpassResult } from '@/lib/overpass'

const MapLocationPicker = dynamic(
  () => import('@/components/map/MapLocationPicker').then(m => m.MapLocationPicker),
  { ssr: false }
)

interface ReportDetailsModalProps {
  report: PotholeReport
  isOpen: boolean
  onClose: () => void
  intToCoordinate: (coord: bigint) => number
}

export function ReportDetailsModal({ report, isOpen, onClose, intToCoordinate }: ReportDetailsModalProps) {
  const [locationData, setLocationData] = useState<OverpassResult | null>(null)
  const [isLoadingLocationData, setIsLoadingLocationData] = useState(false)

  const latitude = intToCoordinate(report.latitude)
  const longitude = intToCoordinate(report.longitude)

  // Fetch location data when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchLocationData = async () => {
      setIsLoadingLocationData(true)
      try {
        const data = await queryLocationData(latitude, longitude)
        setLocationData(data)
      } catch (error) {
        console.error('Error fetching location data:', error)
        setLocationData(null)
      } finally {
        setIsLoadingLocationData(false)
      }
    }

    fetchLocationData()
  }, [isOpen, latitude, longitude])

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

  const PriorityIcon = getPriorityIcon(report.priority)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-4xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between border-b border-slate-200 flex-shrink-0">
          <div className="flex items-start space-x-4">
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

            {/* Report Header Info */}
            <div>
              <CardTitle className="text-2xl mb-2">Report #{report.id}</CardTitle>
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

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6 overflow-y-auto">
          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                <Calendar className="h-4 w-4" />
                <span>Reported Date</span>
              </div>
              <div className="text-sm text-slate-900 pl-6">
                {new Date(report.reportedAt * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                <span className="text-slate-600 ml-2">
                  ({Math.floor((Date.now() / 1000 - report.reportedAt) / 86400)} days ago)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                <User className="h-4 w-4" />
                <span>Reporter Address</span>
              </div>
              <div className="text-sm text-slate-900 font-mono pl-6">
                {report.reporter}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                <MapPin className="h-4 w-4" />
                <span>Coordinates</span>
              </div>
              <div className="flex items-center space-x-2 pl-6">
                <span className="text-sm text-slate-900 font-mono">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Road Information Section */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Road Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                  <Package className="h-4 w-4" />
                  <span>Surface Material</span>
                </div>
                <div className="text-sm text-slate-900 pl-6">
                  {isLoadingLocationData ? (
                    <span className="text-slate-500 italic">Loading...</span>
                  ) : locationData?.surface ? (
                    <span className="capitalize">{locationData.surface}</span>
                  ) : (
                    <span className="text-slate-400">Not available</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                  <Route className="h-4 w-4" />
                  <span>Road Type</span>
                </div>
                <div className="text-sm text-slate-900 pl-6">
                  {isLoadingLocationData ? (
                    <span className="text-slate-500 italic">Loading...</span>
                  ) : locationData?.roadType ? (
                    <span className="capitalize">{locationData.roadType.replace('_', ' ')}</span>
                  ) : (
                    <span className="text-slate-400">Not available</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                  <Gauge className="h-4 w-4" />
                  <span>Speed Limit</span>
                </div>
                <div className="text-sm text-slate-900 pl-6">
                  {isLoadingLocationData ? (
                    <span className="text-slate-500 italic">Loading...</span>
                  ) : locationData?.maxSpeed ? (
                    <span>{locationData.maxSpeed}</span>
                  ) : (
                    <span className="text-slate-400">Not available</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                  <Lightbulb className="h-4 w-4" />
                  <span>Street Lighting</span>
                </div>
                <div className="text-sm text-slate-900 pl-6">
                  {isLoadingLocationData ? (
                    <span className="text-slate-500 italic">Loading...</span>
                  ) : locationData?.lighting ? (
                    <span className="capitalize">{locationData.lighting}</span>
                  ) : (
                    <span className="text-slate-400">Not available</span>
                  )}
                </div>
              </div>

              {locationData?.lanes && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
                    <Route className="h-4 w-4" />
                    <span>Number of Lanes</span>
                  </div>
                  <div className="text-sm text-slate-900 pl-6">
                    {locationData.lanes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description / Rejection Reason */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">
              {report.status === PotholeStatus.Rejected ? 'Rejection Reason' : 'Description'}
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-900">
              {report.status === PotholeStatus.Rejected
                ? (report.rejectionReason || 'No reason provided')
                : (report.ipfsHash?.replace('description:', '') || 'No description provided')}
            </div>
          </div>

          {/* Public Transport */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
              <Bus className="h-4 w-4" />
              <span>Nearby Public Transport</span>
            </div>
            {isLoadingLocationData ? (
              <div className="text-sm text-slate-500 italic pl-6">Loading public transport...</div>
            ) : locationData?.publicTransport && locationData.publicTransport.length > 0 ? (
              <div className="pl-6 space-y-2">
                {locationData.publicTransport.slice(0, 5).map((stop, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Bus className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{stop.name}</div>
                        <div className="text-xs text-slate-600 capitalize">{stop.type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    {stop.distance !== undefined && (
                      <Badge className="bg-blue-100 text-blue-800 text-xs">
                        {stop.distance}m away
                      </Badge>
                    )}
                  </div>
                ))}
                {locationData.publicTransport.length > 5 && (
                  <div className="text-xs text-slate-500 italic">
                    + {locationData.publicTransport.length - 5} more stops nearby
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 pl-6">No public transport stops found nearby</div>
            )}
          </div>

          {/* Nearby Buildings */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
              <Building className="h-4 w-4" />
              <span>Nearby Meaningful Buildings</span>
            </div>
            {isLoadingLocationData ? (
              <div className="text-sm text-slate-500 italic pl-6">Loading nearby buildings...</div>
            ) : locationData?.buildings && locationData.buildings.length > 0 ? (
              <div className="pl-6 space-y-2">
                {locationData.buildings.slice(0, 10).map((building, index) => (
                  <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <Building className="h-4 w-4 text-slate-600" />
                      <div>
                        <div className="text-sm font-medium text-slate-900">{building.name}</div>
                        <div className="text-xs text-slate-600 capitalize">{building.type}</div>
                      </div>
                    </div>
                    {building.distance !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {building.distance}m away
                      </Badge>
                    )}
                  </div>
                ))}
                {locationData.buildings.length > 10 && (
                  <div className="text-xs text-slate-500 italic">
                    + {locationData.buildings.length - 10} more buildings nearby
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 pl-6">No significant buildings found nearby</div>
            )}
          </div>

          {/* Map */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700">
              <Navigation className="h-4 w-4" />
              <span>Location on Map</span>
            </div>
            <div className="rounded-lg overflow-hidden border-2 border-slate-200">
              <MapLocationPicker
                latitude={latitude.toFixed(6)}
                longitude={longitude.toFixed(6)}
                onChange={() => {}} // Read-only - empty handler prevents updates
                center={[latitude, longitude]}
                heightClassName="h-96"
              />
            </div>
          </div>

          {/* Priority Explanation for High Priority Items */}
          {report.priority >= 70 && report.status === PotholeStatus.Reported && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
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

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <Button
              onClick={onClose}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}