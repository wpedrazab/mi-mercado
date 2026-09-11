import { describe, expect, it } from 'vitest'
import { parsePrice } from './ocr'

describe('parsePrice', () => {
  it('coma decimal simple', () => {
    expect(parsePrice('145,50')).toBe(145.5)
  })

  it('punto de miles + coma decimal (formato es-VE)', () => {
    expect(parsePrice('1.339,00')).toBe(1339)
  })

  it('punto decimal simple (USD)', () => {
    expect(parsePrice('9.20')).toBe(9.2)
  })

  it('coma de miles + punto decimal (formato US, por si el OCR lo lee así)', () => {
    expect(parsePrice('1,339.00')).toBe(1339)
  })

  it('punto como separador de miles sin decimales', () => {
    expect(parsePrice('1.339')).toBe(1339)
  })

  it('sin separadores', () => {
    expect(parsePrice('1339')).toBe(1339)
  })

  it('ignora ruido alrededor y se queda con el número más largo', () => {
    expect(parsePrice('Bs 145,50 c/u\n2')).toBe(145.5)
  })

  it('texto sin ningún dígito -> null', () => {
    expect(parsePrice('')).toBeNull()
    expect(parsePrice('   \n  ')).toBeNull()
  })
})
