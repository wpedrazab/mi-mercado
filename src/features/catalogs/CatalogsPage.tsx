import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { db } from '../../data/local/db'
import { categoriesRepo, productsRepo, storesRepo } from '../../data/local/repos'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { PencilIcon, TrashIcon } from '../../shared/ui/icons'

export function CatalogsPage() {
  const auth = useAuth()
  if (auth.status !== 'ready' || !auth.family) return null

  return <CatalogsContent familyId={auth.family.id} />
}

function CatalogsContent({ familyId }: { familyId: string }) {
  const categories = useLiveQuery(() => categoriesRepo.list(familyId), [familyId]) ?? []
  const products = useLiveQuery(() => productsRepo.list(familyId), [familyId]) ?? []
  const stores = useLiveQuery(() => storesRepo.list(familyId), [familyId]) ?? []

  // Local IndexedDB solo guarda los datos de la familia logueada, así que
  // no hace falta acotar estas dos por family_id: list_items/purchase_items
  // no llevan esa columna (cuelgan de shopping_lists/purchases, que sí).
  const usedProductIds =
    useLiveQuery(async () => {
      const [listItems, purchaseItems] = await Promise.all([db.list_items.toArray(), db.purchase_items.toArray()])
      return new Set([...listItems.map((i) => i.product_id), ...purchaseItems.map((i) => i.product_id)])
    }, []) ?? new Set<string>()

  const usedStoreIds =
    useLiveQuery(async () => {
      const purchases = await db.purchases.toArray()
      return new Set(purchases.map((p) => p.store_id))
    }, []) ?? new Set<string>()

  const categoriesWithProducts = new Set(products.map((p) => p.category_id))

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Catálogos</h1>
        <p className="text-text-secondary mt-1 mb-6">Categorías, productos y supermercados de tu familia</p>

        <Section title={`Categorías (${categories.length})`}>
          {categories.length === 0 && <EmptyHint text="Todavía no hay categorías. Se crean desde Lista de mercado." />}
          {categories.map((c) => (
            <EditableRow
              key={c.id}
              nombre={c.nombre}
              extra={
                <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${categoryColorClass(c.nombre, c.id)}`}>
                  {products.filter((p) => p.category_id === c.id).length} productos
                </span>
              }
              onRename={(nuevo) => categoriesRepo.update(c.id, { nombre: nuevo })}
              onDelete={() => categoriesRepo.remove(c.id)}
              deleteDisabled={categoriesWithProducts.has(c.id)}
              deleteDisabledReason="Tiene productos asociados; cámbialos de categoría o bórralos primero."
            />
          ))}
        </Section>

        <Section title={`Productos (${products.length})`}>
          {products.length === 0 && <EmptyHint text="Todavía no hay productos. Se crean desde Lista de mercado." />}
          {products.map((p) => {
            const category = categories.find((c) => c.id === p.category_id)
            return (
              <EditableRow
                key={p.id}
                nombre={p.nombre}
                extra={
                  category && (
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${categoryColorClass(category.nombre, category.id)}`}>
                      {category.nombre}
                    </span>
                  )
                }
                onRename={(nuevo) => productsRepo.update(p.id, { nombre: nuevo })}
                onDelete={() => productsRepo.remove(p.id)}
                deleteDisabled={usedProductIds.has(p.id)}
                deleteDisabledReason="Ya se usó en una lista o una compra; no se puede borrar."
              />
            )
          })}
        </Section>

        <Section title={`Supermercados (${stores.length})`}>
          {stores.length === 0 && <EmptyHint text="Todavía no hay supermercados. Se crean desde Iniciar compra." />}
          {stores.map((s) => (
            <EditableRow
              key={s.id}
              nombre={s.nombre}
              onRename={(nuevo) => storesRepo.update(s.id, { nombre: nuevo })}
              onDelete={() => storesRepo.remove(s.id)}
              deleteDisabled={usedStoreIds.has(s.id)}
              deleteDisabledReason="Ya tiene compras asociadas; no se puede borrar."
            />
          ))}
        </Section>

        <Link to="/" className="block text-center text-accent-dark font-semibold hover:underline mt-4">
          Volver
        </Link>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-heading font-semibold text-lg text-text mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-text-secondary">{text}</p>
}

function EditableRow({
  nombre,
  extra,
  onRename,
  onDelete,
  deleteDisabled,
  deleteDisabledReason,
}: {
  nombre: string
  extra?: ReactNode
  onRename: (nuevoNombre: string) => Promise<unknown>
  onDelete: () => Promise<void>
  deleteDisabled: boolean
  deleteDisabledReason: string
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(nombre)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (editing) {
    return (
      <Card className="p-3">
        <div className="flex gap-2">
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text"
          />
          <Button
            className="px-3"
            disabled={busy || !value.trim()}
            onClick={async () => {
              setBusy(true)
              try {
                await onRename(value.trim())
                setEditing(false)
              } finally {
                setBusy(false)
              }
            }}
          >
            Guardar
          </Button>
          <Button
            variant="ghost"
            className="px-3"
            onClick={() => {
              setValue(nombre)
              setEditing(false)
            }}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-text font-semibold truncate">{nombre}</span>
          {extra}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => {
              setValue(nombre)
              setEditing(true)
            }}
            aria-label={`Editar ${nombre}`}
            className="w-9 h-9 rounded-full text-text-muted hover:text-accent-dark flex items-center justify-center"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (deleteDisabled) {
                setError(deleteDisabledReason)
                return
              }
              setError(null)
              if (!confirm(`¿Borrar "${nombre}"?`)) return
              setBusy(true)
              try {
                await onDelete()
              } finally {
                setBusy(false)
              }
            }}
            disabled={busy}
            aria-label={`Borrar ${nombre}`}
            className="w-9 h-9 rounded-full text-text-muted hover:text-alert flex items-center justify-center disabled:opacity-40"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-alert mt-2">{error}</p>}
    </Card>
  )
}
