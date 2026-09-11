import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { categoriesRepo, listItemsRepo, productsRepo } from '../../data/local/repos'
import type { UnitType } from '../../data/local/types'
import { categoryColorClass } from '../../shared/lib/categoryColor'
import { parseDecimalInput } from '../../shared/lib/parseDecimal'
import { sortByName } from '../../shared/lib/sortByName'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '../../shared/ui/icons'
import { useActiveShoppingList } from './useActiveShoppingList'

const UNIT_OPTIONS: UnitType[] = ['kg', 'g', 'l', 'ml', 'unidad', 'paquete', 'cubeta']

export function ShoppingListPage() {
  const auth = useAuth()
  if (auth.status !== 'ready' || !auth.family) return null

  return <ShoppingListContent familyId={auth.family.id} userId={auth.profile.id} />
}

function ShoppingListContent({ familyId, userId }: { familyId: string; userId: string }) {
  const navigate = useNavigate()
  const list = useActiveShoppingList(familyId, userId)

  const categories = sortByName(useLiveQuery(() => categoriesRepo.list(familyId), [familyId]) ?? [], (c) => c.nombre)
  const products = sortByName(useLiveQuery(() => productsRepo.list(familyId), [familyId]) ?? [], (p) => p.nombre)
  const items = sortByName(
    useLiveQuery(() => (list ? listItemsRepo.list(list.id) : Promise.resolve([])), [list?.id]) ?? [],
    (item) => products.find((p) => p.id === item.product_id)?.nombre ?? '',
  )

  const [categoryId, setCategoryId] = useState('')
  const [productId, setProductId] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [unidad, setUnidad] = useState<UnitType>('unidad')
  const [newCategoryName, setNewCategoryName] = useState<string | null>(null)
  const [newProductName, setNewProductName] = useState<string | null>(null)

  const productsInCategory = products.filter((p) => p.category_id === categoryId)

  async function addCategory() {
    if (!newCategoryName?.trim()) return
    const row = await categoriesRepo.create({
      family_id: familyId,
      nombre: newCategoryName.trim(),
      created_at: new Date().toISOString(),
    })
    setCategoryId(row.id)
    setProductId('')
    setNewCategoryName(null)
  }

  async function addProduct() {
    if (!newProductName?.trim() || !categoryId) return
    const row = await productsRepo.create({
      family_id: familyId,
      category_id: categoryId,
      nombre: newProductName.trim(),
      unidad_default: unidad,
      created_at: new Date().toISOString(),
    })
    setProductId(row.id)
    setNewProductName(null)
  }

  async function addItem() {
    const cantidadNum = parseDecimalInput(cantidad)
    if (!list || !productId || !cantidad || cantidadNum <= 0) return
    await listItemsRepo.create({
      list_id: list.id,
      product_id: productId,
      cantidad: cantidadNum,
      unidad,
      created_at: new Date().toISOString(),
    })
    setCantidad('')
  }

  function categoryOf(catId: string) {
    return categories.find((c) => c.id === catId)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <Link to="/" className="inline-flex items-center gap-1 text-text-secondary hover:text-text mb-4">
          <ArrowLeftIcon className="w-4 h-4" />
          Inicio
        </Link>
        <h1 className="font-heading font-bold text-2xl text-text">Lista de mercado</h1>
        <p className="text-text-secondary mt-1 mb-6">Antes de salir de casa</p>

        <Card className="mb-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-text-label" htmlFor="categoria">
                Categoría
              </label>
              <button type="button" className="text-sm text-accent-dark hover:underline" onClick={() => setNewCategoryName('')}>
                + Nueva categoría
              </button>
            </div>
            {newCategoryName !== null ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nombre de la categoría"
                />
                <Button className="px-4" onClick={addCategory}>
                  Agregar
                </Button>
              </div>
            ) : (
              <select
                id="categoria"
                className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setProductId('')
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-text-label" htmlFor="producto">
                Producto
              </label>
              <button
                type="button"
                disabled={!categoryId}
                className="text-sm text-accent-dark hover:underline disabled:opacity-40"
                onClick={() => setNewProductName('')}
              >
                + Nuevo producto
              </button>
            </div>
            {newProductName !== null ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Nombre del producto"
                />
                <Button className="px-4" onClick={addProduct}>
                  Agregar
                </Button>
              </div>
            ) : (
              <>
                <select
                  id="producto"
                  className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text disabled:opacity-50"
                  value={productId}
                  disabled={!categoryId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Selecciona un producto</option>
                  {productsInCategory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                {categoryId && (
                  <p className="text-xs text-text-secondary mt-1">Mostrando productos de "{categoryOf(categoryId)?.nombre}"</p>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                id="cantidad"
                label="Cantidad"
                type="text"
                inputMode="decimal"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
              />
            </div>
            <select
              aria-label="Unidad"
              className="min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-3 text-text"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value as UnitType)}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-label="Agregar producto a la lista"
              disabled={!productId || !cantidad}
              onClick={addItem}
              className="min-h-11 min-w-11 rounded-full bg-accent text-white flex items-center justify-center disabled:opacity-40"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
          </div>
        </Card>

        <div className="space-y-3 mb-6">
          {items.map((item) => {
            const product = products.find((p) => p.id === item.product_id)
            const category = product ? categoryOf(product.category_id) : undefined
            return (
              <Card key={item.id} className="p-4 flex items-center justify-between">
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
                <button
                  onClick={() => listItemsRepo.remove(item.id)}
                  aria-label={`Quitar ${product?.nombre ?? 'producto'} de la lista`}
                  className="text-text-muted hover:text-alert"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </Card>
            )
          })}
        </div>

        <Button className="w-full" disabled={items.length === 0} onClick={() => navigate('/iniciar-compra')}>
          Listo, ir a comprar
        </Button>
        <p className="text-sm text-text-secondary text-center mt-2">{items.length} productos en la lista</p>
      </div>
    </div>
  )
}
