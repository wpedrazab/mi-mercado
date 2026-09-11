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

  await db.transaction('rw', localTable, async () => {
    for (const remote of remoteRows) {
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
