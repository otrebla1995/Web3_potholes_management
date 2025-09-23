'use client'

import { useUserRole } from '@/hooks/useUserRole'
import { USER_ROLES } from '@/lib/utils'
import { OwnerDashboard } from './OwnerDashboard'
import { MunicipalDashboard } from './MunicipalDashboard'
import { CitizenDashboard } from './CitizenDashboard'
import { UnauthorizedView } from './UnauthorizedView'

export function Dashboard() {
  const { role, isLoading } = useUserRole()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  switch (role) {
    case USER_ROLES.OWNER:
      return <OwnerDashboard />
    case USER_ROLES.MUNICIPAL:
      return <MunicipalDashboard />
    case USER_ROLES.CITIZEN:
      return <CitizenDashboard />
    default:
      return <UnauthorizedView />
  }
}