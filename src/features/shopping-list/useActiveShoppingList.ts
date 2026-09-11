import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { shoppingListsRepo } from '../../data/local/repos'
import type { ShoppingListRow } from '../../data/local/types'

/**
 * Cada familia tiene a lo sumo una lista 'activa' a la vez (se arma antes de
 * salir de casa); al convertirse en compra pasa a 'convertida' y la próxima
 * vez que se visite esta pantalla se crea una nueva. Si todavía no existe
 * ninguna, se crea sola — no hay una pantalla separada de "crear lista".
 */
export function useActiveShoppingList(familyId: string, userId: string): ShoppingListRow | undefined {
  const lists = useLiveQuery(() => shoppingListsRepo.list(familyId), [familyId])
  const active = lists?.find((l) => l.estado === 'activa')
  const creatingRef = useRef(false)

  useEffect(() => {
    if (lists === undefined || active || creatingRef.current) return

    creatingRef.current = true
    shoppingListsRepo
      .create({
        family_id: familyId,
        fecha: new Date().toISOString().slice(0, 10),
        estado: 'activa',
        created_by: userId,
        created_at: new Date().toISOString(),
      })
      .finally(() => {
        creatingRef.current = false
      })
  }, [lists, active, familyId, userId])

  return active
}
