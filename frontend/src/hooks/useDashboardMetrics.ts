"use client"

import { useEffect, useMemo, useState } from 'react'
import { useChainId, usePublicClient } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import { getAllReportsFromEvents } from '@/lib/reports'

export type DailyPoint = { date: string; count: number }

function formatYMD(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function useDashboardMetrics() {
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const contractAddress = contractAddresses[chainId as keyof typeof contractAddresses] as `0x${string}` | undefined

  const [isLoading, setIsLoading] = useState(false)
  const [reports, setReports] = useState<{
    reportedAt: number
  }[]>([])

  // Load all reports via events
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      // If client or address are not ready, ensure loading is false and exit
      if (!publicClient || !contractAddress) {
        if (!cancelled) setIsLoading(false)
        return
      }

      if (!cancelled) setIsLoading(true)
      try {
        const all = await getAllReportsFromEvents(publicClient, contractAddress)
        if (!cancelled) {
          setReports(all.map(r => ({ reportedAt: r.reportedAt })))
        }
      } catch (e) {
        console.error('Failed to load dashboard metrics', e)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [publicClient, contractAddress])

  // Build last 30 days series and month counts
  const { last30d, thisMonthCount } = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 29)

    // Prepare map for last 30 days
    const days: string[] = []
    const counts = new Map<string, number>()
    for (let i = 0; i < 30; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      const key = formatYMD(d)
      days.push(key)
      counts.set(key, 0)
    }

    // Count events by day
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    let monthCount = 0

    for (const r of reports) {
      const d = new Date(r.reportedAt * 1000)
      const key = formatYMD(d)
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1)
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) monthCount++
    }

    const series: DailyPoint[] = days.map(date => ({ date, count: counts.get(date) ?? 0 }))
    return { last30d: series, thisMonthCount: monthCount }
  }, [reports])

  return { isLoading, last30d, thisMonthCount }
}
