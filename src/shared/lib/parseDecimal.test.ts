import { describe, expect, it } from 'vitest'
import { parseDecimalInput } from './parseDecimal'

describe('parseDecimalInput', () => {
  it('acepta coma como separador decimal', () => {
    expect(parseDecimalInput('145,50')).toBe(145.5)
  })

  it('acepta punto como separador decimal', () => {
    expect(parseDecimalInput('9.20')).toBe(9.2)
  })

  it('acepta enteros', () => {
    expect(parseDecimalInput('3')).toBe(3)
  })

  it('recorta espacios', () => {
    expect(parseDecimalInput('  2,5 ')).toBe(2.5)
  })

  it('texto no numérico -> 0', () => {
    expect(parseDecimalInput('')).toBe(0)
    expect(parseDecimalInput('abc')).toBe(0)
  })
})
