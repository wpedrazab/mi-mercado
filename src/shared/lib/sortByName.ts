/** Orden alfabético en español (respeta acentos/ñ correctamente vía localeCompare). */
export function sortByName<T>(items: T[], getName: (item: T) => string): T[] {
  return [...items].sort((a, b) => getName(a).localeCompare(getName(b), 'es'))
}
