export const UNIT_TYPES = ['kg', 'g', 'l', 'ml', 'unidad', 'paquete', 'cubeta'] as const
export type UnitType = (typeof UNIT_TYPES)[number]
export type CurrencyCode = 'VES' | 'USD' | 'COP'
export type ShoppingListStatus = 'activa' | 'convertida'
export type PurchaseStatus = 'en_curso' | 'cerrada'

/**
 * Campos que tienen todas las filas de las tablas del flujo de compra
 * (local-first). `dirty` marca que hay cambios locales sin confirmar en
 * Supabase todavía; lo pone `createLocalRepo` en cada create/update y lo
 * limpia el motor de sync cuando ya no quedan mutaciones pendientes para
 * esa fila en el outbox.
 */
export interface SyncedRow {
  id: string
  updated_at: string
  dirty: 0 | 1
}

// list_items y purchase_items no llevan family_id en Postgres (cuelgan de
// shopping_lists/purchases, que sí lo llevan) — por eso no extienden esto.
export interface FamilyScopedRow extends SyncedRow {
  family_id: string
}

export interface CategoryRow extends FamilyScopedRow {
  nombre: string
  created_at: string
}

export interface ProductRow extends FamilyScopedRow {
  category_id: string
  nombre: string
  unidad_default: UnitType
  created_at: string
}

export interface StoreRow extends FamilyScopedRow {
  nombre: string
  created_at: string
}

export interface ShoppingListRow extends FamilyScopedRow {
  fecha: string
  estado: ShoppingListStatus
  created_by: string
  created_at: string
}

export interface ListItemRow extends SyncedRow {
  list_id: string
  product_id: string
  cantidad: number
  unidad: UnitType
  created_at: string
}

export interface PurchaseRow extends FamilyScopedRow {
  shopping_list_id: string | null
  store_id: string
  fecha_compra: string
  moneda: CurrencyCode
  tasa_cambio: number
  presupuesto_usd: number | null
  estado: PurchaseStatus
  creada_por: string
  factura_path: string | null
  created_at: string
}

export interface PurchaseItemRow extends SyncedRow {
  purchase_id: string
  product_id: string
  cantidad: number
  unidad: UnitType
  precio_unitario: number
  precio_unitario_usd: number
  subtotal: number
  subtotal_usd: number
  fuera_de_lista: boolean
  created_at: string
}

export type SyncTableName =
  | 'categories'
  | 'products'
  | 'stores'
  | 'shopping_lists'
  | 'list_items'
  | 'purchases'
  | 'purchase_items'

export type OutboxOp = 'insert' | 'update' | 'delete'

export interface OutboxEntry {
  id?: number
  table: SyncTableName
  op: OutboxOp
  rowId: string
  /** null en deletes; en insert/update es la fila completa tal como quedó localmente */
  payload: Record<string, unknown> | null
  createdAt: string
  attempts: number
  lastError?: string
}
