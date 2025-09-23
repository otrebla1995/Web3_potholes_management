'use client'

import { useState } from 'react'
import { useAccount, useChainId, useSignTypedData } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import { toast } from 'react-hot-toast'
import { encodeFunctionData } from 'viem'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'

const FORWARDER_ADDRESS = process.env.NEXT_PUBLIC_FORWARDER_ADDRESS as `0x${string}`

export function useGaslessTransactions() {
  const { address } = useAccount()
  const chainId = useChainId()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]

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

    setIsSubmitting(true)
    console.log('Starting gasless transaction...')

    try {
      // 1. Convert coordinates to contract format
      const coordinateToInt = (coord: number): bigint => {
        return BigInt(Math.round(coord * 1000000))
      }

      const latInt = coordinateToInt(latitude)
      const lngInt = coordinateToInt(longitude)
      const ipfsHash = `description:${description}`

      console.log('Coordinates:', { latInt: latInt.toString(), lngInt: lngInt.toString() })

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
        version: '0.0.1',
        chainId: BigInt(chainId),
        verifyingContract: FORWARDER_ADDRESS,
      }

      // 4. Define the ForwardRequest type structure
      const types = {
        ForwardRequest: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'data', type: 'bytes' },
        ],
      }

      // 5. Build the forward request
      const request = {
        from: address,
        to: contractAddress,
        value: BigInt(0),
        gas: BigInt(200000), // Enough gas for the operation
        nonce: BigInt(Date.now()), // Simplified nonce for demo
        data,
      }

      console.log('Forward request:', request)

      // 6. Ask user to sign the typed data
      toast.loading('Please sign the gasless transaction...')

      const signature = await signTypedDataAsync({
        domain,
        types,
        primaryType: 'ForwardRequest',
        message: request,
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
            nonce: request.nonce.toString(),
            data: request.data,
          }, 
          signature 
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