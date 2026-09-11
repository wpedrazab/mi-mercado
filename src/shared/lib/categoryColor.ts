/**
 * Las 6 categorías semilla tienen su color fijo de la paleta ("Fresco y
 * natural"). Una familia puede renombrarlas o crear categorías nuevas —
 * para esas, se asigna un color estable (hash del id) de ese mismo set de 6,
 * en vez de inventar colores nuevos por fuera de la paleta.
 */
const KNOWN_CATEGORY_COLORS: Record<string, string> = {
  'Granos y cereales': 'text-category-grains bg-category-grains-bg',
  'Lácteos y huevos': 'text-category-dairy bg-category-dairy-bg',
  Carnes: 'text-category-meat bg-category-meat-bg',
  Despensa: 'text-category-pantry bg-category-pantry-bg',
  'Aseo del hogar': 'text-category-home bg-category-home-bg',
  Limpieza: 'text-category-cleaning bg-category-cleaning-bg',
}

const FALLBACK_COLORS = Object.values(KNOWN_CATEGORY_COLORS)

export function categoryColorClass(nombre: string, id: string): string {
  const known = KNOWN_CATEGORY_COLORS[nombre]
  if (known) return known

  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length]
}
