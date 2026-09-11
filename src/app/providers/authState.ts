import type { Session } from '@supabase/supabase-js'
import { fetchOwnProfile } from '../../data/remote/profiles'
import { fetchFamily } from '../../data/remote/families'
import type { Profile } from '../../entities/profile'
import type { Family } from '../../entities/family'

export type BlockedReason = 'cuenta_inactiva' | 'familia_inactiva'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'blocked'; reason: BlockedReason; profile: Profile }
  | { status: 'ready'; profile: Profile; family: Family | null }

/**
 * Traduce la sesión de Supabase Auth al estado real de la cuenta dentro de
 * la app: activo/inactivo y, si tiene familia, si esa familia sigue activa.
 * El admin no tiene family_id, así que se salta ese chequeo.
 */
export async function resolveAuthState(session: Session | null): Promise<AuthState> {
  if (!session) return { status: 'signedOut' }

  const profile = await fetchOwnProfile(session.user.id)
  if (!profile) return { status: 'signedOut' }

  if (!profile.activo) return { status: 'blocked', reason: 'cuenta_inactiva', profile }

  if (!profile.family_id) return { status: 'ready', profile, family: null }

  const family = await fetchFamily(profile.family_id)
  if (!family) return { status: 'blocked', reason: 'familia_inactiva', profile }

  return { status: 'ready', profile, family }
}
