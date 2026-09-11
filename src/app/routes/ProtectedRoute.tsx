import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'
import { BlockedScreen } from '../../features/auth/BlockedScreen'
import { FullScreenSpinner } from '../../shared/ui/FullScreenSpinner'
import type { UserRole } from '../../entities/profile'

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <FullScreenSpinner />
  if (auth.status === 'signedOut') return <Navigate to="/login" state={{ from: location }} replace />
  if (auth.status === 'blocked') return <BlockedScreen reason={auth.reason} onSignOut={auth.signOut} />

  if (roles && !roles.includes(auth.profile.rol)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
