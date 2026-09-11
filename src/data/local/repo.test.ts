import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const upsert = vi.fn(async (): Promise<{ error: Error | null }> => ({ error: null }))
const del = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
const select = vi.fn(async () => ({ data: [], error: null }))

vi.mock('../remote/supabaseClient', () => ({
  supabase: {
    from: () => ({ upsert, select, delete: del }),
  },
}))

// create()/update()/remove() disparan un syncNow() de fondo si hay "conexión"
// (navigator.onLine es true en jsdom); se anula acá para que los tests
// controlen el flush explícitamente con flushOutbox() y no haya carreras.
vi.mock('../sync/engine', () => ({ syncNow: vi.fn() }))

const { db } = await import('./db')
const { categoriesRepo } = await import('./repos')
const { flushOutbox } = await import('../sync/outbox')

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

beforeEach(() => {
  upsert.mockClear()
  del.mockClear()
})

afterEach(async () => {
  await db.categories.clear()
  await db.outbox.clear()
})

describe('categoriesRepo.create', () => {
  it('escribe la fila localmente y encola su push', async () => {
    const row = await categoriesRepo.create({ family_id: FAMILY_ID, nombre: 'Bebidas', created_at: new Date().toISOString() })

    const stored = await db.categories.get(row.id)
    expect(stored?.nombre).toBe('Bebidas')
    expect(stored?.dirty).toBe(1)

    const outboxEntries = await db.outbox.toArray()
    expect(outboxEntries).toHaveLength(1)
    expect(outboxEntries[0].table).toBe('categories')
    expect(outboxEntries[0].op).toBe('insert')
    expect(outboxEntries[0].payload).not.toHaveProperty('dirty')
    expect(outboxEntries[0].payload?.nombre).toBe('Bebidas')
  })

  it('al hacer flush exitoso, limpia el outbox y marca la fila como no-dirty', async () => {
    const row = await categoriesRepo.create({ family_id: FAMILY_ID, nombre: 'Snacks', created_at: new Date().toISOString() })

    const result = await flushOutbox()

    expect(upsert).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ sent: 1, pending: 0 })
    expect(await db.outbox.count()).toBe(0)
    expect((await db.categories.get(row.id))?.dirty).toBe(0)
  })

  it('si el push falla, la entrada se queda en el outbox para reintentar', async () => {
    upsert.mockResolvedValueOnce({ error: new Error('sin conexión') })
    await categoriesRepo.create({ family_id: FAMILY_ID, nombre: 'Congelados', created_at: new Date().toISOString() })

    const result = await flushOutbox()

    expect(result.pending).toBe(1)
    const entries = await db.outbox.toArray()
    expect(entries[0].attempts).toBe(1)
    expect(entries[0].lastError).toContain('sin conexión')
  })
})
