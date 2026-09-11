/**
 * Los campos de cantidad/precio son type="text" (no type="number") a propósito:
 * el input nativo "number" del navegador solo acepta punto como separador
 * decimal sin importar el idioma de la página, y esta app usa coma ("145,50")
 * en todo lo que se muestra. Se deja escribir cualquiera de los dos.
 */
export function parseDecimalInput(raw: string): number {
  const normalized = raw.trim().replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : 0
}
