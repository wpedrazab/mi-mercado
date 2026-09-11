import { useRef, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { categoriesRepo, listItemsRepo, productsRepo, purchaseItemsRepo, purchasesRepo, shoppingListsRepo } from '../../data/local/repos'
import type { CurrencyCode, PurchaseItemRow, UnitType } from '../../data/local/types'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { formatAmount, formatUsd } from '../../shared/lib/currency'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { CameraIcon, PencilIcon } from '../../shared/ui/icons'
import { ConfirmPurchaseItemModal, type PurchaseItemDraft } from './ConfirmPurchaseItemModal'
import { recognizePriceFromImage } from './ocr'

interface ScanTarget {
  productId: string
  lockProduct: boolean
  cantidad: number
  unidad: UnitType
  fueraDeLista: boolean
}

export function LivePurchasePage() {
  const auth = useAuth()
  const { purchaseId } = useParams<{ purchaseId: string }>()
  if (auth.status !== 'ready' || !auth.family || !purchaseId) return null

  return <LivePurchaseContent familyId={auth.family.id} purchaseId={purchaseId} />
}

function LivePurchaseContent({ familyId, purchaseId }: { familyId: string; purchaseId: string }) {
  const navigate = useNavigate()

  const purchase = useLiveQuery(() => purchasesRepo.get(purchaseId), [purchaseId])
  const purchaseItems = useLiveQuery(() => purchaseItemsRepo.list(purchaseId), [purchaseId]) ?? []
  const products = useLiveQuery(() => productsRepo.list(familyId), [familyId]) ?? []
  const categories = useLiveQuery(() => categoriesRepo.list(familyId), [familyId]) ?? []
  const listItems = useLiveQuery(
    () => (purchase?.shopping_list_id ? listItemsRepo.list(purchase.shopping_list_id) : Promise.resolve([])),
    [purchase?.shopping_list_id],
  ) ?? []

  const [draft, setDraft] = useState<PurchaseItemDraft | null>(null)
  const [showPending, setShowPending] = useState(false)
  const [closing, setClosing] = useState(false)
  const [captureTarget, setCaptureTarget] = useState<ScanTarget | null>(null)
  const [scanning, setScanning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!purchase) return null

  function startScan(target: ScanTarget) {
    setCaptureTarget(target)
    fileInputRef.current?.click()
  }

  async function onPhotoSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !captureTarget) return

    setScanning(true)
    try {
      const photoUrl = URL.createObjectURL(file)
      const { price } = await recognizePriceFromImage(file)
      setDraft({
        productId: captureTarget.productId,
        lockProduct: captureTarget.lockProduct,
        cantidad: captureTarget.cantidad,
        unidad: captureTarget.unidad,
        precioUnitario: price,
        fueraDeLista: captureTarget.fueraDeLista,
        photoUrl,
      })
    } finally {
      setScanning(false)
      setCaptureTarget(null)
    }
  }

  const purchasedProductIds = new Set(purchaseItems.map((i) => i.product_id))
  const pendingListItems = listItems.filter((li) => !purchasedProductIds.has(li.product_id))

  const totalNative = purchaseItems.reduce((sum, i) => sum + i.subtotal, 0)
  const totalUsd = purchaseItems.reduce((sum, i) => sum + i.subtotal_usd, 0)
  const overBudget = purchase.presupuesto_usd != null && totalUsd > purchase.presupuesto_usd
  const budgetPct = purchase.presupuesto_usd ? Math.min(100, (totalUsd / purchase.presupuesto_usd) * 100) : 0

  function productInfo(productId: string) {
    const product = products.find((p) => p.id === productId)
    const category = product ? categories.find((c) => c.id === product.category_id) : undefined
    return { product, category }
  }

  async function closeForReal() {
    if (!purchase) return
    setClosing(true)
    try {
      await purchasesRepo.update(purchase.id, { estado: 'cerrada' })
      if (purchase.shopping_list_id) {
        await shoppingListsRepo.update(purchase.shopping_list_id, { estado: 'convertida' })
      }
      navigate(`/compra/${purchase.id}/resumen`)
    } finally {
      setClosing(false)
    }
  }

  function onTerminarCompra() {
    if (pendingListItems.length > 0) {
      setShowPending(true)
    } else {
      void closeForReal()
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <div className="bg-dark-bar text-white -mx-6 -mt-6 p-6 rounded-b-[var(--radius-card)] mb-6">
          <p className="text-dark-bar-muted text-xs">Total de la compra</p>
          <div className="flex items-baseline justify-between">
            <p className="font-heading font-bold text-3xl">{formatAmount(totalNative, purchase.moneda)}</p>
            {purchase.moneda !== 'USD' && <p className="text-dark-bar-usd font-semibold">≈ {formatUsd(totalUsd)}</p>}
          </div>

          {purchase.presupuesto_usd != null && (
            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-dark-bar-track overflow-hidden">
                <div className={`h-full ${overBudget ? 'bg-alert' : 'bg-dark-bar-usd'}`} style={{ width: `${budgetPct}%` }} />
              </div>
              <div className="flex justify-between mt-1 text-xs">
                <span className="text-dark-bar-muted">
                  Presupuesto {formatUsd(purchase.presupuesto_usd)} · Llevas {formatUsd(totalUsd)}
                </span>
                {overBudget && (
                  <span className="text-alert-on-dark font-semibold">
                    +{formatUsd(totalUsd - purchase.presupuesto_usd)} sobre el límite
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhotoSelected} />

        <div className="flex gap-2 mb-4">
          <Button
            variant="ghost"
            className="flex-1 px-2"
            onClick={() => startScan({ productId: '', lockProduct: false, cantidad: 1, unidad: 'unidad', fueraDeLista: true })}
          >
            <CameraIcon className="w-4 h-4 inline mr-1 -mt-0.5" />
            Escanear precio
          </Button>
          <Button
            variant="ghost"
            className="flex-1 px-2"
            onClick={() =>
              setDraft({ productId: '', lockProduct: false, cantidad: 1, unidad: 'unidad', precioUnitario: null, fueraDeLista: true })
            }
          >
            + Producto nuevo
          </Button>
        </div>

        {scanning && (
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-4">
            <span className="w-4 h-4 rounded-full border-2 border-border border-t-accent animate-spin" />
            Leyendo el precio…
          </div>
        )}

        <div className="space-y-3 mb-6">
          {purchaseItems.map((item) => {
            const { product, category } = productInfo(item.product_id)
            return (
              <PurchaseItemCard
                key={item.id}
                item={item}
                productName={product?.nombre ?? '…'}
                category={category}
                moneda={purchase.moneda}
                onEdit={() =>
                  setDraft({
                    productId: item.product_id,
                    lockProduct: true,
                    cantidad: item.cantidad,
                    unidad: item.unidad,
                    precioUnitario: item.precio_unitario,
                    fueraDeLista: item.fuera_de_lista,
                    existingItemId: item.id,
                  })
                }
              />
            )
          })}

          {pendingListItems.map((li) => {
            const product = products.find((p) => p.id === li.product_id)
            return (
              <button
                key={li.id}
                onClick={() => startScan({ productId: li.product_id, lockProduct: true, cantidad: li.cantidad, unidad: li.unidad, fueraDeLista: false })}
                className="w-full text-left border border-dashed border-pending-border bg-pending-bg rounded-[var(--radius-card)] p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-text">{product?.nombre ?? '…'}</p>
                  <p className="text-sm text-text-secondary">
                    {li.cantidad} {li.unidad}
                  </p>
                </div>
                <span className="text-sm text-accent-dark flex items-center gap-1">
                  <CameraIcon className="w-4 h-4" />
                  Toca para escanear
                </span>
              </button>
            )
          })}
        </div>

        <Button className="w-full" disabled={closing} onClick={onTerminarCompra}>
          Terminar compra
        </Button>
      </div>

      {draft && (
        <ConfirmPurchaseItemModal purchase={purchase} products={products} categories={categories} draft={draft} onClose={() => setDraft(null)} />
      )}

      {showPending && (
        <PendingItemsModal
          pendingItems={pendingListItems.map((li) => ({ nombre: products.find((p) => p.id === li.product_id)?.nombre ?? '…', cantidad: li.cantidad, unidad: li.unidad }))}
          onKeepShopping={() => setShowPending(false)}
          onFinishAnyway={() => {
            setShowPending(false)
            void closeForReal()
          }}
        />
      )}
    </div>
  )
}

function PurchaseItemCard({
  item,
  productName,
  category,
  moneda,
  onEdit,
}: {
  item: PurchaseItemRow
  productName: string
  category?: { id: string; nombre: string }
  moneda: CurrencyCode
  onEdit: () => void
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-text">
            {productName}
            {category && (
              <span className={`ml-2 text-xs font-semibold rounded-full px-2 py-0.5 align-middle ${categoryColorClass(category.nombre, category.id)}`}>
                {category.nombre}
              </span>
            )}
            {item.fuera_de_lista && (
              <span className="ml-2 text-xs font-semibold rounded-full px-2 py-0.5 align-middle bg-subtle text-text-secondary">
                No estaba en la lista
              </span>
            )}
          </p>
          <p className="text-sm text-text-secondary">
            {item.cantidad} {item.unidad}
          </p>
        </div>
        <button onClick={onEdit} aria-label={`Editar ${productName}`} className="text-text-muted hover:text-accent-dark">
          <PencilIcon className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-text-secondary">
          {formatAmount(item.precio_unitario, moneda)} c/u × {item.cantidad}
        </span>
        <div className="text-right">
          <p className="font-heading font-bold text-text">{formatAmount(item.subtotal, moneda)}</p>
          {moneda !== 'USD' && <p className="text-xs text-text-secondary">{formatUsd(item.subtotal_usd)}</p>}
        </div>
      </div>
    </Card>
  )
}

function PendingItemsModal({
  pendingItems,
  onKeepShopping,
  onFinishAnyway,
}: {
  pendingItems: { nombre: string; cantidad: number; unidad: string }[]
  onKeepShopping: () => void
  onFinishAnyway: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <Card className="max-w-sm w-full text-center">
        <h2 className="font-heading font-semibold text-lg text-text mb-1">Aún faltan productos por comprar</h2>
        <p className="text-sm text-text-secondary mb-4">Estos productos de tu lista todavía no tienen precio registrado:</p>

        <div className="space-y-2 mb-4 text-left">
          {pendingItems.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-subtle rounded-[var(--radius-field)] px-3 py-2">
              <span className="text-sm font-semibold text-text">{item.nombre}</span>
              <span className="text-sm text-text-secondary">
                {item.cantidad} {item.unidad}
              </span>
            </div>
          ))}
        </div>

        <Button className="w-full mb-2" onClick={onKeepShopping}>
          Seguir comprando
        </Button>
        <Button variant="ghost" className="w-full" onClick={onFinishAnyway}>
          Terminar de todas formas
        </Button>
      </Card>
    </div>
  )
}
