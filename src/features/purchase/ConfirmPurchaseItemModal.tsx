import { useState } from 'react'
import { purchaseItemsRepo } from '../../data/local/repos'
import type { CategoryRow, ProductRow, PurchaseRow, UnitType } from '../../data/local/types'
import { formatAmount, formatUsd, toUsd } from '../../shared/lib/currency'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'

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
  onClose,
}: {
  purchase: PurchaseRow
  products: ProductRow[]
  categories: CategoryRow[]
  draft: PurchaseItemDraft
  onClose: () => void
}) {
  const [productId, setProductId] = useState(draft.productId)
  const [cantidad, setCantidad] = useState(draft.cantidad)
  const [precio, setPrecio] = useState(draft.precioUnitario != null ? String(draft.precioUnitario) : '')
  const [saving, setSaving] = useState(false)

  const product = products.find((p) => p.id === productId)
  const category = product ? categories.find((c) => c.id === product.category_id) : undefined
  const precioNum = Number(precio) || 0
  const subtotal = precioNum * cantidad
  const subtotalUsd = toUsd(precioNum, purchase.moneda, purchase.tasa_cambio) * cantidad

  async function save() {
    if (!productId || !precio || cantidad <= 0) return
    setSaving(true)
    try {
      const precioUnitarioUsd = toUsd(precioNum, purchase.moneda, purchase.tasa_cambio)
      const payload = {
        purchase_id: purchase.id,
        product_id: productId,
        cantidad,
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
        <select
          id="modal-producto"
          className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text disabled:opacity-70 mb-1"
          value={productId}
          disabled={draft.lockProduct}
          onChange={(e) => setProductId(e.target.value)}
        >
          <option value="">Selecciona un producto</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
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
            type="number"
            min="0"
            step="0.01"
            autoFocus
            className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text font-heading font-bold text-xl"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
          <span className="text-text-secondary text-sm">/ {draft.unidad}</span>
        </div>

        <p className="block text-sm font-semibold text-text-label mb-2">¿Cuántos compraste?</p>
        <div className="flex items-center gap-4 mb-4">
          <button
            type="button"
            aria-label="Restar"
            onClick={() => setCantidad((c) => Math.max(0.01, Math.round((c - 1) * 100) / 100))}
            className="w-11 h-11 rounded-full border border-border text-text font-bold"
          >
            −
          </button>
          <span className="font-heading font-bold text-xl text-text">
            {cantidad} {draft.unidad}
          </span>
          <button
            type="button"
            aria-label="Sumar"
            onClick={() => setCantidad((c) => Math.round((c + 1) * 100) / 100)}
            className="w-11 h-11 rounded-full bg-accent text-white font-bold"
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

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={saving || !productId || !precio} onClick={save}>
            {draft.existingItemId ? 'Guardar' : 'Agregar al carrito'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
