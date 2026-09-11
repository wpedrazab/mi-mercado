import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const listFamiliesWithSummary = vi.fn()
const createFamily = vi.fn()
const renameProfile = vi.fn()

vi.mock('../../data/remote/admin', () => ({
  listFamiliesWithSummary: (...args: unknown[]) => listFamiliesWithSummary(...args),
  createFamily: (...args: unknown[]) => createFamily(...args),
  renameProfile: (...args: unknown[]) => renameProfile(...args),
}))

vi.mock('../../app/providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'ready', profile: { id: 'admin-1', rol: 'admin' }, family: null, signOut: vi.fn() }),
}))

const { AdminPanelPage } = await import('./AdminPanelPage')

function renderPage() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminPanelPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  listFamiliesWithSummary.mockReset().mockResolvedValue([
    {
      family: { id: 'fam-1', nombre: 'Familia Pedraza', estado: 'activa', created_at: '' },
      memberCount: 4,
      principal: {
        id: 'p-1',
        nombre: 'William Pedraza',
        email: 'will@ejemplo.com',
        rol: 'principal',
        family_id: 'fam-1',
        activo: true,
        created_at: '',
      },
    },
  ])
  createFamily.mockReset().mockResolvedValue({ family: { id: 'fam-2' } })
})

afterEach(() => {
  cleanup()
})

describe('AdminPanelPage', () => {
  it('lista las familias existentes', async () => {
    renderPage()

    expect(await screen.findByText('Familia Pedraza')).toBeInTheDocument()
    expect(screen.getByText(/Principal: William Pedraza/)).toBeInTheDocument()
    expect(screen.getByText('4 miembros')).toBeInTheDocument()
  })

  it('crea una familia con el formulario', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Nombre de la familia'), 'Familia Gómez')
    await user.type(screen.getByLabelText('Nombre del usuario principal'), 'Ana Gómez')
    await user.type(screen.getByLabelText('Correo del usuario principal'), 'ana@ejemplo.com')
    await user.click(screen.getByRole('button', { name: /crear e invitar/i }))

    await waitFor(() => expect(createFamily).toHaveBeenCalled())
    expect(createFamily.mock.calls[0][0]).toEqual({
      familyName: 'Familia Gómez',
      principalName: 'Ana Gómez',
      principalEmail: 'ana@ejemplo.com',
    })
  })

  it('muestra el error de la función si la creación falla', async () => {
    createFamily.mockRejectedValueOnce(new Error('Ese correo ya tiene una cuenta en la plataforma.'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Nombre de la familia'), 'Familia Gómez')
    await user.type(screen.getByLabelText('Nombre del usuario principal'), 'Ana Gómez')
    await user.type(screen.getByLabelText('Correo del usuario principal'), 'ana@ejemplo.com')
    await user.click(screen.getByRole('button', { name: /crear e invitar/i }))

    expect(await screen.findByText('Ese correo ya tiene una cuenta en la plataforma.')).toBeInTheDocument()
  })
})
