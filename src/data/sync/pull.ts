import type { Table } from 'dexie'
import { db } from '../local/db'
import { supabase } from '../remote/supabaseClient'
import type { SyncedRow, SyncTableName } from '../local/types'

const SYNCED_TABLES: SyncTableName[] = [
  'categories',
  'products',
  'stores',
  'shopping_lists',
  'list_items',
  'purchases',
  'purchase_items',
]

/**
 * Trae el estado remoto completo de una tabla (RLS ya la limita a la familia
 * del usuario logueado, así que no hace falta filtrar por family_id acá) y
 * lo reconcilia con Dexie:
 * - fila remota nueva o local no-dirty desactualizada -> se sobrescribe local.
 * - fila local con cambios sin enviar (dirty=1) -> se respeta, no se pisa;
 *   el outbox ya la va a empujar y esa escritura gana en el servidor.
 * - fila local no-dirty que ya no aparece en remoto -> se borró en otro lado,
 *   se borra local también.
 * - fila con un delete pendiente en el outbox -> nunca se resucita, así el
 *   push todavía no se haya podido confirmar (visto en la práctica: un
 *   delete que tarda o falla en subir hacía que el siguiente pull trajera
 *   de vuelta la fila, porque acá no existe localmente y remoto todavía la
 *   tiene — un borrado local, a diferencia de un create/update, no deja
 *   ninguna fila "dirty" que lo proteja por sí sola).
 * A esta escala (pocas familias, catálogos y compras chicos) traer la tabla
 * completa en cada pull es más simple y barato que llevar un cursor
 * incremental + tombstones para los borrados.
 */
async function reconcileTable(table: SyncTableName) {
  const { data, error } = await supabase.from(table).select('*')
  if (error) throw error

  const remoteRows = (data ?? []) as SyncedRow[]
  const remoteIds = new Set(remoteRows.map((r) => r.id))
  const localTable = db[table] as unknown as Table<SyncedRow, string>
  const localRows = await localTable.toArray()

  await db.transaction('rw', localTable, db.outbox, async () => {
    const pendingDeleteIds = new Set(
      (await db.outbox.where({ table }).toArray()).filter((e) => e.op === 'delete').map((e) => e.rowId),
    )

    for (const remote of remoteRows) {
      if (pendingDeleteIds.has(remote.id)) continue
      const local = localRows.find((r) => r.id === remote.id)
      if (!local || local.dirty === 0) {
        await localTable.put({ ...remote, dirty: 0 })
      }
    }

    for (const local of localRows) {
      if (local.dirty === 0 && !remoteIds.has(local.id)) {
        await localTable.delete(local.id)
      }
    }
  })
}

export async function pullAll(): Promise<void> {
  for (const table of SYNCED_TABLES) {
    await reconcileTable(table)
  }
}
