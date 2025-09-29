'use client'

import { useState } from 'react'
import { useAccount, useChainId, useSignTypedData } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import { toast } from 'react-hot-toast'
import { encodeFunctionData } from 'viem'
import { useCity } from '@/hooks/useCity'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'

const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS as `0x${string}`

export function useGaslessTransactions() {
  const { address } = useAccount()
  const chainId = useChainId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const { isWithinBounds, clampToBounds, bounds, cityName } = useCity()

  // Viem's built-in EIP-712 signing
  const { signTypedDataAsync } = useSignTypedData()

  const submitReportGasless = async (
    latitude: number,
    longitude: number,
    description: string
  ): Promise<string | null> => {
    if (!address || !contractAddress || !FORWARDER_ADDRESS) {
      toast.error('Gasless transactions not available')
      return null
    }

    // Guard: enforce city bounds before signing/relaying
    if (bounds && !isWithinBounds(latitude, longitude)) {
      const [clampedLat, clampedLng] = clampToBounds(latitude, longitude)
      toast.error(
        `Location is outside ${cityName || 'city'} bounds. Try a point within [${bounds.minLat.toFixed(4)}, ${bounds.minLng.toFixed(4)}] to [${bounds.maxLat.toFixed(4)}, ${bounds.maxLng.toFixed(4)}].`
      )
      return null
    }

    setIsSubmitting(true)
    console.log('Starting gasless transaction...')

    try {
      // 1. Convert coordinates to contract format
      const coordinateToInt = (coord: number): bigint => {
        return BigInt(Math.round(coord * 1000000))
      }

  // Use clamped values if bounds exist (extra safety)
  const [safeLat, safeLng] = bounds ? clampToBounds(latitude, longitude) : [latitude, longitude]
  const latInt = coordinateToInt(safeLat)
  const lngInt = coordinateToInt(safeLng)
      const ipfsHash = `description:${description}`

      console.log('Coordinates:', { latInt: latInt.toString(), lngInt: lngInt.toString() })

      // Get the current nonce for the user from the Forwarder contract
      const nonce = await fetch("http://localhost:3001/api/relay/nonce?address=" + address)
        .then(res => res.json())
        .then(data => BigInt(data.nonce))

      if (nonce === undefined) {
        throw new Error('Failed to fetch nonce from Forwarder contract')
      }

      console.log('Fetched nonce:', nonce.toString())

      // 2. Encode the function call that we want to execute
      const data = encodeFunctionData({
        abi: PotholesRegistryABI.abi,
        functionName: 'submitReport',
        args: [latInt, lngInt, ipfsHash]
      })

      console.log('Encoded function data:', data)

      // 3. Define EIP-712 domain for the Forwarder
      const domain = {
        name: 'PotholesForwarder',
        version: '1',
        chainId: BigInt(chainId),
        verifyingContract: FORWARDER_ADDRESS,
      }

      // 4. Define the ForwardRequest type structure
      const types = {
        ForwardRequest: [
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "value", type: "uint256" },
            { name: "gas", type: "uint256" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint48" },
            { name: "data", type: "bytes" }
        ]
      };

      // 5. Build the forward request
      const request = {
        from: address,
        to: contractAddress,
        value: BigInt(0),
        gas: BigInt(300000), // Enough gas for the operation
        deadline: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
        data: data,
        signature: '0x', // Placeholder, will be filled after signing
      }

      console.log('Forward request:', request)

      const message = {
        from: request.from,
        to: request.to,
        value: request.value,
        gas: request.gas,
        nonce: nonce,
        deadline: request.deadline,
        data: request.data
    };

      // 6. Ask user to sign the typed data
      toast.loading('Please sign the gasless transaction...')

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'ForwardRequest',
        message: message,
      })

      console.log('Signature:', signature)
      toast.dismiss()

      // 7. Send to relayer
      toast.loading('Relaying transaction...')
      
      const relayResponse = await fetch('http://localhost:3001/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          request: {
            from: request.from,
            to: request.to,
            value: request.value.toString(),
            gas: request.gas.toString(),
            deadline: request.deadline.toString(),
            data: request.data,
            signature: signature
          }, 
        }),
      })

      toast.dismiss()

      if (!relayResponse.ok) {
        throw new Error('Relayer failed to process transaction')
      }

      const result = await relayResponse.json()
      
      if (result.success) {
        toast.success('🎉 Gasless report submitted successfully!')
        console.log('Transaction relayed:', result.txHash)
        return result.txHash
      } else {
        throw new Error(result.error || 'Relay failed')
      }

    } catch (error: any) {
      console.error('Gasless transaction error:', error)
      toast.error(error?.message || 'Failed to submit gasless transaction')
      return null
    } finally {
      setIsSubmitting(false)
    }
  }

  const isGaslessAvailable = !!(
    address && 
    contractAddress && 
    FORWARDER_ADDRESS && 
    process.env.NEXT_PUBLIC_ENABLE_GASLESS === 'true'
  )

  return {
    submitReportGasless,
    isSubmitting,
    isGaslessAvailable,
  }
}