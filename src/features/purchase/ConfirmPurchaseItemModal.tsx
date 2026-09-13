import { useState } from 'react'
import { purchaseItemsRepo } from '../../data/local/repos'
import type { CategoryRow, ProductRow, PurchaseRow, UnitType } from '../../data/local/types'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { formatAmount, formatUsd, toUsd } from '../../shared/lib/currency'
import { parseDecimalInput } from '../../shared/lib/parseDecimal'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { SearchableSelect } from '../../shared/ui/SearchableSelect'

export interface PurchaseItemDraft {
  productId: string
  lockProduct: boolean
  cantidad: number
  unidad: UnitType
  precioUnitario: number | null
  fueraDeLista: boolean
  existingItemId?: string
  /** Si viene de una foto escaneada: se muestra la miniatura y otro subtítulo. */
  photoUrl?: string
}

export function ConfirmPurchaseItemModal({
  purchase,
  products,
  categories,
  draft,
  existingProductIds,
  onClose,
}: {
  purchase: PurchaseRow
  products: ProductRow[]
  categories: CategoryRow[]
  draft: PurchaseItemDraft
  /** product_id de los ítems ya agregados a esta compra (para no repetir uno). */
  existingProductIds: Set<string>
  onClose: () => void
}) {
  const [productId, setProductId] = useState(draft.productId)
  const [cantidadStr, setCantidadStr] = useState(String(draft.cantidad))
  const [precio, setPrecio] = useState(draft.precioUnitario != null ? String(draft.precioUnitario) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const product = products.find((p) => p.id === productId)
  const category = product ? categories.find((c) => c.id === product.category_id) : undefined
  const precioNum = parseDecimalInput(precio)
  const cantidadNum = parseDecimalInput(cantidadStr)
  const subtotal = precioNum * cantidadNum
  const subtotalUsd = toUsd(precioNum, purchase.moneda, purchase.tasa_cambio) * cantidadNum

  function adjustCantidad(delta: number) {
    const next = Math.max(0.01, Math.round((cantidadNum + delta) * 100) / 100)
    setCantidadStr(String(next))
  }

  async function save() {
    if (!productId || !precio || cantidadNum <= 0) return
    if (!draft.existingItemId && existingProductIds.has(productId)) {
      setError('Ese producto ya está en esta compra. Edítalo desde su tarjeta en vez de agregarlo de nuevo.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const precioUnitarioUsd = toUsd(precioNum, purchase.moneda, purchase.tasa_cambio)
      const payload = {
        purchase_id: purchase.id,
        product_id: productId,
        cantidad: cantidadNum,
        unidad: draft.unidad,
        precio_unitario: precioNum,
        precio_unitario_usd: precioUnitarioUsd,
        subtotal,
        subtotal_usd: subtotalUsd,
        fuera_de_lista: draft.fueraDeLista,
        created_at: new Date().toISOString(),
      }
      if (draft.existingItemId) {
        await purchaseItemsRepo.update(draft.existingItemId, payload)
      } else {
        await purchaseItemsRepo.create(payload)
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-6 z-50" onClick={onClose}>
      <Card className="w-full sm:max-w-sm rounded-b-none sm:rounded-[var(--radius-card)]" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading font-semibold text-lg text-text">Confirmar producto</h2>
        <p className="text-sm text-text-secondary mb-4">
          {draft.photoUrl ? 'Precio detectado de la foto — revisa y ajusta si hace falta.' : 'Escribe el precio que viste en la etiqueta.'}
        </p>

        {draft.photoUrl && (
          <img src={draft.photoUrl} alt="Foto de la etiqueta escaneada" className="w-full h-32 object-cover rounded-[var(--radius-field)] mb-4" />
        )}

        <label className="block text-sm font-semibold text-text-label mb-1" htmlFor="modal-producto">
          Producto
        </label>
        <div className="mb-1">
          <SearchableSelect
            id="modal-producto"
            value={productId}
            onChange={(id) => {
              setProductId(id)
              setError(null)
            }}
            options={products.map((p) => ({ id: p.id, label: p.nombre }))}
            disabled={draft.lockProduct}
            placeholder="Busca un producto…"
          />
        </div>
        {category && (
          <span className={`inline-block text-xs font-semibold rounded-full px-2 py-0.5 mb-4 ${categoryColorClass(category.nombre, category.id)}`}>
            {category.nombre}
          </span>
        )}

        <label className="block text-sm font-semibold text-text-label mb-1" htmlFor="modal-precio">
          {draft.photoUrl ? 'Precio detectado' : 'Precio unitario'}
        </label>
        {draft.photoUrl && draft.precioUnitario == null && (
          <p className="text-xs text-alert mb-1">No pudimos leer el precio automáticamente. Escríbelo.</p>
        )}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-text-secondary">{purchase.moneda === 'VES' ? 'Bs' : '$'}</span>
          <input
            id="modal-precio"
            type="text"
            inputMode="decimal"
            autoFocus
            className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text font-heading font-bold text-xl"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <span className="text-text-secondary text-sm">/ {draft.unidad}</span>
        </div>

        <label className="block text-sm font-semibold text-text-label mb-2" htmlFor="modal-cantidad">
          ¿Cuántos compraste?
        </label>
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            aria-label="Restar"
            onClick={() => adjustCantidad(-1)}
            className="w-11 h-11 shrink-0 rounded-full border border-border text-text font-bold"
          >
            −
          </button>
          <input
            id="modal-cantidad"
            type="text"
            inputMode="decimal"
            value={cantidadStr}
            onChange={(e) => setCantidadStr(e.target.value)}
            className="w-20 min-h-11 text-center rounded-[var(--radius-field)] border border-border bg-surface font-heading font-bold text-xl text-text"
          />
          <span className="text-text-secondary">{draft.unidad}</span>
          <button
            type="button"
            aria-label="Sumar"
            onClick={() => adjustCantidad(1)}
            className="w-11 h-11 shrink-0 rounded-full bg-accent text-white font-bold"
          >
            +
          </button>
        </div>

        <div className="bg-dark-bar text-white rounded-[var(--radius-field)] p-4 flex items-center justify-between mb-4">
          <span className="text-dark-bar-muted text-sm">Subtotal</span>
          <div className="text-right">
            <p className="font-heading font-bold text-lg">{formatAmount(subtotal, purchase.moneda)}</p>
            {purchase.moneda !== 'USD' && <p className="text-dark-bar-usd text-sm">{formatUsd(subtotalUsd)}</p>}
          </div>
        </div>

        {error && (
          <p className="text-sm text-alert text-center mb-2" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={saving || !productId || !precio || cantidadNum <= 0} onClick={save}>
            {draft.existingItemId ? 'Guardar' : 'Agregar al carrito'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
