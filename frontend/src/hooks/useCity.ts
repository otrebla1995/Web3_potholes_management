'use client'

import { useMemo } from 'react'
import { useChainId, useReadContract } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'

export interface CityBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export function useCity() {
  const chainId = useChainId()
  const addressFromConfig = contractAddresses[chainId as keyof typeof contractAddresses]
  const envAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined
  const contractAddress = (addressFromConfig || envAddress) as `0x${string}` | undefined

  // cityName
  const { data: cityNameData } = useReadContract({
    address: contractAddress,
    abi: PotholesRegistryABI.abi,
    functionName: 'cityName',
  })

  // bounds and precision (int microdegrees)
  const { data: minLatData } = useReadContract({ address: contractAddress, abi: PotholesRegistryABI.abi, functionName: 'cityMinLat' })
  const { data: maxLatData } = useReadContract({ address: contractAddress, abi: PotholesRegistryABI.abi, functionName: 'cityMaxLat' })
  const { data: minLngData } = useReadContract({ address: contractAddress, abi: PotholesRegistryABI.abi, functionName: 'cityMinLng' })
  const { data: maxLngData } = useReadContract({ address: contractAddress, abi: PotholesRegistryABI.abi, functionName: 'cityMaxLng' })
  const { data: gridPrecisionData } = useReadContract({ address: contractAddress, abi: PotholesRegistryABI.abi, functionName: 'grid_precision' })

  const cityName = (cityNameData as string) || ''

  // Convert bigint/int256 to number degrees (microdegrees -> degrees)
  const bounds: CityBounds | null = useMemo(() => {
    try {
      if (
        minLatData === undefined ||
        maxLatData === undefined ||
        minLngData === undefined ||
        maxLngData === undefined
      ) {
        return null
      }
      const minLat = Number(minLatData as bigint) / 1_000_000
      const maxLat = Number(maxLatData as bigint) / 1_000_000
      const minLng = Number(minLngData as bigint) / 1_000_000
      const maxLng = Number(maxLngData as bigint) / 1_000_000
      if (!isFinite(minLat) || !isFinite(maxLat) || !isFinite(minLng) || !isFinite(maxLng)) return null
      return { minLat, maxLat, minLng, maxLng }
    } catch {
      return null
    }
  }, [minLatData, maxLatData, minLngData, maxLngData])

  const gridPrecision = useMemo(() => {
    try {
      return gridPrecisionData ? Number(gridPrecisionData as bigint) : undefined
    } catch {
      return undefined
    }
  }, [gridPrecisionData])

  const center: [number, number] | null = useMemo(() => {
    if (!bounds) return null
    return [
      (bounds.minLat + bounds.maxLat) / 2,
      (bounds.minLng + bounds.maxLng) / 2,
    ]
  }, [bounds])

  const isWithinBounds = (lat: number, lng: number): boolean => {
    if (!bounds) return true
    return lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng
  }

  const clampToBounds = (lat: number, lng: number): [number, number] => {
    if (!bounds) return [lat, lng]
    const clampedLat = Math.min(Math.max(lat, bounds.minLat), bounds.maxLat)
    const clampedLng = Math.min(Math.max(lng, bounds.minLng), bounds.maxLng)
    return [clampedLat, clampedLng]
  }

  return {
    contractAddress,
    cityName,
    bounds,
    gridPrecision,
    center,
    isWithinBounds,
    clampToBounds,
  }
}
