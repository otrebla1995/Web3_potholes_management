 'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MapPin, Users, Award, TrendingUp, CheckCircle, Coins } from 'lucide-react'
import { useCitizenActions } from '@/hooks/useCitizenActions'
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { contractAddresses } from '@/lib/config'
import PotholesRegistryABI from '@/contracts/abi/PotholesRegistry.json'
import { formatUnits } from 'viem'

export function ContributionStats() {
  const { userReports, duplicateReports, totalReports } = useCitizenActions()
  const { address: userAddress } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const registryAddress = contractAddresses[chainId as keyof typeof contractAddresses]

  // Minimal ERC20 ABI for balance/decimals
  const ERC20_ABI = useMemo(() => ([
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'uint8' }] },
  ] as const), [])

  const [pbcBalance, setPbcBalance] = useState<string | null>(null)
  const [isBalanceLoading, setIsBalanceLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchBalance() {
      if (!publicClient || !registryAddress || !userAddress) return
      try {
        setIsBalanceLoading(true)
        // 1) Get token address from registry
        const tokenAddress = await publicClient.readContract({
          address: registryAddress,
          abi: PotholesRegistryABI.abi,
          functionName: 'potholeToken',
        }) as `0x${string}`

        // 2) Get decimals & user balance
        const [decimals, balance] = await Promise.all([
          publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'decimals' }) as Promise<number>,
          publicClient.readContract({ address: tokenAddress, abi: ERC20_ABI, functionName: 'balanceOf', args: [userAddress] }) as Promise<bigint>,
        ])

        if (!cancelled) {
          const formatted = formatUnits(balance, decimals)
          setPbcBalance(formatted)
        }
      } catch (e) {
        if (!cancelled) setPbcBalance(null)
      } finally {
        if (!cancelled) setIsBalanceLoading(false)
      }
    }

    fetchBalance()
    return () => {
      cancelled = true
    }
  }, [publicClient, registryAddress, userAddress, ERC20_ABI])

  // Calculate stats
  const completedReports = userReports.filter(r => r.status === 2).length
  const inProgressReports = userReports.filter(r => r.status === 1).length
  const totalContributions = userReports.length + duplicateReports.length
  const potentialRewards = completedReports * 15 // 10 + 5 PBC per completed report
  const contributionPercentage = totalReports > 0 
    ? ((totalContributions / totalReports) * 100).toFixed(1)
    : '0'

  const stats = [
    {
      label: 'PBC Balance',
      value: isBalanceLoading ? 'Loading…' : (pbcBalance !== null ? `${Number(pbcBalance).toFixed(2)} PBC` : '—'),
      icon: Coins,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      label: 'Original Reports',
      value: userReports.length,
      icon: MapPin,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Confirmations',
      value: duplicateReports.length,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Completed',
      value: completedReports,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ]

  return (
    <div className="space-y-4">
      {/* Impact Banner */}
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 text-white">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="h-6 w-6" />
              <h3 className="text-2xl font-bold">Your Community Impact</h3>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <p className="text-blue-100">
                You've contributed to {contributionPercentage}% of all pothole reports
              </p>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                {totalContributions} Total Contributions
              </Badge>
            </div>
            <div className="flex items-center justify-center space-x-2">
              {inProgressReports > 0 && (
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {inProgressReports} In Progress
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card 
              key={stat.label} 
              className={`${stat.bgColor} ${stat.borderColor} border-2 hover:shadow-md transition-shadow`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-1">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Achievement Badges */}
      {totalContributions > 0 && (
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Award className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900">Community Champion</h4>
                  <p className="text-sm text-amber-700">
                    {totalContributions >= 10 
                      ? '🏆 Elite Contributor - 10+ reports!'
                      : totalContributions >= 5
                      ? '⭐ Active Contributor - 5+ reports!'
                      : totalContributions >= 3
                      ? '🌟 Rising Star - 3+ reports!'
                      : '🎯 Getting Started - Keep going!'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-amber-600">Level {Math.floor(totalContributions / 5) + 1}</p>
                <p className="text-xs text-amber-500">
                  {5 - (totalContributions % 5)} more to next level
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}