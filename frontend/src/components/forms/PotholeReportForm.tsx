'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { useGaslessTransactions } from '@/hooks/useGaslessTransactions'
import { DuplicateAlert } from '@/components/reports/DuplicateAlert'
import { MapPin, Navigation, Loader2, Zap, Wallet, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapLocationPicker = dynamic(
  () => import('@/components/map/MapLocationPicker').then(m => m.MapLocationPicker),
  { ssr: false }
)
import { usePublicClient } from 'wagmi'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { getReportAtLocation } from '@/lib/reports'
import { useCity } from '@/hooks/useCity'

export function PotholeReportForm() {
  const { 
    submitReport, 
    getCurrentLocation, 
    isPending, 
    isConfirming,
    coordinateToInt,
    hasUserReportedAtLocation,
    refreshData
  } = useCitizenActions()

  const {
    submitReportGasless,
    isSubmitting: isGaslessSubmitting,
    isGaslessAvailable
  } = useGaslessTransactions()

  const publicClient = usePublicClient()
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`

  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [description, setDescription] = useState('')
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [existingReportId, setExistingReportId] = useState<number>()
  const [duplicateCount, setDuplicateCount] = useState(1)
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [submissionMethod, setSubmissionMethod] = useState<'normal' | 'gasless'>('normal')
  const { cityName, bounds, isWithinBounds, clampToBounds, center, gridPrecision } = useCity()

  // Check for duplicates and if user already reported
  useEffect(() => {
    const checkLocation = async () => {
      if (!latitude || !longitude || !publicClient || !contractAddress) {
        setIsDuplicate(false)
        setAlreadyReported(false)
        return
      }

      const lat = parseFloat(latitude)
      const lng = parseFloat(longitude)

      if (isNaN(lat) || isNaN(lng)) {
        setIsDuplicate(false)
        setAlreadyReported(false)
        return
      }

      setIsCheckingDuplicate(true)

      try {
        // Check if user already reported at this location
        const userAlreadyReported = hasUserReportedAtLocation(lat, lng)
        setAlreadyReported(userAlreadyReported)

        if (userAlreadyReported) {
          setIsCheckingDuplicate(false)
          return
        }

        // Check for existing reports at this location via shared helper
        const latInt = coordinateToInt(lat)
        const lngInt = coordinateToInt(lng)
        const match = await getReportAtLocation(
          publicClient,
          contractAddress,
          latInt,
          lngInt,
          gridPrecision ?? 1000
        )

        if (match && match.latestStatus === 0) {
          // We only need an approximate duplicate count for UI hint; leave as 1 for simplicity
          setIsDuplicate(true)
          setExistingReportId(match.reportId)
          setDuplicateCount(1)
        } else {
          setIsDuplicate(false)
        }
      } catch (error) {
        console.error('Error checking location:', error)
        setIsDuplicate(false)
        setAlreadyReported(false)
      } finally {
        setIsCheckingDuplicate(false)
      }
    }

    const timer = setTimeout(checkLocation, 500)
    return () => clearTimeout(timer)
  }, [latitude, longitude, publicClient, contractAddress, coordinateToInt, hasUserReportedAtLocation])

  const handleGetLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const location = await getCurrentLocation()
      setLatitude(location.latitude.toFixed(6))
      setLongitude(location.longitude.toFixed(6))
    } catch (error) {
      console.error('Error getting location:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid coordinates')
      return
    }

    if (bounds && !isWithinBounds(lat, lng)) {
      alert('Selected location is outside the registered city bounds')
      return
    }

    if (!description.trim()) {
      alert('Please enter a description')
      return
    }

    if (alreadyReported) {
      alert('You have already reported a pothole at this location')
      return
    }

    try {
      if (submissionMethod === 'gasless' && isGaslessAvailable) {
        const txHash = await submitReportGasless(lat, lng, description)
        if (txHash) {
          // Success handled in hook
          setLatitude('')
          setLongitude('')
          setDescription('')
          setIsDuplicate(false)
          setTimeout(() => refreshData(), 2000)
        }
      } else {
        await submitReport(lat, lng, description)
        // Clear form after submission
        setLatitude('')
        setLongitude('')
        setDescription('')
        setIsDuplicate(false)
      }
    } catch (error) {
      console.error('Submission error:', error)
    }
  }

  const isSubmitting = isPending || isConfirming || isGaslessSubmitting

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Submission Method Selector */}
      {isGaslessAvailable && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">Submission Method</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSubmissionMethod('normal')}
              className={`p-4 rounded-lg border-2 transition-all ${
                submissionMethod === 'normal'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Wallet className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-slate-900">Normal</span>
              </div>
              <p className="text-xs text-slate-600">Pay gas with your wallet</p>
            </button>

            <button
              type="button"
              onClick={() => setSubmissionMethod('gasless')}
              className={`p-4 rounded-lg border-2 transition-all ${
                submissionMethod === 'gasless'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="h-5 w-5 text-purple-600" />
                <span className="font-semibold text-slate-900">Gasless</span>
                <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1 py-0">FREE</Badge>
              </div>
              <p className="text-xs text-slate-600">No gas fees required</p>
            </button>
          </div>
        </div>
      )}

      {/* Location Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Location</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGetLocation}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Getting Location...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Use My Location
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              placeholder="45.123456"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              placeholder="7.123456"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Map Picker */}
        <MapLocationPicker
          latitude={latitude}
          longitude={longitude}
          onChange={(lat, lng) => {
            const [clampedLat, clampedLng] = clampToBounds(lat, lng)
            setLatitude(clampedLat.toFixed(6))
            setLongitude(clampedLng.toFixed(6))
          }}
          center={center ?? [45.4642, 9.19]}
          bounds={bounds}
          cityName={cityName}
        />

        {cityName && bounds && (
          <div className="text-xs text-slate-600">
            City: <span className="font-medium">{cityName}</span> — Bounds: [
            {bounds.minLat.toFixed(4)}, {bounds.minLng.toFixed(4)}] to [
            {bounds.maxLat.toFixed(4)}, {bounds.maxLng.toFixed(4)}]
          </div>
        )}

        {isCheckingDuplicate && (
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Checking location...</span>
          </div>
        )}

        {/* Already Reported Alert */}
        {alreadyReported && (
          <Alert className="border-2 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <p className="font-semibold text-red-900">You've already reported this location!</p>
              <p className="text-sm text-red-700 mt-1">
                Each user can only report a pothole at a specific location once. Choose a different location or check your reports.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Duplicate Alert */}
        {!alreadyReported && (
          <DuplicateAlert
            isDuplicate={isDuplicate}
            existingReportId={existingReportId}
            duplicateCount={duplicateCount}
          />
        )}
      </div>

      {/* Description Section */}
      <div>
        <Label htmlFor="description" className="text-base font-semibold">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Describe the pothole (size, severity, exact location details...)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="mt-2"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <Button
          type="submit"
          className={`w-1/2 ${
            submissionMethod === 'gasless'
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isSubmitting || isCheckingDuplicate || alreadyReported}
        >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isPending || isGaslessSubmitting ? 'Submitting...' : 'Confirming...'}
          </>
        ) : (
          <>
            {submissionMethod === 'gasless' ? (
              <Zap className="h-4 w-4 mr-2" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            {isDuplicate ? 'Confirm Existing Report' : 'Submit Report'}
            {submissionMethod === 'gasless' && ' (Gasless)'}
          </>
        )}
      </Button>
      </div>

      {/* Info Text */}
      <div className="text-center space-y-1">
        <p className="text-xs text-slate-500">
          {isDuplicate 
            ? 'Your confirmation helps prioritize this repair'
            : 'Earn up to 15 PBC tokens when your report is fixed!'}
        </p>
        {submissionMethod === 'gasless' && (
          <p className="text-xs text-purple-600 font-medium">
            ⚡ No gas fees - Powered by meta-transactions
          </p>
        )}
      </div>
    </form>
  )
}