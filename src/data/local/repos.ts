import { createLocalRepo } from './repo'
import type {
  CategoryRow,
  ListItemRow,
  ProductRow,
  PurchaseItemRow,
  PurchaseRow,
  ShoppingListRow,
  StoreRow,
} from './types'

export const categoriesRepo = createLocalRepo<CategoryRow>('categories', 'family_id')
export const productsRepo = createLocalRepo<ProductRow>('products', 'family_id')
export const storesRepo = createLocalRepo<StoreRow>('stores', 'family_id')
export const shoppingListsRepo = createLocalRepo<ShoppingListRow>('shopping_lists', 'family_id')
export const listItemsRepo = createLocalRepo<ListItemRow>('list_items', 'list_id')
export const purchasesRepo = createLocalRepo<PurchaseRow>('purchases', 'family_id')
export const purchaseItemsRepo = createLocalRepo<PurchaseItemRow>('purchase_items', 'purchase_id')
