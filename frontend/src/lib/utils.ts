import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// User role detection utilities
export const USER_ROLES = {
  OWNER: 'owner',
  MUNICIPAL: 'municipal',
  CITIZEN: 'citizen', 
  UNAUTHORIZED: 'unauthorized'
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]