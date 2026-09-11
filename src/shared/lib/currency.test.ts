import { describe, expect, it } from 'vitest'
import { formatAmount, formatUsd, toUsd } from './currency'

describe('toUsd', () => {
  it('USD no convierte (no repite el valor)', () => {
    expect(toUsd(9.2, 'USD', 1)).toBe(9.2)
  })

  it('VES se divide por la tasa (Bs por 1 USD)', () => {
    expect(toUsd(1339, 'VES', 145.5)).toBeCloseTo(9.2, 2)
  })

  it('COP se divide por la tasa igual que VES', () => {
    expect(toUsd(40130, 'COP', 4361.96)).toBeCloseTo(9.2, 1)
  })
})

describe('formatAmount / formatUsd', () => {
  it('formatea con separador de miles "." y decimal ","', () => {
    expect(formatAmount(1339, 'VES')).toBe('Bs 1.339,00')
    expect(formatAmount(9.2, 'USD')).toBe('$ 9,20')
  })

  it('formatUsd siempre usa "$"', () => {
    expect(formatUsd(9.2)).toBe('$9,20')
  })
})
