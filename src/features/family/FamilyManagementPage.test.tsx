import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AuthState } from '../../app/providers/authState'

const fetchFamily = vi.fn()
const listFamilyMembers = vi.fn()
const inviteMember = vi.fn()
const removeFamilyMember = vi.fn()
const transferPrincipal = vi.fn()

vi.mock('../../data/remote/family', () => ({
  fetchFamily: (...args: unknown[]) => fetchFamily(...args),
  listFamilyMembers: (...args: unknown[]) => listFamilyMembers(...args),
  inviteMember: (...args: unknown[]) => inviteMember(...args),
  removeFamilyMember: (...args: unknown[]) => removeFamilyMember(...args),
  transferPrincipal: (...args: unknown[]) => transferPrincipal(...args),
}))

let authValue: (AuthState & { signOut: () => Promise<void> }) | null = null
vi.mock('../../app/providers/AuthProvider', () => ({ useAuth: () => authValue }))

const { FamilyManagementPage } = await import('./FamilyManagementPage')

function renderPage(initialPath = '/familia') {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/familia" element={<FamilyManagementPage />} />
          <Route path="/admin/familias/:familyId" element={<FamilyManagementPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const MEMBERS = [
  {
    id: 'p-1',
    nombre: 'William Pedraza',
    email: 'will@ejemplo.com',
    rol: 'principal' as const,
    family_id: 'fam-1',
    activo: true,
    created_at: '',
  },
  {
    id: 'p-2',
    nombre: 'María Pedraza',
    email: 'maria@ejemplo.com',
    rol: 'miembro' as const,
    family_id: 'fam-1',
    activo: true,
    created_at: '',
  },
]

beforeEach(() => {
  fetchFamily.mockReset().mockResolvedValue({ id: 'fam-1', nombre: 'Familia Pedraza', estado: 'activa', created_at: '' })
  listFamilyMembers.mockReset().mockResolvedValue(MEMBERS)
  inviteMember.mockReset().mockResolvedValue({ ok: true })
  removeFamilyMember.mockReset().mockResolvedValue(undefined)
  transferPrincipal.mockReset().mockResolvedValue(undefined)
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('FamilyManagementPage — como principal de la propia familia', () => {
  beforeEach(() => {
    authValue = {
      status: 'ready',
      profile: { id: 'p-1', email: 'will@ejemplo.com', nombre: 'William Pedraza', rol: 'principal', family_id: 'fam-1', activo: true, created_at: '' },
      family: { id: 'fam-1', nombre: 'Familia Pedraza', estado: 'activa', created_at: '' },
      signOut: vi.fn(),
    }
  })

  it('lista los miembros e invita a uno nuevo', async () => {
    const user = userEvent.setup()
    renderPage('/familia')

    expect(await screen.findByText('María Pedraza')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nombre'), 'Sofía Pedraza')
    await user.type(screen.getByLabelText('Correo'), 'sofia@ejemplo.com')
    await user.click(screen.getByRole('button', { name: /enviar invitación/i }))

    await waitFor(() =>
      expect(inviteMember).toHaveBeenCalledWith({ familyId: 'fam-1', nombre: 'Sofía Pedraza', email: 'sofia@ejemplo.com' }),
    )
  })

  it('permite quitar a un miembro que no es principal', async () => {
    const user = userEvent.setup()
    renderPage('/familia')

    await screen.findByText('María Pedraza')
    await user.click(screen.getByRole('button', { name: 'Quitar a María Pedraza' }))

    await waitFor(() => expect(removeFamilyMember).toHaveBeenCalledWith('p-2'))
  })

  it('permite traspasar el rol de principal', async () => {
    const user = userEvent.setup()
    renderPage('/familia')

    await screen.findByText('María Pedraza')
    await user.click(screen.getByRole('button', { name: /pasarle el rol de principal/i }))

    await waitFor(() => expect(transferPrincipal).toHaveBeenCalledWith('fam-1', 'p-2'))
  })

  it('no ofrece quitar ni traspasar sobre el propio principal', async () => {
    renderPage('/familia')

    await screen.findByText('María Pedraza')
    expect(screen.queryByRole('button', { name: /quitar a william pedraza/i })).not.toBeInTheDocument()
  })
})

describe('FamilyManagementPage — miembro sin permisos de gestión', () => {
  beforeEach(() => {
    authValue = {
      status: 'ready',
      profile: { id: 'p-2', email: 'maria@ejemplo.com', nombre: 'María Pedraza', rol: 'miembro', family_id: 'fam-1', activo: true, created_at: '' },
      family: { id: 'fam-1', nombre: 'Familia Pedraza', estado: 'activa', created_at: '' },
      signOut: vi.fn(),
    }
  })

  it('ve la lista pero no el formulario de invitar ni los botones de gestión', async () => {
    renderPage('/familia')

    await screen.findByText('William Pedraza')
    expect(screen.queryByLabelText('Correo')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /pasarle el rol de principal/i })).not.toBeInTheDocument()
  })
})

describe('FamilyManagementPage — admin en modo soporte', () => {
  beforeEach(() => {
    authValue = {
      status: 'ready',
      profile: { id: 'admin-1', email: 'admin@ejemplo.com', nombre: 'Admin', rol: 'admin', family_id: null, activo: true, created_at: '' },
      family: null,
      signOut: vi.fn(),
    }
  })

  it('puede gestionar una familia ajena vía /admin/familias/:id', async () => {
    renderPage('/admin/familias/fam-1')

    await screen.findByText('María Pedraza')
    expect(screen.getByRole('button', { name: /enviar invitación/i })).toBeInTheDocument()
    expect(fetchFamily).toHaveBeenCalledWith('fam-1')
  })
})
