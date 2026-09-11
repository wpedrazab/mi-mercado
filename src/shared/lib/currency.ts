import type { CurrencyCode } from '../../data/local/types'

const CURRENCY_LABEL: Record<CurrencyCode, string> = { VES: 'Bs', USD: '$', COP: '$' }

const numberFormatter = new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "Bs 1.339,00" / "$9,20" — el formato de número que usan los mockups (coma decimal, punto de miles). */
export function formatAmount(amount: number, currency: CurrencyCode): string {
  return `${CURRENCY_LABEL[currency]} ${numberFormatter.format(amount)}`
}

export function formatUsd(amount: number): string {
  return `$${numberFormatter.format(amount)}`
}

/**
 * tasa_cambio es "cuántas unidades de esa moneda por 1 USD" (como se
 * ingresa en Iniciar compra: "1 USD = 145,50 Bs"). En USD no se repite el
 * valor porque ya es la moneda de normalización.
 */
export function toUsd(amount: number, currency: CurrencyCode, rate: number): number {
  if (currency === 'USD') return amount
  return amount / rate
}
