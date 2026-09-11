import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../app/providers/AuthProvider'
import { purchasesRepo, storesRepo } from '../../data/local/repos'
import type { CurrencyCode } from '../../data/local/types'
import { parseDecimalInput } from '../../shared/lib/parseDecimal'
import { useActiveShoppingList } from '../shopping-list/useActiveShoppingList'
import { Button } from '../../shared/ui/Button'
import { Card } from '../../shared/ui/Card'
import { Input } from '../../shared/ui/Input'

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: 'VES', label: 'Bolívares' },
  { code: 'USD', label: 'Dólares' },
  { code: 'COP', label: 'Pesos COP' },
]

export function StartPurchasePage() {
  const auth = useAuth()
  if (auth.status !== 'ready' || !auth.family) return null

  return <StartPurchaseContent familyId={auth.family.id} userId={auth.profile.id} />
}

function StartPurchaseContent({ familyId, userId }: { familyId: string; userId: string }) {
  const navigate = useNavigate()
  const list = useActiveShoppingList(familyId, userId)
  const stores = useLiveQuery(() => storesRepo.list(familyId), [familyId]) ?? []

  const [storeId, setStoreId] = useState('')
  const [newStoreName, setNewStoreName] = useState<string | null>(null)
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10))
  const [moneda, setMoneda] = useState<CurrencyCode>('VES')
  const [tasaCambio, setTasaCambio] = useState('')
  const [presupuesto, setPresupuesto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function addStore() {
    if (!newStoreName?.trim()) return
    const row = await storesRepo.create({ family_id: familyId, nombre: newStoreName.trim(), created_at: new Date().toISOString() })
    setStoreId(row.id)
    setNewStoreName(null)
  }

  async function onSubmit() {
    setError(null)
    if (!storeId) return setError('Selecciona o crea un supermercado.')
    if (moneda !== 'USD' && !tasaCambio) return setError('Ingresa la tasa de cambio.')
    if (!list) return setError('No hay una lista de mercado activa.')

    setSubmitting(true)
    try {
      const purchase = await purchasesRepo.create({
        family_id: familyId,
        shopping_list_id: list.id,
        store_id: storeId,
        fecha_compra: fecha,
        moneda,
        tasa_cambio: moneda === 'USD' ? 1 : parseDecimalInput(tasaCambio),
        presupuesto_usd: presupuesto ? parseDecimalInput(presupuesto) : null,
        estado: 'en_curso',
        creada_por: userId,
        factura_path: null,
        created_at: new Date().toISOString(),
      })
      navigate(`/compra/${purchase.id}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-sm mx-auto">
        <h1 className="font-heading font-bold text-2xl text-text">Iniciar compra</h1>
        <p className="text-text-secondary mt-1 mb-6">Antes de empezar</p>

        <Card className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-semibold text-text-label" htmlFor="supermercado">
                Supermercado
              </label>
              <button type="button" className="text-sm text-accent-dark hover:underline" onClick={() => setNewStoreName('')}>
                + Nuevo
              </button>
            </div>
            {newStoreName !== null ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  className="flex-1 min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="Nombre del supermercado"
                />
                <Button className="px-4" onClick={addStore}>
                  Agregar
                </Button>
              </div>
            ) : (
              <select
                id="supermercado"
                className="w-full min-h-11 rounded-[var(--radius-field)] border border-border bg-surface px-4 text-text"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
              >
                <option value="">Selecciona o escribe el supermercado</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            id="fecha-compra"
            label="Fecha de la compra"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />

          <div>
            <p className="block text-sm font-semibold text-text-label mb-2">¿En qué moneda vas a ingresar los precios?</p>
            <div className="flex gap-2">
              {CURRENCIES.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setMoneda(code)}
                  className={`flex-1 min-h-11 rounded-[var(--radius-field)] text-sm font-semibold ${
                    moneda === code ? 'bg-accent text-white' : 'bg-subtle text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {moneda !== 'USD' && (
            <Input
              id="tasa-cambio"
              label="Tasa de cambio"
              type="text"
              inputMode="decimal"
              placeholder={`1 USD = ? ${moneda === 'VES' ? 'Bs' : '$'}`}
              value={tasaCambio}
              onChange={(e) => setTasaCambio(e.target.value)}
            />
          )}

          <Input
            id="presupuesto"
            label="Presupuesto para esta compra (opcional, en USD)"
            type="text"
            inputMode="decimal"
            placeholder="Ej: 8,00"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
          />

          {error && (
            <p className="text-sm text-alert text-center" role="alert">
              {error}
            </p>
          )}

          <Button className="w-full" disabled={submitting} onClick={onSubmit}>
            {submitting ? 'Comenzando…' : 'Comenzar compra'}
          </Button>
        </Card>
      </div>
    </div>
  )
}
