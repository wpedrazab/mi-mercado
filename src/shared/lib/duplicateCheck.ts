/**
 * Comparación case-insensitive y sin espacios sobrantes: "Manzana" y
 * " manzana " deben contar como el mismo nombre. Además de la confusión
 * para quien arma la lista, un duplicado real (mismo nombre exacto) viola
 * el unique(family_id, nombre) de Postgres — el insert se atasca en el
 * outbox local para siempre porque nunca puede confirmarse, bloqueando
 * cualquier sincronización posterior (visto en la práctica).
 */
export function isDuplicateName<T extends { id: string; nombre: string }>(items: T[], name: string, excludeId?: string): boolean {
  const normalized = name.trim().toLowerCase()
  return items.some((item) => item.id !== excludeId && item.nombre.trim().toLowerCase() === normalized)
}
