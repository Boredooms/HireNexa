import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export type UserRole = 'student' | 'recruiter' | 'verifier' | 'admin'

export interface UserPermissions {
  userId: string
  role: UserRole
  isRecruiter: boolean
  isAdmin: boolean
  isVerifier: boolean
}

/**
 * Get user permissions from database
 * Checks both role field and boolean flags for consistency
 */
export async function getUserPermissions(): Promise<UserPermissions | null> {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  const { data: user } = await supabase
    .from('users')
    .select('role, is_recruiter, is_admin')
    .eq('id', userId)
    .single()

  if (!user) {
    return null
  }

  return {
    userId,
    role: user.role as UserRole,
    isRecruiter: user.is_recruiter === true || user.role === 'recruiter',
    isAdmin: user.is_admin === true || user.role === 'admin',
    isVerifier: user.role === 'verifier',
  }
}

/**
 * Require specific role or redirect to appropriate page
 */
export async function requireRole(
  allowedRoles: UserRole[],
  redirectTo: string = '/dashboard'
): Promise<UserPermissions> {
  const permissions = await getUserPermissions()

  if (!permissions) {
    redirect('/sign-in')
  }

  const hasAccess = allowedRoles.some(role => {
    if (role === 'admin') return permissions.isAdmin
    if (role === 'recruiter') return permissions.isRecruiter
    if (role === 'verifier') return permissions.isVerifier
    if (role === 'student') return true // Everyone can be a student
    return false
  })

  if (!hasAccess) {
    redirect(redirectTo)
  }

  return permissions
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(requiredRole: UserRole): Promise<boolean> {
  const permissions = await getUserPermissions()
  
  if (!permissions) {
    return false
  }

  switch (requiredRole) {
    case 'admin':
      return permissions.isAdmin
    case 'recruiter':
      return permissions.isRecruiter
    case 'verifier':
      return permissions.isVerifier
    case 'student':
      return true
    default:
      return false
  }
}

/**
 * Ensure user role and flags are consistent in database
 * This fixes any inconsistencies where role='admin' but is_admin=false
 */
export async function syncUserRoleFlags(userId: string): Promise<void> {
  const { data: user } = await supabase
    .from('users')
    .select('role, is_recruiter, is_admin')
    .eq('id', userId)
    .single()

  if (!user) return

  // Determine what flags should be based on role
  const shouldBeAdmin = user.role === 'admin'
  const shouldBeRecruiter = user.role === 'recruiter' || user.role === 'admin'
  
  // Check if flags are inconsistent
  const needsUpdate = 
    (shouldBeAdmin && !user.is_admin) ||
    (shouldBeRecruiter && !user.is_recruiter) ||
    (!shouldBeAdmin && user.is_admin) ||
    (!shouldBeRecruiter && user.is_recruiter && user.role !== 'admin')

  if (needsUpdate) {
    console.log(`🔧 Syncing role flags for user ${userId}`)
    await supabase
      .from('users')
      .update({
        is_admin: shouldBeAdmin,
        is_recruiter: shouldBeRecruiter,
      })
      .eq('id', userId)
  }
}
