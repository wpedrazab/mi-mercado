import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { categoriesRepo, listItemsRepo, productsRepo, purchaseItemsRepo, purchasesRepo, storesRepo } from '../../data/local/repos'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { formatAmount, formatUsd } from '../../shared/lib/currency'
import { formatDateEs } from '../../shared/lib/date'
import { Button } from '../../shared/ui/Button'
import { CartIcon } from '../../shared/ui/icons'

export function PurchaseSummaryPage() {
  const auth = useAuth()
  const { purchaseId } = useParams<{ purchaseId: string }>()
  if (auth.status !== 'ready' || !auth.family || !purchaseId) return null

  return <PurchaseSummaryContent familyId={auth.family.id} purchaseId={purchaseId} />
}

function PurchaseSummaryContent({ familyId, purchaseId }: { familyId: string; purchaseId: string }) {
  const purchase = useLiveQuery(() => purchasesRepo.get(purchaseId), [purchaseId])
  const purchaseItems = useLiveQuery(() => purchaseItemsRepo.list(purchaseId), [purchaseId]) ?? []
  const stores = useLiveQuery(() => storesRepo.list(familyId), [familyId]) ?? []
  const products = useLiveQuery(() => productsRepo.list(familyId), [familyId]) ?? []
  const categories = useLiveQuery(() => categoriesRepo.list(familyId), [familyId]) ?? []
  const listItems = useLiveQuery(
    () => (purchase?.shopping_list_id ? listItemsRepo.list(purchase.shopping_list_id) : Promise.resolve([])),
    [purchase?.shopping_list_id],
  ) ?? []

  if (!purchase) return null

  const store = stores.find((s) => s.id === purchase.store_id)
  const purchasedProductIds = new Set(purchaseItems.map((i) => i.product_id))
  const notPurchased = listItems.filter((li) => !purchasedProductIds.has(li.product_id))

  const totalNative = purchaseItems.reduce((sum, i) => sum + i.subtotal, 0)
  const totalUsd = purchaseItems.reduce((sum, i) => sum + i.subtotal_usd, 0)
  const overBudget = purchase.presupuesto_usd != null && totalUsd > purchase.presupuesto_usd

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Resumen de compra</h1>
        <p className="text-text-secondary mt-1 mb-6">
          {store?.nombre ?? 'Supermercado'} · {formatDateEs(purchase.fecha_compra)}
        </p>

        <div className="bg-dark-bar text-white rounded-[var(--radius-card)] p-4 mb-4">
          <p className="text-dark-bar-muted text-xs">Total pagado</p>
          <div className="flex items-baseline justify-between">
            <p className="font-heading font-bold text-2xl">{formatAmount(totalNative, purchase.moneda)}</p>
            {purchase.moneda !== 'USD' && <p className="text-dark-bar-usd font-semibold">≈ {formatUsd(totalUsd)}</p>}
          </div>
          {purchase.presupuesto_usd != null && (
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-dark-bar-muted">Presupuesto {formatUsd(purchase.presupuesto_usd)}</span>
              {overBudget && (
                <span className="bg-alert text-alert-on-dark rounded-full px-2 py-0.5 font-semibold">
                  Superó el presupuesto en {formatUsd(totalUsd - purchase.presupuesto_usd)}
                </span>
              )}
            </div>
          )}
        </div>

        <Button variant="ghost" className="w-full mb-6" disabled>
          <CartIcon className="w-4 h-4 inline mr-2" />
          Agregar foto de la factura (próximamente)
        </Button>

        <div className="space-y-3 mb-6">
          {purchaseItems.map((item) => {
            const product = products.find((p) => p.id === item.product_id)
            const category = product ? categories.find((c) => c.id === product.category_id) : undefined
            return (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text">
                    {product?.nombre ?? '…'}
                    {category && (
                      <span className={`ml-2 text-xs font-semibold rounded-full px-2 py-0.5 align-middle ${categoryColorClass(category.nombre, category.id)}`}>
                        {category.nombre}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {item.cantidad} {item.unidad}
                  </p>
                </div>
                <p className="font-semibold text-text">{formatAmount(item.subtotal, purchase.moneda)}</p>
              </div>
            )
          })}
        </div>

        {notPurchased.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-semibold text-text-secondary mb-2">No comprados ({notPurchased.length})</p>
            <div className="space-y-1">
              {notPurchased.map((li) => {
                const product = products.find((p) => p.id === li.product_id)
                return (
                  <div key={li.id} className="flex items-center justify-between text-text-secondary">
                    <span>{product?.nombre ?? '…'}</span>
                    <span className="text-sm">
                      {li.cantidad} {li.unidad}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          <Button variant="ghost" className="flex-1" disabled>
            Compartir (próximamente)
          </Button>
          <Button variant="ghost" className="flex-1" disabled>
            Exportar PDF (próximamente)
          </Button>
        </div>

        <Link to="/lista" className="block text-center text-accent-dark font-semibold hover:underline">
          Iniciar nueva compra
        </Link>
      </div>
    </div>
  )
}
