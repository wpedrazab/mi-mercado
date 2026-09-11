import Dexie, { type EntityTable } from 'dexie'
import type {
  CategoryRow,
  ListItemRow,
  OutboxEntry,
  ProductRow,
  PurchaseItemRow,
  PurchaseRow,
  ShoppingListRow,
  StoreRow,
} from './types'

/**
 * Cache local del flujo de compra (listas, compras, ítems, catálogos) de la
 * familia del usuario logueado. Las pantallas de ese flujo leen/escriben
 * solo aquí, nunca directo contra Supabase — ver src/data/sync.
 * La administración/gestión de familia es online-only y no vive en esta DB.
 */
export class MiMercadoDB extends Dexie {
  categories!: EntityTable<CategoryRow, 'id'>
  products!: EntityTable<ProductRow, 'id'>
  stores!: EntityTable<StoreRow, 'id'>
  shopping_lists!: EntityTable<ShoppingListRow, 'id'>
  list_items!: EntityTable<ListItemRow, 'id'>
  purchases!: EntityTable<PurchaseRow, 'id'>
  purchase_items!: EntityTable<PurchaseItemRow, 'id'>
  outbox!: EntityTable<OutboxEntry, 'id'>

  constructor() {
    super('mi-mercado')

    this.version(1).stores({
      categories: 'id, family_id, dirty',
      products: 'id, family_id, category_id, dirty',
      stores: 'id, family_id, dirty',
      shopping_lists: 'id, family_id, estado, dirty',
      list_items: 'id, list_id, dirty',
      purchases: 'id, family_id, shopping_list_id, estado, dirty',
      purchase_items: 'id, purchase_id, dirty',
      outbox: '++id, table, rowId, createdAt',
    })
  }
}

export const db = new MiMercadoDB()
