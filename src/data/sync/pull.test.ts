import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const select = vi.fn(async (_table: string) => ({ data: [] as unknown[], error: null }))

vi.mock('../remote/supabaseClient', () => ({
  supabase: {
    from: (table: string) => ({ select: () => select(table) }),
  },
}))

const { db } = await import('../local/db')
const { pullAll } = await import('./pull')

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'
const now = () => new Date().toISOString()

function remoteCategory(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cat-remote',
    family_id: FAMILY_ID,
    nombre: 'Granos y cereales',
    created_at: now(),
    updated_at: now(),
    ...overrides,
  }
}

/** Solo 'categories' devuelve filas; las otras 6 tablas responden vacío. */
function mockRemoteCategories(rows: unknown[]) {
  select.mockImplementation(async (table) => ({
    data: table === 'categories' ? rows : [],
    error: null,
  }))
}

beforeEach(() => {
  select.mockReset()
  mockRemoteCategories([])
})

afterEach(async () => {
  await db.categories.clear()
  await db.products.clear()
  await db.stores.clear()
  await db.shopping_lists.clear()
  await db.list_items.clear()
  await db.purchases.clear()
  await db.purchase_items.clear()
})

describe('pullAll — reconciliación con Dexie', () => {
  it('inserta localmente una fila remota nueva', async () => {
    mockRemoteCategories([remoteCategory()])

    await pullAll()

    const local = await db.categories.get('cat-remote')
    expect(local?.nombre).toBe('Granos y cereales')
    expect(local?.dirty).toBe(0)
  })

  it('no pisa una fila local con cambios sin enviar (dirty)', async () => {
    await db.categories.put({
      id: 'cat-remote',
      family_id: FAMILY_ID,
      nombre: 'Nombre editado localmente',
      created_at: now(),
      updated_at: now(),
      dirty: 1,
    })
    mockRemoteCategories([remoteCategory({ nombre: 'Nombre viejo del servidor' })])

    await pullAll()

    const local = await db.categories.get('cat-remote')
    expect(local?.nombre).toBe('Nombre editado localmente')
    expect(local?.dirty).toBe(1)
  })

  it('borra localmente una fila no-dirty que ya no existe en remoto', async () => {
    await db.categories.put({
      id: 'cat-borrada-en-otro-lado',
      family_id: FAMILY_ID,
      nombre: 'Ya no está',
      created_at: now(),
      updated_at: now(),
      dirty: 0,
    })
    mockRemoteCategories([])

    await pullAll()

    expect(await db.categories.get('cat-borrada-en-otro-lado')).toBeUndefined()
  })

  it('conserva una fila local dirty aunque no venga en la respuesta remota', async () => {
    await db.categories.put({
      id: 'cat-pendiente-de-subir',
      family_id: FAMILY_ID,
      nombre: 'Recién creada offline',
      created_at: now(),
      updated_at: now(),
      dirty: 1,
    })
    mockRemoteCategories([])

    await pullAll()

    expect(await db.categories.get('cat-pendiente-de-subir')).toBeDefined()
  })
})
