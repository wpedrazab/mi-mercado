import { describe, expect, it } from 'vitest'
import { sortByName } from './sortByName'

describe('sortByName', () => {
  it('ordena alfabéticamente en español (acentos, ñ)', () => {
    const items = [{ nombre: 'Ñame' }, { nombre: 'Arroz' }, { nombre: 'Ábaco' }, { nombre: 'Banana' }]
    expect(sortByName(items, (i) => i.nombre).map((i) => i.nombre)).toEqual(['Ábaco', 'Arroz', 'Banana', 'Ñame'])
  })

  it('no muta el arreglo original', () => {
    const items = [{ nombre: 'Zeta' }, { nombre: 'Alfa' }]
    const sorted = sortByName(items, (i) => i.nombre)
    expect(items.map((i) => i.nombre)).toEqual(['Zeta', 'Alfa'])
    expect(sorted.map((i) => i.nombre)).toEqual(['Alfa', 'Zeta'])
  })
})
