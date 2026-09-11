import type { Worker } from 'tesseract.js'

/**
 * Import dinámico: tesseract.js es pesado y quien nunca escanea un precio
 * (o ni siquiera inició sesión todavía) no debería pagar ese costo en el
 * bundle inicial. Un solo worker para toda la sesión — cargar el modelo
 * (~10-15 MB, cacheado por el Service Worker una vez con conexión) es lo
 * caro, no reconocer una foto — así que se reutiliza en vez de crear uno
 * por escaneo.
 */
let workerPromise: Promise<Worker> | null = null

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import('tesseract.js').then(async ({ createWorker, PSM }) => {
      const worker = await createWorker()
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        // Solo dígitos y separadores: no letras (ni "Bs"), que es justo lo
        // que más mejora la precisión en una etiqueta de precio real.
        tessedit_char_whitelist: '0123456789.,$',
      })
      return worker
    })
  }
  return workerPromise
}

export interface PriceScanResult {
  rawText: string
  price: number | null
}

/**
 * Nunca rechaza: si el OCR falla (sin red la primera vez, imagen ilegible,
 * lo que sea), se degrada a "no se detectó nada" para que el flujo manual
 * siga siendo la salida siempre disponible, no un plan B.
 */
export async function recognizePriceFromImage(image: Blob): Promise<PriceScanResult> {
  try {
    const worker = await getWorker()
    const { data } = await worker.recognize(image)
    return { rawText: data.text, price: parsePrice(data.text) }
  } catch (err) {
    console.error('OCR falló, se pasa a carga manual', err)
    return { rawText: '', price: null }
  }
}

/**
 * El texto detectado suele traer ruido (espacios, saltos de línea, algún
 * carácter suelto); se asume que el número más largo es el precio y no,
 * por ejemplo, una cantidad o un peso chico impreso en la misma etiqueta.
 */
export function parsePrice(rawText: string): number | null {
  const candidates = rawText.match(/[\d.,]+/g) ?? []
  const numeric = candidates.filter((c) => /\d/.test(c))
  if (numeric.length === 0) return null

  const best = numeric.reduce((a, b) => (b.length > a.length ? b : a))
  return normalizeNumber(best)
}

function normalizeNumber(raw: string): number | null {
  const hasDot = raw.includes('.')
  const hasComma = raw.includes(',')
  let normalized = raw

  if (hasDot && hasComma) {
    // el separador que aparece último es el decimal ("1.339,00" -> ",")
    const decimalSep = raw.lastIndexOf('.') > raw.lastIndexOf(',') ? '.' : ','
    const thousandsSep = decimalSep === '.' ? ',' : '.'
    normalized = raw.split(thousandsSep).join('').replace(decimalSep, '.')
  } else if (hasComma || hasDot) {
    const sep = hasComma ? ',' : '.'
    const parts = raw.split(sep)
    const lastPart = parts[parts.length - 1]
    // "145,50" (1 separador, ≤2 dígitos después) = decimal; "1.339" (3+) = miles
    normalized = parts.length === 2 && lastPart.length <= 2 ? parts.join('.') : parts.join('')
  }

  const value = Number(normalized)
  return Number.isFinite(value) && value > 0 ? value : null
}
