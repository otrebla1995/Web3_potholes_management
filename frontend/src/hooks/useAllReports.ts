import { useState, useEffect } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import { PotholeReport } from '@/types/report'
import { getAllReportsFromEvents } from '@/lib/reports'

export function useAllReports() {
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses]
  const [allReports, setAllReports] = useState<PotholeReport[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchAllReports = async () => {
    if (!publicClient || !contractAddress) return

    setIsLoading(true)

    try {
      console.log('⚡ Fetching all reports via events...')
      const fetchedReports: PotholeReport[] = await getAllReportsFromEvents(publicClient, contractAddress)
      console.log(`✅ Successfully fetched ${fetchedReports.length} reports`)
      setAllReports(fetchedReports)

    } catch (error) {
      console.error('❌ Error fetching all reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    if (publicClient && contractAddress) {
      fetchAllReports()
    }
  }, [publicClient, contractAddress])

  return {
    allReports,
    isLoading,
    refreshAllReports: fetchAllReports,
  }
}