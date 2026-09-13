import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { db } from '../../data/local/db'
import { categoriesRepo, productsRepo, storesRepo } from '../../data/local/repos'
import { UNIT_TYPES, type CategoryRow, type ProductRow, type UnitType } from '../../data/local/types'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { isDuplicateName } from '../../shared/lib/duplicateCheck'
import { sortByName } from '../../shared/lib/sortByName'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { ArrowLeftIcon, PencilIcon, TrashIcon } from '../../shared/ui/icons'

export function CatalogsPage() {
  const auth = useAuth()
  if (auth.status !== 'ready' || !auth.family) return null

  return <CatalogsContent familyId={auth.family.id} />
}

function CatalogsContent({ familyId }: { familyId: string }) {
  const categories = sortByName(useLiveQuery(() => categoriesRepo.list(familyId), [familyId]) ?? [], (c) => c.nombre)
  const products = sortByName(useLiveQuery(() => productsRepo.list(familyId), [familyId]) ?? [], (p) => p.nombre)
  const stores = sortByName(useLiveQuery(() => storesRepo.list(familyId), [familyId]) ?? [], (s) => s.nombre)

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

  const [productCategoryFilter, setProductCategoryFilter] = useState('')
  const filteredProducts = productCategoryFilter ? products.filter((p) => p.category_id === productCategoryFilter) : products

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-text-secondary hover:text-text mb-4">
          <ArrowLeftIcon className="w-4 h-4" />
          Inicio
        </Link>
        <h1 className="font-heading font-bold text-2xl text-text">Catálogos</h1>
        <p className="text-text-secondary mt-1 mb-6">Categorías, productos y supermercados de tu familia</p>

        <Section
          title={`Categorías (${categories.length})`}
          addForm={
            <AddNameForm
              placeholder="Nombre de la categoría"
              isNameTaken={(nombre) => isDuplicateName(categories, nombre)}
              onAdd={(nombre) => categoriesRepo.create({ family_id: familyId, nombre, created_at: new Date().toISOString() })}
            />
          }
        >
          {categories.length === 0 && <EmptyHint text="Todavía no hay categorías." />}
          {categories.map((c) => (
            <EditableRow
              key={c.id}
              nombre={c.nombre}
              isNameTaken={(nombre) => isDuplicateName(categories, nombre, c.id)}
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

        <Section
          title={`Productos (${products.length})`}
          addForm={<AddProductForm categories={categories} products={products} familyId={familyId} />}
        >
          {categories.length > 0 && (
            <select
              aria-label="Filtrar productos por categoría"
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text mb-2"
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          )}
          {products.length === 0 && <EmptyHint text="Todavía no hay productos." />}
          {products.length > 0 && filteredProducts.length === 0 && <EmptyHint text="Esta categoría no tiene productos todavía." />}
          {filteredProducts.map((p) => {
            const category = categories.find((c) => c.id === p.category_id)
            return (
              <EditableRow
                key={p.id}
                nombre={p.nombre}
                isNameTaken={(nombre) => isDuplicateName(products, nombre, p.id)}
                extra={
                  <>
                    <select
                      aria-label={`Categoría de ${p.nombre}`}
                      value={p.category_id}
                      onChange={(e) => productsRepo.update(p.id, { category_id: e.target.value })}
                      className={`text-xs font-semibold rounded-full px-2 py-0.5 border-0 ${category ? categoryColorClass(category.nombre, category.id) : ''}`}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label={`Unidad de ${p.nombre}`}
                      value={p.unidad_default}
                      onChange={(e) => productsRepo.update(p.id, { unidad_default: e.target.value as UnitType })}
                      className="text-xs font-semibold rounded-full px-2 py-0.5 border border-border bg-subtle text-text-secondary"
                    >
                      {UNIT_TYPES.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </>
                }
                onRename={(nuevo) => productsRepo.update(p.id, { nombre: nuevo })}
                onDelete={() => productsRepo.remove(p.id)}
                deleteDisabled={usedProductIds.has(p.id)}
                deleteDisabledReason="Ya se usó en una lista o una compra; no se puede borrar."
              />
            )
          })}
        </Section>

        <Section
          title={`Supermercados (${stores.length})`}
          addForm={
            <AddNameForm
              placeholder="Nombre del supermercado"
              isNameTaken={(nombre) => isDuplicateName(stores, nombre)}
              onAdd={(nombre) => storesRepo.create({ family_id: familyId, nombre, created_at: new Date().toISOString() })}
            />
          }
        >
          {stores.length === 0 && <EmptyHint text="Todavía no hay supermercados." />}
          {stores.map((s) => (
            <EditableRow
              key={s.id}
              nombre={s.nombre}
              isNameTaken={(nombre) => isDuplicateName(stores, nombre, s.id)}
              onRename={(nuevo) => storesRepo.update(s.id, { nombre: nuevo })}
              onDelete={() => storesRepo.remove(s.id)}
              deleteDisabled={usedStoreIds.has(s.id)}
              deleteDisabledReason="Ya tiene compras asociadas; no se puede borrar."
            />
          ))}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, addForm, children }: { title: string; addForm: ReactNode; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-heading font-semibold text-lg text-text mb-3">{title}</h2>
      <div className="mb-2">{addForm}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-sm text-text-secondary mb-2">{text}</p>
}

function AddNameForm({
  placeholder,
  isNameTaken,
  onAdd,
}: {
  placeholder: string
  isNameTaken: (nombre: string) => boolean
  onAdd: (nombre: string) => Promise<unknown>
}) {
  const [adding, setAdding] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!adding) {
    return (
      <button type="button" className="text-sm text-accent-dark hover:underline" onClick={() => setAdding(true)}>
        + Agregar
      </button>
    )
  }

  return (
    <Card className="p-3">
      <div className="flex gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          placeholder={placeholder}
          className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text"
        />
        <Button
          className="px-3"
          disabled={busy || !value.trim()}
          onClick={async () => {
            if (isNameTaken(value)) {
              setError('Ya existe algo con ese nombre.')
              return
            }
            setBusy(true)
            try {
              await onAdd(value.trim())
              setValue('')
              setAdding(false)
            } finally {
              setBusy(false)
            }
          }}
        >
          Agregar
        </Button>
        <Button variant="ghost" className="px-3" onClick={() => setAdding(false)}>
          Cancelar
        </Button>
      </div>
      {error && <p className="text-xs text-alert mt-2">{error}</p>}
    </Card>
  )
}

function AddProductForm({ categories, products, familyId }: { categories: CategoryRow[]; products: ProductRow[]; familyId: string }) {
  const [adding, setAdding] = useState(false)
  const [nombre, setNombre] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [unidad, setUnidad] = useState<UnitType>('unidad')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!adding) {
    return (
      <button type="button" className="text-sm text-accent-dark hover:underline" onClick={() => setAdding(true)}>
        + Agregar
      </button>
    )
  }

  return (
    <Card className="p-3 space-y-2">
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text"
      >
        <option value="">Selecciona una categoría</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          autoFocus
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value)
            setError(null)
          }}
          placeholder="Nombre del producto"
          className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text"
        />
        <select
          aria-label="Unidad de medida"
          value={unidad}
          onChange={(e) => setUnidad(e.target.value as UnitType)}
          className="min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-2 text-text"
        >
          {UNIT_TYPES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          disabled={busy || !nombre.trim() || !categoryId}
          onClick={async () => {
            if (isDuplicateName(products, nombre)) {
              setError('Ya existe un producto con ese nombre.')
              return
            }
            setBusy(true)
            try {
              await productsRepo.create({
                family_id: familyId,
                category_id: categoryId,
                nombre: nombre.trim(),
                unidad_default: unidad,
                created_at: new Date().toISOString(),
              })
              setNombre('')
              setUnidad('unidad')
              setAdding(false)
            } finally {
              setBusy(false)
            }
          }}
        >
          Agregar
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => setAdding(false)}>
          Cancelar
        </Button>
      </div>
      {categories.length === 0 && <p className="text-xs text-text-secondary">Crea una categoría primero.</p>}
      {error && <p className="text-xs text-alert">{error}</p>}
    </Card>
  )
}

function EditableRow({
  nombre,
  extra,
  isNameTaken,
  onRename,
  onDelete,
  deleteDisabled,
  deleteDisabledReason,
}: {
  nombre: string
  extra?: ReactNode
  isNameTaken: (nombre: string) => boolean
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
            onChange={(e) => {
              setValue(e.target.value)
              setError(null)
            }}
            className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text"
          />
          <Button
            className="px-3"
            disabled={busy || !value.trim()}
            onClick={async () => {
              if (isNameTaken(value)) {
                setError('Ya existe algo con ese nombre.')
                return
              }
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
              setError(null)
              setEditing(false)
            }}
          >
            Cancelar
          </Button>
        </div>
        {error && <p className="text-xs text-alert mt-2">{error}</p>}
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
