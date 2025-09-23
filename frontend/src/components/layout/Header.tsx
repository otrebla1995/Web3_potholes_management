'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useUserRole } from '@/hooks/useUserRole'
import { Badge } from '@/components/ui/Badge'
import { Construction, Shield, Users, UserX } from 'lucide-react'
import { USER_ROLES } from '@/lib/utils'

const roleIcons = {
  [USER_ROLES.OWNER]: Shield,
  [USER_ROLES.MUNICIPAL]: Construction, 
  [USER_ROLES.CITIZEN]: Users,
  [USER_ROLES.UNAUTHORIZED]: UserX,
}

const roleColors = {
  [USER_ROLES.OWNER]: 'bg-purple-100 text-purple-800 border-purple-200',
  [USER_ROLES.MUNICIPAL]: 'bg-blue-100 text-blue-800 border-blue-200',
  [USER_ROLES.CITIZEN]: 'bg-green-100 text-green-800 border-green-200',
  [USER_ROLES.UNAUTHORIZED]: 'bg-gray-100 text-gray-800 border-gray-200',
}

const roleLabels = {
  [USER_ROLES.OWNER]: 'System Owner',
  [USER_ROLES.MUNICIPAL]: 'Municipal Authority',
  [USER_ROLES.CITIZEN]: 'Registered Citizen',
  [USER_ROLES.UNAUTHORIZED]: 'Unauthorized',
}

export function Header() {
  const { role, isLoading, address } = useUserRole()
  const RoleIcon = roleIcons[role]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-red-600">
            <Construction className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">PotholeTracker</h1>
            <p className="text-sm text-slate-500">Municipal Management System</p>
          </div>
        </div>

        {/* User Role and Connect Button */}
        <div className="flex items-center space-x-4">
          {address && (
            <div className="flex items-center space-x-2">
              <Badge className={`${roleColors[role]} flex items-center space-x-1`}>
                <RoleIcon className="h-3 w-3" />
                <span className="text-xs font-medium">{roleLabels[role]}</span>
              </Badge>
            </div>
          )}
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}