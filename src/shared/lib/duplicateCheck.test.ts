import { describe, expect, it } from 'vitest'
import { isDuplicateName } from './duplicateCheck'

const items = [
  { id: '1', nombre: 'Manzana' },
  { id: '2', nombre: 'Pan' },
]

describe('isDuplicateName', () => {
  it('detecta el mismo nombre exacto', () => {
    expect(isDuplicateName(items, 'Manzana')).toBe(true)
  })

  it('ignora mayúsculas/minúsculas y espacios sobrantes', () => {
    expect(isDuplicateName(items, ' manzana ')).toBe(true)
    expect(isDuplicateName(items, 'MANZANA')).toBe(true)
  })

  it('nombre nuevo no es duplicado', () => {
    expect(isDuplicateName(items, 'Leche')).toBe(false)
  })

  it('excluye el propio id (para renombrar sin chocar consigo mismo)', () => {
    expect(isDuplicateName(items, 'Manzana', '1')).toBe(false)
    expect(isDuplicateName(items, 'Manzana', '2')).toBe(true)
  })
})
