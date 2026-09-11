import type { Table } from 'dexie'
import { db } from './db'
import { enqueue } from '../sync/outbox'
import { syncNow } from '../sync/engine'
import type { SyncedRow, SyncTableName } from './types'

type Creatable<T extends SyncedRow> = Omit<T, 'id' | 'updated_at' | 'dirty'>
type Patchable<T extends SyncedRow> = Partial<Creatable<T>>

function toRemotePayload<T extends SyncedRow>(row: T): Record<string, unknown> {
  const payload = { ...row } as Record<string, unknown>
  delete payload.dirty
  return payload
}

/**
 * CRUD local (Dexie) + encolado automático en el outbox, para las 7 tablas
 * del flujo de compra. Cada create/update/delete queda visible al instante
 * en la UI (optimista) y se empuja a Supabase cuando haya señal — nunca al
 * revés. Un solo factory porque las 7 tablas comparten exactamente este
 * mismo patrón de sincronización.
 *
 * `scopeKey` es la columna por la que se lista (`family_id` para los
 * catálogos/listas/compras; `list_id`/`purchase_id` para sus ítems, que no
 * llevan family_id propio en Postgres).
 */
export function createLocalRepo<T extends SyncedRow>(tableName: SyncTableName, scopeKey: keyof T & string) {
  const table = db[tableName] as unknown as Table<T, string>

  return {
    list(scopeValue: string): Promise<T[]> {
      return table.where(scopeKey).equals(scopeValue).toArray()
    },

    get(id: string): Promise<T | undefined> {
      return table.get(id)
    },

    async create(input: Creatable<T>): Promise<T> {
      const now = new Date().toISOString()
      const row = { ...input, id: crypto.randomUUID(), updated_at: now, dirty: 1 } as T

      await table.add(row)
      await enqueue(tableName, 'insert', row.id, toRemotePayload(row))
      void syncNow()
      return row
    },

    async update(id: string, patch: Patchable<T>): Promise<T> {
      const existing = await table.get(id)
      if (!existing) throw new Error(`${tableName}/${id} no existe localmente`)

      const row = { ...existing, ...patch, updated_at: new Date().toISOString(), dirty: 1 } as T
      await table.put(row)
      await enqueue(tableName, 'update', id, toRemotePayload(row))
      void syncNow()
      return row
    },

    async remove(id: string): Promise<void> {
      await table.delete(id)
      await enqueue(tableName, 'delete', id, null)
      void syncNow()
    },
  }
}
