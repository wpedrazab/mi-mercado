/**
 * fecha/fecha_compra se guardan como "YYYY-MM-DD" (sin hora). `new
 * Date("2026-09-11")` lo interpreta como medianoche UTC, así que en una
 * zona horaria detrás de UTC (Venezuela, Colombia — justo el público de
 * esta app) se corre al día anterior al mostrarlo. Se construye la fecha
 * en local en vez de dejar que el motor de JS la parsee como UTC.
 */
export function formatDateEs(dateStr: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('es', options)
}
