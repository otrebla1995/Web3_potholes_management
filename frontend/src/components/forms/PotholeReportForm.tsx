'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { useGaslessTransactions } from '@/hooks/useGaslessTransactions'
import { MapPin, Camera, Loader2, Navigation, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function PotholeReportForm() {
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [description, setDescription] = useState('')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [useGasless, setUseGasless] = useState(true) // Default to gasless
  
  // Regular transaction hook
  const {
    submitReport,
    getCurrentLocation,
    hasUserReportedAtLocation,
    isPending,
    isConfirming,
  } = useCitizenActions()

  // Gasless transaction hook
  const {
    submitReportGasless,
    isSubmitting: isGaslessSubmitting,
    isGaslessAvailable,
  } = useGaslessTransactions()

  const handleGetLocation = async () => {
    setIsGettingLocation(true)
    try {
      const location = await getCurrentLocation()
      setLatitude(location.latitude.toString())
      setLongitude(location.longitude.toString())
      toast.success('Location captured!')
    } catch (error: any) {
      console.error('Error getting location:', error)
      toast.error('Failed to get location. Please enter manually.')
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!latitude || !longitude || !description) {
      toast.error('Please fill all fields')
      return
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Please enter valid coordinates')
      return
    }

    // Check if user has already reported at this location
    if (hasUserReportedAtLocation(lat, lng)) {
      toast.error('⚠️ You have already reported a pothole at this location. Please check your previous reports.')
      return
    }

    console.log('🚀 Submitting report:', {
      method: useGasless ? 'gasless' : 'regular',
      lat, lng, description
    })

    let success = false

    // Choose submission method
    if (useGasless && isGaslessAvailable) {
      const txHash = await submitReportGasless(lat, lng, description)
      success = !!txHash
    } else {
      await submitReport(lat, lng, description)
      // For regular transactions, success is handled by the hook
      success = true
    }

    // Reset form on success
    if (success) {
      setLatitude('')
      setLongitude('')
      setDescription('')
    }
  }

  const isLoading = isPending || isConfirming || isGaslessSubmitting

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-orange-500" />
          <span>Report New Pothole</span>
        </CardTitle>
        <CardDescription>
          Help improve your community by reporting road issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">Location</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isGettingLocation || isLoading}
                className="flex items-center space-x-2"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span>{isGettingLocation ? 'Getting...' : 'Get Current Location'}</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="45.4215"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-75.6972"
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the pothole: size, severity, traffic impact..."
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm h-24 focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={isLoading}
            />
          </div>

          {/* Gasless Toggle - Only show if available */}
          {isGaslessAvailable && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-green-900">Gasless Transaction</span>
                      <Badge className="bg-green-100 text-green-800 border-green-300">FREE</Badge>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      No ETH required - just sign the message
                    </p>
                  </div>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useGasless}
                    onChange={(e) => setUseGasless(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-green-800">Enable</span>
                </label>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="report" 
            disabled={isLoading || !latitude || !longitude || !description}
            className="w-full h-12 text-base font-semibold"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>
                  {isGaslessSubmitting ? 'Processing Gasless Transaction...' : 
                   isPending ? 'Submitting to Blockchain...' : 'Confirming Transaction...'}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {useGasless && isGaslessAvailable && <Zap className="h-4 w-4" />}
                <span>
                  {useGasless && isGaslessAvailable ? 'Submit Report (Free)' : 'Submit Pothole Report'}
                </span>
              </div>
            )}
          </Button>
        </form>

        {/* Enhanced Help Text */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <h4 className="text-sm font-medium text-orange-900 mb-2">Reporting Tips:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Use the location button for accurate GPS coordinates</li>
            <li>• Describe the size and severity of the pothole</li>
            <li>• Mention if it affects traffic or poses safety risks</li>
            {useGasless && isGaslessAvailable ? (
              <li>• ⚡ Gasless mode: You only need to sign - no ETH required!</li>
            ) : (
              <li>• You'll earn PBC tokens for valid reports!</li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}