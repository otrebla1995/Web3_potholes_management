'use client'

import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Shield,
  Users,
  Building2,
  Settings,
  Activity,
  TrendingUp,
  Map,
  BarChart3,
  Gauge,
  Server,
  Wifi,
  Clock
} from 'lucide-react'
import { useOwnerActions } from '@/hooks/useOwnerActions'
import { AddCitizenForm } from '@/components/forms/AddCitizenForm'
import { AddMunicipalForm } from '@/components/forms/AddMunicipalForm'
import { useCity } from '@/hooks/useCity'
import { useDashboardMetrics } from '@/hooks/useDashboardMetrics'
import { Sparkline } from '@/components/ui/Sparkline'
import { useContractAddresses } from '@/hooks/useContractAddresses'

type ActiveTab = 'overview' | 'citizens' | 'municipal' | 'settings'

export function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview')
  const { citizenCount, totalReports, municipalCount } = useOwnerActions()
  const { cityName } = useCity()
  const { last30d, thisMonthCount, isLoading: isLoadingMetrics } = useDashboardMetrics()
  const { chainId, registry, forwarder, token, isLoading: isLoadingAddrs } = useContractAddresses()

  const copy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
  }

  const kpis = useMemo(
    () => [
      {
        id: 'citizens',
        label: 'Registered Citizens',
        value: citizenCount ?? 0,
        accent: 'from-green-500 to-emerald-500',
        text: 'text-green-600',
        icon: Users,
        hint: '+3.2% vs last week',
      },
      {
        id: 'staff',
        label: 'Municipal Staff',
        value: municipalCount ?? 0,
        accent: 'from-blue-500 to-indigo-500',
        text: 'text-blue-600',
        icon: Building2,
        hint: municipalCount > 0 ? 'All set' : 'Invite your first member',
      },
      {
        id: 'reports',
        label: 'Total Reports',
        value: totalReports ?? 0,
        accent: 'from-orange-500 to-amber-500',
        text: 'text-orange-600',
        icon: Activity,
        hint: `${thisMonthCount} this month`,
      },
      {
        id: 'uptime',
        label: 'System Uptime',
        value: '100%',
        accent: 'from-purple-500 to-fuchsia-500',
        text: 'text-purple-600',
        icon: Gauge,
        hint: 'Last incident 0d ago',
      },
    ],
    [citizenCount, totalReports, municipalCount, thisMonthCount]
  )

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Activity },
    { id: 'citizens' as const, label: 'Citizens', icon: Users },
    { id: 'municipal' as const, label: 'Municipal Staff', icon: Building2 },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ]

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Decorative header with subtle gradient grid */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-200/40 via-transparent to-transparent" />
        <div className="relative px-6 py-10 text-center">
          <div className="mx-auto inline-flex items-center justify-center rounded-xl bg-white/70 px-3 py-2 shadow-sm ring-1 ring-slate-200 backdrop-blur">
            <Shield className="h-5 w-5 text-purple-600 mr-2" />
            <span className="text-xs font-medium text-slate-700">Admin controls</span>
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            System Administration Dashboard
          </h1>
          <p className="mt-2 text-slate-600">Manage users, municipal staff, and system settings.</p>
          {cityName && (
            <div className="mt-4">
              <span className="inline-flex items-center text-sm text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                <Map className="h-4 w-4 mr-1.5 text-slate-600" />
                {cityName}
              </span>
            </div>
          )}
        </div>
        {/* Tabs */}
        <div className="relative -mt-4 flex justify-center pb-4">
          <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    `group relative overflow-hidden rounded-md px-4 py-2 text-sm font-medium transition-all ` +
                    (isActive
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900')
                  }
                >
                  <span className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon
              return (
                <Card key={kpi.id} className="group relative overflow-hidden">
                  <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-tr ${kpi.accent} opacity-20 blur-2xl`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 ${kpi.text}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <CardDescription className="text-slate-600">{kpi.label}</CardDescription>
                      </div>
                      <BarChart3 className="h-4 w-4 text-slate-400" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`text-3xl font-bold ${kpi.text}`}>{kpi.value}</div>
                    <p className="mt-1 text-xs text-slate-500">{kpi.hint}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* System Overview and Quick Actions */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" /> System Health
                </CardTitle>
                <CardDescription>Live view of core components</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-slate-600">Contract Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[92%] rounded-full bg-green-500" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Response SLA 92%</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-slate-600">Network</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">Localhost</Badge>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[100%] rounded-full bg-blue-500" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Latency ~0ms</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-slate-600">Last Activity</span>
                      </div>
                      <Badge variant="outline">Just now</Badge>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full w-[70%] rounded-full bg-purple-500" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Throughput 70%</p>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-slate-700" />
                    <span className="text-sm font-medium text-slate-700">Reports trend (last 30d)</span>
                  </div>
                  {last30d && last30d.length > 0 ? (
                    <Sparkline
                      className="w-full"
                      data={last30d.map(p => p.count)}
                      width={560}
                      height={96}
                      stroke="#f97316" /* orange-500 */
                      fill="rgba(249, 115, 22, 0.12)"
                    />
                  ) : (
                    <div className="h-24 w-full rounded-md bg-slate-50" />
                  )}
                  <p className="mt-2 text-xs text-slate-500">{isLoadingMetrics ? 'Loading data…' : 'Daily report submissions'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Jump to frequent tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="owner"
                    onClick={() => setActiveTab('citizens')}
                    className="h-20 flex-col shadow-sm"
                  >
                    <Users className="h-5 w-5 mb-1" />
                    <span className="text-xs">Manage Citizens</span>
                  </Button>
                  <Button
                    variant="municipal"
                    onClick={() => setActiveTab('municipal')}
                    className="h-20 flex-col shadow-sm"
                  >
                    <Building2 className="h-5 w-5 mb-1" />
                    <span className="text-xs">Manage Staff</span>
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <span className="text-xs text-slate-500">Tip: you can invite staff from the Municipal tab</span>
              </CardFooter>
            </Card>
          </div>

          {/* Deployed Contracts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" /> Deployed Contracts
              </CardTitle>
              <CardDescription>Current chain and contract addresses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Chain</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">{chainId ?? '—'}</p>
                    <Badge variant="outline">local</Badge>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Registry</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-mono text-slate-800 truncate" title={registry || ''}>{registry || (isLoadingAddrs ? 'Loading…' : '—')}</p>
                    <Button size="sm" variant="secondary" onClick={() => registry && copy(registry)}>Copy</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Forwarder</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-mono text-slate-800 truncate" title={forwarder || ''}>{forwarder || (isLoadingAddrs ? 'Loading…' : '—')}</p>
                    <Button size="sm" variant="secondary" onClick={() => forwarder && copy(forwarder)}>Copy</Button>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">Token</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-mono text-slate-800 truncate" title={token || ''}>{token || (isLoadingAddrs ? 'Loading…' : '—')}</p>
                    <Button size="sm" variant="secondary" onClick={() => token && copy(token)}>Copy</Button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">Addresses are read from the Registry on this chain.</p>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" /> Recent Activity
              </CardTitle>
              <CardDescription>Latest on-chain or system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-800">Citizens</p>
                  <p className="text-xs text-slate-500">Total now {citizenCount ?? 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-800">Reports</p>
                  <p className="text-xs text-slate-500">Total now {totalReports ?? 0}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm font-medium text-slate-800">Municipal Staff</p>
                  <p className="text-xs text-slate-500">No members yet</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'citizens' && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Citizen Management</h2>
            <p className="text-slate-600">Add, remove, and manage registered citizens</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add new citizen</CardTitle>
              <CardDescription>Register a wallet address as a citizen</CardDescription>
            </CardHeader>
            <CardContent>
              <AddCitizenForm />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'municipal' && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Municipal Authority Management</h2>
            <p className="text-slate-600">Add and remove municipal staff members</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invite staff member</CardTitle>
              <CardDescription>Grant municipal privileges to a wallet</CardDescription>
            </CardHeader>
            <CardContent>
              <AddMunicipalForm />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Settings panel coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}