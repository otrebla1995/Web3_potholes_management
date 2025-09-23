'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { MapPin, Camera, Loader2, Navigation } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function PotholeReportForm() {
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [description, setDescription] = useState('')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  
  const {
    submitReport,
    getCurrentLocation,
    isPending,
    isConfirming,
  } = useCitizenActions()

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
    
    await submitReport(lat, lng, description)
    
    // Reset form on success
    if (!isPending) {
      setLatitude('')
      setLongitude('')
      setDescription('')
    }
  }

  const isLoading = isPending || isConfirming

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

          {/* Photo Section (Placeholder) */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Photo (Optional)
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-md p-6 text-center bg-slate-50">
              <Camera className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500 mb-2">Photo upload coming soon</p>
              <p className="text-xs text-slate-400">For now, include photo details in description</p>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="report" 
            disabled={isLoading || !latitude || !longitude || !description}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isPending ? 'Submitting...' : 'Confirming...'}</span>
              </div>
            ) : (
              'Submit Pothole Report'
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-md">
          <h4 className="text-sm font-medium text-orange-900 mb-2">Reporting Tips:</h4>
          <ul className="text-sm text-orange-800 space-y-1">
            <li>• Use the location button for accurate GPS coordinates</li>
            <li>• Describe the size and severity of the pothole</li>
            <li>• Mention if it affects traffic or poses safety risks</li>
            <li>• You'll earn PBC tokens for valid reports!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}