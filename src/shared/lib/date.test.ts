import { describe, expect, it } from 'vitest'
import { formatDateEs } from './date'

describe('formatDateEs', () => {
  it('no se corre de día en zonas detrás de UTC (el bug que new Date(str) tiene)', () => {
    expect(formatDateEs('2026-09-11')).toBe('11 de septiembre de 2026')
    expect(formatDateEs('2026-01-01')).toBe('1 de enero de 2026')
    expect(formatDateEs('2026-12-31')).toBe('31 de diciembre de 2026')
  })
})
