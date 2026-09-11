import { describe, expect, it, vi } from 'vitest'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '../../entities/profile'
import type { Family } from '../../entities/family'

const fetchOwnProfile = vi.fn<(userId: string) => Promise<Profile | null>>()
const fetchFamily = vi.fn<(familyId: string) => Promise<Family | null>>()

vi.mock('../../data/remote/profiles', () => ({ fetchOwnProfile: (id: string) => fetchOwnProfile(id) }))
vi.mock('../../data/remote/families', () => ({ fetchFamily: (id: string) => fetchFamily(id) }))

const { resolveAuthState } = await import('./authState')

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    email: 'user@example.com',
    nombre: 'Usuaria',
    rol: 'miembro',
    family_id: 'family-1',
    activo: true,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

const session = { user: { id: 'user-1' } } as unknown as Session

describe('resolveAuthState', () => {
  it('sin sesión -> signedOut', async () => {
    expect(await resolveAuthState(null)).toEqual({ status: 'signedOut' })
  })

  it('sesión sin fila de profile (no debería pasar) -> signedOut', async () => {
    fetchOwnProfile.mockResolvedValueOnce(null)
    expect(await resolveAuthState(session)).toEqual({ status: 'signedOut' })
  })

  it('perfil desactivado -> blocked/cuenta_inactiva', async () => {
    const profile = makeProfile({ activo: false })
    fetchOwnProfile.mockResolvedValueOnce(profile)

    expect(await resolveAuthState(session)).toEqual({ status: 'blocked', reason: 'cuenta_inactiva', profile })
  })

  it('admin sin family_id -> ready con family null, sin consultar families', async () => {
    const profile = makeProfile({ rol: 'admin', family_id: null })
    fetchOwnProfile.mockResolvedValueOnce(profile)

    expect(await resolveAuthState(session)).toEqual({ status: 'ready', profile, family: null })
    expect(fetchFamily).not.toHaveBeenCalled()
  })

  it('familia inactiva (RLS no la deja ver) -> blocked/familia_inactiva', async () => {
    const profile = makeProfile()
    fetchOwnProfile.mockResolvedValueOnce(profile)
    fetchFamily.mockResolvedValueOnce(null)

    expect(await resolveAuthState(session)).toEqual({ status: 'blocked', reason: 'familia_inactiva', profile })
  })

  it('perfil activo con familia activa -> ready', async () => {
    const profile = makeProfile()
    const family: Family = { id: 'family-1', nombre: 'Familia Pedraza', estado: 'activa', created_at: new Date().toISOString() }
    fetchOwnProfile.mockResolvedValueOnce(profile)
    fetchFamily.mockResolvedValueOnce(family)

    expect(await resolveAuthState(session)).toEqual({ status: 'ready', profile, family })
  })
})
